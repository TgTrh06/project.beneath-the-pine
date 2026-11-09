import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresUnitOfWork } from '../../../platform/database/postgres-unit-of-work';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { AccountAccess, AccountRemoval } from '../application/account.ports';
import { accounts } from './identity.schema';
@Injectable()
export class DrizzleAccountRepository implements AccountAccess, AccountRemoval {
  constructor(private readonly transactions: PostgresUnitOfWork) {}
  async email(accountId: string) {
    return (await this.transactions.reader().select({ email: accounts.email }).from(accounts).where(eq(accounts.id, accountId)))[0]?.email;
  }
  async remove(accountId: string, context: TransactionContext) {
    await this.transactions.reader(context).delete(accounts).where(eq(accounts.id, accountId));
  }
  async lock(accountId: string, context: TransactionContext) {
    return Boolean((await this.transactions.reader(context).select({ id: accounts.id }).from(accounts).where(eq(accounts.id, accountId)).for('update'))[0]);
  }
}
