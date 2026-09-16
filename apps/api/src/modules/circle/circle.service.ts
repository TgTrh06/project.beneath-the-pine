import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { createHash, randomBytes } from 'node:crypto';
import { DatabaseService } from '../../platform/database/database.service';
import { profiles } from '../profile/public-api';
import { AnalyticsService } from '../analytics/public-api';
import { circleInvites, circleMemberships, circles } from './infrastructure/circle.schema';

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
@Injectable()
export class CircleService {
  constructor(private readonly database: DatabaseService, private readonly analytics: AnalyticsService) {}
  async membership(circleId: string, accountId: string) {
    return (await this.database.db.select().from(circleMemberships).where(and(eq(circleMemberships.circleId, circleId), eq(circleMemberships.accountId, accountId), eq(circleMemberships.status, 'active'))))[0];
  }
  private async requireMember(circleId: string, accountId: string) { const value = await this.membership(circleId, accountId); if (!value) throw new NotFoundException(); return value; }
  private async requireOwner(circleId: string, accountId: string) { const value = await this.requireMember(circleId, accountId); if (value.role !== 'owner') throw new ForbiddenException(); return value; }
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
  async update(circleId: string, accountId: string, input: { name?: string; status?: 'active' | 'archived' }) {
    await this.requireOwner(circleId, accountId); const [value] = await this.database.db.update(circles).set({ ...input, updatedAt: new Date() }).where(eq(circles.id, circleId)).returning(); return value;
  }
  async invite(circleId: string, accountId: string, hours: number) {
    await this.requireOwner(circleId, accountId); const token = randomBytes(32).toString('hex');
    const [invite] = await this.database.db.insert(circleInvites).values({ circleId, createdByAccountId: accountId, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + hours * 3600000) }).returning();
    return { ...invite, token };
  }
  async revoke(circleId: string, inviteId: string, accountId: string) {
    await this.requireOwner(circleId, accountId); const [value] = await this.database.db.update(circleInvites).set({ status: 'revoked' }).where(and(eq(circleInvites.id, inviteId), eq(circleInvites.circleId, circleId), eq(circleInvites.status, 'pending'))).returning(); if (!value) throw new NotFoundException();
  }
  async accept(token: string, accountId: string) {
    const result = await this.database.db.transaction(async tx => {
      const [invite] = await tx.select().from(circleInvites).where(eq(circleInvites.tokenHash, tokenHash(token))).for('update'); if (!invite) throw new NotFoundException();
      if (invite.status === 'accepted' && invite.acceptedByAccountId === accountId) return invite.circleId;
      if (invite.status !== 'pending' || invite.expiresAt <= new Date()) { if (invite.status === 'pending') await tx.update(circleInvites).set({ status: 'expired' }).where(eq(circleInvites.id, invite.id)); throw new ConflictException(); }
      const active = await tx.select().from(circleMemberships).where(and(eq(circleMemberships.circleId, invite.circleId), eq(circleMemberships.status, 'active'))).for('update');
      const existing = active.find(value => value.accountId === accountId); if (!existing && active.length >= 8) throw new ConflictException();
      if (!existing) await tx.insert(circleMemberships).values({ circleId: invite.circleId, accountId, role: 'member' }).onConflictDoUpdate({ target: [circleMemberships.circleId, circleMemberships.accountId], set: { status: 'active', role: 'member', joinedAt: new Date(), removedAt: null } });
      await tx.update(circleInvites).set({ status: 'accepted', acceptedByAccountId: accountId, acceptedAt: new Date() }).where(eq(circleInvites.id, invite.id)); return invite.circleId;
    }); await this.analytics.record(accountId, 'circle_invite_accepted', result); return result;
  }
  async remove(circleId: string, targetId: string, actorId: string) { await this.requireOwner(circleId, actorId); if (targetId === actorId) throw new ConflictException(); const [value] = await this.database.db.update(circleMemberships).set({ status: 'removed', removedAt: new Date() }).where(and(eq(circleMemberships.circleId, circleId), eq(circleMemberships.accountId, targetId), eq(circleMemberships.status, 'active'))).returning(); if (!value) throw new NotFoundException(); }
  async leave(circleId: string, accountId: string) { const mine = await this.requireMember(circleId, accountId); if (mine.role === 'owner') throw new ConflictException(); await this.database.db.update(circleMemberships).set({ status: 'removed', removedAt: new Date() }).where(eq(circleMemberships.id, mine.id)); }
  async transfer(circleId: string, targetId: string, actorId: string) {
    await this.requireOwner(circleId, actorId); const target = await this.requireMember(circleId, targetId); if (targetId === actorId) return;
    await this.database.db.transaction(async tx => { await tx.update(circleMemberships).set({ role: 'member' }).where(and(eq(circleMemberships.circleId, circleId), eq(circleMemberships.accountId, actorId))); await tx.update(circleMemberships).set({ role: 'owner' }).where(eq(circleMemberships.id, target.id)); await tx.update(circles).set({ ownerAccountId: targetId, updatedAt: new Date() }).where(eq(circles.id, circleId)); });
  }
  async activeMemberIds(circleId: string) { return (await this.database.db.select({ accountId: circleMemberships.accountId }).from(circleMemberships).where(and(eq(circleMemberships.circleId, circleId), eq(circleMemberships.status, 'active')))).map(value => value.accountId); }
}
