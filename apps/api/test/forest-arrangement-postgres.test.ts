import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { defaultForestArrangement, forestArrangementSchema } from '@pyneath/contracts';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { API_CONFIG, readApiConfig } from '../src/platform/config/api-config';
import { configureHttp } from '../src/platform/http/configure-http';
import { DatabaseService } from '../src/platform/database/database.service';
import { accounts, sessions } from '../src/modules/identity/infrastructure/identity.schema';
import { createIdentity } from './helpers/module-fixtures';
import { sessionHash } from '../src/modules/identity/infrastructure/identity-crypto';
import { createIdentityStore } from './helpers/module-fixtures';
import { IDENTITY_REPOSITORY } from '../src/modules/identity/application/identity.ports';
import { hashPassword } from '../src/modules/identity/infrastructure/password';
import { personalMilestones } from '../src/modules/memory/infrastructure/memory.schema';
import { createMemory } from './helpers/module-fixtures';
import { focusSessions, sessionParticipants } from '../src/modules/focus/infrastructure/focus.schema';
import { createPreferences } from './helpers/module-fixtures';
import { accountPreferences } from '../src/modules/preferences/infrastructure/preferences.schema';
import { createPrivacy } from './helpers/module-fixtures';

test('forest arrangement: migration, entitlement, compare-and-save, HTTP and privacy', { skip: !process.env.PYNEATH_TEST_DATABASE_URL }, async t => {
  const pool = new Pool({ connectionString: process.env.PYNEATH_TEST_DATABASE_URL, max: 4 });
  const client = await pool.connect(), otherClient = await pool.connect();
  const schema = `forest_arrangement_test_${randomBytes(8).toString('hex')}`;
  let app: NestExpressApplication | undefined;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    for (const connection of [client, otherClient]) await connection.query(`SET search_path TO "${schema}"`);
    const folder = resolve(__dirname, '../../drizzle');
    const files = readdirSync(folder).filter(file => file.endsWith('.sql')).sort();
    for (const file of files.filter(file => file < '0005_')) await client.query(readFileSync(resolve(folder, file), 'utf8').replaceAll('"public"', `"${schema}"`));
    const db = drizzle(client), secondDb = drizzle(otherClient);
    const database = { db } as unknown as DatabaseService, secondDatabase = { db: secondDb } as unknown as DatabaseService;
    const [owner, outsider] = [randomUUID(), randomUUID()], password = 'forest-arrangement-test-only';
    await db.insert(accounts).values([{ id: owner, email: 'arrangement@example.test', passwordHash: await hashPassword(password) }, { id: outsider, email: 'outside@example.test', passwordHash: 'fixture' }]);
    await client.query('INSERT INTO account_preferences (account_id,share_presence,preset_duration_minutes,preset_soundscape_id) VALUES ($1,true,25,$2)', [owner, 'rain']);
    for (const file of files.filter(file => file >= '0005_')) await client.query(readFileSync(resolve(folder, file), 'utf8').replaceAll('"public"', `"${schema}"`));
    const service = createPreferences(database), secondService = createPreferences(secondDatabase), memory = createMemory(database);
    const store = createIdentityStore(database), identity = createIdentity(store, readApiConfig({})), privacy = createPrivacy(database, identity.core);
    await t.test('forward migration preserves existing preferences and supplies P1 defaults', async () => {
      const current = await service.get(owner);
      assert.equal(current.sharePresence, true);
      assert.deepEqual(current.focusPreset, { durationMinutes: 25, soundscapeId: 'rain' });
      assert.deepEqual(current.forestArrangement, defaultForestArrangement);
      assert.deepEqual((await service.get(outsider)).forestArrangement, defaultForestArrangement);
      await assert.rejects(client.query("UPDATE account_preferences SET forest_layout='fake'"));
      await assert.rejects(client.query('UPDATE account_preferences SET forest_hidden=ARRAY[2]'));
      await assert.rejects(client.query('UPDATE account_preferences SET forest_version=-1'));
    });
    await t.test('locked items rejected; history projection grants items without changing dates or counts', async () => {
      await assert.rejects(service.arrangeForest(owner, { ...defaultForestArrangement, hidden: [1] }), { code: 'FORBIDDEN' });
      const rows = Array.from({ length: 7 }, () => ({ id: randomUUID(), kind: 'solo' as const, status: 'completed' as const, startedByAccountId: owner, durationMinutes: 5, startedAt: new Date('2026-01-01'), endsAt: new Date('2026-01-01'), completedAt: new Date('2026-01-01'), requestKey: randomUUID() }));
      await db.insert(focusSessions).values(rows);
      await db.insert(sessionParticipants).values(rows.map(row => ({ sessionId: row.id, accountId: owner, presence: 'checked_out' as const, outcome: 'stuck' as const })));
      const before = await memory.personal(owner);
      const saved = await service.arrangeForest(owner, { layout: 'arc', hidden: [7, 1], version: 0 });
      assert.deepEqual(saved, { layout: 'arc', hidden: [1, 7], version: 1 });
      assert.deepEqual(await memory.personal(owner), before);
      assert.deepEqual((await service.get(owner)).forestArrangement, saved);
      assert.equal((await service.get(owner)).sharePresence, true);
      await service.update(owner, { remindAcceptedPacts: true });
      assert.deepEqual((await service.get(owner)).forestArrangement, saved);
      await assert.rejects(service.arrangeForest(outsider, { ...defaultForestArrangement, hidden: [7] }), { code: 'FORBIDDEN' });
    });
    await t.test('simultaneous and first-write saves have exactly one winner and retry cannot overwrite', async () => {
      for (const [id, version] of [[owner, 1], [outsider, 0]] as const) {
        const result = await Promise.allSettled([service.arrangeForest(id, { layout: 'gathered', hidden: [], version }), secondService.arrangeForest(id, { layout: 'arc', hidden: [], version })]);
        assert.equal(result.filter(item => item.status === 'fulfilled').length, 1);
        const rejected = result.find(item => item.status === 'rejected') as PromiseRejectedResult;
        assert.equal(rejected.reason.code, 'STATE_CONFLICT');
        assert.equal((await service.get(id)).forestArrangement.version, version + 1);
        await assert.rejects(service.arrangeForest(id, { layout: 'clearing', hidden: [], version }), { code: 'STATE_CONFLICT' });
      }
      await assert.rejects(service.arrangeForest(randomUUID(), defaultForestArrangement), { code: 'NOT_FOUND' });
    });
    await t.test('HTTP validates strict bodies, owner, CSRF, version and safe dependency failure', async () => {
      const config = readApiConfig({});
      const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(API_CONFIG).useValue(config).overrideProvider(DatabaseService).useValue(database).compile();
      app = module.createNestApplication<NestExpressApplication>({ logger: false, bodyParser: false }); configureHttp(app, config); await app.init();
      const server = app.getHttpServer(), token = randomBytes(32).toString('hex'), csrf = randomBytes(32).toString('hex');
      await db.insert(sessions).values({ tokenHash: sessionHash(token), accountId: outsider, csrfToken: csrf, expiresAt: new Date(Date.now() + 60000) });
      const patch = (path = '/api/v1/me/preferences/forest') => request(server).patch(path).set('Cookie', `PYNEATH_SESSION=${token}`).set('X-XSRF-TOKEN', csrf).set('Origin', config.API_WEB_ORIGIN);
      await request(server).patch('/api/v1/me/preferences/forest').send(defaultForestArrangement).expect(401);
      await request(server).patch('/api/v1/me/preferences/forest').set('Cookie', `PYNEATH_SESSION=${token}`).send(defaultForestArrangement).expect(403);
      for (const invalid of [{ layout: 'unknown', hidden: [], version: 1 }, { layout: 'arc', hidden: [1, 1], version: 1 }, { layout: 'arc', hidden: [2], version: 1 }, { layout: 'arc', hidden: [], version: -1 }, { layout: 'arc', hidden: [] }, { ...defaultForestArrangement, accountId: owner }]) await patch().send(invalid).expect(400);
      await patch('/api/v1/me/preferences').send({ forestArrangement: defaultForestArrangement }).expect(400);
      await patch().send({ layout: 'arc', hidden: [7], version: 1 }).expect(403);
      const before = (await service.get(owner)).forestArrangement;
      const saved = await patch(`/api/v1/me/preferences/forest?accountId=${owner}`).set('X-User-ID', owner).send({ layout: 'arc', hidden: [], version: 1 }).expect(200);
      assert.equal(forestArrangementSchema.parse(saved.body.forestArrangement).version, 2);
      assert.equal(saved.headers['cache-control'], 'no-store');
      assert.deepEqual((await service.get(owner)).forestArrangement, before);
      await patch().send({ layout: 'arc', hidden: [], version: 1 }).expect(409);
      await client.query('ALTER TABLE personal_milestones RENAME TO unavailable_memories');
      try {
        const failed = await patch().send({ layout: 'clearing', hidden: [], version: 2 }).expect(500);
        assert.ok(!JSON.stringify(failed.body).includes('personal_milestones'));
        assert.equal((await service.get(outsider)).forestArrangement.version, 2);
      } finally { await client.query('ALTER TABLE unavailable_memories RENAME TO personal_milestones'); }
      await app.close(); app = undefined;
    });
    await t.test('export includes only own arrangement; deletion cascades without altering other account', async () => {
      const exported = await privacy.export(owner), other = await privacy.export(outsider);
      assert.equal(exported.preferences?.forestVersion, 2);
      assert.equal(other.preferences?.forestLayout, 'arc');
      await privacy.remove(owner, password);
      assert.equal((await db.select().from(accountPreferences).where(eq(accountPreferences.accountId, owner))).length, 0);
      assert.equal((await db.select().from(personalMilestones).where(eq(personalMilestones.accountId, owner))).length, 0);
      assert.deepEqual((await privacy.export(outsider)).preferences, other.preferences);
    });
  } finally {
    await app?.close();
    await client.query('SET search_path TO public'); await otherClient.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    client.release(); otherClient.release(); await pool.end();
  }
});
