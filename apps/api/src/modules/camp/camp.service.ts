import { decodeCursor, encodeCursor } from '../../platform/http/pagination';
import type { CampInvitePreview, InviteListQuery } from '@pyneath/contracts';
import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, desc, lt, or, sql } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import { DatabaseService } from '../../platform/database/database.service';
import { profiles } from '../profile/public-api';
import { AnalyticsService } from '../analytics/public-api';
import { campInviteDeclines, campInvites, campMemberships, camps } from './infrastructure/camp.schema';

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const inviteHash = (token: string) => {
  if (!/^[0-9a-f]{64}$/.test(token)) throw new NotFoundException();
  return tokenHash(token);
};
@Injectable()
export class CampService {
  constructor(private readonly database: DatabaseService, private readonly analytics: AnalyticsService) {}
  async membership(campId: string, accountId: string, reader: Pick<DatabaseService['db'],'select'> = this.database.db) {
    return (await reader.select().from(campMemberships).where(and(eq(campMemberships.campId, campId), eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active'))))[0];
  }
  private async requireMember(campId: string, accountId: string, reader: Pick<DatabaseService['db'],'select'> = this.database.db) { const value = await this.membership(campId, accountId,reader); if (!value) throw new NotFoundException(); return value; }
  private async requireOwner(campId: string, accountId: string, reader: Pick<DatabaseService['db'],'select'> = this.database.db) { const value = await this.requireMember(campId, accountId,reader); if (value.role !== 'owner') throw new ForbiddenException(); return value; }
  async create(accountId: string, name: string) {
    const camp = await this.database.db.transaction(async tx => { const [created] = await tx.insert(camps).values({ ownerAccountId: accountId, name }).returning(); await tx.insert(campMemberships).values({ campId: created.id, accountId, role: 'owner' }); return created; }); await this.analytics.record(accountId, 'camp_created', camp.id); return camp;
  }
  async list(accountId: string) {
    const mine = await this.database.db.select({ id: camps.id, name: camps.name, status: camps.status, myRole: campMemberships.role, createdAt: camps.createdAt })
      .from(campMemberships).innerJoin(camps, eq(camps.id, campMemberships.campId)).where(and(eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active')));
    return Promise.all(mine.map(async camp => ({ ...camp, memberCount: (await this.activeMemberIds(camp.id)).length })));
  }
  async get(campId: string, accountId: string) {
    const mine = await this.requireMember(campId, accountId);
    const [camp] = await this.database.db.select().from(camps).where(eq(camps.id, campId)); if (!camp) throw new NotFoundException();
    const members = await this.database.db.select({ accountId: campMemberships.accountId, displayName: profiles.displayName, role: campMemberships.role, joinedAt: campMemberships.joinedAt })
      .from(campMemberships).leftJoin(profiles, eq(profiles.accountId, campMemberships.accountId)).where(and(eq(campMemberships.campId, campId), eq(campMemberships.status, 'active')));
    return { ...camp, myRole: mine.role, memberCount: members.length, members };
  }
  async listInvites(campId:string,accountId:string,query:InviteListQuery) {
    await this.requireOwner(campId,accountId); const scope=`invites:${campId}:${accountId}`; const cursor=decodeCursor(query.cursor,scope);
    const sortTime=sql<Date>`date_trunc('milliseconds', ${campInvites.createdAt})`.mapWith(campInvites.createdAt);
    const rows=await this.database.db.select({id:campInvites.id,campId:campInvites.campId,createdAt:sortTime,expiresAt:campInvites.expiresAt,status:campInvites.status}).from(campInvites)
      .where(and(eq(campInvites.campId,campId),cursor ? or(lt(sortTime,cursor.time),and(eq(sortTime,cursor.time),lt(campInvites.id,cursor.id))) : undefined))
      .orderBy(desc(sortTime),desc(campInvites.id)).limit(query.limit+1);
    const page=rows.slice(0,query.limit); const last=page.at(-1);
    return {items:page.map(row=>({...row,status:row.status==='pending' && row.expiresAt<=new Date() ? 'expired' : row.status})),nextCursor:rows.length>query.limit && last ? encodeCursor(last.createdAt,last.id,scope) : null};
  }
  async invite(campId:string,accountId:string,hours:number) {
    return this.database.db.transaction(async tx=>{
      const [group]=await tx.select().from(camps).where(eq(camps.id,campId)).for('update');
      await this.requireOwner(campId,accountId,tx); if(!group || group.status!=='active') throw new ConflictException();
      const token=randomBytes(32).toString('hex');
      const [invite]=await tx.insert(campInvites).values({campId,createdByAccountId:accountId,tokenHash:tokenHash(token),expiresAt:new Date(Date.now()+hours*3600000)}).returning();
      return {id:invite.id,campId:invite.campId,createdAt:invite.createdAt,expiresAt:invite.expiresAt,status:invite.status,token};
    });
  }
  async revoke(campId:string,inviteId:string,accountId:string) {
    await this.database.db.transaction(async tx=>{
      await tx.select().from(camps).where(eq(camps.id,campId)).for('update'); await this.requireOwner(campId,accountId,tx);
      const [invite]=await tx.select().from(campInvites).where(and(eq(campInvites.id,inviteId),eq(campInvites.campId,campId)));
      if(!invite) throw new NotFoundException(); if(invite.status==='revoked') return; if(invite.status!=='pending' || invite.expiresAt<=new Date()) throw new ConflictException();
      await tx.update(campInvites).set({status:'revoked'}).where(eq(campInvites.id,inviteId));
    });
  }
  async preview(token: string, accountId: string): Promise<CampInvitePreview> {
    const [result] = await this.database.db.select({
      inviteId: campInvites.id, status: campInvites.status, expiresAt: campInvites.expiresAt,
      campName: camps.name, campStatus: camps.status, inviterName: profiles.displayName,
    }).from(campInvites)
      .innerJoin(camps, eq(camps.id, campInvites.campId))
      .leftJoin(profiles, eq(profiles.accountId, campInvites.createdByAccountId))
      .where(eq(campInvites.tokenHash, inviteHash(token)));
    if (!result) throw new NotFoundException();
    if (result.campStatus !== 'active' || result.status !== 'pending' || result.expiresAt <= new Date()) throw new ConflictException();
    const [declined] = await this.database.db.select({ inviteId: campInviteDeclines.inviteId }).from(campInviteDeclines)
      .where(and(eq(campInviteDeclines.inviteId, result.inviteId), eq(campInviteDeclines.accountId, accountId)));
    if (declined) throw new ConflictException();
    return { campName: result.campName, inviterName: result.inviterName };
  }
  async decline(token: string, accountId: string): Promise<void> {
    await this.database.db.transaction(async tx => {
      const [hint] = await tx.select({ campId: campInvites.campId }).from(campInvites)
        .where(eq(campInvites.tokenHash, inviteHash(token)));
      if (!hint) throw new NotFoundException();
      const [group] = await tx.select().from(camps).where(eq(camps.id, hint.campId)).for('update');
      if (!group || group.status !== 'active') throw new ConflictException();
      const [invite] = await tx.select().from(campInvites).where(eq(campInvites.tokenHash, inviteHash(token))).for('update');
      if (!invite || invite.status !== 'pending' || invite.expiresAt <= new Date()) throw new ConflictException();
      await tx.insert(campInviteDeclines).values({ inviteId: invite.id, accountId }).onConflictDoNothing();
    });
  }
  async accept(token: string, accountId: string) {
    const result = await this.database.db.transaction(async tx => {
      const [hint]=await tx.select({campId:campInvites.campId}).from(campInvites).where(eq(campInvites.tokenHash,inviteHash(token))); if(!hint) throw new NotFoundException();
      const [group]=await tx.select().from(camps).where(eq(camps.id,hint.campId)).for('update'); if(!group || group.status!=='active') throw new ConflictException();
      const [invite] = await tx.select().from(campInvites).where(eq(campInvites.tokenHash, inviteHash(token))).for('update'); if (!invite) throw new NotFoundException();
      if (invite.status !== 'pending' || invite.expiresAt <= new Date()) { if (invite.status === 'pending') await tx.update(campInvites).set({ status: 'expired' }).where(eq(campInvites.id, invite.id)); throw new ConflictException(); }
      const [declined] = await tx.select({ inviteId: campInviteDeclines.inviteId }).from(campInviteDeclines)
        .where(and(eq(campInviteDeclines.inviteId, invite.id), eq(campInviteDeclines.accountId, accountId)));
      if (declined) throw new ConflictException();
      const active = await tx.select().from(campMemberships).where(and(eq(campMemberships.campId, invite.campId), eq(campMemberships.status, 'active'))).for('update');
      const existing = active.find(value => value.accountId === accountId); if (!existing && active.length >= 8) throw new ConflictException();
      if (!existing) await tx.insert(campMemberships).values({ campId: invite.campId, accountId, role: 'member' }).onConflictDoUpdate({ target: [campMemberships.campId, campMemberships.accountId], set: { status: 'active', role: 'member', joinedAt: new Date(), removedAt: null } });
      await tx.update(campInvites).set({ status: 'accepted', acceptedByAccountId: accountId, acceptedAt: new Date() }).where(eq(campInvites.id, invite.id)); return invite.campId;
    }); await this.analytics.record(accountId, 'camp_invite_accepted', result); return result;
  }
  async remove(campId: string, targetId: string, actorId: string) { await this.database.db.transaction(async tx=>{ await tx.select().from(camps).where(eq(camps.id,campId)).for('update');  await this.requireOwner(campId, actorId,tx); if (targetId === actorId) throw new ConflictException(); const [value] = await tx.update(campMemberships).set({ status: 'removed', removedAt: new Date() }).where(and(eq(campMemberships.campId, campId), eq(campMemberships.accountId, targetId), eq(campMemberships.status, 'active'))).returning(); if (!value) throw new NotFoundException();  }); }
  async leave(campId: string, accountId: string) { await this.database.db.transaction(async tx=>{ await tx.select().from(camps).where(eq(camps.id,campId)).for('update');  const mine = await this.requireMember(campId, accountId,tx); if (mine.role === 'owner') throw new ConflictException(); await tx.update(campMemberships).set({ status: 'removed', removedAt: new Date() }).where(eq(campMemberships.id, mine.id));  }); }
  async transfer(campId:string,targetId:string,actorId:string) {
    await this.database.db.transaction(async tx=>{
      await tx.select().from(camps).where(eq(camps.id,campId)).for('update');
      await this.requireOwner(campId,actorId,tx); const target=await this.requireMember(campId,targetId,tx); if(targetId===actorId) return;
      await tx.update(campMemberships).set({role:'member'}).where(and(eq(campMemberships.campId,campId),eq(campMemberships.accountId,actorId)));
      await tx.update(campMemberships).set({role:'owner'}).where(eq(campMemberships.id,target.id));
      await tx.update(camps).set({ownerAccountId:targetId,updatedAt:new Date()}).where(eq(camps.id,campId));
    });
  }
  async activeMemberIds(campId: string) { return (await this.database.db.select({ accountId: campMemberships.accountId }).from(campMemberships).where(and(eq(campMemberships.campId, campId), eq(campMemberships.status, 'active')))).map(value => value.accountId); }
}
