export type Outcome = 'completed' | 'progress' | 'stuck' | 'stopped';
export type Presence = 'active' | 'break' | 'disconnected';
export type StoredPresence = Presence | 'checked_out';
export interface FocusSession {
  id: string; kind: 'solo' | 'pact'; pactId: string | null; campId: string | null; startedByAccountId: string | null;
  durationMinutes: number; status: 'active' | 'completed' | 'cancelled'; startedAt: Date; endsAt: Date; completedAt: Date | null; requestKey: string;
}
export interface FocusParticipant {
  id: string; sessionId: string; accountId: string; activeSlotAccountId: string | null; intention: string | null;
  presence: StoredPresence; outcome: Outcome | null; joinedAt: Date; checkedOutAt: Date | null;
}
export interface ParticipantView { accountId: string; displayName: string | null; presence: StoredPresence; joinedAt: Date; checkedOutAt: Date | null; sharePresence: boolean | null; }
export interface FocusSnapshot {
  id: string; kind: FocusSession['kind']; pactId: string | null; status: FocusSession['status']; startedAt: Date; endsAt: Date; serverNow: Date; intention: string | null;
  participants: Array<Omit<ParticipantView, 'sharePresence' | 'presence'> & { presence: StoredPresence | 'hidden' }>;
}
export interface PresenceChange { sessionId: string; accountId: string; presence: Presence; }
export interface SoloInput { intention: string; durationMinutes: 5 | 10 | 25 | 50; }
export interface CheckoutInput { outcome: Outcome; openSeed?: string | null; }
export type SessionHistory = Pick<FocusSession, 'id' | 'kind' | 'startedAt' | 'endsAt' | 'status'> & { outcome: Outcome | null };
export class ActiveSessionCollision extends Error { constructor() { super('Active session or request already exists'); } }
export const activePresence: StoredPresence[] = ['active', 'break', 'disconnected'];
export function visibleParticipants(rows: ParticipantView[], accountId: string): FocusSnapshot['participants'] {
  return rows.map(({ sharePresence, ...person }) => ({ ...person,
    presence: person.accountId === accountId || person.presence === 'checked_out' || sharePresence ? person.presence : 'hidden',
  }));
}
export function nextPresence(current: StoredPresence, requested: Presence, preserveBreak: boolean): Presence {
  return preserveBreak && current === 'break' ? 'break' : requested;
}
