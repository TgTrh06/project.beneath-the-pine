import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { PactModule } from '../pact/pact.module';
import { ProfileModule } from '../profile/profile.module';
import { SeedModule } from '../seed/seed.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { FocusController } from './presentation/focus.controller';
import { FocusService } from './application/focus.service';
import { FOCUS_ACCESS } from './application/focus.ports';
import { FOCUS_CONTEXT_READER } from './application/focus-context.ports';
import { DrizzleFocusRepository } from './infrastructure/focus.repository';
import { FocusMaintenance } from './infrastructure/focus-maintenance';
import { CampModule } from '../camp/camp.module';
import { MemoryModule } from '../memory/memory.module';
import { CAMP_ACCESS, type CampAccess } from '../camp/public-api';
import { PACT_ACCESS, type PactAccess } from '../pact/public-api';
import { SEED_ACCESS, type SeedAccess } from '../seed/public-api';
import { SHARED_MEMORY, type SharedMemory } from '../memory/public-api';
import { ANALYTICS, type Analytics } from '../analytics/public-api';
import { PostgresUnitOfWork } from '../../platform/database/postgres-unit-of-work';
import { Subject } from 'rxjs';
import type { PresenceChange } from './domain/focus';

@Module({ imports: [DatabaseModule, CampModule, PactModule, ProfileModule, SeedModule, MemoryModule, AnalyticsModule], controllers: [FocusController],
  providers: [DrizzleFocusRepository, FocusMaintenance,
    { provide: FocusService, inject: [DrizzleFocusRepository, PostgresUnitOfWork, CAMP_ACCESS, PACT_ACCESS, SEED_ACCESS, SHARED_MEMORY, ANALYTICS],
      useFactory: (repository: DrizzleFocusRepository, transactions: PostgresUnitOfWork, camps: CampAccess, pacts: PactAccess, seeds: SeedAccess, memory: SharedMemory, analytics: Analytics) =>
        new FocusService(repository, transactions, camps, pacts, seeds, memory, analytics, { now: () => new Date() }, { changes: new Subject<string>(), presenceChanges: new Subject<PresenceChange>() }) },
    { provide: FOCUS_ACCESS, useExisting: FocusService },
    { provide: FOCUS_CONTEXT_READER, useExisting: DrizzleFocusRepository },
  ], exports: [FOCUS_ACCESS, FOCUS_CONTEXT_READER] })
export class FocusModule {}
