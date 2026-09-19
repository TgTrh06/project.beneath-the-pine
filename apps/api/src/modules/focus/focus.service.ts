import { circles } from '../circle/public-api';
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
  private async ensureFree(accountId: string, reader: Pick<DatabaseService['db'],'select'> = this.database.db) { const [active] = await reader.select({ id: sessionParticipants.id }).from(sessionParticipants).where(eq(sessionParticipants.activeSlotAccountId, accountId)); if (active) throw new ConflictException(); }
  private async releaseRevokedSlot(accountId:string) {
    const [row]=await this.database.db.select({id:sessionParticipants.id,sessionId:sessionParticipants.sessionId}).from(sessionParticipants).where(eq(sessionParticipants.activeSlotAccountId,accountId)); if(!row)return;
    const [session]=await this.database.db.select().from(focusSessions).where(eq(focusSessions.id,row.sessionId)); if(!session?.circleId || !session.pactId)return;
    await this.database.db.transaction(async tx=>{
      await tx.select().from(circles).where(eq(circles.id,session.circleId!)).for('update');
      try { await this.pacts.requireParticipant(session.pactId!,accountId,tx); }
      catch(error) { if(!(error instanceof NotFoundException))throw error;
        await tx.update(sessionParticipants).set({activeSlotAccountId:null,presence:'checked_out',outcome:'stopped',checkedOutAt:new Date()}).where(and(eq(sessionParticipants.id,row.id),eq(sessionParticipants.activeSlotAccountId,accountId)));
      }
    });
  }
  async startSolo(accountId: string, input: { intention: string; durationMinutes: 5 | 10 | 25 | 50 }, requestKey: string) {
    await this.releaseRevokedSlot(accountId);
    const [existing] = await this.database.db.select().from(focusSessions).where(and(eq(focusSessions.startedByAccountId, accountId), eq(focusSessions.requestKey, requestKey))); if (existing) return this.snapshot(existing.id, accountId);
    const now = new Date(); const endsAt = new Date(now.getTime() + input.durationMinutes * 60000);
    let id: string;
    try {
      id = await this.database.db.transaction(async tx => { const [session] = await tx.insert(focusSessions).values({ kind: 'solo', startedByAccountId: accountId, durationMinutes: input.durationMinutes, startedAt: now, endsAt, requestKey }).returning(); await tx.insert(sessionParticipants).values({ sessionId: session.id, accountId, activeSlotAccountId: accountId, intention: input.intention }); return session.id; });
    } catch (failure) {
      const wrapped = failure as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string } };
      const error = wrapped.cause ?? wrapped;
      if (error.code !== '23505' || !['focus_sessions_actor_request_uq', 'session_participants_one_active_per_account_uq'].includes(error.constraint ?? '')) throw failure;
      const [winner] = await this.database.db.select().from(focusSessions).where(and(eq(focusSessions.startedByAccountId, accountId), eq(focusSessions.requestKey, requestKey)));
      if (winner) return this.snapshot(winner.id, accountId);
      throw new ConflictException();
    }
    await this.analytics.record(accountId, 'solo_session_started', id, { durationMinutes: input.durationMinutes }); this.changes.next(id); return this.snapshot(id, accountId);
  }
  async startPact(pactId:string,accountId:string,requestKey:string) {
    const hint=await this.pacts.raw(pactId);
    const id=await this.database.db.transaction(async tx=>{
      const [group]=await tx.select().from(circles).where(eq(circles.id,hint.circleId)).for('update');
      const participant=await this.pacts.requireParticipant(pactId,accountId,tx);
      const [pact]=await tx.select().from(focusPacts).where(eq(focusPacts.id,pactId)).for('update');
      if(pact.creatorAccountId!==accountId || participant.response!=='accepted') throw new ForbiddenException();
      if(pact.startedSessionId) return pact.startedSessionId;
      if(group.status!=='active' || pact.status!=='scheduled') throw new ConflictException();
      const now=new Date(); if(now.getTime()<pact.startsAt.getTime()-600000 || now.getTime()>pact.startsAt.getTime()+1800000) throw new ConflictException();
      await this.ensureFree(accountId,tx);
      const [session]=await tx.insert(focusSessions).values({kind:'pact',pactId,circleId:pact.circleId,startedByAccountId:accountId,durationMinutes:pact.durationMinutes,startedAt:now,endsAt:new Date(now.getTime()+pact.durationMinutes*60000),requestKey}).returning();
      await tx.insert(sessionParticipants).values({sessionId:session.id,accountId,activeSlotAccountId:accountId});
      await tx.update(focusPacts).set({status:'active',startedSessionId:session.id,updatedAt:now}).where(eq(focusPacts.id,pactId)); return session.id;
    }); this.changes.next(id); return this.snapshot(id,accountId);
  }
  async join(sessionId:string,accountId:string) {
    const [hint]=await this.database.db.select().from(focusSessions).where(eq(focusSessions.id,sessionId)); if(!hint?.pactId || !hint.circleId) throw new NotFoundException();
    await this.database.db.transaction(async tx=>{
      await tx.select().from(circles).where(eq(circles.id,hint.circleId!)).for('update');
      const invite=await this.pacts.requireParticipant(hint.pactId!,accountId,tx); if(invite.response!=='accepted') throw new ForbiddenException();
      const [session]=await tx.select().from(focusSessions).where(eq(focusSessions.id,sessionId)).for('update');
      if(session.status!=='active' || session.endsAt<=new Date()) throw new ConflictException();
      const [existing]=await tx.select().from(sessionParticipants).where(and(eq(sessionParticipants.sessionId,sessionId),eq(sessionParticipants.accountId,accountId)));
      if(existing) { if(existing.presence==='checked_out') throw new ConflictException(); return; }
      await this.ensureFree(accountId,tx); await tx.insert(sessionParticipants).values({sessionId,accountId,activeSlotAccountId:accountId});
    }); this.changes.next(sessionId); return this.snapshot(sessionId,accountId);
  }
  async active(accountId: string) {
    const [row] = await this.database.db.select({ sessionId: sessionParticipants.sessionId }).from(sessionParticipants).where(eq(sessionParticipants.activeSlotAccountId, accountId));
    if (!row) return null;
    let session; try { session = await this.snapshot(row.sessionId, accountId); } catch(error) { if(error instanceof NotFoundException) { await this.releaseRevokedSlot(accountId); return null; } throw error; }
    return session.status === 'active' && session.participants.some(person => person.accountId === accountId && person.presence !== 'checked_out') ? session : null;
  }
  async snapshot(sessionId: string, accountId: string) {
    let [session] = await this.database.db.select().from(focusSessions).where(eq(focusSessions.id, sessionId)); if (!session) throw new NotFoundException(); if(session.pactId) await this.pacts.requireParticipant(session.pactId,accountId); await this.reconcile(session); [session] = await this.database.db.select().from(focusSessions).where(eq(focusSessions.id, sessionId));
    const mine = (await this.database.db.select().from(sessionParticipants).where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, accountId))))[0]; if (!mine) throw new NotFoundException();
    const participants = await this.database.db.select({ accountId: sessionParticipants.accountId, displayName: profiles.displayName, presence: sessionParticipants.presence, joinedAt: sessionParticipants.joinedAt, checkedOutAt: sessionParticipants.checkedOutAt }).from(sessionParticipants).leftJoin(profiles, eq(profiles.accountId, sessionParticipants.accountId)).where(eq(sessionParticipants.sessionId, sessionId));
    return { id: session.id, kind: session.kind, pactId: session.pactId, status: session.status, startedAt: session.startedAt, endsAt: session.endsAt, serverNow: new Date(), intention: mine.intention, participants };
  }
  async checkout(sessionId: string, accountId: string, input: { outcome: Outcome; openSeed?: string | null }) {
    const changed = await this.database.db.transaction(async tx => {
      // Lock in the same order as expiry: session, then participants.
      const [current] = await tx.select().from(focusSessions).where(eq(focusSessions.id, sessionId)).for('update');
      if (!current) throw new NotFoundException(); if(current.pactId) await this.pacts.requireParticipant(current.pactId,accountId,tx);
      const [mine] = await tx.select().from(sessionParticipants).where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, accountId))).for('update');
      if (!mine) throw new NotFoundException();
      if (mine.presence === 'checked_out' || current.status !== 'active') return false;
      const now = new Date();
      if (current.endsAt <= now) {
        await tx.update(focusSessions).set({ status: 'completed', completedAt: now }).where(eq(focusSessions.id, sessionId));
        await tx.update(sessionParticipants).set({ presence: 'checked_out', activeSlotAccountId: null, checkedOutAt: now, outcome: 'stopped' }).where(and(eq(sessionParticipants.sessionId, sessionId), inArray(sessionParticipants.presence, ['active', 'break', 'disconnected'])));
        if (current.pactId) await tx.update(focusPacts).set({ status: 'completed', updatedAt: now }).where(eq(focusPacts.id, current.pactId));
        return false;
      }
      await tx.update(sessionParticipants).set({ presence: 'checked_out', outcome: input.outcome, checkedOutAt: now, activeSlotAccountId: null }).where(eq(sessionParticipants.id, mine.id));
      if (input.openSeed === null) await tx.delete(openSeeds).where(eq(openSeeds.accountId, accountId)); else if (input.openSeed !== undefined) await tx.insert(openSeeds).values({ accountId, text: input.openSeed, sourceSessionId: sessionId }).onConflictDoUpdate({ target: openSeeds.accountId, set: { text: input.openSeed, sourceSessionId: sessionId, updatedAt: new Date() } });
      const remaining = await tx.select({ id: sessionParticipants.id }).from(sessionParticipants).where(and(eq(sessionParticipants.sessionId, sessionId), inArray(sessionParticipants.presence, ['active', 'break', 'disconnected']))); if (!remaining.length) { await tx.update(focusSessions).set({ status: 'completed', completedAt: new Date() }).where(and(eq(focusSessions.id, sessionId), eq(focusSessions.status, 'active'))); const [session] = await tx.select().from(focusSessions).where(eq(focusSessions.id, sessionId)); if (session?.pactId) await tx.update(focusPacts).set({ status: 'completed', updatedAt: new Date() }).where(eq(focusPacts.id, session.pactId)); }
      return true;
    });
    await this.deriveMilestone(sessionId); if (changed) await this.analytics.record(accountId, 'session_checked_out', sessionId, { outcome: input.outcome }); this.changes.next(sessionId); return this.snapshot(sessionId, accountId);
  }
  async setPresence(sessionId: string, accountId: string, presence: 'active' | 'break' | 'disconnected') { const [session]=await this.database.db.select().from(focusSessions).where(eq(focusSessions.id,sessionId)); if(session?.pactId) await this.pacts.requireParticipant(session.pactId,accountId); const [value] = await this.database.db.update(sessionParticipants).set({ presence }).where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, accountId), inArray(sessionParticipants.presence, ['active', 'break', 'disconnected']))).returning(); if (!value) throw new NotFoundException(); this.changes.next(sessionId); }
  async history(accountId: string) { return this.database.db.select({ id: focusSessions.id, kind: focusSessions.kind, startedAt: focusSessions.startedAt, endsAt: focusSessions.endsAt, status: focusSessions.status, outcome: sessionParticipants.outcome }).from(sessionParticipants).innerJoin(focusSessions, eq(focusSessions.id, sessionParticipants.sessionId)).where(eq(sessionParticipants.accountId, accountId)).orderBy(desc(focusSessions.startedAt)).limit(100); }
  private async reconcile(session: typeof focusSessions.$inferSelect) { if (session.status === 'active' && session.endsAt <= new Date()) await this.finishSession(session.id, session.pactId); }
  private async finishSession(sessionId: string, pactId: string | null) { await this.database.db.transaction(async tx => { await tx.update(focusSessions).set({ status: 'completed', completedAt: new Date() }).where(and(eq(focusSessions.id, sessionId), eq(focusSessions.status, 'active'))); await tx.update(sessionParticipants).set({ presence: 'checked_out', activeSlotAccountId: null, checkedOutAt: new Date(), outcome: 'stopped' }).where(and(eq(sessionParticipants.sessionId, sessionId), inArray(sessionParticipants.presence, ['active', 'break', 'disconnected']))); if (pactId) await tx.update(focusPacts).set({ status: 'completed', updatedAt: new Date() }).where(eq(focusPacts.id, pactId)); }); await this.deriveMilestone(sessionId); this.changes.next(sessionId); }
  private async deriveMilestone(sessionId: string) { const [session] = await this.database.db.select().from(focusSessions).where(eq(focusSessions.id, sessionId)); if (!session?.circleId || session.status !== 'completed') return; const joined = await this.database.db.select({ accountId: sessionParticipants.accountId }).from(sessionParticipants).where(eq(sessionParticipants.sessionId, sessionId)); if (joined.length < 2) return; const inserted = await this.database.db.insert(circleMilestones).values({ circleId: session.circleId, sessionId }).onConflictDoNothing().returning({ id: circleMilestones.id }); if (inserted.length) await this.analytics.record(session.startedByAccountId ?? joined[0].accountId, 'circle_milestone_recorded', inserted[0].id); }
  async finalizeExpired() { const expired = await this.database.db.select().from(focusSessions).where(and(eq(focusSessions.status, 'active'), lte(focusSessions.endsAt, new Date()))); for (const session of expired) await this.finishSession(session.id, session.pactId); }
}
