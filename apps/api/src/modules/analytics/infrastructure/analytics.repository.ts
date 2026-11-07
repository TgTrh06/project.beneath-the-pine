import { Injectable } from '@nestjs/common';
import { and, count, eq, gte, lt, sql } from 'drizzle-orm';
import type { AssistanceCapability } from '@pyneath/contracts';
import { PostgresUnitOfWork } from '../../../platform/database/postgres-unit-of-work';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { AnalyticsRepository, EventRecord } from '../application/analytics.ports';
import { productEvents } from './analytics.schema';

@Injectable()
export class DrizzleAnalyticsRepository implements AnalyticsRepository {
  constructor(private readonly transactions: PostgresUnitOfWork) {}
  async append(event: EventRecord, context?: TransactionContext): Promise<void> {
    await this.transactions.reader(context).insert(productEvents).values(event);
  }
  async lockAssistanceQuota(context: TransactionContext): Promise<void> {
    await this.transactions.reader(context).execute(sql`select pg_advisory_xact_lock(639104, 1)`);
  }
  async countRequests(start: Date, end: Date, context: TransactionContext, accountId?: string): Promise<number> {
    const today = and(eq(productEvents.name, 'assistance_requested'), gte(productEvents.occurredAt, start), lt(productEvents.occurredAt, end));
    const [row] = await this.transactions.reader(context).select({ total: count() }).from(productEvents)
      .where(accountId === undefined ? today : and(today, eq(productEvents.accountId, accountId)));
    return row.total;
  }
  async ownsRequest(accountId: string, suggestionId: string, capability: AssistanceCapability): Promise<boolean> {
    const rows = await this.transactions.reader().select({ metadata: productEvents.metadata }).from(productEvents)
      .where(and(eq(productEvents.accountId, accountId), eq(productEvents.subjectId, suggestionId), eq(productEvents.name, 'assistance_requested'))).limit(1);
    return rows[0]?.metadata.capability === capability;
  }
}
