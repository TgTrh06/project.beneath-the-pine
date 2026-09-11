import { Module } from '@nestjs/common';
import { AccountRepository } from './application/account.repository';
import { IdentityService } from './application/identity.service';
import { PgAccountRepository } from './infrastructure/pg-account.repository';
import { AuthController } from './presentation/auth.controller';

@Module({
  controllers: [AuthController],
  providers: [
    { provide: AccountRepository, useClass: PgAccountRepository },
    { provide: IdentityService, useFactory: (accounts: AccountRepository) => new IdentityService(accounts), inject: [AccountRepository] },
  ],
})
export class IdentityModule {}
