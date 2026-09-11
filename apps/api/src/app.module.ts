import { Module } from '@nestjs/common';
import { ConfigModule } from './platform/config/config.module';
import { HealthModule } from './platform/health/health.module';
import { SecurityModule } from './platform/security/security.module';
import { IdentityModule } from './modules/identity/identity.module';
import { ProfileModule } from './modules/profile/profile.module';
import { ConsentModule } from './modules/consent/consent.module';
import { TaskModule } from './modules/task/task.module';
import { FocusModule } from './modules/focus/focus.module';
import { CaptureModule } from './modules/capture/capture.module';
import { EngagementModule } from './modules/engagement/engagement.module';
import { ReflectionModule } from './modules/reflection/reflection.module';
import { HabitModule } from './modules/habit/habit.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { PrivacyModule } from './modules/privacy/privacy.module';
import { AccessModule } from './modules/access/access.module';

@Module({
  imports: [
    ConfigModule, SecurityModule, HealthModule,
    IdentityModule,
    ProfileModule,
    ConsentModule,
    TaskModule,
    FocusModule,
    CaptureModule,
    EngagementModule,
    ReflectionModule,
    HabitModule,
    AnalyticsModule,
    PrivacyModule,
    AccessModule,
  ],
})
export class AppModule {}
