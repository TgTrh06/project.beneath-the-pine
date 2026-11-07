import { Controller, Delete, Get, HttpCode, Inject, Put, Req } from '@nestjs/common';
import type { Request } from 'express';
import { upsertOpenSeedSchema } from '@pyneath/contracts';
import { body, principal } from '../../../platform/http/request';
import { SEED_ACCESS, type SeedAccess } from '../application/seed.ports';

@Controller('api/v1/me/open-seed')
export class SeedController {
  constructor(@Inject(SEED_ACCESS) private readonly seeds: SeedAccess) { }

  @Get()
  async get(@Req() req: Request) {
    return {
      openSeed: await this.seeds.get(principal(req).id)
    };
  }

  @Put()
  async put(@Req() req: Request) {
    return {
      openSeed: await this.seeds.upsert(principal(req).id, body(upsertOpenSeedSchema, req))
    };
  }

  @Delete()
  @HttpCode(204)
  async remove(@Req() req: Request) {
    await this.seeds.remove(principal(req).id);
  }
}
