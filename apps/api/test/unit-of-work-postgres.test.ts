import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { accounts } from '../src/modules/identity/infrastructure/identity.schema';
import type { DatabaseService } from '../src/platform/database/database.service';
import { PostgresUnitOfWork } from '../src/platform/database/postgres-unit-of-work';
import { DrizzleProfileRepository } from '../src/modules/profile/infrastructure/profile.repository';
import { DrizzleSeedRepository } from '../src/modules/seed/infrastructure/seed.repository';
import { DrizzleAnalyticsRepository } from '../src/modules/analytics/infrastructure/analytics.repository';

test('owner repositories roll back together and commit together on the same PostgreSQL transaction', { skip: !process.env.PYNEATH_TEST_DATABASE_URL }, async () => {
  const schema = `uow_test_${randomBytes(8).toString('hex')}`;
  const setup = new Pool({ connectionString: process.env.PYNEATH_TEST_DATABASE_URL, max: 1 });
  let pool: Pool | undefined;
  try {
    await setup.query(`CREATE SCHEMA "${schema}"`);
    await setup.query(`SET search_path TO "${schema}"`);
    const migrations = resolve(__dirname, '../../drizzle');
    for (const name of readdirSync(migrations).filter(name => /^\d+.*\.sql$/.test(name)).sort()) {
      await setup.query(readFileSync(resolve(migrations, name), 'utf8').replaceAll('"public"', `"${schema}"`));
    }
    pool = new Pool({ connectionString: process.env.PYNEATH_TEST_DATABASE_URL, max: 2, options: `-c search_path=${schema}` });
    const db = drizzle(pool), accountId = randomUUID(), subjectId = randomUUID();
    await db.insert(accounts).values({ id: accountId, email: 'uow@example.test', passwordHash: 'fixture' });
    const transactions = new PostgresUnitOfWork({ db } as unknown as DatabaseService);
    const profiles = new DrizzleProfileRepository(transactions), seeds = new DrizzleSeedRepository(transactions), events = new DrizzleAnalyticsRepository(transactions);
    const write = async (fail: boolean) => transactions.run(async context => {
      await profiles.save({ accountId, displayName: 'Fixture', timezone: 'UTC', updatedAt: new Date() }, context);
      await seeds.upsert(accountId, { text: 'Fictional draft', sourceSessionId: null }, new Date(), context);
      await events.append({ accountId, subjectId, name: 'assistance_requested', metadata: { capability: 'assisted_start' } }, context);
      assert.ok(await profiles.get(accountId, context));
      assert.ok(await seeds.get(accountId, context));
      if (fail) throw new Error('fixture failure after third owner write');
    });
    await assert.rejects(write(true), /fixture failure/);
    assert.equal(await profiles.get(accountId), null);
    assert.equal(await seeds.get(accountId), null);
    assert.equal(await events.ownsRequest(accountId, subjectId, 'assisted_start'), false);
    await write(false);
    assert.equal((await profiles.get(accountId))?.displayName, 'Fixture');
    assert.equal((await seeds.get(accountId))?.text, 'Fictional draft');
    assert.equal(await events.ownsRequest(accountId, subjectId, 'assisted_start'), true);
    // A second connection commits while the first holds a repeatable-read snapshot.
    await transactions.run(async context => {
      assert.equal((await profiles.get(accountId, context))?.displayName, 'Fixture');
      await profiles.save({ accountId, displayName: 'Updated elsewhere', timezone: 'UTC', updatedAt: new Date() });
      assert.equal((await profiles.get(accountId, context))?.displayName, 'Fixture');
    }, { isolationLevel: 'repeatable read' });
    assert.equal((await profiles.get(accountId))?.displayName, 'Updated elsewhere');
  } finally {
    await pool?.end();
    await setup.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await setup.end();
  }
});
