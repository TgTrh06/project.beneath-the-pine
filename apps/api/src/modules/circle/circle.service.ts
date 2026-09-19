import { decodeCursor, encodeCursor } from '../../platform/http/pagination';
import type { InviteListQuery } from '@beneath-the-pine/contracts';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, desc, lt, or, sql } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import { DatabaseService } from '../../platform/database/database.service';
import { profiles } from '../profile/public-api';
import { AnalyticsService } from '../analytics/public-api';
import { circleInvites, circleMemberships, circles } from './infrastructure/circle.schema';

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
@Injectable()
export class CircleService {
  constructor(private readonly database: DatabaseService, private readonly analytics: AnalyticsService) {}
  async membership(circleId: string, accountId: string, reader: Pick<DatabaseService['db'],'select'> = this.database.db) {
    return (await reader.select().from(circleMemberships).where(and(eq(circleMemberships.circleId, circleId), eq(circleMemberships.accountId, accountId), eq(circleMemberships.status, 'active'))))[0];
  }
  private async requireMember(circleId: string, accountId: string, reader: Pick<DatabaseService['db'],'select'> = this.database.db) { const value = await this.membership(circleId, accountId,reader); if (!value) throw new NotFoundException(); return value; }
  private async requireOwner(circleId: string, accountId: string, reader: Pick<DatabaseService['db'],'select'> = this.database.db) { const value = await this.requireMember(circleId, accountId,reader); if (value.role !== 'owner') throw new ForbiddenException(); return value; }
  async create(accountId: string, name: string) {
    const circle = await this.database.db.transaction(async tx => { const [created] = await tx.insert(circles).values({ ownerAccountId: accountId, name }).returning(); await tx.insert(circleMemberships).values({ circleId: created.id, accountId, role: 'owner' }); return created; }); await this.analytics.record(accountId, 'circle_created', circle.id); return circle;
  }
  async list(accountId: string) {
    const mine = await this.database.db.select({ id: circles.id, name: circles.name, status: circles.status, myRole: circleMemberships.role, createdAt: circles.createdAt })
      .from(circleMemberships).innerJoin(circles, eq(circles.id, circleMemberships.circleId)).where(and(eq(circleMemberships.accountId, accountId), eq(circleMemberships.status, 'active')));
    return Promise.all(mine.map(async circle => ({ ...circle, memberCount: (await this.activeMemberIds(circle.id)).length })));
  }
  async get(circleId: string, accountId: string) {
    const mine = await this.requireMember(circleId, accountId);
    const [circle] = await this.database.db.select().from(circles).where(eq(circles.id, circleId)); if (!circle) throw new NotFoundException();
    const members = await this.database.db.select({ accountId: circleMemberships.accountId, displayName: profiles.displayName, role: circleMemberships.role, joinedAt: circleMemberships.joinedAt })
      .from(circleMemberships).leftJoin(profiles, eq(profiles.accountId, circleMemberships.accountId)).where(and(eq(circleMemberships.circleId, circleId), eq(circleMemberships.status, 'active')));
    return { ...circle, myRole: mine.role, memberCount: members.length, members };
  }
  async listInvites(circleId:string,accountId:string,query:InviteListQuery) {
    await this.requireOwner(circleId,accountId); const scope=`invites:${circleId}:${accountId}`; const cursor=decodeCursor(query.cursor,scope);
    const sortTime=sql<Date>`date_trunc('milliseconds', ${circleInvites.createdAt})`.mapWith(circleInvites.createdAt);
    const rows=await this.database.db.select({id:circleInvites.id,circleId:circleInvites.circleId,createdAt:sortTime,expiresAt:circleInvites.expiresAt,status:circleInvites.status}).from(circleInvites)
      .where(and(eq(circleInvites.circleId,circleId),cursor ? or(lt(sortTime,cursor.time),and(eq(sortTime,cursor.time),lt(circleInvites.id,cursor.id))) : undefined))
      .orderBy(desc(sortTime),desc(circleInvites.id)).limit(query.limit+1);
    const page=rows.slice(0,query.limit); const last=page.at(-1);
    return {items:page.map(row=>({...row,status:row.status==='pending' && row.expiresAt<=new Date() ? 'expired' : row.status})),nextCursor:rows.length>query.limit && last ? encodeCursor(last.createdAt,last.id,scope) : null};
  }
  async invite(circleId:string,accountId:string,hours:number) {
    return this.database.db.transaction(async tx=>{
      const [group]=await tx.select().from(circles).where(eq(circles.id,circleId)).for('update');
      await this.requireOwner(circleId,accountId,tx); if(!group || group.status!=='active') throw new ConflictException();
      const token=randomBytes(32).toString('hex');
      const [invite]=await tx.insert(circleInvites).values({circleId,createdByAccountId:accountId,tokenHash:tokenHash(token),expiresAt:new Date(Date.now()+hours*3600000)}).returning();
      return {id:invite.id,circleId:invite.circleId,createdAt:invite.createdAt,expiresAt:invite.expiresAt,status:invite.status,token};
    });
  }
  async revoke(circleId:string,inviteId:string,accountId:string) {
    await this.database.db.transaction(async tx=>{
      await tx.select().from(circles).where(eq(circles.id,circleId)).for('update'); await this.requireOwner(circleId,accountId,tx);
      const [invite]=await tx.select().from(circleInvites).where(and(eq(circleInvites.id,inviteId),eq(circleInvites.circleId,circleId)));
      if(!invite) throw new NotFoundException(); if(invite.status==='revoked') return; if(invite.status!=='pending' || invite.expiresAt<=new Date()) throw new ConflictException();
      await tx.update(circleInvites).set({status:'revoked'}).where(eq(circleInvites.id,inviteId));
    });
  }
  async accept(token: string, accountId: string) {
    const result = await this.database.db.transaction(async tx => {
      const [hint]=await tx.select({circleId:circleInvites.circleId}).from(circleInvites).where(eq(circleInvites.tokenHash,tokenHash(token))); if(!hint) throw new NotFoundException();
      const [group]=await tx.select().from(circles).where(eq(circles.id,hint.circleId)).for('update'); if(!group || group.status!=='active') throw new ConflictException();
      const [invite] = await tx.select().from(circleInvites).where(eq(circleInvites.tokenHash, tokenHash(token))).for('update'); if (!invite) throw new NotFoundException();
      if (invite.status === 'accepted' && invite.acceptedByAccountId === accountId) { await this.requireMember(invite.circleId,accountId,tx); return invite.circleId; }
      if (invite.status !== 'pending' || invite.expiresAt <= new Date()) { if (invite.status === 'pending') await tx.update(circleInvites).set({ status: 'expired' }).where(eq(circleInvites.id, invite.id)); throw new ConflictException(); }
      const active = await tx.select().from(circleMemberships).where(and(eq(circleMemberships.circleId, invite.circleId), eq(circleMemberships.status, 'active'))).for('update');
      const existing = active.find(value => value.accountId === accountId); if (!existing && active.length >= 8) throw new ConflictException();
      if (!existing) await tx.insert(circleMemberships).values({ circleId: invite.circleId, accountId, role: 'member' }).onConflictDoUpdate({ target: [circleMemberships.circleId, circleMemberships.accountId], set: { status: 'active', role: 'member', joinedAt: new Date(), removedAt: null } });
      await tx.update(circleInvites).set({ status: 'accepted', acceptedByAccountId: accountId, acceptedAt: new Date() }).where(eq(circleInvites.id, invite.id)); return invite.circleId;
    }); await this.analytics.record(accountId, 'circle_invite_accepted', result); return result;
  }
  async remove(circleId: string, targetId: string, actorId: string) { await this.database.db.transaction(async tx=>{ await tx.select().from(circles).where(eq(circles.id,circleId)).for('update');  await this.requireOwner(circleId, actorId,tx); if (targetId === actorId) throw new ConflictException(); const [value] = await tx.update(circleMemberships).set({ status: 'removed', removedAt: new Date() }).where(and(eq(circleMemberships.circleId, circleId), eq(circleMemberships.accountId, targetId), eq(circleMemberships.status, 'active'))).returning(); if (!value) throw new NotFoundException();  }); }
  async leave(circleId: string, accountId: string) { await this.database.db.transaction(async tx=>{ await tx.select().from(circles).where(eq(circles.id,circleId)).for('update');  const mine = await this.requireMember(circleId, accountId,tx); if (mine.role === 'owner') throw new ConflictException(); await tx.update(circleMemberships).set({ status: 'removed', removedAt: new Date() }).where(eq(circleMemberships.id, mine.id));  }); }
  async transfer(circleId:string,targetId:string,actorId:string) {
    await this.database.db.transaction(async tx=>{
      await tx.select().from(circles).where(eq(circles.id,circleId)).for('update');
      await this.requireOwner(circleId,actorId,tx); const target=await this.requireMember(circleId,targetId,tx); if(targetId===actorId) return;
      await tx.update(circleMemberships).set({role:'member'}).where(and(eq(circleMemberships.circleId,circleId),eq(circleMemberships.accountId,actorId)));
      await tx.update(circleMemberships).set({role:'owner'}).where(eq(circleMemberships.id,target.id));
      await tx.update(circles).set({ownerAccountId:targetId,updatedAt:new Date()}).where(eq(circles.id,circleId));
    });
  }
  async activeMemberIds(circleId: string) { return (await this.database.db.select({ accountId: circleMemberships.accountId }).from(circleMemberships).where(and(eq(circleMemberships.circleId, circleId), eq(circleMemberships.status, 'active')))).map(value => value.accountId); }
}
