import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Subject } from 'rxjs';
import { DatabaseModule } from '../../platform/database/database.module';
import { DrizzleIdentityRepository } from './infrastructure/identity.repository';
import { identityCrypto } from './infrastructure/identity-crypto';
import { IdentityService } from './application/identity.service';
import { IDENTITY_ACCESS, IDENTITY_REPOSITORY, type IdentityRepository } from './application/identity.ports';
import { IdentityController } from './presentation/identity.controller';
import { IdentityGuard } from './presentation/identity.guard';
import { IdentityHttpAdapter } from './presentation/identity-http.adapter';

@Module({
  imports: [DatabaseModule], controllers: [IdentityController],
  providers: [DrizzleIdentityRepository,
    { provide: IDENTITY_REPOSITORY, useExisting: DrizzleIdentityRepository },
    { provide: IdentityService, inject: [IDENTITY_REPOSITORY], useFactory: (repository: IdentityRepository) =>
      new IdentityService(repository, identityCrypto, { now: () => new Date() }, { revokedSessions: new Subject<string>(), deletedAccounts: new Subject<string>() }) },
    { provide: IDENTITY_ACCESS, useExisting: IdentityService },
    IdentityHttpAdapter, { provide: APP_GUARD, useClass: IdentityGuard },
  ],
  exports: [IDENTITY_ACCESS],
})
export class IdentityModule {}
