import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from '../../platform/database/database.module';
import { IdentityStore } from './identity.store';
import { IdentityService } from './identity.service';
import { IdentityController } from './identity.controller';
import { IdentityGuard } from './identity.guard';

/** Identity owns account/session persistence and browser authorization. */
@Module({ imports: [DatabaseModule], controllers: [IdentityController], providers: [IdentityStore, IdentityService, { provide: APP_GUARD, useClass: IdentityGuard }] })
export class IdentityModule {}
