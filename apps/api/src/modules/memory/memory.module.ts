import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { MemoryController } from './presentation/memory.controller';
import { MemoryService } from './application/memory.service';
import { DrizzleMemoryRepository } from './infrastructure/memory.repository';
import { MEMORY_ACCESS } from './application/memory.ports';
import { IdentityModule } from '../identity/identity.module';
import { ACCOUNT_ACCESS, type AccountAccess } from '../identity/public-api';
import { PostgresUnitOfWork } from '../../platform/database/postgres-unit-of-work';
import { SHARED_MEMORY } from './application/shared-memory.ports';
import { SharedMemoryService } from './application/shared-memory.service';
import { DrizzleSharedMemoryRepository } from './infrastructure/shared-memory.repository';

@Module({
    imports: [DatabaseModule, IdentityModule],
    controllers: [MemoryController],
    providers: [DrizzleMemoryRepository, DrizzleSharedMemoryRepository,
      { provide: MemoryService, inject: [DrizzleMemoryRepository, PostgresUnitOfWork, ACCOUNT_ACCESS], useFactory: (repository: DrizzleMemoryRepository, transactions: PostgresUnitOfWork, accounts: AccountAccess) => new MemoryService(repository, transactions, accounts) },
      { provide: MEMORY_ACCESS, useExisting: MemoryService },
      { provide: SHARED_MEMORY, inject: [DrizzleSharedMemoryRepository], useFactory: (repository: DrizzleSharedMemoryRepository) => new SharedMemoryService(repository) }],
    exports: [MEMORY_ACCESS, SHARED_MEMORY]
})
export class MemoryModule { }
