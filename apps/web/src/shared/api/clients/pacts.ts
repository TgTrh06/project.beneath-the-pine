import { request, mutation } from '../transport';
import type { FocusPact, FocusSession, PactReminderClaim } from '@pyneath/contracts';

export const createPact = (
  campId: string,
  value: {
    participantIds: string[];
    startsAt: string;
    durationMinutes: 5 | 10 | 25 | 50
  },
  key: string
) => mutation<{ pact: FocusPact }>(`/camps/${campId}/pacts`, "POST", value, key);

export const getPact = (id: string) => request<{ pact: FocusPact }>(`/pacts/${id}`);

export const respondPact = (id: string, response: "accepted" | "declined") => mutation<{ pact: FocusPact }>(`/pacts/${id}/respond`, "POST", { response });

export const startPact = (id: string, key: string) => mutation<{ session: FocusSession }>(`/pacts/${id}/start`, "POST", undefined, key);

export const cancelPact = (id: string) => mutation<{ pact: FocusPact }>(`/pacts/${id}/cancel`, "POST");

export const listPacts = (group: string, cursor?: string, campId?: string) =>
  request<import('@pyneath/contracts').PactPage>(`${campId ? `/camps/${campId}/pacts` : '/me/pacts'}?group=${encodeURIComponent(group)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);

export const claimDuePactReminders = () => mutation<PactReminderClaim>('/me/pact-reminders/claim-due', 'POST');
