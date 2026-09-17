import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AnalyticsService } from './analytics.service';

/** Review boundary only. See README.md; no business providers or routes yet. */
@Module({ imports: [DatabaseModule], providers: [AnalyticsService], exports: [AnalyticsService] })
export class AnalyticsModule {}
