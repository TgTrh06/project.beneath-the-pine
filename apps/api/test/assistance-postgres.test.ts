import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { accounts } from '../src/modules/identity/infrastructure/identity.schema';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import type { DatabaseService } from '../src/platform/database/database.service';

test('assistance quotas reserve atomically on isolated PostgreSQL', { skip: !process.env.PYNEATH_TEST_DATABASE_URL }, async () => {
  const schema = `assistance_test_${randomBytes(8).toString('hex')}`;
  const setup = new Pool({ connectionString: process.env.PYNEATH_TEST_DATABASE_URL, max: 1 });
  let pool: Pool | undefined;
  try {
    await setup.query(`CREATE SCHEMA "${schema}"`);
    await setup.query(`SET search_path TO "${schema}"`);
    for (const file of ['0000_core_baseline.sql', '0001_white_spacker_dave.sql', '0002_camp-rename.sql', '0003_account-preferences-and-pact-reminders.sql']) {
      const migration = readFileSync(resolve(__dirname, `../../drizzle/${file}`), 'utf8').replaceAll('"public"', `"${schema}"`);
      await setup.query(migration);
    }
    pool = new Pool({ connectionString: process.env.PYNEATH_TEST_DATABASE_URL, max: 12, options: `-c search_path=${schema}` });
    const db = drizzle(pool);
    const analytics = new AnalyticsService({ db } as unknown as DatabaseService);
    const ids = Array.from({ length: 11 }, () => randomUUID());
    await db.insert(accounts).values(ids.map((id, index) => ({ id, email: `assist-${index}@example.test`, passwordHash: 'fixture' })));
    const sameAccount = await Promise.all(Array.from({ length: 12 }, () => analytics.reserveAssistanceRequest(ids[0], 'assisted_start')));
    assert.equal(sameAccount.filter(Boolean).length, 10);
    const ownedId = sameAccount.find((value): value is string => Boolean(value));
    assert.ok(ownedId);
    assert.equal(await analytics.ownsAssistanceRequest(ids[0], ownedId, 'assisted_start'), true);
    assert.equal(await analytics.ownsAssistanceRequest(ids[1], ownedId, 'assisted_start'), false);
    assert.equal(await analytics.ownsAssistanceRequest(ids[0], ownedId, 'open_seed_draft'), false);
    const rest = await Promise.all(ids.slice(1).flatMap(id => Array.from({ length: 10 }, () => analytics.reserveAssistanceRequest(id, 'open_seed_draft'))));
    assert.equal(rest.filter(Boolean).length, 90);
    const eventRows = await pool.query(`SELECT name, metadata::text AS metadata FROM "${schema}".product_events WHERE name='assistance_requested'`);
    assert.equal(eventRows.rowCount, 100);
    assert.ok(eventRows.rows.every(row => !String(row.metadata).includes('PRIVATE_INTENTION')));
  } finally {
    await pool?.end();
    await setup.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await setup.end();
  }
});
