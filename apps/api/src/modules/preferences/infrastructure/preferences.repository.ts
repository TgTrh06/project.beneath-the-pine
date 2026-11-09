import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresUnitOfWork } from '../../../platform/database/postgres-unit-of-work';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { PreferencesPatch, PreferencesRecord } from '../domain/preferences';
import type { PreferencesRepository } from '../application/preferences.ports';
import { accountPreferences } from './preferences.schema';
@Injectable()
export class DrizzlePreferencesRepository implements PreferencesRepository {
  constructor(private readonly transactions: PostgresUnitOfWork) {}
  async get(accountId: string, context?: TransactionContext) {
    return (await this.transactions.reader(context).select().from(accountPreferences).where(eq(accountPreferences.accountId, accountId)))[0];
  }
  async lockReminders(accountId: string, context: TransactionContext) {
    return Boolean((await this.transactions.reader(context).select({ enabled: accountPreferences.remindAcceptedPacts }).from(accountPreferences).where(eq(accountPreferences.accountId, accountId)).for('update'))[0]?.enabled);
  }
  async save(accountId: string, patch: PreferencesPatch, now: Date) {
    return (await this.transactions.reader().insert(accountPreferences).values({ accountId, ...patch })
      .onConflictDoUpdate({ target: accountPreferences.accountId, set: { ...patch, updatedAt: now } }).returning())[0];
  }
  async arrange(accountId: string, values: Pick<PreferencesRecord, 'forestLayout' | 'forestHidden' | 'forestVersion'>, now: Date, context: TransactionContext) {
    return (await this.transactions.reader(context).insert(accountPreferences).values({ accountId, ...values })
      .onConflictDoUpdate({ target: accountPreferences.accountId, set: { ...values, updatedAt: now } }).returning())[0];
  }
}
