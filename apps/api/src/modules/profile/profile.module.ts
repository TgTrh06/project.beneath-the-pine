import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../platform/database/database.module';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

/** Review boundary only. See README.md; no business providers or routes yet. */
@Module({ imports: [DatabaseModule], controllers: [ProfileController], providers: [ProfileService], exports: [ProfileService] })
export class ProfileModule {}
