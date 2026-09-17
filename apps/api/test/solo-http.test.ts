import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Pool } from 'pg';
import type { FocusSession, ReturnState } from '@beneath-the-pine/contracts';

// Opt-in against an already migrated local API/database. Never runs migrations.
const apiUrl = process.env.BTP_SOLO_API_URL;
const databaseUrl = process.env.BTP_SOLO_DATABASE_URL;
const origin = process.env.BTP_SOLO_WEB_ORIGIN ?? 'http://localhost:5173';
type Payload = Partial<ReturnState> & {
  account?: { id: string }; csrfToken?: string; session?: FocusSession | null;
  sessions?: Array<{ id: string; outcome: string | null }>;
};

class Client {
  readonly email = `solo-regression-${randomUUID()}@example.test`;
  readonly password = randomBytes(24).toString('hex');
  accountId = '';
  cookie = '';
  csrf = '';
  async request(path: string, method = 'GET', body?: unknown, key?: string) {
    const response = await fetch(`${apiUrl}${path}`, {
      method, signal: AbortSignal.timeout(10000),
      headers: { origin, cookie: this.cookie, 'Content-Type': 'application/json',
        ...(method !== 'GET' ? { 'X-XSRF-TOKEN': this.csrf } : {}),
        ...(key ? { 'Idempotency-Key': key } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    for (const cookie of response.headers.getSetCookie()) this.cookie = cookie.split(';')[0];
    const data: Payload = response.status === 204 ? {} : await response.json();
    if (data.csrfToken) this.csrf = data.csrfToken;
    return { status: response.status, data };
  }
  async login() {
    await this.request('/auth/session');
    assert.equal((await this.request('/auth/login', 'POST', { email: this.email, password: this.password })).status, 200);
  }
  async start(key = randomUUID(), durationMinutes = 5) {
    return this.request('/focus-sessions', 'POST', { intention: 'Test-only next step', durationMinutes }, key);
  }
}

test('solo HTTP lifecycle on an existing local database', { skip: !apiUrl || !databaseUrl }, async t => {
  for (const raw of [apiUrl!, databaseUrl!, origin]) {
    assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(raw).hostname), 'Local test targets only');
  }
  const pool = new Pool({ connectionString: databaseUrl, connectionTimeoutMillis: 3000 });
  const clients: Client[] = [];
  const sessionId = (result: Awaited<ReturnType<Client['start']>>) => {
    assert.equal(result.status, 201); assert.ok(result.data.session); return result.data.session.id;
  };
  try {
    for (let i = 0; i < 2; i++) {
      const client = new Client();
      assert.equal((await client.request('/auth/session')).status, 200);
      const registered = await client.request('/auth/register', 'POST', { email: client.email, password: client.password });
      assert.equal(registered.status, 201); assert.ok(registered.data.account);
      client.accountId = registered.data.account.id; clients.push(client);
      // Verify that the SQL connection and HTTP service point to the same database.
      assert.equal((await pool.query('select id from identity_accounts where id=$1 and email=$2', [client.accountId, client.email])).rowCount, 1);
      assert.equal((await client.request('/me/profile', 'PATCH', { timezone: 'Asia/Ho_Chi_Minh' })).status, 200);
    }
    const [a, b] = clients;
    await t.test('validation, privacy, retry and all four outcomes', async () => {
      for (const intention of ['', 'x'.repeat(281)]) assert.equal((await a.request('/focus-sessions', 'POST', { intention, durationMinutes: 5 }, randomUUID())).status, 400);
      assert.equal((await a.request('/me/open-seed', 'PUT', { text: 'x'.repeat(501) })).status, 400);
      assert.equal((await a.request('/me/open-seed', 'PUT', { text: 'x'.repeat(500) })).status, 200);
      assert.equal((await b.request('/me/return')).data.openSeed, null);
      for (const [index, outcome] of ['completed', 'progress', 'stuck', 'stopped'].entries()) {
        const key = randomUUID(); const started = await a.start(key, [5, 10, 25, 50][index]); const id = sessionId(started);
        assert.equal((await a.start(key)).data.session?.id, id);
        assert.equal((await a.start()).status, 409);
        assert.equal((await b.request(`/focus-sessions/${id}`)).status, 404);
        assert.equal((await b.request(`/focus-sessions/${id}/check-out`, 'POST', { outcome })).status, 404);
        assert.equal((await a.request(`/focus-sessions/${id}`)).data.session?.endsAt, started.data.session?.endsAt);
        assert.equal((await a.request(`/focus-sessions/${id}/check-out`, 'POST', { outcome })).status, 201);
        assert.equal((await a.request('/me/focus-history')).data.sessions?.find(row => row.id === id)?.outcome, outcome);
        assert.equal((await a.request('/me/return')).data.openSeed?.text.length, 500);
      }
    });
    await t.test('old checkout cannot overwrite/delete a newer seed or duplicate its event', async () => {
      for (const openSeed of ['Original seed', null]) {
        const id = sessionId(await a.start());
        const body = { outcome: 'progress', openSeed };
        await a.request(`/focus-sessions/${id}/check-out`, 'POST', body);
        assert.equal((await a.request('/me/return')).data.openSeed?.text ?? null, openSeed);
        await a.request('/me/open-seed', 'PUT', { text: 'Newer seed' });
        await a.request(`/focus-sessions/${id}/check-out`, 'POST', body);
        assert.equal((await a.request('/me/return')).data.openSeed?.text, 'Newer seed');
        assert.equal((await pool.query("select count(*)::int as n from product_events where account_id=$1 and subject_id=$2 and name='session_checked_out'", [a.accountId, id])).rows[0].n, 1);
      }
    });
    await t.test('concurrent starts return one session or an explicit conflict', async () => {
      for (const sameKey of [true, false, true, false]) {
        const key = randomUUID();
        const results = await Promise.all([a.start(key), a.start(sameKey ? key : randomUUID())]);
        try {
          assert.deepEqual(results.map(value => value.status).sort(), sameKey ? [201, 201] : [201, 409]);
          if (sameKey) assert.equal(results[0].data.session?.id, results[1].data.session?.id);
          assert.equal((await pool.query('select count(*)::int as n from session_participants where active_slot_account_id=$1', [a.accountId])).rows[0].n, 1);
        } finally {
          const active = (await a.request('/focus-sessions/active')).data.session;
          if (active) await a.request(`/focus-sessions/${active.id}/check-out`, 'POST', { outcome: 'stopped' });
        }
      }
    });
    await t.test('expiry wins over late checkout; active endpoint never returns an ended session', async () => {
      for (const mode of ['checkout', 'active']) {
        const id = sessionId(await a.start());
        // Time travel only the session created by this test, never existing user data.
        assert.equal((await pool.query("update focus_sessions set started_at=now()-interval '6 minutes', ends_at=now()-interval '1 minute' where id=$1 and started_by_account_id=$2", [id, a.accountId])).rowCount, 1);
        if (mode === 'checkout') await a.request(`/focus-sessions/${id}/check-out`, 'POST', { outcome: 'completed', openSeed: 'Late overwrite' });
        assert.equal((await a.request('/focus-sessions/active')).data.session, null);
        assert.equal((await a.request('/me/focus-history')).data.sessions?.find(row => row.id === id)?.outcome, 'stopped');
        assert.equal((await a.request('/me/return')).data.openSeed?.text, 'Newer seed');
      }
    });
    await t.test('logout and expired authentication recover without losing the seed', async () => {
      await a.request('/auth/logout', 'POST');
      assert.equal((await a.request('/me/return')).status, 401);
      await a.login();
      assert.equal((await a.request('/me/return')).data.openSeed?.text, 'Newer seed');
      await pool.query("update identity_sessions set expires_at=now()-interval '1 second' where account_id=$1", [a.accountId]);
      assert.equal((await a.request('/me/return')).status, 401);
      await a.login();
      assert.equal((await a.request('/me/return')).data.openSeed?.text, 'Newer seed');
    });
  } finally {
    try {
      for (const client of clients) {
        // Account IDs are captured from this run's registrations only.
        await pool.query('delete from focus_sessions where started_by_account_id=$1', [client.accountId]);
        const removed = await client.request('/me/account', 'DELETE', { password: client.password });
        assert.equal(removed.status, 204, 'Test account cleanup failed');
      }
    } finally { await pool.end(); }
  }
});
