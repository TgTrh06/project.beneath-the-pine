import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Public } from '../security/public.decorator';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Public()
  @Get('live')
  live() { return { status: 'UP', service: 'core-api', stage: 'core' }; }

  @Public()
  @Get('ready')
  async ready() {
    if (!await this.database.isReachable()) throw new ServiceUnavailableException();
    return { status: 'UP', service: 'core-api', stage: 'core', checks: { database: 'UP' } };
  }
}
