import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { SeedController } from './presentation/seed.controller';
import { SeedService } from './application/seed.service';
import { SEED_ACCESS } from './application/seed.ports';
import { DrizzleSeedRepository } from './infrastructure/seed.repository';

@Module({
    imports: [DatabaseModule],
    controllers: [SeedController],
    providers: [DrizzleSeedRepository, { provide: SEED_ACCESS, inject: [DrizzleSeedRepository],
      useFactory: (repository: DrizzleSeedRepository) => new SeedService(repository, { now: () => new Date() }) }],
    exports: [SEED_ACCESS]
})
export class SeedModule { }
