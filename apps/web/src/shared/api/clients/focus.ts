import { request, mutation } from '../transport';
import type { FocusSession, ReturnState } from '@pyneath/contracts';

export const getReturnState = () => request<ReturnState>("/me/return");

export const startSolo = (value: { intention: string; durationMinutes: 5 | 10 | 25 | 50 }, key: string) => mutation<{ session: FocusSession }>("/focus-sessions", "POST", value, key);

export const getSession = (id: string) => request<{ session: FocusSession }>(`/focus-sessions/${id}`);

export const joinSession = (id: string) => mutation<{ session: FocusSession }>(`/focus-sessions/${id}/join`, "POST");

export const checkOut = (id: string, value: { outcome: "completed" | "progress" | "stuck" | "stopped"; openSeed?: string | null }) => mutation<{ session: FocusSession }>(`/focus-sessions/${id}/check-out`, "POST", value);

export const getRecentPartners = (id: string) => request<{ accountIds: string[] }>(`/camps/${id}/recent-partners`);

export type HistoryEntry = {
  id: string;
  kind: "solo" | "pact";
  startedAt: string;
  endsAt: string;
  status: string;
  outcome: "completed" | "progress" | "stuck" | "stopped" | null
};

export const getHistory = () => request<{ sessions: HistoryEntry[] }>("/me/focus-history");
