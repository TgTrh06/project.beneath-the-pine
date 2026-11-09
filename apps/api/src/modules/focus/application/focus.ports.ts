import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { EventChannel, EventSource } from '../../../shared/kernel/events';
import type { FocusSession, FocusParticipant, FocusSnapshot, ParticipantView, SessionHistory, Presence, PresenceChange, SoloInput, CheckoutInput, Outcome } from '../domain/focus';

export interface FocusAccess {
  readonly changes: EventSource<string>;
  readonly presenceChanges: EventSource<PresenceChange>;
  active(accountId: string): Promise<FocusSnapshot | null>;
  snapshot(sessionId: string, accountId: string): Promise<FocusSnapshot>;
  setPresence(sessionId: string, accountId: string, presence: Presence): Promise<void>;
  markConnected(sessionId: string, accountId: string): Promise<void>;
  startSolo(accountId: string, input: SoloInput, requestKey: string): Promise<FocusSnapshot>;
  startPact(pactId: string, accountId: string, requestKey: string): Promise<FocusSnapshot>;
  join(sessionId: string, accountId: string): Promise<FocusSnapshot>;
  checkout(sessionId: string, accountId: string, input: CheckoutInput): Promise<FocusSnapshot>;
  history(accountId: string): Promise<SessionHistory[]>;
  recentPartners(campId: string, accountId: string): Promise<string[]>;
}
export const FOCUS_ACCESS = Symbol('FOCUS_ACCESS');
export interface FocusEvents { changes: EventChannel<string>; presenceChanges: EventChannel<PresenceChange>; }
export interface FocusRepository extends FocusPrivacyAccess {
  activeSlot(accountId: string, context?: TransactionContext): Promise<{ id: string; sessionId: string } | undefined>;
  find(sessionId: string, context?: TransactionContext, lock?: boolean): Promise<FocusSession | undefined>;
  byRequest(accountId: string, requestKey: string): Promise<FocusSession | undefined>;
  create(value: Pick<FocusSession, 'kind' | 'startedByAccountId' | 'durationMinutes' | 'startedAt' | 'endsAt' | 'requestKey'> & { pactId?: string; campId?: string }, context: TransactionContext): Promise<FocusSession>;
  addParticipant(sessionId: string, accountId: string, context: TransactionContext, intention?: string): Promise<void>;
  participant(sessionId: string, accountId: string, context?: TransactionContext, lock?: boolean): Promise<FocusParticipant | undefined>;
  participantViews(sessionId: string, context: TransactionContext): Promise<ParticipantView[]>;
  stopRevokedSlot(participantId: string, accountId: string, now: Date, context: TransactionContext): Promise<void>;
  complete(sessionId: string, now: Date, context: TransactionContext, guard: 'active' | 'expired' | 'locked'): Promise<boolean>;
  stopParticipants(sessionId: string, now: Date, context: TransactionContext): Promise<void>;
  checkOutParticipant(participantId: string, outcome: Outcome, now: Date, context: TransactionContext): Promise<void>;
  hasRemaining(sessionId: string, context: TransactionContext, limitOne?: boolean): Promise<boolean>;
  hasWaiting(pactId: string, campId: string, sessionId: string, context: TransactionContext): Promise<boolean>;
  setPresence(participantId: string, presence: Presence, context: TransactionContext): Promise<void>;
  history(accountId: string): Promise<SessionHistory[]>;
  activeCampMember(campId: string, accountId: string, context: TransactionContext): Promise<boolean>;
  recentPartners(campId: string, accountId: string, context: TransactionContext): Promise<string[]>;
  stopRevokedParticipants(sessionId: string, campId: string, now: Date, context: TransactionContext): Promise<void>;
  joinedAccountIds(sessionId: string): Promise<string[]>;
  expired(now: Date): Promise<string[]>;
  activePacts(): Promise<string[]>;
}

export interface FocusPrivacyAccess {
  exportSessions(accountId: string): Promise<Array<Pick<FocusSession, 'id' | 'kind' | 'startedAt' | 'endsAt' | 'status'> & Pick<FocusParticipant, 'intention' | 'outcome'>>>;
}
