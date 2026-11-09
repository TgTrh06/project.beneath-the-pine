import { Injectable } from '@nestjs/common';
import { and, asc, eq, ne, desc, lt, or, sql } from 'drizzle-orm';
import { PostgresUnitOfWork } from '../../../platform/database/postgres-unit-of-work';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { PageCursor } from '../../../shared/kernel/pagination';
import { profiles } from '../../profile/infrastructure/profile.schema';
import type { CampRepository } from '../application/camp.ports';
import type { CampUpdate } from '../domain/camp';
import { campInviteDeclines, campInvites, campMemberships, camps } from './camp.schema';

@Injectable()
export class DrizzleCampRepository implements CampRepository {
  constructor(private readonly transactions: PostgresUnitOfWork) {}
  exportMemberships(accountId: string) {
    return this.transactions.reader().select({ campId: camps.id, name: sql<string | null>`case when ${campMemberships.status} = 'active' then ${camps.name} else null end`, status: sql<string | null>`case when ${campMemberships.status} = 'active' then ${camps.status} else null end`, role: campMemberships.role, joinedAt: campMemberships.joinedAt })
      .from(campMemberships).innerJoin(camps, eq(camps.id, campMemberships.campId)).where(eq(campMemberships.accountId, accountId));
  }
  exportDeclines(accountId: string) {
    return this.transactions.reader().select({ inviteId: campInviteDeclines.inviteId, campId: campInvites.campId, declinedAt: campInviteDeclines.declinedAt })
      .from(campInviteDeclines).innerJoin(campInvites, eq(campInvites.id, campInviteDeclines.inviteId)).where(eq(campInviteDeclines.accountId, accountId));
  }
  lockOwned(accountId: string, context: TransactionContext) {
    return this.transactions.reader(context).select().from(camps).where(eq(camps.ownerAccountId, accountId)).for('update');
  }
  async successor(campId: string, accountId: string, context: TransactionContext) {
    return (await this.transactions.reader(context).select().from(campMemberships).where(and(eq(campMemberships.campId, campId), eq(campMemberships.status, 'active'), ne(campMemberships.accountId, accountId))).orderBy(asc(campMemberships.joinedAt)).limit(1))[0];
  }
  async delete(campId: string, context: TransactionContext) {
    await this.transactions.reader(context).delete(camps).where(eq(camps.id, campId));
  }
  async update(campId: string, input: CampUpdate, now: Date, context: TransactionContext) {
    return (await this.transactions.reader(context).update(camps).set({ ...input, updatedAt: now }).where(eq(camps.id, campId)).returning())[0];
  }
  async revokePendingInvites(campId: string, context: TransactionContext) {
    await this.transactions.reader(context).update(campInvites).set({ status: 'revoked' }).where(and(eq(campInvites.campId, campId), eq(campInvites.status, 'pending')));
  }
  async membership(campId: string, accountId: string, context?: TransactionContext) {
    return (await this.transactions.reader(context).select().from(campMemberships).where(and(eq(campMemberships.campId, campId), eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active'))))[0];
  }
  async activeMemberIds(campId: string, context?: TransactionContext) {
    return (await this.transactions.reader(context).select({ accountId: campMemberships.accountId }).from(campMemberships).where(and(eq(campMemberships.campId, campId), eq(campMemberships.status, 'active')))).map(value => value.accountId);
  }
  async find(campId: string, context?: TransactionContext, lock = false) {
    const query = this.transactions.reader(context).select().from(camps).where(eq(camps.id, campId));
    return (await (lock ? query.for('update') : query))[0];
  }
  async create(accountId: string, name: string, context: TransactionContext) {
    return (await this.transactions.reader(context).insert(camps).values({ ownerAccountId: accountId, name }).returning())[0];
  }
  async addOwner(campId: string, accountId: string, context: TransactionContext) {
    await this.transactions.reader(context).insert(campMemberships).values({ campId, accountId, role: 'owner' });
  }
  list(accountId: string) {
    return this.transactions.reader().select({ id: camps.id, name: camps.name, status: camps.status, myRole: campMemberships.role, createdAt: camps.createdAt })
      .from(campMemberships).innerJoin(camps, eq(camps.id, campMemberships.campId)).where(and(eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active')));
  }
  members(campId: string) {
    // Read-model exception: display names belong to Profile; no Profile writes occur here.
    return this.transactions.reader().select({ accountId: campMemberships.accountId, displayName: profiles.displayName, role: campMemberships.role, joinedAt: campMemberships.joinedAt })
      .from(campMemberships).leftJoin(profiles, eq(profiles.accountId, campMemberships.accountId)).where(and(eq(campMemberships.campId, campId), eq(campMemberships.status, 'active')));
  }
  invites(campId: string, limit: number, cursor?: PageCursor) {
    const sortTime = sql<Date>`date_trunc('milliseconds', ${campInvites.createdAt})`.mapWith(campInvites.createdAt);
    return this.transactions.reader().select({ id: campInvites.id, campId: campInvites.campId, createdAt: sortTime, expiresAt: campInvites.expiresAt, status: campInvites.status }).from(campInvites)
      .where(and(eq(campInvites.campId, campId), cursor ? or(lt(sortTime, cursor.time), and(eq(sortTime, cursor.time), lt(campInvites.id, cursor.id))) : undefined))
      .orderBy(desc(sortTime), desc(campInvites.id)).limit(limit);
  }
  async createInvite(value: { campId: string; createdByAccountId: string; tokenHash: string; expiresAt: Date }, context: TransactionContext) {
    return (await this.transactions.reader(context).insert(campInvites).values(value).returning())[0];
  }
  async inviteById(campId: string, inviteId: string, context: TransactionContext) {
    return (await this.transactions.reader(context).select().from(campInvites).where(and(eq(campInvites.id, inviteId), eq(campInvites.campId, campId))))[0];
  }
  async inviteHint(hash: string, context: TransactionContext) {
    return (await this.transactions.reader(context).select({ campId: campInvites.campId }).from(campInvites).where(eq(campInvites.tokenHash, hash)))[0];
  }
  async lockInvite(hash: string, context: TransactionContext) {
    return (await this.transactions.reader(context).select().from(campInvites).where(eq(campInvites.tokenHash, hash)).for('update'))[0];
  }
  async setInviteStatus(inviteId: string, status: 'revoked' | 'expired', context: TransactionContext) {
    await this.transactions.reader(context).update(campInvites).set({ status }).where(eq(campInvites.id, inviteId));
  }
  async preview(hash: string) {
    return (await this.transactions.reader().select({ inviteId: campInvites.id, status: campInvites.status, expiresAt: campInvites.expiresAt,
      campName: camps.name, campStatus: camps.status, inviterName: profiles.displayName }).from(campInvites)
      .innerJoin(camps, eq(camps.id, campInvites.campId)).leftJoin(profiles, eq(profiles.accountId, campInvites.createdByAccountId))
      .where(eq(campInvites.tokenHash, hash)))[0];
  }
  async declined(inviteId: string, accountId: string, context?: TransactionContext) {
    return Boolean((await this.transactions.reader(context).select({ inviteId: campInviteDeclines.inviteId }).from(campInviteDeclines)
      .where(and(eq(campInviteDeclines.inviteId, inviteId), eq(campInviteDeclines.accountId, accountId))))[0]);
  }
  async decline(inviteId: string, accountId: string, context: TransactionContext) {
    await this.transactions.reader(context).insert(campInviteDeclines).values({ inviteId, accountId }).onConflictDoNothing();
  }
  lockActiveMembers(campId: string, context: TransactionContext) {
    return this.transactions.reader(context).select().from(campMemberships).where(and(eq(campMemberships.campId, campId), eq(campMemberships.status, 'active'))).for('update');
  }
  async join(campId: string, accountId: string, now: Date, context: TransactionContext) {
    await this.transactions.reader(context).insert(campMemberships).values({ campId, accountId, role: 'member' }).onConflictDoUpdate({ target: [campMemberships.campId, campMemberships.accountId], set: { status: 'active', role: 'member', joinedAt: now, removedAt: null } });
  }
  async accept(inviteId: string, accountId: string, now: Date, context: TransactionContext) {
    await this.transactions.reader(context).update(campInvites).set({ status: 'accepted', acceptedByAccountId: accountId, acceptedAt: now }).where(eq(campInvites.id, inviteId));
  }
  async removeMember(campId: string, accountId: string, now: Date, context: TransactionContext) {
    return (await this.transactions.reader(context).update(campMemberships).set({ status: 'removed', removedAt: now }).where(and(eq(campMemberships.campId, campId), eq(campMemberships.accountId, accountId), eq(campMemberships.status, 'active'))).returning())[0];
  }
  async leave(membershipId: string, now: Date, context: TransactionContext) {
    await this.transactions.reader(context).update(campMemberships).set({ status: 'removed', removedAt: now }).where(eq(campMemberships.id, membershipId));
  }
  async demoteOwner(campId: string, accountId: string, context: TransactionContext) {
    await this.transactions.reader(context).update(campMemberships).set({ role: 'member' }).where(and(eq(campMemberships.campId, campId), eq(campMemberships.accountId, accountId)));
  }
  async promoteMember(membershipId: string, context: TransactionContext) {
    await this.transactions.reader(context).update(campMemberships).set({ role: 'owner' }).where(eq(campMemberships.id, membershipId));
  }
  async transfer(campId: string, accountId: string, now: Date, context: TransactionContext) {
    await this.transactions.reader(context).update(camps).set({ ownerAccountId: accountId, updatedAt: now }).where(eq(camps.id, campId));
  }
}
