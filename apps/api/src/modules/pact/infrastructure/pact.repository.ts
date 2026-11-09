import { Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull, or, lt, gt, gte, lte, asc, desc, sql } from 'drizzle-orm';
import type { PactListQuery } from '@pyneath/contracts';
import { PostgresUnitOfWork } from '../../../platform/database/postgres-unit-of-work';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { PageCursor } from '../../../shared/kernel/pagination';
import { camps, campMemberships } from '../../camp/infrastructure/camp.schema';
import { profiles } from '../../profile/infrastructure/profile.schema';
import type { PactRepository } from '../application/pact.ports';
import type { PactStatus, PactResponse } from '../domain/pact';
import { focusPactParticipants, focusPacts, pactReminderReceipts } from './pact.schema';

@Injectable()
export class DrizzlePactRepository implements PactRepository {
  exportPacts(accountId: string) {
    return this.transactions.reader().select({ id: focusPacts.id, campId: focusPacts.campId, startsAt: focusPacts.startsAt, durationMinutes: focusPacts.durationMinutes, status: focusPacts.status, response: focusPactParticipants.response })
      .from(focusPactParticipants).innerJoin(focusPacts, eq(focusPacts.id, focusPactParticipants.pactId)).where(eq(focusPactParticipants.accountId, accountId));
  }
  exportReminders(accountId: string) {
    return this.transactions.reader().select().from(pactReminderReceipts).where(eq(pactReminderReceipts.accountId, accountId));
  }
  constructor(private readonly transactions: PostgresUnitOfWork) {}
  async activate(pactId: string, sessionId: string, now: Date, context: TransactionContext) {
    await this.transactions.reader(context).update(focusPacts).set({ status: 'active', startedSessionId: sessionId, updatedAt: now }).where(eq(focusPacts.id, pactId));
  }
  async completeActive(pactId: string, now: Date, context: TransactionContext) {
    await this.transactions.reader(context).update(focusPacts).set({ status: 'completed', updatedAt: now }).where(and(eq(focusPacts.id, pactId), eq(focusPacts.status, 'active')));
  }
  dueReminders(accountId: string, now: Date, context: TransactionContext) {
    return this.transactions.reader(context).select({ id: focusPacts.id, campName: camps.name, startsAt: focusPacts.startsAt, durationMinutes: focusPacts.durationMinutes })
      .from(focusPacts)
      .innerJoin(focusPactParticipants, and(eq(focusPactParticipants.pactId, focusPacts.id), eq(focusPactParticipants.accountId, accountId), eq(focusPactParticipants.response, 'accepted')))
      .innerJoin(camps, and(eq(camps.id, focusPacts.campId), eq(camps.status, 'active')))
      .innerJoin(campMemberships, and(eq(campMemberships.campId, camps.id), eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active')))
      .leftJoin(pactReminderReceipts, and(eq(pactReminderReceipts.pactId, focusPacts.id), eq(pactReminderReceipts.accountId, accountId)))
      .where(and(eq(focusPacts.status, 'scheduled'), gte(focusPacts.startsAt, now), lte(focusPacts.startsAt, new Date(now.getTime() + 600000)), isNull(pactReminderReceipts.pactId)))
      .orderBy(asc(focusPacts.startsAt)).limit(5);
  }
  async claimReminder(pactId: string, accountId: string, context: TransactionContext) {
    return Boolean((await this.transactions.reader(context).insert(pactReminderReceipts).values({ pactId, accountId }).onConflictDoNothing().returning({ pactId: pactReminderReceipts.pactId }))[0]);
  }
  async status(pactId: string, context: TransactionContext) {
    return (await this.transactions.reader(context).select({ status: focusPacts.status }).from(focusPacts).where(eq(focusPacts.id, pactId)))[0]?.status;
  }
  async lockActor(accountId: string, context: TransactionContext) { await this.transactions.reader(context).execute(sql`select pg_advisory_xact_lock(hashtext(${accountId}))`); }
  async byRequest(accountId: string, requestKey: string, context?: TransactionContext) {
    return (await this.transactions.reader(context).select().from(focusPacts).where(and(eq(focusPacts.creatorAccountId, accountId), eq(focusPacts.requestKey, requestKey))))[0];
  }
  async create(value: { campId: string; creatorAccountId: string; startsAt: Date; durationMinutes: number; requestKey: string }, context: TransactionContext) {
    return (await this.transactions.reader(context).insert(focusPacts).values(value).returning())[0];
  }
  async addParticipants(values: Array<{ pactId: string; accountId: string; response: PactResponse; respondedAt: Date | null }>, context: TransactionContext) {
    await this.transactions.reader(context).insert(focusPactParticipants).values(values);
  }
  async participant(pactId: string, accountId: string, context?: TransactionContext) {
    return (await this.transactions.reader(context).select().from(focusPactParticipants).where(and(eq(focusPactParticipants.pactId, pactId), eq(focusPactParticipants.accountId, accountId))))[0];
  }
  async find(pactId: string, context?: TransactionContext, lock = false) {
    const query = this.transactions.reader(context).select().from(focusPacts).where(eq(focusPacts.id, pactId));
    return (await (lock ? query.for('update') : query))[0];
  }
  participants(pactId: string) {
    return this.transactions.reader().select({ accountId: focusPactParticipants.accountId, response: focusPactParticipants.response, displayName: profiles.displayName })
      .from(focusPactParticipants).leftJoin(profiles, eq(profiles.accountId, focusPactParticipants.accountId)).where(eq(focusPactParticipants.pactId, pactId));
  }
  upcoming(accountId: string) {
    return this.transactions.reader().select({ id: focusPacts.id, campId: focusPacts.campId, startsAt: focusPacts.startsAt, durationMinutes: focusPacts.durationMinutes }).from(focusPactParticipants)
      .innerJoin(focusPacts, eq(focusPacts.id, focusPactParticipants.pactId)).innerJoin(campMemberships, and(eq(campMemberships.campId, focusPacts.campId), eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active')))
      .where(and(eq(focusPactParticipants.accountId, accountId), eq(focusPactParticipants.response, 'accepted'), inArray(focusPacts.status, ['scheduled', 'active']))).orderBy(asc(focusPacts.startsAt));
  }
  async setStatus(pactId: string, status: PactStatus, now: Date, context: TransactionContext) {
    await this.transactions.reader(context).update(focusPacts).set({ status, updatedAt: now }).where(eq(focusPacts.id, pactId));
  }
  async respond(participantId: string, response: 'accepted' | 'declined', now: Date, context: TransactionContext) {
    await this.transactions.reader(context).update(focusPactParticipants).set({ response, respondedAt: now }).where(eq(focusPactParticipants.id, participantId));
  }
  list(actorId: string, query: PactListQuery, cursor?: PageCursor, campId?: string) {
    const past = query.group === 'past';
    const filter = query.group === 'pending' ? and(eq(focusPacts.status, 'scheduled'), inArray(focusPactParticipants.response, ['invited', 'declined']))
      : query.group === 'upcoming' ? and(eq(focusPacts.status, 'scheduled'), eq(focusPactParticipants.response, 'accepted'))
      : query.group === 'active' ? and(eq(focusPacts.status, 'active'), eq(focusPactParticipants.response, 'accepted'))
      : inArray(focusPacts.status, ['completed', 'cancelled', 'expired']);
    const compare = past ? lt : gt, order = past ? desc : asc;
    return this.transactions.reader().select({ id: focusPacts.id, campId: focusPacts.campId, campName: camps.name, startsAt: focusPacts.startsAt, durationMinutes: focusPacts.durationMinutes, status: focusPacts.status, response: focusPactParticipants.response, creatorId: focusPacts.creatorAccountId, sessionId: focusPacts.startedSessionId })
      .from(focusPacts).innerJoin(focusPactParticipants, and(eq(focusPactParticipants.pactId, focusPacts.id), eq(focusPactParticipants.accountId, actorId)))
      .innerJoin(camps, eq(camps.id, focusPacts.campId)).innerJoin(campMemberships, and(eq(campMemberships.campId, camps.id), eq(campMemberships.accountId, actorId), eq(campMemberships.status, 'active')))
      .where(and(filter, campId ? eq(camps.id, campId) : undefined, cursor ? or(compare(focusPacts.startsAt, cursor.time), and(eq(focusPacts.startsAt, cursor.time), compare(focusPacts.id, cursor.id))) : undefined))
      .orderBy(order(focusPacts.startsAt), order(focusPacts.id)).limit(query.limit + 1);
  }
  async expireScheduled(now: Date, before: Date, context?: TransactionContext, filter?: { pactId?: string; campId?: string }) {
    await this.transactions.reader(context).update(focusPacts).set({ status: 'expired', updatedAt: now })
      .where(and(filter?.pactId ? eq(focusPacts.id, filter.pactId) : undefined, filter?.campId ? eq(focusPacts.campId, filter.campId) : undefined, eq(focusPacts.status, 'scheduled'), lt(focusPacts.startsAt, before)));
  }
  async hasOpen(campId: string, context: TransactionContext) {
    return Boolean((await this.transactions.reader(context).select({ id: focusPacts.id }).from(focusPacts).where(and(eq(focusPacts.campId, campId), inArray(focusPacts.status, ['scheduled', 'active']))).limit(1))[0]);
  }
}
