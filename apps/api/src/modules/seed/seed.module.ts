import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
@Module({ imports: [DatabaseModule], controllers: [SeedController], providers: [SeedService], exports: [SeedService] })
export class SeedModule {}
