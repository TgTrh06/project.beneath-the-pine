import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CampController } from './camp.controller';
import { CampService } from './camp.service';
@Module({ imports: [DatabaseModule, AnalyticsModule], controllers: [CampController], providers: [CampService], exports: [CampService] })
export class CampModule {}
