import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { CircleController } from './circle.controller';
import { CircleService } from './circle.service';
@Module({ imports: [DatabaseModule, AnalyticsModule], controllers: [CircleController], providers: [CircleService], exports: [CircleService] })
export class CircleModule {}
