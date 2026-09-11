import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './shared/database/database.module';
import { SessionGuard } from './shared/security/session.guard';
import { IdentityModule } from './identity/identity.module';
import { TaskModule } from './task/task.module';
import { SystemModule } from './system/system.module';

@Module({
  imports: [DatabaseModule, IdentityModule, TaskModule, SystemModule],
  providers: [{ provide: APP_GUARD, useClass: SessionGuard }],
})
export class AppModule {}
