import { Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, eq, sql } from 'drizzle-orm';
import type { CampForest, ForestThreshold, PersonalForest } from '@pyneath/contracts';
import { DatabaseService } from '../../platform/database/database.service';
import { camps, campMemberships } from '../camp/public-api';
import { campMilestones, personalMilestones } from './infrastructure/memory.schema';
import { accounts } from '../identity/public-api';
import { focusSessions, sessionParticipants } from '../focus/public-api';

@Injectable()
export class MemoryService {
  constructor(private readonly database: DatabaseService) { }
  /** Rebuild the bounded projection from durable sessions, including pre-feature history.
   * This is deliberately outside checkout: memory failures cannot block focus or Seed saving.
   */
  async personal(accountId: string): Promise<PersonalForest> {
    return this.database.db.transaction(async tx => {
      const [owner] = await tx.select({ id: accounts.id }).from(accounts)
        .where(eq(accounts.id, accountId)).for('update');
      if (!owner) throw new NotFoundException();
      const endedAt = sql<Date>`coalesce(${focusSessions.completedAt}, ${focusSessions.endsAt})`.mapWith(focusSessions.endsAt);
      const first = await tx.select({
        id: focusSessions.id, endedAt,
        total: sql<number>`count(*) over ()`.mapWith(Number),
      }).from(sessionParticipants)
        .innerJoin(focusSessions, eq(focusSessions.id, sessionParticipants.sessionId))
        .where(and(eq(sessionParticipants.accountId, accountId), eq(focusSessions.status, 'completed')))
        .orderBy(asc(endedAt), asc(focusSessions.id)).limit(7);
      const earned = ([1, 3, 7] as const).flatMap(threshold => {
        const source = first[threshold - 1];
        return source ? [{ accountId, threshold, sourceSessionId: source.id, recordedAt: source.endedAt }] : [];
      });
      if (earned.length) await tx.insert(personalMilestones).values(earned).onConflictDoNothing();
      const milestones = await tx.select({
        threshold: personalMilestones.threshold,
        sourceSessionId: personalMilestones.sourceSessionId,
        recordedAt: personalMilestones.recordedAt,
      }).from(personalMilestones).where(eq(personalMilestones.accountId, accountId))
        .orderBy(asc(personalMilestones.threshold));
      return {
        completedSessions: first[0]?.total ?? 0,
        milestones: milestones.map(item => ({ ...item, threshold: item.threshold as ForestThreshold, recordedAt: item.recordedAt.toISOString() })),
      };
    });
  }
  async list(accountId: string) {
    return this.database.db.select({
      id: campMilestones.id,
      campId: campMilestones.campId,
      sessionId: campMilestones.sessionId,
      type: campMilestones.type,
      recordedAt: campMilestones.recordedAt
    }).from(campMilestones)
      .innerJoin(campMemberships, eq(campMemberships.campId, campMilestones.campId))
      .where(and(eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active')));
  }

  /** One read snapshot; only durable shared-presence records contribute, including archived Camps. */
  async camps(accountId: string): Promise<CampForest[]> {
    const ranked = this.database.db.select({
      campId: campMilestones.campId,
      recordedAt: campMilestones.recordedAt,
      ordinal: sql<number>`row_number() over (partition by ${campMilestones.campId} order by ${campMilestones.recordedAt}, ${campMilestones.id})`.as('ordinal'),
    }).from(campMilestones)
      .innerJoin(campMemberships, eq(campMemberships.campId, campMilestones.campId))
      .where(and(eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active'), eq(campMilestones.type, 'shared_presence')))
      .as('ranked_memory');
    const milestoneDate = (threshold: ForestThreshold) => sql<Date | null>`min(case when ${ranked.ordinal} = ${threshold} then ${ranked.recordedAt} end)`.mapWith(campMilestones.recordedAt);
    const rows = await this.database.db.select({
      campId: camps.id, name: camps.name, status: camps.status,
      sharedSessions: sql<number>`count(${ranked.campId})`.mapWith(Number),
      first: milestoneDate(1), third: milestoneDate(3), seventh: milestoneDate(7),
    }).from(camps)
      .innerJoin(campMemberships, eq(campMemberships.campId, camps.id))
      .leftJoin(ranked, eq(ranked.campId, camps.id))
      .where(and(eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active')))
      .groupBy(camps.id).orderBy(asc(camps.createdAt), asc(camps.id));
    return rows.map(({ first, third, seventh, ...camp }) => ({ ...camp,
      milestones: ([{ threshold: 1, date: first }, { threshold: 3, date: third }, { threshold: 7, date: seventh }] as const)
        .flatMap(({ threshold, date }) => date ? [{ threshold, recordedAt: date.toISOString() }] : []),
    }));
  }
} 
