import { createPreferences, transactionsFor } from './helpers/module-fixtures';
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomBytes } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq } from 'drizzle-orm';
import { accounts } from '../src/modules/identity/infrastructure/identity.schema';
import { campInvites, campMemberships, camps } from '../src/modules/camp/infrastructure/camp.schema';
import { DrizzleCampRepository } from '../src/modules/camp/infrastructure/camp.repository';
import { inviteTokens } from '../src/modules/camp/infrastructure/invite-tokens';
import { CampService } from '../src/modules/camp/application/camp.service';
import type { Analytics } from '../src/modules/analytics/public-api';
import type { DatabaseService } from '../src/platform/database/database.service';
import { decodeCursor, encodeCursor } from '../src/platform/http/pagination';
import { BusinessError } from '../src/shared/kernel/business-error';
import { PactService } from '../src/modules/pact/application/pact.service';
import { DrizzlePactRepository } from '../src/modules/pact/infrastructure/pact.repository';
import { focusPacts, focusPactParticipants } from '../src/modules/pact/infrastructure/pact.schema';

test('Camp owner transfer and invitation failures retain atomic writes and post-commit telemetry', { skip: !process.env.PYNEATH_TEST_DATABASE_URL }, async () => {
  const schema = `camp_tx_${randomBytes(8).toString('hex')}`;
  const pool = new Pool({ connectionString: process.env.PYNEATH_TEST_DATABASE_URL, max: 1 });
  const client = await pool.connect();
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    const migrations = resolve(__dirname, '../../drizzle');
    for (const name of readdirSync(migrations).filter(name => /^\d+.*\.sql$/.test(name)).sort()) {
      await client.query(readFileSync(resolve(migrations, name), 'utf8').replaceAll('"public"', `"${schema}"`));
    }
    const db = drizzle(client), database = { db } as unknown as DatabaseService, transactions = transactionsFor(database);
    const repository = new DrizzleCampRepository(transactions);
    const events: string[] = [];
    const analytics: Analytics = { record: async (_id, name) => { events.push(name); }, reserveAssistanceRequest: async () => null, ownsAssistanceRequest: async () => false };
    const service = new CampService(repository, transactions, analytics, { now: () => new Date() }, inviteTokens, { decode: decodeCursor, encode: encodeCursor });
    const [owner, member, newcomer] = await db.insert(accounts).values(['owner', 'member', 'newcomer'].map(name => ({ email: `${name}@fixture.test`, passwordHash: 'fixture' }))).returning();
    const camp = await service.create(owner.id, 'Fixture Camp');
    await db.insert(campMemberships).values({ campId: camp.id, accountId: member.id, role: 'member' });
    const transfer = repository.transfer.bind(repository);
    repository.transfer = async () => { throw new Error('fixture failure after membership roles changed'); };
    await assert.rejects(service.transfer(camp.id, member.id, owner.id), /fixture failure/);
    assert.equal((await service.membership(camp.id, owner.id))?.role, 'owner');
    assert.equal((await service.membership(camp.id, member.id))?.role, 'member');
    assert.equal((await repository.find(camp.id))?.ownerAccountId, owner.id);
    repository.transfer = transfer;
    await service.transfer(camp.id, member.id, owner.id);
    assert.equal((await service.membership(camp.id, owner.id))?.role, 'member');
    assert.equal((await repository.find(camp.id))?.ownerAccountId, member.id);
    await assert.rejects(service.invite(camp.id, owner.id, 72), error => error instanceof BusinessError && error.code === 'FORBIDDEN');

    const invite = await service.invite(camp.id, member.id, 72);
    const accept = repository.accept.bind(repository);
    repository.accept = async () => { throw new Error('fixture failure after membership insert'); };
    await assert.rejects(service.accept(invite.token, newcomer.id), /fixture failure/);
    assert.equal(await service.membership(camp.id, newcomer.id), undefined);
    assert.deepEqual(events, ['camp_created']);
    repository.accept = accept;
    await db.update(campInvites).set({ expiresAt: new Date(0) }).where(eq(campInvites.id, invite.id));
    await assert.rejects(service.accept(invite.token, newcomer.id), error => error instanceof BusinessError && error.code === 'STATE_CONFLICT');
    assert.equal((await db.select().from(campInvites).where(eq(campInvites.id, invite.id)))[0].status, 'pending', 'existing expiry marker rolls back with the conflict');
    await db.update(campInvites).set({ expiresAt: new Date(Date.now() + 60000) }).where(eq(campInvites.id, invite.id));
    await service.accept(invite.token, newcomer.id);
    assert.equal((await service.membership(camp.id, newcomer.id))?.role, 'member');
    assert.deepEqual(events, ['camp_created', 'camp_invite_accepted']);
    assert.equal((await db.select().from(camps)).length, 1);

    const pacts = new PactService(new DrizzlePactRepository(transactions), transactions, service, analytics, { now: () => new Date() }, { decode: decodeCursor, encode: encodeCursor }, createPreferences(database));
    const [expired] = await db.insert(focusPacts).values({ campId: camp.id, creatorAccountId: member.id, startsAt: new Date(0), durationMinutes: 5, requestKey: 'expired-response' }).returning();
    await db.insert(focusPactParticipants).values({ pactId: expired.id, accountId: member.id, response: 'accepted' });
    await assert.rejects(pacts.respond(expired.id, member.id, 'declined'), error => error instanceof BusinessError && error.code === 'STATE_CONFLICT');
    assert.equal((await pacts.raw(expired.id)).status, 'expired', 'Pact expiry commits before reporting conflict');

    const [stale] = await db.insert(focusPacts).values({ campId: camp.id, creatorAccountId: member.id, startsAt: new Date(0), durationMinutes: 5, requestKey: 'archive-rollback' }).returning();
    const pending = await service.invite(camp.id, member.id, 72);
    const update = repository.update.bind(repository);
    repository.update = async () => { throw new Error('fixture archive failure after Pact and invite writes'); };
    await assert.rejects(pacts.updateCamp(camp.id, member.id, { status: 'archived' }), /fixture archive failure/);
    assert.equal((await pacts.raw(stale.id)).status, 'scheduled', 'Pact owner write rolls back');
    assert.equal((await db.select().from(campInvites).where(eq(campInvites.id, pending.id)))[0].status, 'pending', 'Camp owner write rolls back in the same transaction');
    assert.equal((await repository.find(camp.id))?.status, 'active');
    repository.update = update;
    await pacts.updateCamp(camp.id, member.id, { status: 'archived' });
    assert.equal((await pacts.raw(stale.id)).status, 'expired');
    assert.equal((await db.select().from(campInvites).where(eq(campInvites.id, pending.id)))[0].status, 'revoked');
    assert.equal((await repository.find(camp.id))?.status, 'archived');
  } finally {
    await client.query('SET search_path TO public');
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    client.release(); await pool.end();
  }
});
