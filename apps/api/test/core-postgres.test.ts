import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { DatabaseService } from '../src/platform/database/database.service';
import { accounts } from '../src/modules/identity/infrastructure/identity.schema';
import { profiles } from '../src/modules/profile/infrastructure/profile.schema';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { CircleService } from '../src/modules/circle/circle.service';
import { PactService } from '../src/modules/pact/pact.service';
import { FocusService } from '../src/modules/focus/focus.service';
import { MemoryService } from '../src/modules/memory/memory.service';
import { SeedService } from '../src/modules/seed/seed.service';

test('core PostgreSQL flow preserves ownership, reconnect state, seed uniqueness and shared milestone', { skip: !process.env.BTP_TEST_DATABASE_URL }, async () => {
  const pool = new Pool({ connectionString: process.env.BTP_TEST_DATABASE_URL, max: 1 }); const client = await pool.connect(); const schema = `core_test_${randomBytes(8).toString('hex')}`;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`); await client.query(`SET search_path TO "${schema}"`);
    const migration = readFileSync(resolve(__dirname, '../../drizzle/0000_core_baseline.sql'), 'utf8').replaceAll('"public"', `"${schema}"`); await client.query(migration);
    const db = drizzle(client); const database = { db } as unknown as DatabaseService; const analytics = new AnalyticsService(database); const circles = new CircleService(database, analytics); const pacts = new PactService(database, circles, analytics); const focus = new FocusService(database, pacts, analytics); const memory = new MemoryService(database); const seeds = new SeedService(database);
    const ids = [randomUUID(), randomUUID(), randomUUID()]; await db.insert(accounts).values(ids.map((id, index) => ({ id, email: `member${index}@example.test`, passwordHash: 'fixture' }))); await db.insert(profiles).values(ids.map((accountId, index) => ({ accountId, displayName: `Member ${index}`, timezone: 'Asia/Ho_Chi_Minh' })));
    const circle = await circles.create(ids[0], 'Bạn quen'); const invite = await circles.invite(circle.id, ids[0], 72); assert.equal(await circles.accept(invite.token, ids[1]), circle.id); await assert.rejects(circles.get(circle.id, ids[2]));
    const pact = await pacts.create(circle.id, ids[0], { participantIds: [ids[1]], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID()); await pacts.respond(pact.id, ids[1], 'accepted'); const started = await focus.startPact(pact.id, ids[0], randomUUID()); await focus.join(started.id, ids[1]);
    assert.equal((await focus.snapshot(started.id, ids[1])).intention, null); await assert.rejects(focus.snapshot(started.id, ids[2])); await focus.checkout(started.id, ids[0], { outcome: 'progress' }); await focus.checkout(started.id, ids[1], { outcome: 'completed' }); assert.equal((await memory.list(ids[1])).length, 1); assert.equal((await memory.list(ids[2])).length, 0);
    const solo = await focus.startSolo(ids[0], { intention: 'Mở lại chương đang dở', durationMinutes: 5 }, randomUUID()); assert.equal((await focus.snapshot(solo.id, ids[0])).intention, 'Mở lại chương đang dở'); await assert.rejects(focus.snapshot(solo.id, ids[1])); await focus.checkout(solo.id, ids[0], { outcome: 'stopped', openSeed: 'Đọc từ mục tiếp theo' }); await seeds.upsert(ids[0], { text: 'Viết một đoạn mở đầu' }); assert.equal((await seeds.get(ids[0]))?.text, 'Viết một đoạn mở đầu');
  } finally { await client.query('SET search_path TO public'); await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); client.release(); await pool.end(); }
});
