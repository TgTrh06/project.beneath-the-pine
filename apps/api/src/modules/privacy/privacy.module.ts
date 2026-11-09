import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { PostgresUnitOfWork } from '../../platform/database/postgres-unit-of-work';
import { IdentityModule } from '../identity/identity.module';
import { CampModule } from '../camp/camp.module';
import { FocusModule } from '../focus/focus.module';
import { MemoryModule } from '../memory/memory.module';
import { PactModule } from '../pact/pact.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { ProfileModule } from '../profile/profile.module';
import { SeedModule } from '../seed/seed.module';
import { ACCOUNT_REMOVAL, IDENTITY_ACCESS, type AccountRemoval, type IdentityAccess } from '../identity/public-api';
import { CAMP_ACCESS, type CampPrivacyAccess } from '../camp/public-api';
import { FOCUS_ACCESS, type FocusPrivacyAccess } from '../focus/public-api';
import { MEMORY_ACCESS, type MemoryPrivacyAccess } from '../memory/public-api';
import { PACT_ACCESS, type PactPrivacyAccess } from '../pact/public-api';
import { PREFERENCES_ACCESS, type PreferencesPrivacyAccess } from '../preferences/public-api';
import { PROFILE_ACCESS, type ProfileAccess } from '../profile/public-api';
import { SEED_ACCESS, type SeedAccess } from '../seed/public-api';
import { PrivacyController } from './presentation/privacy.controller';
import { PrivacyService } from './application/privacy.service';

@Module({
  imports: [DatabaseModule, IdentityModule, CampModule, FocusModule, MemoryModule, PactModule, PreferencesModule, ProfileModule, SeedModule],
  controllers: [PrivacyController],
  providers: [{ provide: PrivacyService,
    inject: [PostgresUnitOfWork, ACCOUNT_REMOVAL, IDENTITY_ACCESS, CAMP_ACCESS, FOCUS_ACCESS, MEMORY_ACCESS, PACT_ACCESS, PREFERENCES_ACCESS, PROFILE_ACCESS, SEED_ACCESS],
    useFactory: (transactions: PostgresUnitOfWork, accounts: AccountRemoval, identity: IdentityAccess,
      camps: CampPrivacyAccess, focus: FocusPrivacyAccess, memory: MemoryPrivacyAccess, pacts: PactPrivacyAccess,
      preferences: PreferencesPrivacyAccess, profile: ProfileAccess, seeds: SeedAccess) =>
      new PrivacyService({ camps, focus, memory, pacts, preferences, profile, seeds }, accounts, identity, transactions, { now: () => new Date() }) }],
})
export class PrivacyModule {}
