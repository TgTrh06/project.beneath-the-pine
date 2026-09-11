import { Controller, Get, Module, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Database } from '../shared/database/database.module';
import { AppError } from '../shared/error/app-error';
import { Public } from '../shared/security/session.guard';

@Controller()
export class SystemController {
  constructor(private readonly database: Database) {}
  @Get('api/v1/system/auth-check')
  authCheck(@Req() request: Request) {
    return { authenticated: true, subject: request.session.user!.id, email: request.session.user!.email };
  }
  @Public()
  @Get('actuator/health/liveness')
  liveness() { return { status: 'UP' }; }

  @Public()
  @Get(['actuator/health', 'actuator/health/readiness'])
  async readiness() {
    try {
      // Check the implemented schema, not just connectivity. Never migrate at startup.
      await this.database.pool.query(`SELECT a.id, a.email, a.password_hash, a.enabled, a.created_at, a.updated_at,
        t.id, t.user_id, t.title, t.minutes, t.status, t.source_brain_dump_id, t.created_at, t.updated_at,
        n.id, n.task_id, n.title, n.minutes, n.confirmed_at
        FROM core.accounts a, core.tasks t, core.next_actions n LIMIT 0`);
      return { status: 'UP' };
    } catch {
      throw new AppError('SERVICE_UNAVAILABLE', 'The service is not ready.', 503);
    }
  }
}

@Module({ controllers: [SystemController] })
export class SystemModule {}
