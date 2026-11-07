import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { randomUUID } from 'node:crypto';
import { AnalyticsService } from './application/analytics.service';
import { ANALYTICS } from './application/analytics.ports';
import { DrizzleAnalyticsRepository } from './infrastructure/analytics.repository';
import { PostgresUnitOfWork } from '../../platform/database/postgres-unit-of-work';

@Module({ imports: [DatabaseModule], providers: [DrizzleAnalyticsRepository, {
  provide: ANALYTICS, inject: [DrizzleAnalyticsRepository, PostgresUnitOfWork],
  useFactory: (repository: DrizzleAnalyticsRepository, transactions: PostgresUnitOfWork) =>
    new AnalyticsService(repository, transactions, { now: () => new Date() }, randomUUID),
}], exports: [ANALYTICS] })
export class AnalyticsModule {}
