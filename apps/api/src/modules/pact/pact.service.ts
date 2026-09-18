import { decodeCursor, encodeCursor } from '../../platform/http/pagination';
import type { PactListQuery } from '@beneath-the-pine/contracts';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, inArray, or, lt, gt, asc, desc, sql } from 'drizzle-orm';
import { DatabaseService } from '../../platform/database/database.service';
import { CircleService, circles, circleMemberships, circleInvites } from '../circle/public-api';
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
    let created = false;
    const pactId = await this.database.db.transaction(async tx => { await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${actorId}))`);
      const [group] = await tx.select().from(circles).where(eq(circles.id,circleId)).for('update');
      if (!group || group.status !== 'active') throw new ConflictException();
      const members = await tx.select().from(circleMemberships).where(and(eq(circleMemberships.circleId,circleId),eq(circleMemberships.status,'active')));
      if (!members.some(m=>m.accountId===actorId) || requested.some(id=>!members.some(m=>m.accountId===id))) throw new NotFoundException();
      const [retry] = await tx.select().from(focusPacts).where(and(eq(focusPacts.creatorAccountId,actorId),eq(focusPacts.requestKey,requestKey)));
      if (retry) return retry.id;
      created = true;
      const [pact] = await tx.insert(focusPacts).values({ circleId, creatorAccountId: actorId, startsAt: new Date(input.startsAt), durationMinutes: input.durationMinutes, requestKey }).returning(); await tx.insert(focusPactParticipants).values(requested.map(accountId => ({ pactId: pact.id, accountId, response: accountId === actorId ? 'accepted' as const : 'invited' as const, respondedAt: accountId === actorId ? new Date() : null }))); return pact.id; });
    if(created) await this.analytics.record(actorId, 'pact_created', pactId, { durationMinutes: input.durationMinutes }); return this.get(pactId, actorId);
  }
  async requireParticipant(pactId: string, accountId: string, reader: Pick<DatabaseService['db'],'select'> = this.database.db) { const value = (await reader.select().from(focusPactParticipants).where(and(eq(focusPactParticipants.pactId, pactId), eq(focusPactParticipants.accountId, accountId))))[0]; if (!value) throw new NotFoundException(); const pact = await this.raw(pactId,reader); if (!await this.circles.membership(pact.circleId, accountId,reader)) throw new NotFoundException(); return value; }
  async raw(pactId: string, reader: Pick<DatabaseService['db'],'select'> = this.database.db) { const value = (await reader.select().from(focusPacts).where(eq(focusPacts.id, pactId)))[0]; if (!value) throw new NotFoundException(); return value; }
  async get(pactId: string, actorId: string) {
    await this.requireParticipant(pactId, actorId); const pact = await this.raw(pactId);
    const participants = await this.database.db.select({ accountId: focusPactParticipants.accountId, response: focusPactParticipants.response, displayName: profiles.displayName }).from(focusPactParticipants).leftJoin(profiles, eq(profiles.accountId, focusPactParticipants.accountId)).where(eq(focusPactParticipants.pactId, pactId));
    return { id: pact.id, circleId: pact.circleId, creatorId: pact.creatorAccountId, startsAt: pact.startsAt, durationMinutes: pact.durationMinutes, status: pact.status, sessionId: pact.startedSessionId, participants, createdAt: pact.createdAt };
  }
  async listUpcoming(accountId:string) {
    await this.expireScheduled();
    return this.database.db.select({id:focusPacts.id,circleId:focusPacts.circleId,startsAt:focusPacts.startsAt,durationMinutes:focusPacts.durationMinutes}).from(focusPactParticipants)
      .innerJoin(focusPacts,eq(focusPacts.id,focusPactParticipants.pactId)).innerJoin(circleMemberships,and(eq(circleMemberships.circleId,focusPacts.circleId),eq(circleMemberships.accountId,accountId),eq(circleMemberships.status,'active')))
      .where(and(eq(focusPactParticipants.accountId,accountId),eq(focusPactParticipants.response,'accepted'),inArray(focusPacts.status,['scheduled','active']))).orderBy(asc(focusPacts.startsAt));
  }
  async respond(pactId:string,actorId:string,response:'accepted'|'declined') {
    const hint=await this.raw(pactId);
    const changed=await this.database.db.transaction(async tx=>{
      await tx.select().from(circles).where(eq(circles.id,hint.circleId)).for('update');
      const participant=await this.requireParticipant(pactId,actorId,tx);
      const [pact]=await tx.select().from(focusPacts).where(eq(focusPacts.id,pactId)).for('update');
      if(pact.status!=='scheduled' || pact.startsAt.getTime()+1800000<Date.now()) throw new ConflictException();
      if(participant.response===response) return false;
      await tx.update(focusPactParticipants).set({response,respondedAt:new Date()}).where(eq(focusPactParticipants.id,participant.id)); return true;
    });
    if(changed && response==='accepted') await this.analytics.record(actorId,'pact_accepted',pactId); return this.get(pactId,actorId);
  }
  async cancel(pactId:string,actorId:string) {
    const hint=await this.raw(pactId);
    const changed=await this.database.db.transaction(async tx=>{
      await tx.select().from(circles).where(eq(circles.id,hint.circleId)).for('update'); await this.requireParticipant(pactId,actorId,tx);
      const [pact]=await tx.select().from(focusPacts).where(eq(focusPacts.id,pactId)).for('update');
      if(pact.creatorAccountId!==actorId) throw new ForbiddenException(); if(pact.status==='cancelled') return false; if(pact.status!=='scheduled') throw new ConflictException();
      await tx.update(focusPacts).set({status:'cancelled',updatedAt:new Date()}).where(eq(focusPacts.id,pactId)); return true;
    });
    if(changed) await this.analytics.record(actorId,'pact_cancelled',pactId); return this.get(pactId,actorId);
  }

  async list(actorId: string, query: PactListQuery, circleId?: string) {
    if (circleId && !await this.circles.membership(circleId,actorId)) throw new NotFoundException();
    await this.expireScheduled();
    const scope = `${actorId}:${circleId ?? 'all'}:${query.group}`;
    const cursor = decodeCursor(query.cursor,scope);
    const past = query.group === 'past';
    const filter = query.group === 'pending' ? and(eq(focusPacts.status,'scheduled'),eq(focusPactParticipants.response,'invited'))
      : query.group === 'upcoming' ? and(eq(focusPacts.status,'scheduled'),eq(focusPactParticipants.response,'accepted'))
      : query.group === 'active' ? and(eq(focusPacts.status,'active'),eq(focusPactParticipants.response,'accepted'))
      : or(inArray(focusPacts.status,['completed','cancelled','expired']),eq(focusPactParticipants.response,'declined'));
    const compare = past ? lt : gt; const order = past ? desc : asc;
    const rows = await this.database.db.select({id:focusPacts.id,circleId:focusPacts.circleId,circleName:circles.name,startsAt:focusPacts.startsAt,durationMinutes:focusPacts.durationMinutes,status:focusPacts.status,response:focusPactParticipants.response,creatorId:focusPacts.creatorAccountId,sessionId:focusPacts.startedSessionId})
      .from(focusPacts).innerJoin(focusPactParticipants,and(eq(focusPactParticipants.pactId,focusPacts.id),eq(focusPactParticipants.accountId,actorId)))
      .innerJoin(circles,eq(circles.id,focusPacts.circleId)).innerJoin(circleMemberships,and(eq(circleMemberships.circleId,circles.id),eq(circleMemberships.accountId,actorId),eq(circleMemberships.status,'active')))
      .where(and(filter,circleId ? eq(circles.id,circleId) : undefined,cursor ? or(compare(focusPacts.startsAt,cursor.time),and(eq(focusPacts.startsAt,cursor.time),compare(focusPacts.id,cursor.id))) : undefined))
      .orderBy(order(focusPacts.startsAt),order(focusPacts.id)).limit(query.limit+1);
    const page=rows.slice(0,query.limit); const last=page.at(-1);
    return {items:page.map(({creatorId,...item})=>({...item,isCreator:creatorId===actorId})),nextCursor:rows.length>query.limit && last ? encodeCursor(last.startsAt,last.id,scope) : null};
  }
  async expireScheduled() { await this.database.db.update(focusPacts).set({status:'expired',updatedAt:new Date()}).where(and(eq(focusPacts.status,'scheduled'),lt(focusPacts.startsAt,new Date(Date.now()-1800000)))); }
  async updateCircle(circleId:string, actorId:string, input:{name?:string;status?:'active'|'archived'}) {
    return this.database.db.transaction(async tx=>{
      const [group]=await tx.select().from(circles).where(eq(circles.id,circleId)).for('update');
      const [member]=await tx.select().from(circleMemberships).where(and(eq(circleMemberships.circleId,circleId),eq(circleMemberships.accountId,actorId),eq(circleMemberships.status,'active')));
      if(!group || !member) throw new NotFoundException(); if(member.role!=='owner') throw new ForbiddenException();
      if(input.status==='archived') {
        await tx.update(focusPacts).set({status:'expired',updatedAt:new Date()}).where(and(eq(focusPacts.circleId,circleId),eq(focusPacts.status,'scheduled'),lt(focusPacts.startsAt,new Date(Date.now()-1800000))));
        const [open]=await tx.select({id:focusPacts.id}).from(focusPacts).where(and(eq(focusPacts.circleId,circleId),inArray(focusPacts.status,['scheduled','active']))).limit(1);
        if(open) throw new ConflictException('Circle has open pacts');
        await tx.update(circleInvites).set({status:'revoked'}).where(and(eq(circleInvites.circleId,circleId),eq(circleInvites.status,'pending')));
      }
      const [updated]=await tx.update(circles).set({...input,updatedAt:new Date()}).where(eq(circles.id,circleId)).returning(); return updated;
    });
  }
}
