import { Module } from '@nestjs/common';
import { FocusModule } from '../focus/focus.module';
import { IdentityModule } from '../identity/identity.module';
import { PreferencesModule } from '../preferences/preferences.module';
import { PresenceGateway } from './presence.gateway';
@Module({ imports: [IdentityModule, FocusModule, PreferencesModule], providers: [PresenceGateway] })
export class PresenceModule {}
