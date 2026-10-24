import 'reflect-metadata';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { Pool } from 'pg';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { API_CONFIG, readApiConfig } from '../src/platform/config/api-config';
import { configureHttp } from '../src/platform/http/configure-http';

const database = process.env.BTP_SOLO_DATABASE_URL;
const origin = process.env.BTP_SOLO_WEB_ORIGIN ?? 'http://localhost:5173';

class Client {
  constructor(private readonly server: ReturnType<NestExpressApplication['getHttpServer']>) {}
  id = '';
  cookie = '';
  csrf = '';
  email = `camp-regression-${randomUUID()}@example.test`;
  password = randomBytes(24).toString('hex');

  async req(path: string, method = 'GET', body?: unknown, key?: string) {
    const client = request(this.server);
    const route = `/api/v1${path}`;
    const operation = method === 'POST' ? client.post(route) : method === 'PATCH' ? client.patch(route) : method === 'DELETE' ? client.delete(route) : client.get(route);
    operation.set('Origin', origin);
    if (this.cookie) operation.set('Cookie', this.cookie);
    if (method !== 'GET') operation.set('X-XSRF-TOKEN', this.csrf);
    if (key) operation.set('Idempotency-Key', key);
    if (body !== undefined) operation.send(body as object);
    const result = await operation;
    const cookies = result.headers['set-cookie'];
    if (Array.isArray(cookies) && cookies.length) this.cookie = cookies[0].split(';')[0];
    const data = result.status === 204 ? {} : result.body;
    if (data.csrfToken) this.csrf = data.csrfToken;
    return { status: result.status, data };
  }
}

