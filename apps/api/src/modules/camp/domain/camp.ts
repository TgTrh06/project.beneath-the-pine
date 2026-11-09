import { BusinessError } from '../../../shared/kernel/business-error';

export type CampStatus = 'active' | 'archived';
export type CampRole = 'owner' | 'member';
export interface CampUpdate { name?: string; status?: CampStatus; }
export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
export interface CampRecord {
  id: string; ownerAccountId: string; name: string; status: CampStatus; createdAt: Date; updatedAt: Date;
}
export interface Membership {
  id: string; campId: string; accountId: string; role: CampRole; status: 'active' | 'removed'; joinedAt: Date; removedAt: Date | null;
}
export interface InviteRecord {
  id: string; campId: string; createdByAccountId: string | null; tokenHash: string; status: InviteStatus;
  expiresAt: Date; acceptedByAccountId: string | null; createdAt: Date; acceptedAt: Date | null;
}
export type InviteSummary = Pick<InviteRecord, 'id' | 'campId' | 'createdAt' | 'expiresAt' | 'status'>;
export interface InvitePreviewRecord {
  inviteId: string; status: InviteStatus; expiresAt: Date; campName: string; campStatus: CampStatus; inviterName: string | null;
}
export function requireActiveCamp(camp: CampRecord | undefined) {
  if (!camp || camp.status !== 'active') throw new BusinessError('STATE_CONFLICT');
}
export function requirePendingInvite(invite: Pick<InviteRecord, 'status' | 'expiresAt'>, now: Date) {
  if (invite.status !== 'pending' || invite.expiresAt <= now) throw new BusinessError('STATE_CONFLICT');
}
export function validateInviteToken(token: string) {
  if (!/^[0-9a-f]{64}$/.test(token)) throw new BusinessError('NOT_FOUND');
  return token;
}

export interface ExportedMembership { campId: string; name: string | null; status: string | null; role: CampRole; joinedAt: Date; }
export interface ExportedInviteDecline { inviteId: string; campId: string; declinedAt: Date; }
