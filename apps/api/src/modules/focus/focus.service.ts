import { campMemberships, camps } from '../camp/public-api';
import { ConflictException, ForbiddenException, Injectable, NotFoundException, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, lte, ne, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { DatabaseService } from '../../platform/database/database.service';
import { campMilestones } from '../memory/public-api';
import { focusPactParticipants, focusPacts, PactService } from '../pact/public-api';
import { profiles } from '../profile/public-api';
import { accountPreferences } from '../preferences/public-api';
import { openSeeds } from '../seed/public-api';
import { AnalyticsService } from '../analytics/public-api';
import { focusSessions, sessionParticipants } from './infrastructure/focus.schema';
import { Subject } from 'rxjs';

type Outcome = 'completed' | 'progress' | 'stuck' | 'stopped';
type PresenceChange = { sessionId: string; accountId: string; presence: 'active' | 'break' | 'disconnected' };
@Injectable()
export class FocusService implements OnModuleInit, OnModuleDestroy {
  private timer?: NodeJS.Timeout;
  readonly changes = new Subject<string>();
  readonly presenceChanges = new Subject<PresenceChange>();
  constructor(private readonly database: DatabaseService, private readonly pacts: PactService, private readonly analytics: AnalyticsService) {}
  onModuleInit() { this.timer = setInterval(() => void this.finalizeExpired().catch(() => undefined), 30000); this.timer.unref(); }
  onModuleDestroy() { if (this.timer) clearInterval(this.timer); }
  private async ensureFree(accountId: string, reader: Pick<DatabaseService['db'],'select'> = this.database.db) { const [active] = await reader.select({ id: sessionParticipants.id }).from(sessionParticipants).where(eq(sessionParticipants.activeSlotAccountId, accountId)); if (active) throw new ConflictException(); }
  private async releaseRevokedSlot(accountId:string) {
    const [row]=await this.database.db.select({id:sessionParticipants.id,sessionId:sessionParticipants.sessionId}).from(sessionParticipants).where(eq(sessionParticipants.activeSlotAccountId,accountId)); if(!row)return;
    const [session]=await this.database.db.select().from(focusSessions).where(eq(focusSessions.id,row.sessionId)); if(!session?.campId || !session.pactId)return;
    await this.database.db.transaction(async tx=>{
      await tx.select().from(camps).where(eq(camps.id,session.campId!)).for('update');
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
    const result=await this.database.db.transaction(async tx=>{
      const [group]=await tx.select().from(camps).where(eq(camps.id,hint.campId)).for('update');
      const participant=await this.pacts.requireParticipant(pactId,accountId,tx);
      const [pact]=await tx.select().from(focusPacts).where(eq(focusPacts.id,pactId)).for('update');
      if(pact.creatorAccountId!==accountId || participant.response!=='accepted') throw new ForbiddenException();
      if(pact.startedSessionId) {
        if(pact.status!=='active') throw new ConflictException();
        return {id:pact.startedSessionId,expired:false};
      }
      const now=new Date();
      if(pact.status==='scheduled' && pact.startsAt.getTime()+1800000<now.getTime()) {
        await tx.update(focusPacts).set({status:'expired',updatedAt:now}).where(eq(focusPacts.id,pactId));
        return {id:null,expired:true};
      }
      if(!group || group.status!=='active' || pact.status!=='scheduled') throw new ConflictException();
      if(now.getTime()<pact.startsAt.getTime()-600000 || now.getTime()>pact.startsAt.getTime()+1800000) throw new ConflictException();
      await this.ensureFree(accountId,tx);
      const [session]=await tx.insert(focusSessions).values({kind:'pact',pactId,campId:pact.campId,startedByAccountId:accountId,durationMinutes:pact.durationMinutes,startedAt:now,endsAt:new Date(now.getTime()+pact.durationMinutes*60000),requestKey}).returning();
      await tx.insert(sessionParticipants).values({sessionId:session.id,accountId,activeSlotAccountId:accountId});
      await tx.update(focusPacts).set({status:'active',startedSessionId:session.id,updatedAt:now}).where(eq(focusPacts.id,pactId)); return {id:session.id,expired:false};
    });
    if(result.expired || !result.id) throw new ConflictException();
    this.changes.next(result.id); return this.snapshot(result.id,accountId);
  }
  async join(sessionId:string,accountId:string) {
    const [hint]=await this.database.db.select().from(focusSessions).where(eq(focusSessions.id,sessionId)); if(!hint?.pactId || !hint.campId) throw new NotFoundException();
    const expired=await this.database.db.transaction(async tx=>{
      await tx.select().from(camps).where(eq(camps.id,hint.campId!)).for('update');
      const [session]=await tx.select().from(focusSessions).where(eq(focusSessions.id,sessionId)).for('update');
      if(!session) throw new NotFoundException();
      const invite=await this.pacts.requireParticipant(session.pactId!,accountId,tx); if(invite.response!=='accepted') throw new ForbiddenException();
      const now=new Date();
      if(session.status==='active' && session.endsAt<=now) {
        await tx.update(focusSessions).set({status:'completed',completedAt:now}).where(and(eq(focusSessions.id,sessionId),eq(focusSessions.status,'active'),lte(focusSessions.endsAt,now)));
        await tx.update(sessionParticipants).set({presence:'checked_out',activeSlotAccountId:null,checkedOutAt:now,outcome:'stopped'}).where(and(eq(sessionParticipants.sessionId,sessionId),inArray(sessionParticipants.presence,['active','break','disconnected'])));
        await tx.update(focusPacts).set({status:'completed',updatedAt:now}).where(and(eq(focusPacts.id,session.pactId!),eq(focusPacts.status,'active')));
        return true;
      }
      if(session.status!=='active') throw new ConflictException();
      const [existing]=await tx.select().from(sessionParticipants).where(and(eq(sessionParticipants.sessionId,sessionId),eq(sessionParticipants.accountId,accountId)));
      if(existing) { if(existing.presence==='checked_out') throw new ConflictException(); return false; }
      await this.ensureFree(accountId,tx); await tx.insert(sessionParticipants).values({sessionId,accountId,activeSlotAccountId:accountId});
      return false;
    });
    if(expired) { await this.deriveMilestone(sessionId); this.changes.next(sessionId); throw new ConflictException(); }
    this.changes.next(sessionId); return this.snapshot(sessionId,accountId);
  }
  async active(accountId: string) {
    const [row] = await this.database.db.select({ sessionId: sessionParticipants.sessionId }).from(sessionParticipants).where(eq(sessionParticipants.activeSlotAccountId, accountId));
    if (!row) return null;
    let session; try { session = await this.snapshot(row.sessionId, accountId); } catch(error) { if(error instanceof NotFoundException) { await this.releaseRevokedSlot(accountId); return null; } throw error; }
    return session.status === 'active' && session.participants.some(person => person.accountId === accountId && person.presence !== 'checked_out') ? session : null;
  }
  async snapshot(sessionId: string, accountId: string) {
    const [hint] = await this.database.db.select().from(focusSessions).where(eq(focusSessions.id, sessionId));
    if (!hint) throw new NotFoundException();
    if (hint.pactId) await this.pacts.requireParticipant(hint.pactId, accountId);
    await this.reconcile(hint);
    return this.database.db.transaction(async tx => {
      const [session] = await tx.select().from(focusSessions).where(eq(focusSessions.id, sessionId));
      if (!session) throw new NotFoundException();
      if (session.pactId) await this.pacts.requireParticipant(session.pactId, accountId, tx);
      const [mine] = await tx.select().from(sessionParticipants).where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, accountId)));
      if (!mine) throw new NotFoundException();
      const rows = await tx.select({ accountId: sessionParticipants.accountId, displayName: profiles.displayName, presence: sessionParticipants.presence, joinedAt: sessionParticipants.joinedAt, checkedOutAt: sessionParticipants.checkedOutAt, sharePresence: accountPreferences.sharePresence })
        .from(sessionParticipants)
        .leftJoin(profiles, eq(profiles.accountId, sessionParticipants.accountId))
        .leftJoin(accountPreferences, eq(accountPreferences.accountId, sessionParticipants.accountId))
        .where(eq(sessionParticipants.sessionId, sessionId));
      const participants = rows.map(({ sharePresence, ...person }) => ({
        ...person,
        presence: person.accountId === accountId || person.presence === 'checked_out' || sharePresence
          ? person.presence : 'hidden' as const,
      }));
      return { id: session.id, kind: session.kind, pactId: session.pactId, status: session.status, startedAt: session.startedAt, endsAt: session.endsAt, serverNow: new Date(), intention: mine.intention, participants };
    }, { isolationLevel: 'repeatable read' });
  }
  async checkout(sessionId: string, accountId: string, input: { outcome: Outcome; openSeed?: string | null }) {
    const [hint]=await this.database.db.select().from(focusSessions).where(eq(focusSessions.id,sessionId));
    if(!hint) throw new NotFoundException();
    const result = await this.database.db.transaction(async tx => {
      if(hint.campId) await tx.select().from(camps).where(eq(camps.id,hint.campId)).for('update');
      const [current] = await tx.select().from(focusSessions).where(eq(focusSessions.id, sessionId)).for('update');
      if (!current) throw new NotFoundException();
      if(current.pactId) await this.pacts.requireParticipant(current.pactId,accountId,tx);
      const [mine] = await tx.select().from(sessionParticipants).where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, accountId))).for('update');
      if (!mine) throw new NotFoundException();
      if (mine.presence === 'checked_out' || current.status !== 'active') return {changed:false,finished:false};
      const now = new Date();
      if (current.endsAt <= now) {
        await tx.update(focusSessions).set({ status: 'completed', completedAt: now }).where(and(eq(focusSessions.id, sessionId),eq(focusSessions.status,'active'),lte(focusSessions.endsAt,now)));
        await tx.update(sessionParticipants).set({ presence: 'checked_out', activeSlotAccountId: null, checkedOutAt: now, outcome: 'stopped' }).where(and(eq(sessionParticipants.sessionId, sessionId), inArray(sessionParticipants.presence, ['active', 'break', 'disconnected'])));
        if (current.pactId) await tx.update(focusPacts).set({ status: 'completed', updatedAt: now }).where(and(eq(focusPacts.id, current.pactId),eq(focusPacts.status,'active')));
        return {changed:false,finished:true};
      }
      await tx.update(sessionParticipants).set({ presence: 'checked_out', outcome: input.outcome, checkedOutAt: now, activeSlotAccountId: null }).where(eq(sessionParticipants.id, mine.id));
      if (input.openSeed === null) await tx.delete(openSeeds).where(eq(openSeeds.accountId, accountId)); else if (input.openSeed !== undefined) await tx.insert(openSeeds).values({ accountId, text: input.openSeed, sourceSessionId: sessionId }).onConflictDoUpdate({ target: openSeeds.accountId, set: { text: input.openSeed, sourceSessionId: sessionId, updatedAt: new Date() } });
      const remaining = await tx.select({ id: sessionParticipants.id }).from(sessionParticipants).where(and(eq(sessionParticipants.sessionId, sessionId), inArray(sessionParticipants.presence, ['active', 'break', 'disconnected'])));
      const waiting = current.pactId && current.campId ? await tx.select({ id: focusPactParticipants.id })
        .from(focusPactParticipants)
        .innerJoin(campMemberships, and(eq(campMemberships.campId, current.campId), eq(campMemberships.accountId, focusPactParticipants.accountId), eq(campMemberships.status, 'active')))
        .leftJoin(sessionParticipants, and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, focusPactParticipants.accountId)))
        .where(and(eq(focusPactParticipants.pactId, current.pactId), eq(focusPactParticipants.response, 'accepted'), isNull(sessionParticipants.id)))
        .limit(1) : [];
      let finished=false;
      if (!remaining.length && !waiting.length) {
        const [closed]=await tx.update(focusSessions).set({ status: 'completed', completedAt: now }).where(and(eq(focusSessions.id, sessionId), eq(focusSessions.status, 'active'))).returning({id:focusSessions.id});
        finished=Boolean(closed);
        if (finished && current.pactId) await tx.update(focusPacts).set({ status: 'completed', updatedAt: now }).where(and(eq(focusPacts.id, current.pactId),eq(focusPacts.status,'active')));
      }
      return {changed:true,finished};
    });
    if(result.finished) await this.deriveMilestone(sessionId);
    if (result.changed) await this.analytics.record(accountId, 'session_checked_out', sessionId, { outcome: input.outcome });
    if(result.changed || result.finished) this.changes.next(sessionId);
    return this.snapshot(sessionId, accountId);
  }
  async setPresence(sessionId: string, accountId: string, presence: 'active' | 'break' | 'disconnected') {
    return this.updatePresence(sessionId,accountId,presence,false);
  }
  async markConnected(sessionId:string,accountId:string) {
    return this.updatePresence(sessionId,accountId,'active',true);
  }
  private async updatePresence(sessionId:string,accountId:string,presence:'active'|'break'|'disconnected',preserveBreak:boolean) {
    const [hint]=await this.database.db.select().from(focusSessions).where(eq(focusSessions.id,sessionId));
    if(!hint) throw new NotFoundException();
    const result = await this.database.db.transaction(async tx => {
      if(hint.campId) await tx.select().from(camps).where(eq(camps.id,hint.campId)).for('update');
      const [session]=await tx.select().from(focusSessions).where(eq(focusSessions.id,sessionId)).for('update');
      if(!session) throw new NotFoundException();
      if(session.pactId) await this.pacts.requireParticipant(session.pactId,accountId,tx);
      const [participant] = await tx.select({ id: sessionParticipants.id, presence: sessionParticipants.presence })
        .from(sessionParticipants)
        .where(and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, accountId)))
        .for('update');
      if (!participant) throw new NotFoundException();
      const now=new Date();
      if(session.status==='active' && session.endsAt<=now) {
          await tx.update(focusSessions).set({status:'completed',completedAt:now}).where(and(eq(focusSessions.id,sessionId),eq(focusSessions.status,'active'),lte(focusSessions.endsAt,now)));
          await tx.update(sessionParticipants).set({presence:'checked_out',activeSlotAccountId:null,checkedOutAt:now,outcome:'stopped'}).where(and(eq(sessionParticipants.sessionId,sessionId),inArray(sessionParticipants.presence,['active','break','disconnected'])));
          if(session.pactId) await tx.update(focusPacts).set({status:'completed',updatedAt:now}).where(and(eq(focusPacts.id,session.pactId),eq(focusPacts.status,'active')));
          return {changed:false,finished:true,presence:null as null|'active'|'break'|'disconnected'};
      }
      if(session.status!=='active' || participant.presence==='checked_out') {
        if(preserveBreak) return {changed:false,finished:false,presence:null as null|'active'|'break'|'disconnected'};
        throw new ConflictException();
      }
      const nextPresence=preserveBreak && participant.presence==='break' ? 'break' : presence;
      if (participant.presence === nextPresence) return {changed:false,finished:false,presence:null as null|'active'|'break'|'disconnected'};
      await tx.update(sessionParticipants).set({ presence:nextPresence }).where(eq(sessionParticipants.id, participant.id));
      return {changed:true,finished:false,presence:nextPresence as 'active'|'break'|'disconnected'};
    });
    if(result.finished) { await this.deriveMilestone(sessionId); this.changes.next(sessionId); throw new ConflictException(); }
    if(result.changed) { this.changes.next(sessionId); this.presenceChanges.next({sessionId,accountId,presence:result.presence!}); }
  }
  async history(accountId: string) { return this.database.db.select({ id: focusSessions.id, kind: focusSessions.kind, startedAt: focusSessions.startedAt, endsAt: focusSessions.endsAt, status: focusSessions.status, outcome: sessionParticipants.outcome }).from(sessionParticipants).innerJoin(focusSessions, eq(focusSessions.id, sessionParticipants.sessionId)).where(eq(sessionParticipants.accountId, accountId)).orderBy(desc(focusSessions.startedAt)).limit(100); }
  async recentPartners(campId: string, accountId: string): Promise<string[]> {
    const mine = alias(sessionParticipants, 'mine');
    const other = alias(sessionParticipants, 'other');
    return this.database.db.transaction(async tx => {
      const [membership] = await tx.select({ id: campMemberships.id }).from(campMemberships)
        .innerJoin(camps, eq(camps.id, campMemberships.campId))
        .where(and(eq(campMemberships.campId, campId), eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active'), eq(camps.status, 'active')));
      if (!membership) throw new NotFoundException();
      const rows = await tx.select({ accountId: other.accountId }).from(mine)
        .innerJoin(focusSessions, and(eq(focusSessions.id, mine.sessionId), eq(focusSessions.kind, 'pact'), eq(focusSessions.campId, campId), eq(focusSessions.status, 'completed')))
        .innerJoin(other, and(eq(other.sessionId, mine.sessionId), ne(other.accountId, accountId)))
        .innerJoin(campMemberships, and(eq(campMemberships.accountId, other.accountId), eq(campMemberships.campId, campId), eq(campMemberships.status, 'active')))
        .where(eq(mine.accountId, accountId))
        .groupBy(other.accountId).orderBy(desc(sql`max(${focusSessions.startedAt})`)).limit(7);
      return rows.map(row => row.accountId);
    }, { isolationLevel: 'repeatable read' });
  }
  private async reconcile(session: typeof focusSessions.$inferSelect) {
    if (session.status !== 'active') return;
    if (session.endsAt <= new Date()) await this.finishExpiredSession(session.id);
    else if (session.pactId) await this.finishAbandonedSession(session.id);
  }
  private async finishAbandonedSession(sessionId: string) {
    const [hint] = await this.database.db.select().from(focusSessions).where(eq(focusSessions.id, sessionId));
    if (!hint?.pactId || !hint.campId) return;
    const finished = await this.database.db.transaction(async tx => {
      await tx.select().from(camps).where(eq(camps.id, hint.campId!)).for('update');
      const [session] = await tx.select().from(focusSessions).where(eq(focusSessions.id, sessionId)).for('update');
      if (!session || session.status !== 'active' || session.endsAt <= new Date()) return false;
      const now = new Date();
      await tx.execute(sql`UPDATE session_participants AS sp
        SET presence = 'checked_out', active_slot_account_id = NULL, outcome = 'stopped', checked_out_at = ${now}
        WHERE sp.session_id = ${sessionId} AND sp.presence IN ('active', 'break', 'disconnected')
          AND NOT EXISTS (SELECT 1 FROM camp_memberships AS cm
            WHERE cm.camp_id = ${session.campId} AND cm.account_id = sp.account_id AND cm.status = 'active')`);
      const remaining = await tx.select({ id: sessionParticipants.id }).from(sessionParticipants)
        .where(and(eq(sessionParticipants.sessionId, sessionId), inArray(sessionParticipants.presence, ['active', 'break', 'disconnected']))).limit(1);
      if (remaining.length) return false;
      const waiting = await tx.select({ id: focusPactParticipants.id }).from(focusPactParticipants)
        .innerJoin(campMemberships, and(eq(campMemberships.campId, session.campId!), eq(campMemberships.accountId, focusPactParticipants.accountId), eq(campMemberships.status, 'active')))
        .leftJoin(sessionParticipants, and(eq(sessionParticipants.sessionId, sessionId), eq(sessionParticipants.accountId, focusPactParticipants.accountId)))
        .where(and(eq(focusPactParticipants.pactId, session.pactId!), eq(focusPactParticipants.response, 'accepted'), isNull(sessionParticipants.id))).limit(1);
      if (waiting.length) return false;
      await tx.update(focusSessions).set({ status: 'completed', completedAt: now }).where(eq(focusSessions.id, sessionId));
      await tx.update(focusPacts).set({ status: 'completed', updatedAt: now }).where(and(eq(focusPacts.id, session.pactId!), eq(focusPacts.status, 'active')));
      return true;
    });
    if (finished) { await this.deriveMilestone(sessionId); this.changes.next(sessionId); }
  }
  private async finishExpiredSession(sessionId: string) {
    const [hint]=await this.database.db.select().from(focusSessions).where(eq(focusSessions.id,sessionId)); if(!hint) return;
    const finished=await this.database.db.transaction(async tx=>{
      if(hint.campId) await tx.select().from(camps).where(eq(camps.id,hint.campId)).for('update');
      const [session]=await tx.select().from(focusSessions).where(eq(focusSessions.id,sessionId)).for('update');
      const now=new Date();
      if(!session || session.status!=='active' || session.endsAt>now) return false;
      const [closed]=await tx.update(focusSessions).set({status:'completed',completedAt:now}).where(and(eq(focusSessions.id,sessionId),eq(focusSessions.status,'active'),lte(focusSessions.endsAt,now))).returning({id:focusSessions.id});
      if(!closed) return false;
      await tx.update(sessionParticipants).set({presence:'checked_out',activeSlotAccountId:null,checkedOutAt:now,outcome:'stopped'}).where(and(eq(sessionParticipants.sessionId,sessionId),inArray(sessionParticipants.presence,['active','break','disconnected'])));
      if(session.pactId) await tx.update(focusPacts).set({status:'completed',updatedAt:now}).where(and(eq(focusPacts.id,session.pactId),eq(focusPacts.status,'active')));
      return true;
    });
    if(finished) { await this.deriveMilestone(sessionId); this.changes.next(sessionId); }
  }
  private async deriveMilestone(sessionId: string) { const [session] = await this.database.db.select().from(focusSessions).where(eq(focusSessions.id, sessionId)); if (!session?.campId || session.status !== 'completed') return; const joined = await this.database.db.select({ accountId: sessionParticipants.accountId }).from(sessionParticipants).where(eq(sessionParticipants.sessionId, sessionId)); if (joined.length < 2) return; const inserted = await this.database.db.insert(campMilestones).values({ campId: session.campId, sessionId }).onConflictDoNothing().returning({ id: campMilestones.id }); if (inserted.length) await this.analytics.record(session.startedByAccountId ?? joined[0].accountId, 'camp_milestone_recorded', inserted[0].id); }
  async finalizeExpired() {
    const expired = await this.database.db.select({id:focusSessions.id}).from(focusSessions).where(and(eq(focusSessions.status, 'active'), lte(focusSessions.endsAt, new Date())));
    for (const session of expired) await this.finishExpiredSession(session.id);
    const pacts = await this.database.db.select({id:focusSessions.id}).from(focusSessions).where(and(eq(focusSessions.status, 'active'), eq(focusSessions.kind, 'pact')));
    for (const session of pacts) await this.finishAbandonedSession(session.id);
  }
}
