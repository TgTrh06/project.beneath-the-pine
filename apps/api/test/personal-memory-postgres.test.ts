import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { personalForestSchema } from '@pyneath/contracts';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { API_CONFIG, readApiConfig } from '../src/platform/config/api-config';
import { configureHttp } from '../src/platform/http/configure-http';
import type { DatabaseService as DatabaseType } from '../src/platform/database/database.service';
import { DatabaseService } from '../src/platform/database/database.service';
import { accounts } from '../src/modules/identity/infrastructure/identity.schema';
import { IdentityStore } from '../src/modules/identity/identity.store';
import { IdentityService, sessionHash } from '../src/modules/identity/identity.service';
import { sessions } from '../src/modules/identity/infrastructure/identity.schema';
import { hashPassword } from '../src/modules/identity/password';
import { MemoryService } from '../src/modules/memory/memory.service';
import { personalMilestones } from '../src/modules/memory/infrastructure/memory.schema';
import { FocusService } from '../src/modules/focus/focus.service';
import { focusSessions, sessionParticipants } from '../src/modules/focus/infrastructure/focus.schema';
import { CampService } from '../src/modules/camp/camp.service';
import { PactService } from '../src/modules/pact/pact.service';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';
import { PrivacyService } from '../src/modules/privacy/privacy.service';

