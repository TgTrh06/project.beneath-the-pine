import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes, randomUUID } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import type { DatabaseService } from '../src/platform/database/database.service';
import { accounts } from '../src/modules/identity/infrastructure/identity.schema';
import { IdentityStore } from '../src/modules/identity/identity.store';
import { IdentityService } from '../src/modules/identity/identity.service';
import { hashPassword } from '../src/modules/identity/password';
import { readApiConfig } from '../src/platform/config/api-config';
import { camps, campMemberships } from '../src/modules/camp/infrastructure/camp.schema';
import { campMilestones } from '../src/modules/memory/infrastructure/memory.schema';
import { focusSessions, sessionParticipants } from '../src/modules/focus/infrastructure/focus.schema';
import { PrivacyService } from '../src/modules/privacy/privacy.service';

test('PostgreSQL export excludes revoked Camp activity and deletion notifies only after commit', { skip: !process.env.PYNEATH_TEST_DATABASE_URL }, async () => {
  const pool = new Pool({ connectionString: process.env.PYNEATH_TEST_DATABASE_URL, max: 1 });
  const client = await pool.connect(); const schema = `privacy_test_${randomBytes(8).toString('hex')}`;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`); await client.query(`SET search_path TO "${schema}"`);
    const folder = resolve(__dirname, '../../drizzle');
    for (const file of readdirSync(folder).filter(file => file.endsWith('.sql')).sort()) {
      await client.query(readFileSync(resolve(folder, file), 'utf8').replaceAll('"public"', `"${schema}"`));
    }
    const db = drizzle(client), database = { db } as unknown as DatabaseService;
    const store = new IdentityStore(database), identity = new IdentityService(store, readApiConfig({}));
    const privacy = new PrivacyService(database, store, identity);
    const [owner, member, outsider] = [randomUUID(), randomUUID(), randomUUID()];
    const password = 'test-only-deletion-password';
    await db.insert(accounts).values(await Promise.all([owner, member, outsider].map(async (id, i) => ({ id, email: `privacy${i}@example.test`, passwordHash: await hashPassword(password) }))));
    const [camp] = await db.insert(camps).values({ name: 'Original Camp', ownerAccountId: owner }).returning();
    await db.insert(campMemberships).values([{ campId: camp.id, accountId: owner, role: 'owner' }, { campId: camp.id, accountId: member, role: 'member' }]);
    const [solo] = await db.insert(focusSessions).values({ kind: 'solo', startedByAccountId: member, durationMinutes: 5, startedAt: new Date(), endsAt: new Date(Date.now()+300000), requestKey: randomUUID() }).returning();
    await db.insert(sessionParticipants).values({ sessionId: solo.id, accountId: member, intention: 'Private retained work' });
    await db.insert(campMilestones).values({ campId: camp.id, sessionId: randomUUID() });
    assert.equal((await privacy.export(member)).milestones.length, 1);
    assert.equal((await privacy.export(outsider)).milestones.length, 0);
    for (const reason of ['leave', 'remove']) {
      await db.update(campMemberships).set({ status: 'removed', removedAt: new Date() }).where(eq(campMemberships.accountId, member));
      await db.update(camps).set({ name: `Private rename after ${reason}` }).where(eq(camps.id, camp.id));
      await db.insert(campMilestones).values({ campId: camp.id, sessionId: randomUUID() });
      const exported = await privacy.export(member);
      assert.deepEqual(exported.milestones, []);
      assert.equal(exported.camps[0].name, null); assert.equal(exported.camps[0].status, null);
      assert.equal(exported.sessions[0].intention, 'Private retained work');
      assert.ok((await privacy.export(owner)).milestones.length > 1);
      await db.update(campMemberships).set({ status: 'active', removedAt: null }).where(eq(campMemberships.accountId, member));
    }
    const deleted: string[] = []; identity.deletedAccounts.subscribe(id => deleted.push(id));
    await assert.rejects(privacy.remove(member, 'incorrect-password')); assert.deepEqual(deleted, []);
    const failingDatabase = { db: { select: db.select.bind(db), transaction: async () => { throw new Error('transaction failed'); } } } as unknown as DatabaseService;
    await assert.rejects(new PrivacyService(failingDatabase, store, identity).remove(member, password));
    assert.deepEqual(deleted, []); assert.equal((await db.select().from(accounts).where(eq(accounts.id, member))).length, 1);
    await privacy.remove(member, password);
    assert.deepEqual(deleted, [member]); assert.deepEqual(await db.select().from(accounts).where(eq(accounts.id, member)), []);
  } finally {
    await client.query('SET search_path TO public'); await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    client.release(); await pool.end();
  }
});
