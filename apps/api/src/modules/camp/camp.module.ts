import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CampController } from './presentation/camp.controller';
import { CampService } from './application/camp.service';
import { CAMP_ACCESS } from './application/camp.ports';
import { DrizzleCampRepository } from './infrastructure/camp.repository';
import { inviteTokens } from './infrastructure/invite-tokens';
import { PostgresUnitOfWork } from '../../platform/database/postgres-unit-of-work';
import { ANALYTICS, type Analytics } from '../analytics/public-api';
import { decodeCursor, encodeCursor } from '../../platform/http/pagination';
@Module({ imports: [DatabaseModule, AnalyticsModule], controllers: [CampController], providers: [DrizzleCampRepository,
  { provide: CampService, inject: [DrizzleCampRepository, PostgresUnitOfWork, ANALYTICS],
    useFactory: (repository: DrizzleCampRepository, transactions: PostgresUnitOfWork, analytics: Analytics) =>
      new CampService(repository, transactions, analytics, { now: () => new Date() }, inviteTokens, { decode: decodeCursor, encode: encodeCursor }) },
  { provide: CAMP_ACCESS, useExisting: CampService },
], exports: [CAMP_ACCESS] })
export class CampModule {}
