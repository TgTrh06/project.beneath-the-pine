import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { accounts, sessions } from '../src/modules/identity/infrastructure/identity.schema';
import { createIdentityStore } from './helpers/module-fixtures';
import type { DatabaseService } from '../src/platform/database/database.service';

// Opt-in only: never uses API_DATABASE_URL or the user's normal schema.
test('PostgreSQL migration enforces unique accounts and session cascade', { skip: !process.env.PYNEATH_TEST_DATABASE_URL }, async () => {
  const pool = new Pool({ connectionString: process.env.PYNEATH_TEST_DATABASE_URL, max: 1, connectionTimeoutMillis: 3000 });
  const client = await pool.connect();
  const schema = `identity_test_${randomBytes(8).toString('hex')}`;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    for (const file of ['0000_core_baseline.sql', '0001_white_spacker_dave.sql', '0002_camp-rename.sql', '0003_account-preferences-and-pact-reminders.sql']) {
      const migration = readFileSync(resolve(__dirname, `../../drizzle/${file}`), 'utf8').replaceAll('"public"', `"${schema}"`);
      await client.query(migration);
    }
    const db = drizzle(client);
    const [before] = await db.insert(accounts).values({ email: 'owner@example.test', passwordHash: 'test-fixture-only' }).returning();
    await db.insert(accounts).values({ email: 'wanderer@example.test', passwordHash: 'test-fixture-only' });
    await assert.rejects(db.insert(accounts).values({ email: 'wanderer@example.test', passwordHash: 'test' }));
    await db.insert(sessions).values({ tokenHash: 'fixture-token', accountId: before.id, csrfToken: 'fixture-csrf', expiresAt: new Date(Date.now() + 1000) });
    await db.delete(accounts).where(eq(accounts.id, before.id));
    assert.equal((await db.select().from(sessions)).length, 0);
    const repository = createIdentityStore({ db } as unknown as DatabaseService);
    const future = new Date(Date.now() + 60000), past = new Date(0);
    await db.insert(sessions).values([
      { tokenHash: 'old-token', accountId: null, csrfToken: 'old-csrf', expiresAt: future },
      { tokenHash: 'collision', accountId: null, csrfToken: 'other-csrf', expiresAt: future },
      { tokenHash: 'expired-token', accountId: null, csrfToken: 'expired-csrf', expiresAt: past },
    ]);
    await assert.rejects(repository.rotateSession('old-token', { tokenHash: 'collision', accountId: null, csrfToken: 'new-csrf', expiresAt: future }));
    assert.deepEqual((await db.select().from(sessions)).map(row => row.tokenHash).sort(), ['collision', 'expired-token', 'old-token']);
    await repository.rotateSession('old-token', { tokenHash: 'new-token', accountId: null, csrfToken: 'new-csrf', expiresAt: future });
    assert.deepEqual((await db.select().from(sessions)).map(row => row.tokenHash).sort(), ['collision', 'new-token']);
  } finally {
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    client.release(); await pool.end();
  }
});
