import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { PreferencesController } from './presentation/preferences.controller';
import { PreferencesService } from './application/preferences.service';
import { DrizzlePreferencesRepository } from './infrastructure/preferences.repository';
import { PostgresUnitOfWork } from '../../platform/database/postgres-unit-of-work';
import { IdentityModule } from '../identity/identity.module';
import { MemoryModule } from '../memory/memory.module';
import { ACCOUNT_ACCESS, type AccountAccess } from '../identity/public-api';
import { MEMORY_ACCESS, type MemoryAccess } from '../memory/public-api';
import { Subject } from 'rxjs';
import { PREFERENCES_ACCESS } from './application/preferences.ports';

@Module({
  imports: [DatabaseModule, IdentityModule, MemoryModule],
  controllers: [PreferencesController],
  providers: [DrizzlePreferencesRepository,
    { provide: PreferencesService, inject: [DrizzlePreferencesRepository, PostgresUnitOfWork, ACCOUNT_ACCESS, MEMORY_ACCESS],
      useFactory: (repository: DrizzlePreferencesRepository, transactions: PostgresUnitOfWork, accounts: AccountAccess, memory: MemoryAccess) => new PreferencesService(repository, transactions, accounts, memory, { now: () => new Date() }, new Subject<string>()) },
    { provide: PREFERENCES_ACCESS, useExisting: PreferencesService }],
  exports: [PREFERENCES_ACCESS],
})
export class PreferencesModule {}
