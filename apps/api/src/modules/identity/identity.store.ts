import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { and, eq, gt, lt, desc } from 'drizzle-orm';
import { DatabaseService } from '../../platform/database/database.service';
import { accounts, sessions } from './infrastructure/identity.schema';

@Injectable()
export class IdentityStore {
  constructor(private readonly database: DatabaseService) {}
  private async run<T>(work: () => Promise<T>): Promise<T> {
    try { return await work(); } catch { throw new ServiceUnavailableException(); }
  }
  findAccount(email: string) { return this.run(async () => (await this.database.db.select().from(accounts).where(eq(accounts.email, email)))[0]); }
  createAccount(email: string, passwordHash: string) {
    return this.run(async () => (await this.database.db.insert(accounts).values({ email, passwordHash }).onConflictDoNothing().returning())[0]);
  }
  findSession(tokenHash: string) {
    return this.run(async () => (await this.database.db.select({ session: sessions, user: { id: accounts.id, email: accounts.email, role: accounts.role } })
      .from(sessions).leftJoin(accounts, eq(sessions.accountId, accounts.id))
      .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date()))))[0]);
  }
  rotateSession(oldHash: string | undefined, value: typeof sessions.$inferInsert) {
    return this.run(async () => this.database.db.transaction(async tx => {
      if (oldHash) await tx.delete(sessions).where(eq(sessions.tokenHash, oldHash));
      await tx.delete(sessions).where(lt(sessions.expiresAt, new Date()));
      await tx.insert(sessions).values(value);
    }));
  }
  revoke(tokenHash: string) { return this.run(async () => { await this.database.db.delete(sessions).where(eq(sessions.tokenHash, tokenHash)); }); }
  listAccounts(offset: number) {
    return this.run(() => this.database.db.select({ id: accounts.id, email: accounts.email, role: accounts.role, createdAt: accounts.createdAt })
      .from(accounts).orderBy(desc(accounts.createdAt), accounts.id).limit(51).offset(offset));
  }
}
