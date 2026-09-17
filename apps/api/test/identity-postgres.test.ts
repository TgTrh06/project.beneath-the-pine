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

// Opt-in only: never uses API_DATABASE_URL or the user's normal schema.
test('PostgreSQL migration enforces unique accounts and session cascade', { skip: !process.env.BTP_TEST_DATABASE_URL }, async () => {
  const pool = new Pool({ connectionString: process.env.BTP_TEST_DATABASE_URL, max: 1, connectionTimeoutMillis: 3000 });
  const client = await pool.connect();
  const schema = `identity_test_${randomBytes(8).toString('hex')}`;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    const migration = readFileSync(resolve(__dirname, '../../drizzle/0000_core_baseline.sql'), 'utf8').replaceAll('"public"', `"${schema}"`);
    await client.query(migration);
    const db = drizzle(client);
    const [before] = await db.insert(accounts).values({ email: 'owner@example.test', passwordHash: 'test-fixture-only' }).returning();
    await db.insert(accounts).values({ email: 'wanderer@example.test', passwordHash: 'test-fixture-only' });
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
