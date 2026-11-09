import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { PageCursor } from '../../../shared/kernel/pagination';
import type { CampRecord, CampRole, CampUpdate, Membership, InviteRecord, InviteSummary, InvitePreviewRecord } from '../domain/camp';

export interface CampAccess {
  lock(campId: string, context: TransactionContext): Promise<CampRecord | undefined>;
  update(campId: string, input: CampUpdate, context: TransactionContext): Promise<CampRecord>;
  revokePendingInvites(campId: string, context: TransactionContext): Promise<void>;
  membership(campId: string, accountId: string, context?: TransactionContext): Promise<Membership | undefined>;
  activeMemberIds(campId: string, context?: TransactionContext): Promise<string[]>;
}
export const CAMP_ACCESS = Symbol('CAMP_ACCESS');
export interface CampRepository {
  exportMemberships(accountId: string): Promise<import('../domain/camp').ExportedMembership[]>;
  exportDeclines(accountId: string): Promise<import('../domain/camp').ExportedInviteDecline[]>;
  lockOwned(accountId: string, context: TransactionContext): Promise<CampRecord[]>;
  successor(campId: string, accountId: string, context: TransactionContext): Promise<Membership | undefined>;
  delete(campId: string, context: TransactionContext): Promise<void>;
  update(campId: string, input: CampUpdate, now: Date, context: TransactionContext): Promise<CampRecord>;
  revokePendingInvites(campId: string, context: TransactionContext): Promise<void>;
  membership(campId: string, accountId: string, context?: TransactionContext): Promise<Membership | undefined>;
  activeMemberIds(campId: string, context?: TransactionContext): Promise<string[]>;
  find(campId: string, context?: TransactionContext, lock?: boolean): Promise<CampRecord | undefined>;
  create(accountId: string, name: string, context: TransactionContext): Promise<CampRecord>;
  addOwner(campId: string, accountId: string, context: TransactionContext): Promise<void>;
  list(accountId: string): Promise<Array<Pick<CampRecord, 'id' | 'name' | 'status' | 'createdAt'> & { myRole: CampRole }>>;
  members(campId: string): Promise<Array<{ accountId: string; displayName: string | null; role: CampRole; joinedAt: Date }>>;
  invites(campId: string, limit: number, cursor?: PageCursor): Promise<InviteSummary[]>;
  createInvite(value: { campId: string; createdByAccountId: string; tokenHash: string; expiresAt: Date }, context: TransactionContext): Promise<InviteRecord>;
  inviteById(campId: string, inviteId: string, context: TransactionContext): Promise<InviteRecord | undefined>;
  inviteHint(hash: string, context: TransactionContext): Promise<{ campId: string } | undefined>;
  lockInvite(hash: string, context: TransactionContext): Promise<InviteRecord | undefined>;
  setInviteStatus(inviteId: string, status: 'revoked' | 'expired', context: TransactionContext): Promise<void>;
  preview(hash: string): Promise<InvitePreviewRecord | undefined>;
  declined(inviteId: string, accountId: string, context?: TransactionContext): Promise<boolean>;
  decline(inviteId: string, accountId: string, context: TransactionContext): Promise<void>;
  lockActiveMembers(campId: string, context: TransactionContext): Promise<Membership[]>;
  join(campId: string, accountId: string, now: Date, context: TransactionContext): Promise<void>;
  accept(inviteId: string, accountId: string, now: Date, context: TransactionContext): Promise<void>;
  removeMember(campId: string, accountId: string, now: Date, context: TransactionContext): Promise<Membership | undefined>;
  leave(membershipId: string, now: Date, context: TransactionContext): Promise<void>;
  demoteOwner(campId: string, accountId: string, context: TransactionContext): Promise<void>;
  promoteMember(membershipId: string, context: TransactionContext): Promise<void>;
  transfer(campId: string, accountId: string, now: Date, context: TransactionContext): Promise<void>;
}
export interface InviteTokens { create(): string; hash(token: string): string; }

export interface CampPrivacyAccess {
  exportMemberships(accountId: string): Promise<import('../domain/camp').ExportedMembership[]>;
  exportDeclines(accountId: string): Promise<import('../domain/camp').ExportedInviteDecline[]>;
  releaseOwnedCamps(accountId: string, context: TransactionContext): Promise<void>;
}
