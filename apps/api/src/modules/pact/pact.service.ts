import { decodeCursor, encodeCursor } from '../../platform/http/pagination';
import type { PactListQuery } from '@beneath-the-pine/contracts';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray, isNull, or, lt, gt, gte, lte, asc, desc, sql } from 'drizzle-orm';
import { DatabaseService } from '../../platform/database/database.service';
import { CampService, camps, campMemberships, campInvites } from '../camp/public-api';
import { profiles } from '../profile/public-api';
import { AnalyticsService } from '../analytics/public-api';
import { accountPreferences } from '../preferences/public-api';
import { focusPactParticipants, focusPacts, pactReminderReceipts } from './infrastructure/pact.schema';

@Injectable()
export class PactService {
  constructor(private readonly database: DatabaseService, private readonly camps: CampService, private readonly analytics: AnalyticsService) {}
  async claimDueReminders(accountId: string) {
    return this.database.db.transaction(async tx => {
      const [preferences] = await tx.select({enabled:accountPreferences.remindAcceptedPacts})
        .from(accountPreferences).where(eq(accountPreferences.accountId,accountId)).for('update');
      if (!preferences?.enabled) return {serverNow:new Date(),items:[]};
      const now = new Date();
      const due = await tx.select({id:focusPacts.id,campName:camps.name,startsAt:focusPacts.startsAt,durationMinutes:focusPacts.durationMinutes})
        .from(focusPacts)
        .innerJoin(focusPactParticipants,and(eq(focusPactParticipants.pactId,focusPacts.id),eq(focusPactParticipants.accountId,accountId),eq(focusPactParticipants.response,'accepted')))
        .innerJoin(camps,and(eq(camps.id,focusPacts.campId),eq(camps.status,'active')))
        .innerJoin(campMemberships,and(eq(campMemberships.campId,camps.id),eq(campMemberships.accountId,accountId),eq(campMemberships.status,'active')))
        .leftJoin(pactReminderReceipts,and(eq(pactReminderReceipts.pactId,focusPacts.id),eq(pactReminderReceipts.accountId,accountId)))
        .where(and(eq(focusPacts.status,'scheduled'),gte(focusPacts.startsAt,now),lte(focusPacts.startsAt,new Date(now.getTime()+600000)),isNull(pactReminderReceipts.pactId)))
        .orderBy(asc(focusPacts.startsAt)).limit(5);
      const claimed: typeof due = [];
      for (const pact of due) {
        const [receipt] = await tx.insert(pactReminderReceipts).values({pactId:pact.id,accountId}).onConflictDoNothing().returning({pactId:pactReminderReceipts.pactId});
        if (!receipt) continue;
        const [current] = await tx.select({status:focusPacts.status}).from(focusPacts).where(eq(focusPacts.id,pact.id));
        if (current?.status === 'scheduled') claimed.push(pact);
      }
      return {serverNow:new Date(),items:claimed};
    });
  }
  async create(campId: string, actorId: string, input: { participantIds: string[]; startsAt: string; durationMinutes: 5 | 10 | 25 | 50 }, requestKey: string) {
    const membership = await this.camps.membership(campId, actorId); if (!membership) throw new NotFoundException();
    const requested = [...new Set([actorId, ...input.participantIds])]; const active = await this.camps.activeMemberIds(campId);
    if (requested.length > 8 || requested.some(id => !active.includes(id))) throw new ForbiddenException();
    const existing = (await this.database.db.select().from(focusPacts).where(and(eq(focusPacts.creatorAccountId, actorId), eq(focusPacts.requestKey, requestKey))))[0]; if (existing) return this.get(existing.id, actorId);
    let created = false;
    const pactId = await this.database.db.transaction(async tx => { await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${actorId}))`);
      const [group] = await tx.select().from(camps).where(eq(camps.id,campId)).for('update');
      if (!group || group.status !== 'active') throw new ConflictException();
      const members = await tx.select().from(campMemberships).where(and(eq(campMemberships.campId,campId),eq(campMemberships.status,'active')));
      if (!members.some(m=>m.accountId===actorId) || requested.some(id=>!members.some(m=>m.accountId===id))) throw new NotFoundException();
      const [retry] = await tx.select().from(focusPacts).where(and(eq(focusPacts.creatorAccountId,actorId),eq(focusPacts.requestKey,requestKey)));
      if (retry) return retry.id;
      created = true;
      const [pact] = await tx.insert(focusPacts).values({ campId, creatorAccountId: actorId, startsAt: new Date(input.startsAt), durationMinutes: input.durationMinutes, requestKey }).returning(); await tx.insert(focusPactParticipants).values(requested.map(accountId => ({ pactId: pact.id, accountId, response: accountId === actorId ? 'accepted' as const : 'invited' as const, respondedAt: accountId === actorId ? new Date() : null }))); return pact.id; });
    if(created) await this.analytics.record(actorId, 'pact_created', pactId, { durationMinutes: input.durationMinutes }); return this.get(pactId, actorId);
  }
  async requireParticipant(pactId: string, accountId: string, reader: Pick<DatabaseService['db'],'select'> = this.database.db) { const value = (await reader.select().from(focusPactParticipants).where(and(eq(focusPactParticipants.pactId, pactId), eq(focusPactParticipants.accountId, accountId))))[0]; if (!value) throw new NotFoundException(); const pact = await this.raw(pactId,reader); if (!await this.camps.membership(pact.campId, accountId,reader)) throw new NotFoundException(); return value; }
  async raw(pactId: string, reader: Pick<DatabaseService['db'],'select'> = this.database.db) { const value = (await reader.select().from(focusPacts).where(eq(focusPacts.id, pactId)))[0]; if (!value) throw new NotFoundException(); return value; }
  async get(pactId: string, actorId: string) {
    await this.requireParticipant(pactId, actorId);
    await this.expirePact(pactId);
    const pact = await this.raw(pactId);
    const participants = await this.database.db.select({ accountId: focusPactParticipants.accountId, response: focusPactParticipants.response, displayName: profiles.displayName }).from(focusPactParticipants).leftJoin(profiles, eq(profiles.accountId, focusPactParticipants.accountId)).where(eq(focusPactParticipants.pactId, pactId));
    return { id: pact.id, campId: pact.campId, creatorId: pact.creatorAccountId, startsAt: pact.startsAt, durationMinutes: pact.durationMinutes, status: pact.status, sessionId: pact.startedSessionId, participants, createdAt: pact.createdAt };
  }
  async listUpcoming(accountId:string) {
    await this.expireScheduled();
    return this.database.db.select({id:focusPacts.id,campId:focusPacts.campId,startsAt:focusPacts.startsAt,durationMinutes:focusPacts.durationMinutes}).from(focusPactParticipants)
      .innerJoin(focusPacts,eq(focusPacts.id,focusPactParticipants.pactId)).innerJoin(campMemberships,and(eq(campMemberships.campId,focusPacts.campId),eq(campMemberships.accountId,accountId),eq(campMemberships.status,'active')))
      .where(and(eq(focusPactParticipants.accountId,accountId),eq(focusPactParticipants.response,'accepted'),inArray(focusPacts.status,['scheduled','active']))).orderBy(asc(focusPacts.startsAt));
  }
  async respond(pactId:string,actorId:string,response:'accepted'|'declined') {
    const hint=await this.raw(pactId);
    const result=await this.database.db.transaction(async tx=>{
      await tx.select().from(camps).where(eq(camps.id,hint.campId)).for('update');
      const participant=await this.requireParticipant(pactId,actorId,tx);
      const [pact]=await tx.select().from(focusPacts).where(eq(focusPacts.id,pactId)).for('update');
      const now=new Date();
      if(pact.status==='scheduled' && pact.startsAt.getTime()+1800000<now.getTime()) {
        await tx.update(focusPacts).set({status:'expired',updatedAt:now}).where(eq(focusPacts.id,pactId));
        return {changed:false,expired:true};
      }
      if(pact.status!=='scheduled') throw new ConflictException();
      if(participant.response===response) return {changed:false,expired:false};
      await tx.update(focusPactParticipants).set({response,respondedAt:now}).where(eq(focusPactParticipants.id,participant.id)); return {changed:true,expired:false};
    });
    if(result.expired) throw new ConflictException();
    if(result.changed && response==='accepted') await this.analytics.record(actorId,'pact_accepted',pactId); return this.get(pactId,actorId);
  }
  async cancel(pactId:string,actorId:string) {
    const hint=await this.raw(pactId);
    const result=await this.database.db.transaction(async tx=>{
      await tx.select().from(camps).where(eq(camps.id,hint.campId)).for('update'); await this.requireParticipant(pactId,actorId,tx);
      const [pact]=await tx.select().from(focusPacts).where(eq(focusPacts.id,pactId)).for('update');
      if(pact.creatorAccountId!==actorId) throw new ForbiddenException();
      if(pact.status==='cancelled') return {changed:false,expired:false};
      if(pact.status!=='scheduled') throw new ConflictException();
      const now=new Date();
      if(pact.startsAt.getTime()+1800000<now.getTime()) {
        await tx.update(focusPacts).set({status:'expired',updatedAt:now}).where(eq(focusPacts.id,pactId));
        return {changed:false,expired:true};
      }
      await tx.update(focusPacts).set({status:'cancelled',updatedAt:now}).where(eq(focusPacts.id,pactId)); return {changed:true,expired:false};
    });
    if(result.expired) throw new ConflictException();
    if(result.changed) await this.analytics.record(actorId,'pact_cancelled',pactId); return this.get(pactId,actorId);
  }

  async list(actorId: string, query: PactListQuery, campId?: string) {
    if (campId && !await this.camps.membership(campId,actorId)) throw new NotFoundException();
    await this.expireScheduled();
    const scope = `${actorId}:${campId ?? 'all'}:${query.group}`;
    const cursor = decodeCursor(query.cursor,scope);
    const past = query.group === 'past';
    const filter = query.group === 'pending' ? and(eq(focusPacts.status,'scheduled'),inArray(focusPactParticipants.response,['invited','declined']))
      : query.group === 'upcoming' ? and(eq(focusPacts.status,'scheduled'),eq(focusPactParticipants.response,'accepted'))
      : query.group === 'active' ? and(eq(focusPacts.status,'active'),eq(focusPactParticipants.response,'accepted'))
      : inArray(focusPacts.status,['completed','cancelled','expired']);
    const compare = past ? lt : gt; const order = past ? desc : asc;
    const rows = await this.database.db.select({id:focusPacts.id,campId:focusPacts.campId,campName:camps.name,startsAt:focusPacts.startsAt,durationMinutes:focusPacts.durationMinutes,status:focusPacts.status,response:focusPactParticipants.response,creatorId:focusPacts.creatorAccountId,sessionId:focusPacts.startedSessionId})
      .from(focusPacts).innerJoin(focusPactParticipants,and(eq(focusPactParticipants.pactId,focusPacts.id),eq(focusPactParticipants.accountId,actorId)))
      .innerJoin(camps,eq(camps.id,focusPacts.campId)).innerJoin(campMemberships,and(eq(campMemberships.campId,camps.id),eq(campMemberships.accountId,actorId),eq(campMemberships.status,'active')))
      .where(and(filter,campId ? eq(camps.id,campId) : undefined,cursor ? or(compare(focusPacts.startsAt,cursor.time),and(eq(focusPacts.startsAt,cursor.time),compare(focusPacts.id,cursor.id))) : undefined))
      .orderBy(order(focusPacts.startsAt),order(focusPacts.id)).limit(query.limit+1);
    const page=rows.slice(0,query.limit); const last=page.at(-1);
    return {items:page.map(({creatorId,...item})=>({...item,isCreator:creatorId===actorId})),nextCursor:rows.length>query.limit && last ? encodeCursor(last.startsAt,last.id,scope) : null};
  }
  private async expirePact(pactId:string, now=new Date()) {
    await this.database.db.update(focusPacts).set({status:'expired',updatedAt:now})
      .where(and(eq(focusPacts.id,pactId),eq(focusPacts.status,'scheduled'),lt(focusPacts.startsAt,new Date(now.getTime()-1800000))));
  }
  async expireScheduled() { await this.database.db.update(focusPacts).set({status:'expired',updatedAt:new Date()}).where(and(eq(focusPacts.status,'scheduled'),lt(focusPacts.startsAt,new Date(Date.now()-1800000)))); }
  async updateCamp(campId:string, actorId:string, input:{name?:string;status?:'active'|'archived'}) {
    return this.database.db.transaction(async tx=>{
      const [group]=await tx.select().from(camps).where(eq(camps.id,campId)).for('update');
      const [member]=await tx.select().from(campMemberships).where(and(eq(campMemberships.campId,campId),eq(campMemberships.accountId,actorId),eq(campMemberships.status,'active')));
      if(!group || !member) throw new NotFoundException(); if(member.role!=='owner') throw new ForbiddenException();
      if(input.status==='archived') {
        await tx.update(focusPacts).set({status:'expired',updatedAt:new Date()}).where(and(eq(focusPacts.campId,campId),eq(focusPacts.status,'scheduled'),lt(focusPacts.startsAt,new Date(Date.now()-1800000))));
        const [open]=await tx.select({id:focusPacts.id}).from(focusPacts).where(and(eq(focusPacts.campId,campId),inArray(focusPacts.status,['scheduled','active']))).limit(1);
        if(open) throw new ConflictException('Camp has open pacts');
        await tx.update(campInvites).set({status:'revoked'}).where(and(eq(campInvites.campId,campId),eq(campInvites.status,'pending')));
      }
      const [updated]=await tx.update(camps).set({...input,updatedAt:new Date()}).where(eq(camps.id,campId)).returning(); return updated;
    });
  }
}
