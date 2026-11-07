import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { and, eq, gt, lt } from 'drizzle-orm';
import { PostgresUnitOfWork } from '../../../platform/database/postgres-unit-of-work';
import type { IdentityRepository } from '../application/identity.ports';
import type { SessionRecord } from '../domain/identity';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import { accounts, sessions } from './identity.schema';

@Injectable()
export class DrizzleIdentityRepository implements IdentityRepository {
  constructor(private readonly transactions: PostgresUnitOfWork) {}
  private async run<T>(work: () => Promise<T>): Promise<T> {
    try { return await work(); } catch { throw new ServiceUnavailableException(); }
  }
  findAccount(email: string) { return this.run(async () => (await this.transactions.reader().select().from(accounts).where(eq(accounts.email, email)))[0]); }
  createAccount(email: string, passwordHash: string) {
    return this.run(async () => (await this.transactions.reader().insert(accounts).values({ email, passwordHash }).onConflictDoNothing().returning())[0]);
  }
  findSession(tokenHash: string) {
    return this.run(async () => (await this.transactions.reader().select({ session: sessions, account: { id: accounts.id, email: accounts.email } })
      .from(sessions).leftJoin(accounts, eq(sessions.accountId, accounts.id))
      .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date()))))[0]);
  }
  rotateSession(oldHash: string | undefined, value: SessionRecord) {
    return this.run(async () => this.transactions.run(async context => {
      const tx = this.transactions.reader(context);
      if (oldHash) await tx.delete(sessions).where(eq(sessions.tokenHash, oldHash));
      await tx.delete(sessions).where(lt(sessions.expiresAt, new Date()));
      await tx.insert(sessions).values(value);
    }));
  }
  revoke(tokenHash: string) { return this.run(async () => { await this.transactions.reader().delete(sessions).where(eq(sessions.tokenHash, tokenHash)); }); }
  deleteAccount(accountId: string, context?: TransactionContext) { return this.run(async () => { await this.transactions.reader(context).delete(accounts).where(eq(accounts.id, accountId)); }); }
}
