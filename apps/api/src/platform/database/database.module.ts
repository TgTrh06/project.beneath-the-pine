import { Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { PostgresUnitOfWork } from './postgres-unit-of-work';
import { UNIT_OF_WORK } from '../../shared/kernel/unit-of-work';

@Module({
    providers: [DatabaseService, PostgresUnitOfWork, { provide: UNIT_OF_WORK, useExisting: PostgresUnitOfWork }],
    exports: [DatabaseService, PostgresUnitOfWork, UNIT_OF_WORK]
})

export class DatabaseModule {}