test('Camp invitation preview, decline and membership lifecycle on isolated local database', { skip: !database }, async t => {
  for (const url of [database!, origin]) assert.ok(['localhost', '127.0.0.1', '[::1]'].includes(new URL(url).hostname));
  const config = readApiConfig({ API_DATABASE_URL: database, API_WEB_ORIGIN: origin });
  const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(API_CONFIG).useValue(config).compile();
  const app = module.createNestApplication<NestExpressApplication>({ logger: false, bodyParser: false });
  configureHttp(app, config);
  await app.init();
  const server = app.getHttpServer();
  const pool = new Pool({ connectionString: database });
  const users: Client[] = [];
  const groups: string[] = [];
  const dummyIds: string[] = [];
  try {
    for (let i = 0; i < 4; i++) {
      const user = new Client(server);
      await user.req('/auth/session');
      const registered = await user.req('/auth/register', 'POST', { email: user.email, password: user.password });
      assert.equal(registered.status, 201);
      user.id = registered.data.account.id;
      users.push(user);
    }
    const [owner, invitee, successor, outsider] = users;
    const createCamp = async () => {
      const response = await owner.req('/camps', 'POST', { name: 'Trusted Camp' });
      assert.equal(response.status, 201);
      groups.push(response.data.camp.id);
      return response.data.camp.id as string;
    };
    const createInvite = async (campId: string) => {
      const response = await owner.req(`/camps/${campId}/invites`, 'POST', {});
      assert.equal(response.status, 201);
      return response.data.invite as { id: string; token: string };
    };
    const campId = await createCamp();
    const previewPath = (token: string) => `/camp-invites/${token}/preview`;
    const acceptPath = (token: string) => `/camp-invites/${token}/accept`;
    const declinePath = (token: string) => `/camp-invites/${token}/decline`;

    await t.test('preview reveals only the Camp name and inviter display name', async () => {
      assert.equal((await owner.req('/me/profile', 'PATCH', { displayName: 'Camp owner' })).status, 200);
      assert.equal((await owner.req('/camps')).data.camps[0].id, campId);
      assert.equal((await outsider.req(`/camps/${campId}`)).status, 404);
      const link = await createInvite(campId);
      const preview = await invitee.req(previewPath(link.token));
      assert.equal(preview.status, 200);
      assert.deepEqual(Object.keys(preview.data.invite).sort(), ['campName', 'inviterName']);
      assert.equal(preview.data.invite.campName, 'Trusted Camp');
      assert.equal(preview.data.invite.inviterName, 'Camp owner');
      assert.ok(!JSON.stringify(preview.data).includes(link.token));
      await request(server).get(`/api/v1${previewPath(link.token)}`).expect(401);
      await request(server).post(`/api/v1${declinePath(link.token)}`).expect(401);
      await request(server).post(`/api/v1${declinePath(link.token)}`).set('Cookie', invitee.cookie).set('Origin', origin).expect(403);
      assert.equal((await invitee.req(previewPath('invalid-token'))).status, 404);
      assert.equal((await invitee.req(previewPath('a'.repeat(64)))).status, 404);

      assert.equal((await invitee.req(declinePath(link.token), 'POST')).status, 204);
      assert.equal((await invitee.req(declinePath(link.token), 'POST')).status, 204);
      assert.equal((await invitee.req(previewPath(link.token))).status, 409);
      assert.equal((await invitee.req(acceptPath(link.token), 'POST')).status, 409);
      assert.equal((await outsider.req(previewPath(link.token))).status, 200);
      assert.equal((await outsider.req(acceptPath(link.token), 'POST')).status, 201);
      assert.equal((await outsider.req(acceptPath(link.token), 'POST')).status, 409);
      assert.equal((await successor.req(previewPath(link.token))).status, 409);
      const exported = await invitee.req('/me/data-export');
      assert.ok(exported.data.declinedCampInvites.some((item: { inviteId: string }) => item.inviteId === link.id));
    });

    await t.test('preview handles a creator without a display name', async () => {
      const created = await successor.req('/camps', 'POST', { name: 'Unnamed sender Camp' });
      assert.equal(created.status, 201);
      const group = created.data.camp.id as string;
      groups.push(group);
      const link = await successor.req(`/camps/${group}/invites`, 'POST', {});
      assert.equal(link.status, 201);
      const preview = await invitee.req(previewPath(link.data.invite.token));
      assert.equal(preview.status, 200);
      assert.equal(preview.data.invite.inviterName, null);
    });

    await t.test('revoke and expiry prevent preview and membership', async () => {
      const revoked = await createInvite(campId);
      assert.equal((await owner.req(`/camps/${campId}/invites/${revoked.id}`, 'DELETE')).status, 204);
      assert.equal((await invitee.req(previewPath(revoked.token))).status, 409);
      assert.equal((await invitee.req(acceptPath(revoked.token), 'POST')).status, 409);
      const expired = await createInvite(campId);
      await pool.query("update camp_invites set expires_at=now()-interval '1 second' where id=$1 and camp_id=$2", [expired.id, campId]);
      assert.equal((await invitee.req(previewPath(expired.token))).status, 409);
      assert.equal((await invitee.req(acceptPath(expired.token), 'POST')).status, 409);
      const listed = await owner.req(`/camps/${campId}/invites`);
      assert.equal(listed.data.items.find((item: { id: string }) => item.id === expired.id).status, 'expired');
      assert.equal((await invitee.req(`/camps/${campId}`)).status, 404);
    });

    await t.test('leave, removal and ownership transfer revoke access without losing ownership', async () => {
      const first = await createInvite(campId);
      assert.equal((await invitee.req(acceptPath(first.token), 'POST')).status, 201);
      assert.equal((await invitee.req(`/camps/${campId}`)).status, 200);
      const pact = await owner.req(`/camps/${campId}/pacts`, 'POST', { participantIds: [invitee.id], startsAt: new Date(Date.now() + 3600000).toISOString(), durationMinutes: 5 }, randomUUID());
      assert.equal(pact.status, 201);
      const pactId = pact.data.pact.id as string;
      assert.equal((await invitee.req(`/pacts/${pactId}`)).status, 200);
      assert.equal((await owner.req(`/camps/${campId}/members/me`, 'DELETE')).status, 409);
      assert.equal((await owner.req(`/camps/${campId}/members/${owner.id}`, 'DELETE')).status, 409);
      assert.equal((await invitee.req(`/camps/${campId}/members/me`, 'DELETE')).status, 204);
      assert.equal((await invitee.req(`/camps/${campId}`)).status, 404);
      assert.equal((await invitee.req(`/pacts/${pactId}`)).status, 404);
      assert.equal((await invitee.req(`/camps/${campId}/pacts`)).status, 404);
      assert.ok(!(await invitee.req('/camps')).data.camps.some((camp: { id: string }) => camp.id === campId));
      assert.equal((await invitee.req(acceptPath(first.token), 'POST')).status, 409);
      const second = await createInvite(campId);
      assert.equal((await invitee.req(acceptPath(second.token), 'POST')).status, 201);
      const successorLink = await createInvite(campId);
      assert.equal((await successor.req(acceptPath(successorLink.token), 'POST')).status, 201);
      assert.equal((await owner.req(`/camps/${campId}/ownership-transfer`, 'POST', { accountId: successor.id })).status, 204);
      assert.equal((await owner.req(`/camps/${campId}/invites`)).status, 403);
      const successorPact = await successor.req(`/camps/${campId}/pacts`, 'POST', { participantIds: [invitee.id], startsAt: new Date(Date.now() + 3600000).toISOString(), durationMinutes: 5 }, randomUUID());
      assert.equal(successorPact.status, 201);
      assert.equal((await successor.req(`/camps/${campId}/members/${invitee.id}`, 'DELETE')).status, 204);
      assert.equal((await invitee.req(`/camps/${campId}`)).status, 404);
      assert.equal((await invitee.req(`/pacts/${successorPact.data.pact.id}`)).status, 404);
      assert.equal((await invitee.req(`/camps/${campId}/invites`)).status, 404);
      assert.equal((await owner.req(`/camps/${campId}/members/me`, 'DELETE')).status, 204);
      assert.equal((await owner.req(`/camps/${campId}`)).status, 404);
      const detail = await successor.req(`/camps/${campId}`);
      assert.equal(detail.status, 200);
      assert.equal(detail.data.camp.myRole, 'owner');
    });

    await t.test('accept and decline serialize per invitation', async () => {
      const group = await createCamp();
      const link = await createInvite(group);
      const [accepted, declined] = await Promise.all([invitee.req(acceptPath(link.token), 'POST'), invitee.req(declinePath(link.token), 'POST')]);
      assert.ok((accepted.status === 201 && declined.status === 409) || (accepted.status === 409 && declined.status === 204));
      const detail = await owner.req(`/camps/${group}`);
      assert.equal(detail.data.camp.memberCount, accepted.status === 201 ? 2 : 1);
      assert.equal((await invitee.req(acceptPath(link.token), 'POST')).status, 409);
    });

    await t.test('revoke and accept serialize without a usable revoked link', async () => {
      const group = await createCamp();
      const link = await createInvite(group);
      const [revoked, accepted] = await Promise.all([owner.req(`/camps/${group}/invites/${link.id}`, 'DELETE'), invitee.req(acceptPath(link.token), 'POST')]);
      assert.ok((revoked.status === 204 && accepted.status === 409) || (revoked.status === 409 && accepted.status === 201));
      assert.equal((await invitee.req(previewPath(link.token))).status, 409);
      assert.equal((await invitee.req(acceptPath(link.token), 'POST')).status, 409);
    });

    await t.test('archive and acceptance serialize, and restore does not revive a link', async () => {
      const group = await createCamp();
      const link = await createInvite(group);
      const [archived, accepted] = await Promise.all([
        owner.req(`/camps/${group}`, 'PATCH', { status: 'archived' }),
        invitee.req(acceptPath(link.token), 'POST'),
      ]);
      assert.equal(archived.status, 200);
      assert.ok([201, 409].includes(accepted.status));
      assert.equal((await invitee.req(previewPath(link.token))).status, 409);
      assert.equal((await owner.req(`/camps/${group}`, 'PATCH', { status: 'active' })).status, 200);
      assert.equal((await invitee.req(acceptPath(link.token), 'POST')).status, 409);
    });

    await t.test('full Camp rejects another member', async () => {
      const group = await createCamp();
      for (let i = 0; i < 7; i++) {
        const id = randomUUID();
        dummyIds.push(id);
        await pool.query('insert into identity_accounts (id,email,password_hash) values ($1,$2,$3)', [id, `camp-fixture-${id}@example.test`, 'fixture']);
        await pool.query('insert into camp_memberships (camp_id,account_id,role) values ($1,$2,$3)', [group, id, 'member']);
      }
      const link = await createInvite(group);
      assert.equal((await outsider.req(previewPath(link.token))).status, 200);
      assert.equal((await outsider.req(acceptPath(link.token), 'POST')).status, 409);
      assert.equal((await owner.req(`/camps/${group}`)).data.camp.memberCount, 8);
    });
  } finally {
    try {
      for (const group of groups) await pool.query('delete from camps where id=$1', [group]);
      for (const id of dummyIds) await pool.query('delete from identity_accounts where id=$1', [id]);
      for (const user of users) await pool.query('delete from identity_accounts where id=$1 and email=$2', [user.id, user.email]);
    } finally { await pool.end(); await app.close(); }
  }
});
