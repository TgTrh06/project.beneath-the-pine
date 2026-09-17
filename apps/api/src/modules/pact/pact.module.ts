import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { CircleModule } from '../circle/circle.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { PactController } from './pact.controller';
import { PactService } from './pact.service';
@Module({ imports: [DatabaseModule, CircleModule, AnalyticsModule], controllers: [PactController], providers: [PactService], exports: [PactService] })
export class PactModule {}
