import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { IdentityModule } from '../identity/identity.module';
import { PrivacyController } from './privacy.controller';
import { PrivacyService } from './privacy.service';

/** Review boundary only. See README.md; no business providers or routes yet. */
@Module({ imports: [DatabaseModule, IdentityModule], controllers: [PrivacyController], providers: [PrivacyService] })
export class PrivacyModule {}
