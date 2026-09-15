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
import { seedKeeper } from '../src/modules/identity/seed';

// Opt-in only: never uses API_DATABASE_URL or the user's normal schema.
test('PostgreSQL migration, constraints, seed idempotency/conflict and session cascade', { skip: !process.env.BTP_TEST_DATABASE_URL }, async () => {
  const pool = new Pool({ connectionString: process.env.BTP_TEST_DATABASE_URL, max: 1, connectionTimeoutMillis: 3000 });
  const client = await pool.connect();
  const schema = `identity_test_${randomBytes(8).toString('hex')}`;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    const migration = readFileSync(resolve(__dirname, '../../drizzle/0000_identity_accounts_sessions.sql'), 'utf8').replaceAll('"public"', `"${schema}"`);
    await client.query(migration);
    const db = drizzle(client);
    const env = { PINE_KEEPER_EMAIL: 'keeper@example.test', PINE_KEEPER_PASSWORD: 'temporary-test-password' };
    assert.equal(await seedKeeper(db, env), 'created');
    const [before] = await db.select().from(accounts);
    assert.equal(await seedKeeper(db, { ...env, PINE_KEEPER_PASSWORD: 'different-test-password' }), 'unchanged');
    const [after] = await db.select().from(accounts);
    assert.equal(before.passwordHash, after.passwordHash);
    await db.insert(accounts).values({ email: 'wanderer@example.test', passwordHash: 'test-fixture-only' });
    await assert.rejects(seedKeeper(db, { ...env, PINE_KEEPER_EMAIL: 'wanderer@example.test' }), /Seed conflict/);
    const [wanderer] = await db.select().from(accounts).where(eq(accounts.email, 'wanderer@example.test'));
    assert.equal(wanderer.role, 'wanderer');
    await assert.rejects(db.insert(accounts).values({ email: 'wanderer@example.test', passwordHash: 'test' }));
    await db.insert(sessions).values({ tokenHash: 'fixture-token', accountId: before.id, csrfToken: 'fixture-csrf', expiresAt: new Date(Date.now() + 1000) });
    await db.delete(accounts).where(eq(accounts.id, before.id));
    assert.equal((await db.select().from(sessions)).length, 0);
  } finally {
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    client.release(); await pool.end();
  }
});
