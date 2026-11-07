import { BusinessError } from '../../../shared/kernel/business-error';
import type { Clock } from '../../../shared/kernel/clock';
import { validSessionToken, sessionLifetime, type AccountIdentity } from '../domain/identity';
import type { IdentityAccess, IdentityCrypto, IdentityEvents, IdentityRepository, IssuedSession } from './identity.ports';

export class IdentityService implements IdentityAccess {
  private readonly attempts = new Map<string, { count: number; until: number }>();
  readonly revokedSessions;
  readonly deletedAccounts;
  constructor(private readonly repository: IdentityRepository, private readonly crypto: IdentityCrypto,
    private readonly clock: Clock, private readonly events: IdentityEvents) {
    this.revokedSessions = { subscribe: events.revokedSessions.subscribe.bind(events.revokedSessions) };
    this.deletedAccounts = { subscribe: events.deletedAccounts.subscribe.bind(events.deletedAccounts) };
  }
  hashToken(token: string) { return this.crypto.hashToken(token); }
  async session(token?: string) { return validSessionToken(token) ? this.repository.findSession(this.hashToken(token)) : undefined; }
  async verifyAccountPassword(email: string, password: string) {
    const account = await this.repository.findAccount(email);
    return Boolean(account && await this.crypto.verifyPassword(password, account.passwordHash));
  }
  async register(email: string, password: string): Promise<AccountIdentity> {
    const account = await this.repository.createAccount(email, await this.crypto.hashPassword(password));
    if (!account) throw new BusinessError('STATE_CONFLICT');
    return { id: account.id, email: account.email };
  }
  async login(email: string, password: string): Promise<AccountIdentity> {
    const account = await this.repository.findAccount(email);
    // Always run the password check, including the missing-account dummy hash path.
    if (!await this.crypto.verifyPassword(password, account?.passwordHash) || !account) throw new BusinessError('UNAUTHENTICATED');
    return { id: account.id, email: account.email };
  }
  async csrf(token: string | undefined, submitted: string | undefined, originMatches: boolean) {
    const current = await this.session(token), expected = current?.session.csrfToken;
    if (!originMatches || !validSessionToken(submitted) || !expected || submitted.length !== expected.length || !this.crypto.equal(submitted, expected)) throw new BusinessError('FORBIDDEN');
    return current;
  }
  async issue(oldToken: string | undefined, account: AccountIdentity | null): Promise<IssuedSession> {
    const token = this.crypto.token(), csrfToken = this.crypto.token(), maxAge = sessionLifetime(Boolean(account));
    await this.repository.rotateSession(oldToken ? this.hashToken(oldToken) : undefined, {
      tokenHash: this.hashToken(token), accountId: account?.id ?? null, csrfToken, expiresAt: new Date(this.clock.now().getTime() + maxAge),
    });
    if (oldToken) this.events.revokedSessions.next(this.hashToken(oldToken));
    return { token, maxAge, response: { authenticated: Boolean(account), account, csrfToken } };
  }
  async logout(tokens: Array<string | undefined>) {
    for (const token of new Set(tokens)) if (validSessionToken(token)) {
      const hash = this.hashToken(token);
      await this.repository.revoke(hash);
      this.events.revokedSessions.next(hash);
    }
  }
  notifyAccountDeleted(accountId: string) { this.events.deletedAccounts.next(accountId); }
  limit(client: string) {
    const now = this.clock.now().getTime();
    for (const [key, value] of this.attempts) if (value.until < now) this.attempts.delete(key);
    const entry = this.attempts.get(client) ?? { count: 0, until: now + 60000 };
    if (++entry.count > 20 || (!this.attempts.has(client) && this.attempts.size >= 10000)) throw new BusinessError('RATE_LIMITED');
    this.attempts.set(client, entry);
  }
}
