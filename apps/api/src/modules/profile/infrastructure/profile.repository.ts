import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresUnitOfWork } from '../../../platform/database/postgres-unit-of-work';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { ProfileRepository } from '../application/profile.ports';
import type { ProfileRecord } from '../domain/profile';
import { profiles } from './profile.schema';
@Injectable()
export class DrizzleProfileRepository implements ProfileRepository {
  constructor(private readonly transactions: PostgresUnitOfWork) {}
  async get(accountId: string, context?: TransactionContext) {
    return (await this.transactions.reader(context).select().from(profiles).where(eq(profiles.accountId, accountId)))[0] ?? null;
  }
  async save(profile: ProfileRecord, context?: TransactionContext) {
    const { accountId, ...value } = profile;
    return (await this.transactions.reader(context).insert(profiles).values(profile)
      .onConflictDoUpdate({ target: profiles.accountId, set: value }).returning())[0];
  }
}