test('personal forest: forward migration, lifetime milestones, races, privacy and failure isolation', { skip: !process.env.PYNEATH_TEST_DATABASE_URL }, async t => {
  const pool = new Pool({ connectionString: process.env.PYNEATH_TEST_DATABASE_URL, max: 4 });
  const client = await pool.connect(), concurrentClient = await pool.connect();
  const schema = `personal_memory_test_${randomBytes(8).toString('hex')}`;
  let app: NestExpressApplication | undefined;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    await concurrentClient.query(`SET search_path TO "${schema}"`);
    const folder = resolve(__dirname, '../../drizzle');
    const files = readdirSync(folder).filter(file => file.endsWith('.sql')).sort();
    for (const file of files.filter(file => file < '0004_')) await client.query(readFileSync(resolve(folder, file), 'utf8').replaceAll('"public"', `"${schema}"`));
    const db = drizzle(client), secondDb = drizzle(concurrentClient);
    const database = { db } as unknown as DatabaseType, secondDatabase = { db: secondDb } as unknown as DatabaseType;
    const [owner, outsider] = [randomUUID(), randomUUID()];
    const password = 'personal-forest-test-only';
    await db.insert(accounts).values([{ id: owner, email: 'forest@example.test', passwordHash: await hashPassword(password) }, { id: outsider, email: 'outsider@example.test', passwordHash: 'fixture' }]);
    const legacy = randomUUID(), oldDate = new Date('2026-01-01T00:00:00Z');
    await db.insert(focusSessions).values({ id: legacy, kind: 'solo', status: 'completed', startedByAccountId: owner, startedAt: oldDate, endsAt: oldDate, completedAt: oldDate, durationMinutes: 5, requestKey: randomUUID() });
    await db.insert(sessionParticipants).values({ sessionId: legacy, accountId: owner, presence: 'checked_out', outcome: 'stuck', intention: 'PRIVATE_WORK_MARKER' });
    for (const file of files.filter(file => file >= '0004_')) await client.query(readFileSync(resolve(folder, file), 'utf8').replaceAll('"public"', `"${schema}"`));
    const memory = new MemoryService(database), concurrentMemory = new MemoryService(secondDatabase);
    const analytics = new AnalyticsService(database), camps = new CampService(database, analytics), pacts = new PactService(database, camps, analytics);
    const focus = new FocusService(database, pacts, analytics);
    const otherAnalytics = new AnalyticsService(secondDatabase), otherCamps = new CampService(secondDatabase, otherAnalytics), otherPacts = new PactService(secondDatabase, otherCamps, otherAnalytics);
    const otherFocus = new FocusService(secondDatabase, otherPacts, otherAnalytics);
    const store = new IdentityStore(database), identity = new IdentityService(store, readApiConfig({}));
    const privacy = new PrivacyService(database, store, identity);
    await t.test('existing history is materialized once with original dates, never private text', async () => {
      const races = await Promise.all([memory.personal(owner), concurrentMemory.personal(owner)]);
      assert.deepEqual(races[0], races[1]);
      const first = personalForestSchema.parse(races[0]);
      assert.equal(first.completedSessions, 1);
      assert.deepEqual(first.milestones, [{ threshold: 1, sourceSessionId: legacy, recordedAt: oldDate.toISOString() }]);
      assert.ok(!JSON.stringify(first).includes('PRIVATE_WORK_MARKER'));
      assert.deepEqual(await memory.personal(outsider), { completedSessions: 0, milestones: [] });
      await assert.rejects(memory.personal(randomUUID()), { status: 404 });
      await assert.rejects(db.insert(personalMilestones).values({ accountId: owner, threshold: 2, sourceSessionId: legacy, recordedAt: oldDate }));
    });
    await t.test('all checkout outcomes count equally and duplicate checkout never adds a chặng', async () => {
      for (const outcome of ['completed', 'progress', 'stuck', 'stopped'] as const) {
        const started = await focus.startSolo(owner, { intention: 'PRIVATE_WORK_MARKER', durationMinutes: outcome === 'completed' ? 50 : 5 }, randomUUID());
        await Promise.all([focus.checkout(started.id, owner, { outcome, openSeed: 'PRIVATE_SEED_MARKER' }), otherFocus.checkout(started.id, owner, { outcome, openSeed: 'PRIVATE_SEED_MARKER' })]);
      }
      const result = await memory.personal(owner);
      assert.equal(result.completedSessions, 5);
      assert.deepEqual(result.milestones.map(item => item.threshold), [1, 3]);
      const cancelled = await focus.startSolo(owner, { intention: 'cancelled', durationMinutes: 5 }, randomUUID());
      await db.update(focusSessions).set({ status: 'cancelled' }).where(eq(focusSessions.id, cancelled.id));
      await db.update(sessionParticipants).set({ presence: 'checked_out', activeSlotAccountId: null }).where(eq(sessionParticipants.sessionId, cancelled.id));
      assert.equal((await memory.personal(owner)).completedSessions, 5);
    });
    await t.test('expiry and shared sessions count only after the session closes', async () => {
      const expired = await focus.startSolo(owner, { intention: 'expiry', durationMinutes: 5 }, randomUUID());
      await db.update(focusSessions).set({ endsAt: new Date(Date.now() - 1000) }).where(eq(focusSessions.id, expired.id));
      await focus.snapshot(expired.id, owner);
      assert.equal((await memory.personal(owner)).completedSessions, 6);
      const camp = await camps.create(owner, 'Test-only Camp');
      await camps.accept((await camps.invite(camp.id, owner, 72)).token, outsider);
      const pact = await pacts.create(camp.id, owner, { participantIds: [outsider], startsAt: new Date().toISOString(), durationMinutes: 5 }, randomUUID());
      await pacts.respond(pact.id, outsider, 'accepted');
      const shared = await focus.startPact(pact.id, owner, randomUUID());
      await focus.join(shared.id, outsider);
      await focus.checkout(shared.id, owner, { outcome: 'stopped' });
      assert.equal((await memory.personal(owner)).completedSessions, 6);
      await focus.checkout(shared.id, outsider, { outcome: 'progress' });
      const done = await memory.personal(owner);
      assert.equal(done.completedSessions, 7);
      assert.deepEqual(done.milestones.map(item => item.threshold), [1, 3, 7]);
      assert.equal(done.milestones[2].sourceSessionId, shared.id);
      assert.equal((await memory.personal(outsider)).completedSessions, 1);
    });
    await t.test('lifetime counts exceed the history cap without reminting or changing milestones', async () => {
      const before = (await memory.personal(owner)).milestones;
      const rows = Array.from({ length: 101 }, () => ({ id: randomUUID(), kind: 'solo' as const, status: 'completed' as const, startedByAccountId: owner, durationMinutes: 5, startedAt: new Date(), endsAt: new Date(), completedAt: new Date(), requestKey: randomUUID() }));
      await db.insert(focusSessions).values(rows);
      await db.insert(sessionParticipants).values(rows.map(row => ({ sessionId: row.id, accountId: owner, presence: 'checked_out' as const, outcome: 'stopped' as const })));
      assert.equal((await focus.history(owner)).length, 100);
      const result = await memory.personal(owner);
      assert.equal(result.completedSessions, 108);
      assert.deepEqual(result.milestones, before);
    });
    await t.test('HTTP uses the authenticated owner, ignores forged owner parameters and fails safely', async () => {
      const config = readApiConfig({});
      const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(API_CONFIG).useValue(config)
        .overrideProvider(DatabaseService).useValue(database).compile();
      app = module.createNestApplication<NestExpressApplication>({ logger: false, bodyParser: false });
      configureHttp(app, config); await app.init();
      const server = app.getHttpServer();
      await request(server).get('/api/v1/me/memory/personal').expect(401);
      const token = randomBytes(32).toString('hex');
      await db.insert(sessions).values({ tokenHash: sessionHash(token), accountId: outsider, csrfToken: 'fixture', expiresAt: new Date(Date.now() + 60000) });
      const response = await request(server).get(`/api/v1/me/memory/personal?accountId=${owner}`).set('Cookie', `PYNEATH_SESSION=${token}`).set('X-User-ID', owner).expect(200);
      assert.equal(personalForestSchema.parse(response.body).completedSessions, 1);
      assert.equal(response.headers['cache-control'], 'no-store');
      await client.query('ALTER TABLE personal_milestones RENAME TO personal_milestones_temporarily_unavailable');
      try {
        const failed = await request(server).get('/api/v1/me/memory/personal').set('Cookie', `PYNEATH_SESSION=${token}`).expect(500);
        assert.ok(!JSON.stringify(failed.body).includes('personal_milestones'));
        const stillWorks = await focus.startSolo(owner, { intention: 'focus survives memory failure', durationMinutes: 5 }, randomUUID());
        await focus.checkout(stillWorks.id, owner, { outcome: 'stuck', openSeed: 'Still saved' });
      } finally { await client.query('ALTER TABLE personal_milestones_temporarily_unavailable RENAME TO personal_milestones'); }
      await app.close(); app = undefined;
    });
    await t.test('export is private and account deletion cascades without deleting others memories', async () => {
      assert.equal((await privacy.export(owner)).personalMilestones.length, 3);
      const other = (await privacy.export(outsider)).personalMilestones;
      assert.equal(other.length, 1);
      assert.ok(!JSON.stringify(other).includes('PRIVATE_WORK_MARKER'));
      await privacy.remove(owner, password);
      assert.equal((await db.select().from(personalMilestones).where(eq(personalMilestones.accountId, owner))).length, 0);
      assert.deepEqual((await privacy.export(outsider)).personalMilestones, other);
    });
  } finally {
    await app?.close();
    await client.query('SET search_path TO public');
    await concurrentClient.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    client.release(); concurrentClient.release(); await pool.end();
  }
});
