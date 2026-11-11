import { Injectable } from '@nestjs/common';
import { focusContextSchema } from '@pyneath/contracts';
import { and, desc, eq, inArray, isNull, lte, ne, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { PostgresUnitOfWork } from '../../../platform/database/postgres-unit-of-work';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import { campMemberships, camps } from '../../camp/infrastructure/camp.schema';
import { focusPactParticipants } from '../../pact/infrastructure/pact.schema';
import { profiles } from '../../profile/infrastructure/profile.schema';
import { accountPreferences } from '../../preferences/infrastructure/preferences.schema';
import type { FocusRepository } from '../application/focus.ports';
import { ActiveSessionCollision, activePresence, type Outcome, type Presence } from '../domain/focus';
import { focusSessions, sessionParticipants } from './focus.schema';

@Injectable()
export class DrizzleFocusRepository implements FocusRepository {
  async readOwnContext(accountId: string) {
    const [row] = await this.transactions.reader().select({ kind: focusSessions.kind, intention: sessionParticipants.intention,
      durationMinutes: focusSessions.durationMinutes, endsAt: focusSessions.endsAt, presence: sessionParticipants.presence })
      .from(sessionParticipants).innerJoin(focusSessions, eq(focusSessions.id, sessionParticipants.sessionId))
      .where(and(eq(sessionParticipants.accountId, accountId), eq(sessionParticipants.activeSlotAccountId, accountId),
        isNull(sessionParticipants.checkedOutAt), inArray(sessionParticipants.presence, activePresence),
        eq(focusSessions.status, 'active'), sql`${focusSessions.endsAt} > now()`,
        sql`(${focusSessions.kind} = 'solo' or exists (
          select 1 from ${campMemberships} inner join ${camps} on ${camps.id} = ${campMemberships.campId}
          where ${campMemberships.campId} = ${focusSessions.campId} and ${campMemberships.accountId} = ${accountId}
          and ${campMemberships.status} = 'active' and ${camps.status} = 'active'
        ))`)).limit(1);
    return row ? focusContextSchema.parse({ ...row, status: 'active', endsAt: row.endsAt.toISOString() }) : null;
  }
  exportSessions(accountId: string) {
    return this.transactions.reader().select({ id: focusSessions.id, kind: focusSessions.kind, startedAt: focusSessions.startedAt, endsAt: focusSessions.endsAt, status: focusSessions.status, intention: sessionParticipants.intention, outcome: sessionParticipants.outcome })
      .from(sessionParticipants).innerJoin(focusSessions, eq(focusSessions.id, sessionParticipants.sessionId)).where(eq(sessionParticipants.accountId, accountId));
  }
  constructor(private readonly transactions: PostgresUnitOfWork) {}
  private async insert<T>(work: () => Promise<T>): Promise<T> {
    try { return await work(); } catch (failure) {
      const wrapped = failure as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string } };
      const error = wrapped.cause ?? wrapped;
      if (error.code === '23505' && ['focus_sessions_actor_request_uq', 'session_participants_one_active_per_account_uq'].includes(error.constraint ?? '')) throw new ActiveSessionCollision();
      throw failure;
    }
  }
  async activeSlot(accountId: string, context?: TransactionContext) {
    return (await this.transactions.reader(context).select({ id: sessionParticipants.id, sessionId: sessionParticipants.sessionId }).from(sessionParticipants).where(eq(sessionParticipants.activeSlotAccountId, accountId)))[0];
  }
  async find(sessionId: string, context?: TransactionContext, lock = false) {
    const query = this.transactions.reader(context).select().from(focusSessions).where(eq(focusSessions.id, sessionId));
    return (await (lock ? query.for('update') : query))[0];
  }
  async byRequest(accountId: string, requestKey: string) {
    return (await this.transactions.reader().select().from(focusSessions).where(and(eq(focusSessions.startedByAccountId, accountId), eq(focusSessions.requestKey, requestKey))))[0];
  }
  create(value: Parameters<FocusRepository['create']>[0], context: TransactionContext) {
    return this.insert(async () => (await this.transactions.reader(context).insert(focusSessions).values(value).returning())[0]);
  }
  async addParticipant(sessionId: string, accountId: string, context: TransactionContext, intention?: string) {
    await this.insert(async () => { await this.transactions.reader(context).insert(sessionParticipants).values({ sessionId, accountId, activeSlotAccountId: accountId, ...(intention === undefined ? {} : { intention }) }); });
  }
  async participant(sessionId: string, accountId: string, context?: TransactionContext, lock = false) {
    const query = this.transactions.reader(context).select().from(sessionParticipants).where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, accountId)));
    return (await (lock ? query.for('update') : query))[0];
  }
  participantViews(sessionId: string, context: TransactionContext) {
    return this.transactions.reader(context).select({ accountId: sessionParticipants.accountId, displayName: profiles.displayName, presence: sessionParticipants.presence, joinedAt: sessionParticipants.joinedAt, checkedOutAt: sessionParticipants.checkedOutAt, sharePresence: accountPreferences.sharePresence })
      .from(sessionParticipants).leftJoin(profiles, eq(profiles.accountId, sessionParticipants.accountId))
      .leftJoin(accountPreferences, eq(accountPreferences.accountId, sessionParticipants.accountId)).where(eq(sessionParticipants.sessionId, sessionId));
  }
  async stopRevokedSlot(participantId: string, accountId: string, now: Date, context: TransactionContext) {
    await this.transactions.reader(context).update(sessionParticipants).set({ activeSlotAccountId: null, presence: 'checked_out', outcome: 'stopped', checkedOutAt: now })
      .where(and(eq(sessionParticipants.id, participantId), eq(sessionParticipants.activeSlotAccountId, accountId)));
  }
  async complete(sessionId: string, now: Date, context: TransactionContext, guard: 'active' | 'expired' | 'locked') {
    const rows = await this.transactions.reader(context).update(focusSessions).set({ status: 'completed', completedAt: now })
      .where(and(eq(focusSessions.id, sessionId), guard === 'locked' ? undefined : eq(focusSessions.status, 'active'), guard === 'expired' ? lte(focusSessions.endsAt, now) : undefined)).returning({ id: focusSessions.id });
    return rows.length > 0;
  }
  async stopParticipants(sessionId: string, now: Date, context: TransactionContext) {
    await this.transactions.reader(context).update(sessionParticipants).set({ presence: 'checked_out', activeSlotAccountId: null, checkedOutAt: now, outcome: 'stopped' })
      .where(and(eq(sessionParticipants.sessionId, sessionId), inArray(sessionParticipants.presence, activePresence)));
  }
  async checkOutParticipant(participantId: string, outcome: Outcome, now: Date, context: TransactionContext) {
    await this.transactions.reader(context).update(sessionParticipants).set({ presence: 'checked_out', outcome, checkedOutAt: now, activeSlotAccountId: null }).where(eq(sessionParticipants.id, participantId));
  }
  async hasRemaining(sessionId: string, context: TransactionContext, limitOne = false) {
    const query = this.transactions.reader(context).select({ id: sessionParticipants.id }).from(sessionParticipants).where(and(eq(sessionParticipants.sessionId, sessionId), inArray(sessionParticipants.presence, activePresence)));
    return (await (limitOne ? query.limit(1) : query)).length > 0;
  }
  async hasWaiting(pactId: string, campId: string, sessionId: string, context: TransactionContext) {
    return (await this.transactions.reader(context).select({ id: focusPactParticipants.id }).from(focusPactParticipants)
      .innerJoin(campMemberships, and(eq(campMemberships.campId, campId), eq(campMemberships.accountId, focusPactParticipants.accountId), eq(campMemberships.status, 'active')))
      .leftJoin(sessionParticipants, and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, focusPactParticipants.accountId)))
      .where(and(eq(focusPactParticipants.pactId, pactId), eq(focusPactParticipants.response, 'accepted'), isNull(sessionParticipants.id))).limit(1)).length > 0;
  }
  async setPresence(participantId: string, presence: Presence, context: TransactionContext) {
    await this.transactions.reader(context).update(sessionParticipants).set({ presence }).where(eq(sessionParticipants.id, participantId));
  }
  history(accountId: string) {
    return this.transactions.reader().select({ id: focusSessions.id, kind: focusSessions.kind, startedAt: focusSessions.startedAt, endsAt: focusSessions.endsAt, status: focusSessions.status, outcome: sessionParticipants.outcome })
      .from(sessionParticipants).innerJoin(focusSessions, eq(focusSessions.id, sessionParticipants.sessionId)).where(eq(sessionParticipants.accountId, accountId)).orderBy(desc(focusSessions.startedAt)).limit(100);
  }
  async activeCampMember(campId: string, accountId: string, context: TransactionContext) {
    return Boolean((await this.transactions.reader(context).select({ id: campMemberships.id }).from(campMemberships).innerJoin(camps, eq(camps.id, campMemberships.campId))
      .where(and(eq(campMemberships.campId, campId), eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active'), eq(camps.status, 'active'))))[0]);
  }
  async recentPartners(campId: string, accountId: string, context: TransactionContext) {
    const mine = alias(sessionParticipants, 'mine'), other = alias(sessionParticipants, 'other');
    const rows = await this.transactions.reader(context).select({ accountId: other.accountId }).from(mine)
      .innerJoin(focusSessions, and(eq(focusSessions.id, mine.sessionId), eq(focusSessions.kind, 'pact'), eq(focusSessions.campId, campId), eq(focusSessions.status, 'completed')))
      .innerJoin(other, and(eq(other.sessionId, mine.sessionId), ne(other.accountId, accountId)))
      .innerJoin(campMemberships, and(eq(campMemberships.accountId, other.accountId), eq(campMemberships.campId, campId), eq(campMemberships.status, 'active')))
      .where(eq(mine.accountId, accountId)).groupBy(other.accountId).orderBy(desc(sql`max(${focusSessions.startedAt})`)).limit(7);
    return rows.map(row => row.accountId);
  }
  async stopRevokedParticipants(sessionId: string, campId: string, now: Date, context: TransactionContext) {
    await this.transactions.reader(context).execute(sql`UPDATE session_participants AS sp
      SET presence = 'checked_out', active_slot_account_id = NULL, outcome = 'stopped', checked_out_at = ${now}
      WHERE sp.session_id = ${sessionId} AND sp.presence IN ('active', 'break', 'disconnected')
        AND NOT EXISTS (SELECT 1 FROM camp_memberships AS cm
          WHERE cm.camp_id = ${campId} AND cm.account_id = sp.account_id AND cm.status = 'active')`);
  }
  async joinedAccountIds(sessionId: string) {
    return (await this.transactions.reader().select({ accountId: sessionParticipants.accountId }).from(sessionParticipants).where(eq(sessionParticipants.sessionId, sessionId))).map(row => row.accountId);
  }
  async expired(now: Date) { return (await this.transactions.reader().select({ id: focusSessions.id }).from(focusSessions).where(and(eq(focusSessions.status, 'active'), lte(focusSessions.endsAt, now)))).map(row => row.id); }
  async activePacts() { return (await this.transactions.reader().select({ id: focusSessions.id }).from(focusSessions).where(and(eq(focusSessions.status, 'active'), eq(focusSessions.kind, 'pact')))).map(row => row.id); }
}
