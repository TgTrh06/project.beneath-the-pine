import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { ProfileController } from './presentation/profile.controller';
import { ProfileService } from './application/profile.service';
import { PROFILE_ACCESS } from './application/profile.ports';
import { DrizzleProfileRepository } from './infrastructure/profile.repository';

@Module({
    imports: [DatabaseModule],
    controllers: [ProfileController],
    providers: [DrizzleProfileRepository, { provide: PROFILE_ACCESS, inject: [DrizzleProfileRepository],
      useFactory: (repository: DrizzleProfileRepository) => new ProfileService(repository, { now: () => new Date() }) }],
    exports: [PROFILE_ACCESS]
})
export class ProfileModule { }
