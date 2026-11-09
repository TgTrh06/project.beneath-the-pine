import { request, mutation } from '../transport';
import type { Camp, CampInvitePreview } from '@pyneath/contracts';

export const listCamps = () => request<{ camps: Camp[] }>("/camps");

export const getCamp = (id: string) => request<{ camp: Camp }>(`/camps/${id}`);

export const createCamp = (name: string) => mutation<{ camp: { id: string } }>("/camps", "POST", { name });

export const createCampInvite = (id: string) => mutation<{ invite: { id: string; token: string; expiresAt: string } }>(`/camps/${id}/invites`, "POST", { expiresInHours: 72 });

export const getCampInvitePreview = (token: string) => request<{ invite: CampInvitePreview }>(`/camp-invites/${token}/preview`);

export const declineCampInvite = (token: string) => mutation<void>(`/camp-invites/${token}/decline`, "POST");

export const acceptCampInvite = (token: string) => mutation<{ campId: string }>(`/camp-invites/${token}/accept`, "POST");

export const updateCamp = (id: string, name: string) => mutation(`/camps/${id}`, "PATCH", { name });

export const revokeInvite = (id: string, inviteId: string) => mutation<void>(`/camps/${id}/invites/${inviteId}`, "DELETE");

export const removeMember = (id: string, accountId: string) => mutation<void>(`/camps/${id}/members/${accountId}`, "DELETE");

export const leaveCamp = (id: string) => mutation<void>(`/camps/${id}/members/me`, "DELETE");

export const transferCamp = (id: string, accountId: string) => mutation<void>(`/camps/${id}/ownership-transfer`, "POST", { accountId });

export const listCampInvites = (id: string, cursor?: string) =>
  request<import('@pyneath/contracts').InvitePage>(`/camps/${id}/invites${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`);

export const setCampStatus = (id: string, status: 'active' | 'archived') =>
  mutation(`/camps/${id}`, 'PATCH', { status });
