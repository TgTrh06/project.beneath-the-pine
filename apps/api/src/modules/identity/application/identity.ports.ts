import type { AccountIdentity, AccountRecord, SessionIdentity, SessionRecord } from '../domain/identity';
import type { EventChannel, EventSource } from '../../../shared/kernel/events';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';

export interface IdentityRepository {
  findAccount(email: string): Promise<AccountRecord | undefined>;
  createAccount(email: string, passwordHash: string): Promise<AccountRecord | undefined>;
  findSession(tokenHash: string): Promise<SessionIdentity | undefined>;
  rotateSession(oldHash: string | undefined, value: SessionRecord): Promise<void>;
  revoke(tokenHash: string): Promise<void>;
  deleteAccount(accountId: string, context?: TransactionContext): Promise<void>;
}
export const IDENTITY_REPOSITORY = Symbol('IDENTITY_REPOSITORY');
export interface IdentityCrypto {
  token(): string;
  hashToken(token: string): string;
  equal(left: string, right: string): boolean;
  hashPassword(password: string): Promise<string>;
  verifyPassword(password: string, encoded?: string): Promise<boolean>;
}
export interface IdentityEvents { revokedSessions: EventChannel<string>; deletedAccounts: EventChannel<string>; }
export interface IdentityAccess {
  readonly revokedSessions: EventSource<string>;
  readonly deletedAccounts: EventSource<string>;
  session(token?: string): Promise<SessionIdentity | undefined>;
  hashToken(token: string): string;
  logout(tokens: Array<string | undefined>): Promise<void>;
  verifyAccountPassword(email: string, password: string): Promise<boolean>;
  notifyAccountDeleted(accountId: string): void;
}
export interface IssuedSession {
  token: string; maxAge: number;
  response: { authenticated: boolean; account: AccountIdentity | null; csrfToken: string };
}
export const IDENTITY_ACCESS = Symbol('IDENTITY_ACCESS');
