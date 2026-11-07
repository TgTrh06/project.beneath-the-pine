import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { PostgresUnitOfWork } from '../../../platform/database/postgres-unit-of-work';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { SeedRepository } from '../application/seed.ports';
import { openSeeds } from './seed.schema';
@Injectable()
export class DrizzleSeedRepository implements SeedRepository {
  constructor(private readonly transactions: PostgresUnitOfWork) {}
  async get(accountId: string, context?: TransactionContext) {
    return (await this.transactions.reader(context).select().from(openSeeds).where(eq(openSeeds.accountId, accountId)))[0] ?? null;
  }
  async upsert(accountId: string, input: { text: string; sourceSessionId: string | null }, now: Date, context?: TransactionContext) {
    return (await this.transactions.reader(context).insert(openSeeds).values({ accountId, ...input })
      .onConflictDoUpdate({ target: openSeeds.accountId, set: { ...input, updatedAt: now } }).returning())[0];
  }
  async remove(accountId: string, context?: TransactionContext) {
    await this.transactions.reader(context).delete(openSeeds).where(eq(openSeeds.accountId, accountId));
  }
}
