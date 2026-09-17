import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DatabaseService } from '../../platform/database/database.service';
import { CircleService } from '../circle/public-api';
import { profiles } from '../profile/public-api';
import { AnalyticsService } from '../analytics/public-api';
import { focusPactParticipants, focusPacts } from './infrastructure/pact.schema';

@Injectable()
export class PactService {
  constructor(private readonly database: DatabaseService, private readonly circles: CircleService, private readonly analytics: AnalyticsService) {}
  async create(circleId: string, actorId: string, input: { participantIds: string[]; startsAt: string; durationMinutes: 5 | 10 | 25 | 50 }, requestKey: string) {
    const membership = await this.circles.membership(circleId, actorId); if (!membership) throw new NotFoundException();
    const requested = [...new Set([actorId, ...input.participantIds])]; const active = await this.circles.activeMemberIds(circleId);
    if (requested.length > 8 || requested.some(id => !active.includes(id))) throw new ForbiddenException();
    const existing = (await this.database.db.select().from(focusPacts).where(and(eq(focusPacts.creatorAccountId, actorId), eq(focusPacts.requestKey, requestKey))))[0]; if (existing) return this.get(existing.id, actorId);
    const pactId = await this.database.db.transaction(async tx => { const [pact] = await tx.insert(focusPacts).values({ circleId, creatorAccountId: actorId, startsAt: new Date(input.startsAt), durationMinutes: input.durationMinutes, requestKey }).returning(); await tx.insert(focusPactParticipants).values(requested.map(accountId => ({ pactId: pact.id, accountId, response: accountId === actorId ? 'accepted' as const : 'invited' as const, respondedAt: accountId === actorId ? new Date() : null }))); return pact.id; });
    await this.analytics.record(actorId, 'pact_created', pactId, { durationMinutes: input.durationMinutes }); return this.get(pactId, actorId);
  }
  async requireParticipant(pactId: string, accountId: string) { const value = (await this.database.db.select().from(focusPactParticipants).where(and(eq(focusPactParticipants.pactId, pactId), eq(focusPactParticipants.accountId, accountId))))[0]; if (!value) throw new NotFoundException(); return value; }
  async raw(pactId: string) { const value = (await this.database.db.select().from(focusPacts).where(eq(focusPacts.id, pactId)))[0]; if (!value) throw new NotFoundException(); return value; }
  async get(pactId: string, actorId: string) {
    await this.requireParticipant(pactId, actorId); const pact = await this.raw(pactId);
    const participants = await this.database.db.select({ accountId: focusPactParticipants.accountId, response: focusPactParticipants.response, displayName: profiles.displayName }).from(focusPactParticipants).leftJoin(profiles, eq(profiles.accountId, focusPactParticipants.accountId)).where(eq(focusPactParticipants.pactId, pactId));
    return { id: pact.id, circleId: pact.circleId, creatorId: pact.creatorAccountId, startsAt: pact.startsAt, durationMinutes: pact.durationMinutes, status: pact.status, sessionId: pact.startedSessionId, participants, createdAt: pact.createdAt };
  }
  async listUpcoming(accountId: string) {
    return this.database.db.select({ id: focusPacts.id, circleId: focusPacts.circleId, startsAt: focusPacts.startsAt, durationMinutes: focusPacts.durationMinutes })
      .from(focusPactParticipants).innerJoin(focusPacts, eq(focusPacts.id, focusPactParticipants.pactId)).where(and(eq(focusPactParticipants.accountId, accountId), eq(focusPactParticipants.response, 'accepted'), inArray(focusPacts.status, ['scheduled', 'active'])));
  }
  async respond(pactId: string, actorId: string, response: 'accepted' | 'declined') { const participant = await this.requireParticipant(pactId, actorId); const pact = await this.raw(pactId); if (pact.status !== 'scheduled') throw new ConflictException(); if (participant.response === response) return this.get(pactId, actorId); await this.database.db.update(focusPactParticipants).set({ response, respondedAt: new Date() }).where(eq(focusPactParticipants.id, participant.id)); if (response === 'accepted') await this.analytics.record(actorId, 'pact_accepted', pactId); return this.get(pactId, actorId); }
  async cancel(pactId: string, actorId: string) { const pact = await this.raw(pactId); if (pact.creatorAccountId !== actorId) throw new ForbiddenException(); if (pact.status === 'cancelled') return this.get(pactId, actorId); if (pact.status !== 'scheduled') throw new ConflictException(); await this.database.db.update(focusPacts).set({ status: 'cancelled', updatedAt: new Date() }).where(eq(focusPacts.id, pactId)); await this.analytics.record(actorId, 'pact_cancelled', pactId); return this.get(pactId, actorId); }
}
