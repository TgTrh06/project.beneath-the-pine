import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';
import { campForestsSchema } from '@pyneath/contracts';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { API_CONFIG, readApiConfig } from '../src/platform/config/api-config';
import { configureHttp } from '../src/platform/http/configure-http';
import { DatabaseService } from '../src/platform/database/database.service';
import { accounts, sessions } from '../src/modules/identity/infrastructure/identity.schema';
import { sessionHash } from '../src/modules/identity/identity.service';
import { camps, campMemberships } from '../src/modules/camp/infrastructure/camp.schema';
import { campMilestones } from '../src/modules/memory/infrastructure/memory.schema';
import { MemoryService } from '../src/modules/memory/memory.service';

test('Camp forest: durable aggregation, membership boundaries and HTTP failures', { skip: !process.env.PYNEATH_TEST_DATABASE_URL }, async t => {
  const pool = new Pool({ connectionString: process.env.PYNEATH_TEST_DATABASE_URL });
  const client = await pool.connect(), schema = `camp_forest_test_${randomBytes(8).toString('hex')}`;
  let app: NestExpressApplication | undefined;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    const folder = resolve(__dirname, '../../drizzle');
    for (const file of readdirSync(folder).filter(file => file.endsWith('.sql')).sort()) {
      await client.query(readFileSync(resolve(folder, file), 'utf8').replaceAll('"public"', `"${schema}"`));
    }
    const db = drizzle(client), database = { db } as unknown as DatabaseService;
    const memory = new MemoryService(database);
    const owner = randomUUID(), member = randomUUID(), outsider = randomUUID();
    await db.insert(accounts).values([owner, member, outsider].map((id, i) => ({ id, email: `camp-forest-${i}@example.test`, passwordHash: 'fixture' })));
    const [a, b, empty] = [randomUUID(), randomUUID(), randomUUID()];
    await db.insert(camps).values([{ id: a, name: 'Camp A', ownerAccountId: owner }, { id: b, name: 'Camp B', ownerAccountId: owner, status: 'archived' }, { id: empty, name: 'Empty Camp', ownerAccountId: owner }]);
    await db.insert(campMemberships).values([a, b, empty].flatMap(campId => [owner, member].map(accountId => ({ campId, accountId, role: accountId === owner ? 'owner' as const : 'member' as const }))));
    const rows = Array.from({ length: 8 }, (_, i) => ({ id: randomUUID(), campId: a, sessionId: randomUUID(), recordedAt: new Date(Date.UTC(2026, 0, i + 1)) }));

    await t.test('0/1/2/3/6/7/>7 use original dates and never count duplicate sessions', async () => {
      for (let count = 0; count <= 8; count++) {
        if (count) await db.insert(campMilestones).values(rows[count - 1]);
        const response = campForestsSchema.parse({ camps: await memory.camps(member) });
        const result = response.camps.find(item => item.campId === a)!;
        assert.equal(result.sharedSessions, count);
        assert.deepEqual(result.milestones, [1, 3, 7].filter(n => n <= count).map(threshold => ({ threshold, recordedAt: rows[threshold - 1].recordedAt.toISOString() })));
        assert.deepEqual(response.camps.find(item => item.campId === empty)!.milestones, []);
      }
      await assert.rejects(db.insert(campMilestones).values({ campId: a, sessionId: rows[0].sessionId }));
      assert.equal((await memory.camps(member)).find(item => item.campId === a)!.sharedSessions, 8);
      // Source sessions need not exist: this projection survives historical session cleanup.
      assert.equal((await client.query('SELECT count(*) FROM focus_sessions')).rows[0].count, '0');
    });

    await t.test('separate Camps, archived history, equal timestamps and repeat reads remain stable', async () => {
      const date = new Date('2025-12-01T00:00:00Z');
      await db.insert(campMilestones).values(Array.from({ length: 3 }, () => ({ campId: b, sessionId: randomUUID(), recordedAt: date })));
      const first = await memory.camps(member), second = await memory.camps(member);
      assert.deepEqual(second, first);
      const archived = first.find(item => item.campId === b)!;
      assert.equal(archived.status, 'archived');
      assert.equal(archived.sharedSessions, 3);
      assert.deepEqual(archived.milestones, [1, 3].map(threshold => ({ threshold, recordedAt: date.toISOString() })));
      assert.equal(first.find(item => item.campId === a)!.sharedSessions, 8);
      assert.deepEqual(await memory.camps(outsider), []);
    });

    await t.test('removal hides names/counts/dates; rejoining sees earlier Camp history', async () => {
      const membership = and(eq(campMemberships.campId, a), eq(campMemberships.accountId, member));
      await db.update(campMemberships).set({ status: 'removed', removedAt: new Date() }).where(membership);
      assert.equal((await memory.camps(member)).some(item => item.campId === a), false);
      assert.equal((await memory.list(member)).some(item => item.campId === a), false);
      await db.update(campMemberships).set({ status: 'active', removedAt: null, joinedAt: new Date() }).where(membership);
      assert.equal((await memory.camps(member)).find(item => item.campId === a)!.sharedSessions, 8);
    });

    await t.test('HTTP authenticates, ignores forged owners, uses no-store and sanitizes dependency failures', async () => {
      const config = readApiConfig({});
      const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(API_CONFIG).useValue(config)
        .overrideProvider(DatabaseService).useValue(database).compile();
      app = module.createNestApplication<NestExpressApplication>({ logger: false, bodyParser: false });
      configureHttp(app, config); await app.init();
      const server = app.getHttpServer();
      await request(server).get('/api/v1/me/memory/camps').expect(401);
      const token = randomBytes(32).toString('hex');
      await db.insert(sessions).values({ tokenHash: sessionHash(token), accountId: member, csrfToken: 'fixture', expiresAt: new Date(Date.now() + 60000) });
      const response = await request(server).get('/api/v1/me/memory/camps').set('Cookie', `PYNEATH_SESSION=${token}`).expect(200);
      assert.equal(campForestsSchema.parse(response.body).camps.length, 3);
      assert.equal(response.headers['cache-control'], 'no-store');
      assert.ok(!JSON.stringify(response.body).includes('sessionId'));
      await db.update(sessions).set({ accountId: outsider }).where(eq(sessions.tokenHash, sessionHash(token)));
      const forged = await request(server).get(`/api/v1/me/memory/camps?accountId=${member}&campId=${a}`).set('Cookie', `PYNEATH_SESSION=${token}`).set('X-User-ID', member).expect(200);
      assert.deepEqual(forged.body, { camps: [] });
      await client.query('ALTER TABLE camp_milestones RENAME TO temporarily_unavailable_memories');
      try {
        const failed = await request(server).get('/api/v1/me/memory/camps').set('Cookie', `PYNEATH_SESSION=${token}`).expect(500);
        assert.ok(!JSON.stringify(failed.body).includes('camp_milestones'));
      } finally { await client.query('ALTER TABLE temporarily_unavailable_memories RENAME TO camp_milestones'); }
      await app.close(); app = undefined;
    });

    await t.test('member deletion preserves shared history; Camp deletion removes its memories only', async () => {
      await db.delete(accounts).where(eq(accounts.id, member));
      assert.deepEqual(await memory.camps(member), []);
      assert.equal((await memory.camps(owner)).find(item => item.campId === a)!.sharedSessions, 8);
      await db.delete(camps).where(eq(camps.id, a));
      assert.equal((await db.select().from(campMilestones).where(eq(campMilestones.campId, a))).length, 0);
      assert.equal((await memory.camps(owner)).find(item => item.campId === b)!.sharedSessions, 3);
    });
  } finally {
    await app?.close();
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    client.release(); await pool.end();
  }
});
