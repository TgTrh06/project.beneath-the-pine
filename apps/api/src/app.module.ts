import { Module } from '@nestjs/common';
import { ConfigModule } from './platform/config/config.module';
import { HealthModule } from './platform/health/health.module';
import { SecurityModule } from './platform/security/security.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ProfileModule } from './modules/profile/profile.module';
import { FocusModule } from './modules/focus/focus.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { CircleModule } from './modules/circle/circle.module';
import { PactModule } from './modules/pact/pact.module';
import { SeedModule } from './modules/seed/seed.module';
import { PresenceModule } from './modules/presence/presence.module';
import { MemoryModule } from './modules/memory/memory.module';

@Module({
  imports: [
    ConfigModule, SecurityModule, HealthModule,
    IdentityModule,
    ProfileModule,
    CircleModule,
    PactModule,
    FocusModule,
    SeedModule,
    PresenceModule,
    MemoryModule,
    AnalyticsModule,
    PrivacyModule,
  ],
})
export class AppModule {}
