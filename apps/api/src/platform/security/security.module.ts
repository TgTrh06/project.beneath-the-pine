import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DenyUntilAuthGuard } from './deny-until-auth.guard';

@Module({ providers: [{ provide: APP_GUARD, useClass: DenyUntilAuthGuard }] })
export class SecurityModule {}
