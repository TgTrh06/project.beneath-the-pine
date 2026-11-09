import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { Subject } from 'rxjs';
import { accounts } from '../src/modules/identity/infrastructure/identity.schema';
import { focusSessions, sessionParticipants } from '../src/modules/focus/infrastructure/focus.schema';
import { campMilestones } from '../src/modules/memory/infrastructure/memory.schema';
import { FocusService } from '../src/modules/focus/application/focus.service';
import { DrizzleFocusRepository } from '../src/modules/focus/infrastructure/focus.repository';
import { SharedMemoryService } from '../src/modules/memory/application/shared-memory.service';
import { DrizzleSharedMemoryRepository } from '../src/modules/memory/infrastructure/shared-memory.repository';
import type { DatabaseService } from '../src/platform/database/database.service';
import type { Analytics } from '../src/modules/analytics/public-api';
import type { PresenceChange } from '../src/modules/focus/domain/focus';
import { createCamps, createPacts, createSeeds, transactionsFor } from './helpers/module-fixtures';

test('Focus shares rollback with Pact and Seed, then publishes and derives memory after commit', { skip: !process.env.PYNEATH_TEST_DATABASE_URL }, async () => {
  const schema = `focus_tx_${randomBytes(8).toString('hex')}`;
  const pool = new Pool({ connectionString: process.env.PYNEATH_TEST_DATABASE_URL, max: 1 });
  const client = await pool.connect();
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    const migrations = resolve(__dirname, '../../drizzle');
    for (const name of readdirSync(migrations).filter(name => /^\d+.*\.sql$/.test(name)).sort()) {
      await client.query(readFileSync(resolve(migrations, name), 'utf8').replaceAll('"public"', `"${schema}"`));
    }
    const db = drizzle(client), database = { db } as unknown as DatabaseService;
    const [owner, member] = await db.insert(accounts).values(['owner', 'member'].map(name => ({ email: `${name}@fixture.test`, passwordHash: 'fixture' }))).returning();
    const telemetry: string[] = [], changes: string[] = [];
    const analytics: Analytics = { record: async (_id, event) => { telemetry.push(event); }, reserveAssistanceRequest: async () => null, ownsAssistanceRequest: async () => false };
    const transactions = transactionsFor(database), repository = new DrizzleFocusRepository(transactions);
    const camps = createCamps(database, analytics), pacts = createPacts(database, camps, analytics), seeds = createSeeds(database);
    const memory = new SharedMemoryService(new DrizzleSharedMemoryRepository(transactions));
    const events = { changes: new Subject<string>(), presenceChanges: new Subject<PresenceChange>() };
    events.changes.subscribe(id => changes.push(id));
    const focus = new FocusService(repository, transactions, camps, pacts, seeds, memory, analytics, { now: () => new Date() }, events);
    const camp = await camps.create(owner.id, 'Fixture Camp');
    await camps.accept((await camps.invite(camp.id, owner.id, 72)).token, member.id);
    const pact = await pacts.create(camp.id, owner.id, { participantIds: [member.id], startsAt: new Date().toISOString(), durationMinutes: 5 }, 'fixture-pact');
    await pacts.respond(pact.id, member.id, 'accepted');
    changes.length = 0; telemetry.length = 0;

    const activate = pacts.activate.bind(pacts);
    pacts.activate = async (...args) => { await activate(...args); throw new Error('fixture activation failure'); };
    await assert.rejects(focus.startPact(pact.id, owner.id, 'fixture-start'), /fixture activation failure/);
    assert.equal((await db.select().from(focusSessions)).length, 0);
    assert.equal((await db.select().from(sessionParticipants)).length, 0);
    assert.equal((await pacts.raw(pact.id)).status, 'scheduled');
    assert.equal((await pacts.raw(pact.id)).startedSessionId, null);
    assert.deepEqual(changes, []); assert.deepEqual(telemetry, []);
    pacts.activate = activate;
    const session = await focus.startPact(pact.id, owner.id, 'fixture-start');
    await focus.join(session.id, member.id);
    await seeds.upsert(owner.id, { text: 'Old fictional draft' });
    const save = seeds.upsert.bind(seeds);
    seeds.upsert = async (...args) => { await save(...args); throw new Error('fixture failure after seed write'); };
    changes.length = 0; telemetry.length = 0;
    await assert.rejects(focus.checkout(session.id, owner.id, { outcome: 'progress', openSeed: 'New fictional draft' }), /fixture failure after seed write/);
    assert.equal((await seeds.get(owner.id))?.text, 'Old fictional draft');
    assert.equal((await repository.participant(session.id, owner.id))?.presence, 'active');
    assert.equal((await repository.participant(session.id, owner.id))?.activeSlotAccountId, owner.id);
    assert.deepEqual(changes, []); assert.deepEqual(telemetry, []);
    seeds.upsert = save;
    await focus.checkout(session.id, owner.id, { outcome: 'progress', openSeed: 'New fictional draft' });
    assert.equal((await seeds.get(owner.id))?.text, 'New fictional draft');

    // A second connection can see the terminal state when the post-commit memory operation runs.
    const observer = new Pool({ connectionString: process.env.PYNEATH_TEST_DATABASE_URL, max: 1, options: `-c search_path=${schema}` });
    const record = memory.record.bind(memory);
    let observedCommit = false;
    memory.record = async (...args) => {
      const rows = await observer.query('select status from focus_sessions where id = $1', [session.id]);
      observedCommit = rows.rows[0].status === 'completed';
      return record(...args);
    };
    try { await focus.checkout(session.id, member.id, { outcome: 'completed' }); }
    finally { await observer.end(); }
    assert.equal(observedCommit, true);
    assert.equal((await pacts.raw(pact.id)).status, 'completed');
    assert.equal((await db.select().from(campMilestones).where(eq(campMilestones.sessionId, session.id))).length, 1);
    assert.deepEqual(telemetry, ['session_checked_out', 'camp_milestone_recorded', 'session_checked_out']);
    assert.deepEqual(changes, [session.id, session.id]);
    await focus.checkout(session.id, member.id, { outcome: 'stopped', openSeed: null });
    assert.equal(telemetry.length, 3, 'repeated checkout emits no additional event');
  } finally {
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    client.release(); await pool.end();
  }
});
