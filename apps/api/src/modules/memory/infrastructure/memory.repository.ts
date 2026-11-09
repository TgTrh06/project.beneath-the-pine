import { Injectable } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { ForestThreshold } from '@pyneath/contracts';
import { PostgresUnitOfWork } from '../../../platform/database/postgres-unit-of-work';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { MemoryRepository } from '../application/memory.ports';
import type { PersonalMilestone } from '../domain/memory';
import { camps, campMemberships } from '../../camp/infrastructure/camp.schema';
import { focusSessions, sessionParticipants } from '../../focus/infrastructure/focus.schema';
import { campMilestones, personalMilestones } from './memory.schema';
@Injectable()
export class DrizzleMemoryRepository implements MemoryRepository {
  exportPersonal(accountId: string) {
    return this.transactions.reader().select({ threshold: personalMilestones.threshold, sourceSessionId: personalMilestones.sourceSessionId, recordedAt: personalMilestones.recordedAt })
      .from(personalMilestones).where(eq(personalMilestones.accountId, accountId));
  }
  constructor(private readonly transactions: PostgresUnitOfWork) {}
  completedSources(accountId: string, context: TransactionContext) {
    const endedAt = sql<Date>`coalesce(${focusSessions.completedAt}, ${focusSessions.endsAt})`.mapWith(focusSessions.endsAt);
    return this.transactions.reader(context).select({ id: focusSessions.id, endedAt, total: sql<number>`count(*) over ()`.mapWith(Number) })
      .from(sessionParticipants).innerJoin(focusSessions, eq(focusSessions.id, sessionParticipants.sessionId))
      .where(and(eq(sessionParticipants.accountId, accountId), eq(focusSessions.status, 'completed')))
      .orderBy(asc(endedAt), asc(focusSessions.id)).limit(7);
  }
  async insertPersonal(values: Array<PersonalMilestone & { accountId: string }>, context: TransactionContext) {
    await this.transactions.reader(context).insert(personalMilestones).values(values).onConflictDoNothing();
  }
  personalMilestones(accountId: string, context: TransactionContext) {
    return this.transactions.reader(context).select({ threshold: personalMilestones.threshold, sourceSessionId: personalMilestones.sourceSessionId, recordedAt: personalMilestones.recordedAt })
      .from(personalMilestones).where(eq(personalMilestones.accountId, accountId)).orderBy(asc(personalMilestones.threshold));
  }
  async earnedThresholds(accountId: string, context: TransactionContext) {
    return (await this.transactions.reader(context).select({ threshold: personalMilestones.threshold }).from(personalMilestones).where(eq(personalMilestones.accountId, accountId))).map(row => row.threshold);
  }
  async list(accountId: string) {
    return this.transactions.reader().select({
      id: campMilestones.id,
      campId: campMilestones.campId,
      sessionId: campMilestones.sessionId,
      type: campMilestones.type,
      recordedAt: campMilestones.recordedAt
    }).from(campMilestones)
      .innerJoin(campMemberships, eq(campMemberships.campId, campMilestones.campId))
      .where(and(eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active')));
  }

  async camps(accountId: string) {
    const ranked = this.transactions.reader().select({
      campId: campMilestones.campId,
      recordedAt: campMilestones.recordedAt,
      ordinal: sql<number>`row_number() over (partition by ${campMilestones.campId} order by ${campMilestones.recordedAt}, ${campMilestones.id})`.as('ordinal'),
    }).from(campMilestones)
      .innerJoin(campMemberships, eq(campMemberships.campId, campMilestones.campId))
      .where(and(eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active'), eq(campMilestones.type, 'shared_presence')))
      .as('ranked_memory');
    const milestoneDate = (threshold: ForestThreshold) => sql<Date | null>`min(case when ${ranked.ordinal} = ${threshold} then ${ranked.recordedAt} end)`.mapWith(campMilestones.recordedAt);
    const rows = await this.transactions.reader().select({
      campId: camps.id, name: camps.name, status: camps.status,
      sharedSessions: sql<number>`count(${ranked.campId})`.mapWith(Number),
      first: milestoneDate(1), third: milestoneDate(3), seventh: milestoneDate(7),
    }).from(camps)
      .innerJoin(campMemberships, eq(campMemberships.campId, camps.id))
      .leftJoin(ranked, eq(ranked.campId, camps.id))
      .where(and(eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active')))
      .groupBy(camps.id).orderBy(asc(camps.createdAt), asc(camps.id));
    return rows;
  }
}
