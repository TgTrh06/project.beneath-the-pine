import { ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { and, desc, eq, inArray, lte } from 'drizzle-orm';
import { DatabaseService } from '../../platform/database/database.service';
import { circleMilestones } from '../memory/public-api';
import { focusPactParticipants, focusPacts, PactService } from '../pact/public-api';
import { profiles } from '../profile/public-api';
import { openSeeds } from '../seed/public-api';
import { AnalyticsService } from '../analytics/public-api';
import { focusSessions, sessionParticipants } from './infrastructure/focus.schema';
import { Subject } from 'rxjs';

type Outcome = 'completed' | 'progress' | 'stuck' | 'stopped';
@Injectable()
export class FocusService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  readonly changes = new Subject<string>();
  constructor(private readonly database: DatabaseService, private readonly pacts: PactService, private readonly analytics: AnalyticsService) {}
  onModuleInit() { this.timer = setInterval(() => void this.finalizeExpired().catch(() => undefined), 30000); this.timer.unref(); }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  private async ensureFree(accountId: string) { const [active] = await this.database.db.select({ id: sessionParticipants.id }).from(sessionParticipants).where(eq(sessionParticipants.activeSlotAccountId, accountId)); if (active) throw new ConflictException(); }
  async startSolo(accountId: string, input: { intention: string; durationMinutes: 5 | 10 | 25 | 50 }, requestKey: string) {
    const [existing] = await this.database.db.select().from(focusSessions).where(and(eq(focusSessions.startedByAccountId, accountId), eq(focusSessions.requestKey, requestKey))); if (existing) return this.snapshot(existing.id, accountId);
    await this.ensureFree(accountId); const now = new Date(); const endsAt = new Date(now.getTime() + input.durationMinutes * 60000);
    const id = await this.database.db.transaction(async tx => { const [session] = await tx.insert(focusSessions).values({ kind: 'solo', startedByAccountId: accountId, durationMinutes: input.durationMinutes, startedAt: now, endsAt, requestKey }).returning(); await tx.insert(sessionParticipants).values({ sessionId: session.id, accountId, activeSlotAccountId: accountId, intention: input.intention }); return session.id; });
    await this.analytics.record(accountId, 'solo_session_started', id, { durationMinutes: input.durationMinutes }); this.changes.next(id); return this.snapshot(id, accountId);
  }
  async startPact(pactId: string, accountId: string, requestKey: string) {
    const pact = await this.pacts.raw(pactId); if (pact.creatorAccountId !== accountId) throw new ForbiddenException(); const participant = await this.pacts.requireParticipant(pactId, accountId); if (participant.response !== 'accepted') throw new ForbiddenException();
    if (pact.startedSessionId) return this.snapshot(pact.startedSessionId, accountId); if (pact.status !== 'scheduled') throw new ConflictException();
    const now = new Date(); if (now.getTime() < pact.startsAt.getTime() - 10 * 60000) throw new ConflictException(); if (now.getTime() > pact.startsAt.getTime() + 30 * 60000) { await this.database.db.update(focusPacts).set({ status: 'expired', updatedAt: now }).where(eq(focusPacts.id, pactId)); throw new ConflictException(); }
    await this.ensureFree(accountId); const endsAt = new Date(now.getTime() + pact.durationMinutes * 60000);
    const id = await this.database.db.transaction(async tx => { const [session] = await tx.insert(focusSessions).values({ kind: 'pact', pactId, circleId: pact.circleId, startedByAccountId: accountId, durationMinutes: pact.durationMinutes, startedAt: now, endsAt, requestKey }).returning(); await tx.insert(sessionParticipants).values({ sessionId: session.id, accountId, activeSlotAccountId: accountId }); await tx.update(focusPacts).set({ status: 'active', startedSessionId: session.id, updatedAt: now }).where(and(eq(focusPacts.id, pactId), eq(focusPacts.status, 'scheduled'))); return session.id; });
    this.changes.next(id); return this.snapshot(id, accountId);
  }
  async join(sessionId: string, accountId: string) {
    const [session] = await this.database.db.select().from(focusSessions).where(eq(focusSessions.id, sessionId)); if (!session?.pactId) throw new NotFoundException(); await this.reconcile(session);
    const invite = await this.pacts.requireParticipant(session.pactId, accountId); if (invite.response !== 'accepted') throw new ForbiddenException(); const [existing] = await this.database.db.select().from(sessionParticipants).where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, accountId))); if (existing) { if (existing.presence === 'checked_out') throw new ConflictException(); return this.snapshot(sessionId, accountId); }
    await this.ensureFree(accountId); await this.database.db.insert(sessionParticipants).values({ sessionId, accountId, activeSlotAccountId: accountId }); this.changes.next(sessionId); return this.snapshot(sessionId, accountId);
  }
  async active(accountId: string) { const [row] = await this.database.db.select({ sessionId: sessionParticipants.sessionId }).from(sessionParticipants).where(eq(sessionParticipants.activeSlotAccountId, accountId)); return row ? this.snapshot(row.sessionId, accountId) : null; }
  async snapshot(sessionId: string, accountId: string) {
    let [session] = await this.database.db.select().from(focusSessions).where(eq(focusSessions.id, sessionId)); if (!session) throw new NotFoundException(); await this.reconcile(session); [session] = await this.database.db.select().from(focusSessions).where(eq(focusSessions.id, sessionId));
    const mine = (await this.database.db.select().from(sessionParticipants).where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, accountId))))[0]; if (!mine) throw new NotFoundException();
    const participants = await this.database.db.select({ accountId: sessionParticipants.accountId, displayName: profiles.displayName, presence: sessionParticipants.presence, joinedAt: sessionParticipants.joinedAt, checkedOutAt: sessionParticipants.checkedOutAt }).from(sessionParticipants).leftJoin(profiles, eq(profiles.accountId, sessionParticipants.accountId)).where(eq(sessionParticipants.sessionId, sessionId));
    return { id: session.id, kind: session.kind, pactId: session.pactId, status: session.status, startedAt: session.startedAt, endsAt: session.endsAt, serverNow: new Date(), intention: mine.intention, participants };
  }
  async checkout(sessionId: string, accountId: string, input: { outcome: Outcome; openSeed?: string | null }) {
    await this.database.db.transaction(async tx => { const [mine] = await tx.select().from(sessionParticipants).where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, accountId))).for('update'); if (!mine) throw new NotFoundException(); if (mine.presence !== 'checked_out') await tx.update(sessionParticipants).set({ presence: 'checked_out', outcome: input.outcome, checkedOutAt: new Date(), activeSlotAccountId: null }).where(eq(sessionParticipants.id, mine.id));
      if (input.openSeed === null) await tx.delete(openSeeds).where(eq(openSeeds.accountId, accountId)); else if (input.openSeed !== undefined) await tx.insert(openSeeds).values({ accountId, text: input.openSeed, sourceSessionId: sessionId }).onConflictDoUpdate({ target: openSeeds.accountId, set: { text: input.openSeed, sourceSessionId: sessionId, updatedAt: new Date() } });
      const remaining = await tx.select({ id: sessionParticipants.id }).from(sessionParticipants).where(and(eq(sessionParticipants.sessionId, sessionId), inArray(sessionParticipants.presence, ['active', 'break', 'disconnected']))); if (!remaining.length) { await tx.update(focusSessions).set({ status: 'completed', completedAt: new Date() }).where(and(eq(focusSessions.id, sessionId), eq(focusSessions.status, 'active'))); const [session] = await tx.select().from(focusSessions).where(eq(focusSessions.id, sessionId)); if (session?.pactId) await tx.update(focusPacts).set({ status: 'completed', updatedAt: new Date() }).where(eq(focusPacts.id, session.pactId)); }
    });
    await this.deriveMilestone(sessionId); await this.analytics.record(accountId, 'session_checked_out', sessionId, { outcome: input.outcome }); this.changes.next(sessionId); return this.snapshot(sessionId, accountId);
  }
  async setPresence(sessionId: string, accountId: string, presence: 'active' | 'break' | 'disconnected') { const [value] = await this.database.db.update(sessionParticipants).set({ presence }).where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, accountId), inArray(sessionParticipants.presence, ['active', 'break', 'disconnected']))).returning(); if (!value) throw new NotFoundException(); this.changes.next(sessionId); }
  async history(accountId: string) { return this.database.db.select({ id: focusSessions.id, kind: focusSessions.kind, startedAt: focusSessions.startedAt, endsAt: focusSessions.endsAt, status: focusSessions.status, outcome: sessionParticipants.outcome }).from(sessionParticipants).innerJoin(focusSessions, eq(focusSessions.id, sessionParticipants.sessionId)).where(eq(sessionParticipants.accountId, accountId)).orderBy(desc(focusSessions.startedAt)).limit(100); }
  private async reconcile(session: typeof focusSessions.$inferSelect) { if (session.status === 'active' && session.endsAt <= new Date()) await this.finishSession(session.id, session.pactId); }
  private async finishSession(sessionId: string, pactId: string | null) { await this.database.db.transaction(async tx => { await tx.update(focusSessions).set({ status: 'completed', completedAt: new Date() }).where(and(eq(focusSessions.id, sessionId), eq(focusSessions.status, 'active'))); await tx.update(sessionParticipants).set({ presence: 'checked_out', activeSlotAccountId: null, checkedOutAt: new Date(), outcome: 'stopped' }).where(and(eq(sessionParticipants.sessionId, sessionId), inArray(sessionParticipants.presence, ['active', 'break', 'disconnected']))); if (pactId) await tx.update(focusPacts).set({ status: 'completed', updatedAt: new Date() }).where(eq(focusPacts.id, pactId)); }); await this.deriveMilestone(sessionId); this.changes.next(sessionId); }
  private async deriveMilestone(sessionId: string) { const [session] = await this.database.db.select().from(focusSessions).where(eq(focusSessions.id, sessionId)); if (!session?.circleId || session.status !== 'completed') return; const joined = await this.database.db.select({ accountId: sessionParticipants.accountId }).from(sessionParticipants).where(eq(sessionParticipants.sessionId, sessionId)); if (joined.length < 2) return; const inserted = await this.database.db.insert(circleMilestones).values({ circleId: session.circleId, sessionId }).onConflictDoNothing().returning({ id: circleMilestones.id }); if (inserted.length) await this.analytics.record(session.startedByAccountId ?? joined[0].accountId, 'circle_milestone_recorded', inserted[0].id); }
  async finalizeExpired() { const expired = await this.database.db.select().from(focusSessions).where(and(eq(focusSessions.status, 'active'), lte(focusSessions.endsAt, new Date()))); for (const session of expired) await this.finishSession(session.id, session.pactId); }
}
