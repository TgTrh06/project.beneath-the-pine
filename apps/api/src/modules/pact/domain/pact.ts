export type PactStatus = 'scheduled' | 'active' | 'completed' | 'cancelled' | 'expired';
export type PactResponse = 'invited' | 'accepted' | 'declined';
export interface PactRecord {
  id: string; campId: string; creatorAccountId: string | null; startsAt: Date; durationMinutes: number;
  status: PactStatus; startedSessionId: string | null; requestKey: string; createdAt: Date; updatedAt: Date;
}
export interface PactParticipant {
  id: string; pactId: string; accountId: string; response: PactResponse; respondedAt: Date | null; createdAt: Date;
}
export interface CreatePact { participantIds: string[]; startsAt: string; durationMinutes: 5 | 10 | 25 | 50; }
export type UpcomingPact = Pick<PactRecord, 'id' | 'campId' | 'startsAt' | 'durationMinutes'>;
export interface DueReminder { id: string; campName: string; startsAt: Date; durationMinutes: number; }
export interface PactListRow extends UpcomingPact {
  campName: string; status: PactStatus; response: PactResponse; creatorId: string | null; sessionId: string | null;
}
export const pactExpiryTime = (now: Date) => new Date(now.getTime() - 1800000);
export const pactIsExpired = (pact: PactRecord, now: Date) => pact.startsAt < pactExpiryTime(now);

export interface ExportedPact { id: string; campId: string; startsAt: Date; durationMinutes: number; status: PactStatus; response: PactResponse; }
export interface ExportedPactReminder { pactId: string; accountId: string; claimedAt: Date; }
