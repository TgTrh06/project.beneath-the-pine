import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { PactModule } from '../pact/pact.module';
import { ProfileModule } from '../profile/profile.module';
import { SeedModule } from '../seed/seed.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { FocusController } from './focus.controller';
import { FocusService } from './focus.service';

/** Review boundary only. See README.md; no business providers or routes yet. */
@Module({ imports: [DatabaseModule, PactModule, ProfileModule, SeedModule, AnalyticsModule], controllers: [FocusController], providers: [FocusService], exports: [FocusService] })
export class FocusModule {}
