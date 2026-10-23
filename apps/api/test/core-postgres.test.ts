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
  const pool = new Pool({ connectionString: process.env.BTP_TEST_DATABASE_URL, max: 4 }); const client = await pool.connect(); const concurrentClient = await pool.connect(); const schema = `core_test_${randomBytes(8).toString('hex')}`;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`); await client.query(`SET search_path TO "${schema}"`); await concurrentClient.query(`SET search_path TO "${schema}"`);
    for (const file of ['0000_core_baseline.sql', '0001_white_spacker_dave.sql']) {
      const migration = readFileSync(resolve(__dirname, `../../drizzle/${file}`), 'utf8').replaceAll('"public"', `"${schema}"`);
      await client.query(migration);
    }
    const db = drizzle(client); const concurrentDb = drizzle(concurrentClient); const database = { db } as unknown as DatabaseService; const concurrentDatabase = { db: concurrentDb } as unknown as DatabaseService; const analytics = new AnalyticsService(database); const concurrentAnalytics = new AnalyticsService(concurrentDatabase); const circles = new CircleService(database, analytics); const concurrentCircles = new CircleService(concurrentDatabase, concurrentAnalytics); const pacts = new PactService(database, circles, analytics); const concurrentPacts = new PactService(concurrentDatabase, concurrentCircles, concurrentAnalytics); const focus = new FocusService(database, pacts, analytics); const concurrentFocus = new FocusService(concurrentDatabase, concurrentPacts, concurrentAnalytics); const memory = new MemoryService(database); const seeds = new SeedService(database);
    const ids = [randomUUID(), randomUUID(), randomUUID(), randomUUID()]; await db.insert(accounts).values(ids.map((id, index) => ({ id, email: `member${index}@example.test`, passwordHash: 'fixture' }))); await db.insert(profiles).values(ids.map((accountId, index) => ({ accountId, displayName: `Member ${index}`, timezone: 'Asia/Ho_Chi_Minh' })));
    const circle = await circles.create(ids[0], 'Bạn quen'); const invite = await circles.invite(circle.id, ids[0], 72); assert.equal(await circles.accept(invite.token, ids[1]), circle.id); const secondInvite = await circles.invite(circle.id, ids[0], 72); assert.equal(await circles.accept(secondInvite.token, ids[3]), circle.id);
    const pact = await pacts.create(circle.id, ids[0], { participantIds: [ids[1]], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID()); await pacts.respond(pact.id, ids[1], 'accepted'); const started = await focus.startPact(pact.id, ids[0], randomUUID()); await focus.join(started.id, ids[1]);
    assert.equal((await focus.snapshot(started.id, ids[1])).intention, null); await assert.rejects(focus.snapshot(started.id, ids[2])); await focus.checkout(started.id, ids[0], { outcome: 'progress' }); await focus.checkout(started.id, ids[1], { outcome: 'completed' }); await focus.markConnected(started.id, ids[1]); await assert.rejects(focus.setPresence(started.id, ids[1], 'break')); assert.equal((await memory.list(ids[1])).length, 1); assert.equal((await memory.list(ids[2])).length, 0);
    const solo = await focus.startSolo(ids[0], { intention: 'Mở lại chương đang dở', durationMinutes: 5 }, randomUUID()); assert.equal((await focus.snapshot(solo.id, ids[0])).intention, 'Mở lại chương đang dở'); await assert.rejects(focus.snapshot(solo.id, ids[1])); await focus.checkout(solo.id, ids[0], { outcome: 'stopped', openSeed: 'Đọc từ mục tiếp theo' }); await seeds.upsert(ids[0], { text: 'Viết một đoạn mở đầu' }); assert.equal((await seeds.get(ids[0]))?.text, 'Viết một đoạn mở đầu');

    const racePact = await pacts.create(circle.id, ids[0], { participantIds: [], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID());
    const [startRace, cancelRace] = await Promise.allSettled([focus.startPact(racePact.id, ids[0], randomUUID()), concurrentPacts.cancel(racePact.id, ids[0])]);
    const racePactState = await pacts.get(racePact.id, ids[0]);
    if (racePactState.status === 'active') {
      assert.equal(startRace.status, 'fulfilled'); assert.equal(cancelRace.status, 'rejected');
      await focus.checkout(racePactState.sessionId!, ids[0], { outcome: 'stopped' });
    } else {
      assert.equal(racePactState.status, 'cancelled'); assert.equal(racePactState.sessionId, null);
      assert.equal(startRace.status, 'rejected'); assert.equal(cancelRace.status, 'fulfilled');
    }

    const presencePact = await pacts.create(circle.id, ids[0], { participantIds: [ids[1]], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID());
    await pacts.respond(presencePact.id, ids[1], 'accepted'); const presenceSession = await focus.startPact(presencePact.id, ids[0], randomUUID()); await focus.join(presenceSession.id, ids[1]);
    await focus.setPresence(presenceSession.id, ids[1], 'break'); await concurrentFocus.markConnected(presenceSession.id, ids[1]);
    assert.equal((await focus.snapshot(presenceSession.id, ids[0])).participants.find(person => person.accountId === ids[1])?.presence, 'break', 'heartbeat preserves a chosen break state');
    await focus.setPresence(presenceSession.id, ids[1], 'disconnected'); await concurrentFocus.markConnected(presenceSession.id, ids[1]);
    assert.equal((await focus.snapshot(presenceSession.id, ids[0])).participants.find(person => person.accountId === ids[1])?.presence, 'active', 'reconnect restores a disconnected participant');
    await focus.checkout(presenceSession.id, ids[0], { outcome: 'stopped' }); await concurrentFocus.checkout(presenceSession.id, ids[1], { outcome: 'stopped' });

    const joinPact = await pacts.create(circle.id, ids[0], { participantIds: [ids[3]], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID());
    await pacts.respond(joinPact.id, ids[3], 'accepted'); const joinSession = await focus.startPact(joinPact.id, ids[0], randomUUID());
    const [joinRace, checkoutRace] = await Promise.allSettled([concurrentFocus.join(joinSession.id, ids[3]), focus.checkout(joinSession.id, ids[0], { outcome: 'progress' })]);
    const afterJoinRace = await focus.snapshot(joinSession.id, ids[0]);
    if (joinRace.status === 'fulfilled') {
      assert.equal(checkoutRace.status, 'fulfilled'); assert.equal(afterJoinRace.status, 'active');
      assert.notEqual(afterJoinRace.participants.find(person => person.accountId === ids[3])?.presence, 'checked_out');
      await focus.checkout(joinSession.id, ids[3], { outcome: 'completed' });
    } else {
      assert.equal(checkoutRace.status, 'fulfilled'); assert.equal(afterJoinRace.status, 'completed');
    }
    await assert.rejects(concurrentFocus.join(joinSession.id, ids[3]));

    const expiredSolo = await focus.startSolo(ids[0], { intention: 'Race against expiry', durationMinutes: 5 }, randomUUID());
    await client.query("update focus_sessions set ends_at=now()-interval '1 second' where id=$1", [expiredSolo.id]);
    await Promise.allSettled([focus.checkout(expiredSolo.id, ids[0], { outcome: 'progress' }), concurrentFocus.finalizeExpired()]);
    const expiredState = await focus.snapshot(expiredSolo.id, ids[0]);
    assert.equal(expiredState.status, 'completed'); assert.equal(expiredState.participants[0].presence, 'checked_out');

    const revokePact = await pacts.create(circle.id, ids[0], { participantIds: [ids[1]], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID());
    await pacts.respond(revokePact.id, ids[1], 'accepted'); const revokeSession = await focus.startPact(revokePact.id, ids[0], randomUUID()); await focus.join(revokeSession.id, ids[1]);
    await circles.remove(circle.id, ids[1], ids[0]);
    await assert.rejects(concurrentFocus.checkout(revokeSession.id, ids[1], { outcome: 'stopped' }));
    await assert.rejects(concurrentFocus.setPresence(revokeSession.id, ids[1], 'break'));
    await assert.rejects(concurrentFocus.snapshot(revokeSession.id, ids[1]));
    assert.equal(await focus.active(ids[1]), null, 'a removed participant releases their active slot when reconnecting');
    await focus.checkout(revokeSession.id, ids[0], { outcome: 'stopped' });
  } finally { await Promise.all([client.query('SET search_path TO public'), concurrentClient.query('SET search_path TO public')]); await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`); concurrentClient.release(); client.release(); await pool.end(); }
});
