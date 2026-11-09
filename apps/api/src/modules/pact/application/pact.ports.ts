import type { PactListQuery } from '@pyneath/contracts';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { PageCursor } from '../../../shared/kernel/pagination';
import type { PactRecord, PactParticipant, PactResponse, PactStatus, UpcomingPact, DueReminder, PactListRow } from '../domain/pact';

export interface PactAccess {
  lock(pactId: string, context: TransactionContext): Promise<PactRecord | undefined>;
  expire(pactId: string, now: Date, context: TransactionContext): Promise<void>;
  activate(pactId: string, sessionId: string, now: Date, context: TransactionContext): Promise<void>;
  completeActive(pactId: string, now: Date, context: TransactionContext): Promise<void>;
  raw(pactId: string, context?: TransactionContext): Promise<PactRecord>;
  requireParticipant(pactId: string, accountId: string, context?: TransactionContext): Promise<PactParticipant>;
  listUpcoming(accountId: string): Promise<UpcomingPact[]>;
}
export const PACT_ACCESS = Symbol('PACT_ACCESS');
export interface PactRepository extends PactPrivacyAccess {
  activate(pactId: string, sessionId: string, now: Date, context: TransactionContext): Promise<void>;
  completeActive(pactId: string, now: Date, context: TransactionContext): Promise<void>;
  dueReminders(accountId: string, now: Date, context: TransactionContext): Promise<DueReminder[]>;
  claimReminder(pactId: string, accountId: string, context: TransactionContext): Promise<boolean>;
  status(pactId: string, context: TransactionContext): Promise<PactStatus | undefined>;
  lockActor(accountId: string, context: TransactionContext): Promise<void>;
  byRequest(accountId: string, requestKey: string, context?: TransactionContext): Promise<PactRecord | undefined>;
  create(value: { campId: string; creatorAccountId: string; startsAt: Date; durationMinutes: number; requestKey: string }, context: TransactionContext): Promise<PactRecord>;
  addParticipants(values: Array<{ pactId: string; accountId: string; response: PactResponse; respondedAt: Date | null }>, context: TransactionContext): Promise<void>;
  participant(pactId: string, accountId: string, context?: TransactionContext): Promise<PactParticipant | undefined>;
  find(pactId: string, context?: TransactionContext, lock?: boolean): Promise<PactRecord | undefined>;
  participants(pactId: string): Promise<Array<{ accountId: string; response: PactResponse; displayName: string | null }>>;
  upcoming(accountId: string): Promise<UpcomingPact[]>;
  setStatus(pactId: string, status: PactStatus, now: Date, context: TransactionContext): Promise<void>;
  respond(participantId: string, response: 'accepted' | 'declined', now: Date, context: TransactionContext): Promise<void>;
  list(accountId: string, query: PactListQuery, cursor?: PageCursor, campId?: string): Promise<PactListRow[]>;
  expireScheduled(now: Date, before: Date, context?: TransactionContext, filter?: { pactId?: string; campId?: string }): Promise<void>;
  hasOpen(campId: string, context: TransactionContext): Promise<boolean>;
}

export interface PactPrivacyAccess {
  exportPacts(accountId: string): Promise<import('../domain/pact').ExportedPact[]>;
  exportReminders(accountId: string): Promise<import('../domain/pact').ExportedPactReminder[]>;
}
