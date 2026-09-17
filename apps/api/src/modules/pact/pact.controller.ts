import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { createPactSchema, respondPactSchema } from '@beneath-the-pine/contracts';
import { body, idempotencyKey, principal } from '../../platform/http/request';
import { PactService } from './pact.service';
@Controller('api/v1')
export class PactController {
  constructor(private readonly pacts: PactService) {}
  @Post('circles/:circleId/pacts') async create(@Param('circleId') circleId: string, @Req() req: Request) { return { pact: await this.pacts.create(circleId, principal(req).id, body(createPactSchema, req), idempotencyKey(req)) }; }
  @Get('pacts/:pactId') async get(@Param('pactId') id: string, @Req() req: Request) { return { pact: await this.pacts.get(id, principal(req).id) }; }
  @Post('pacts/:pactId/respond') async respond(@Param('pactId') id: string, @Req() req: Request) { return { pact: await this.pacts.respond(id, principal(req).id, body(respondPactSchema, req).response) }; }
  @Post('pacts/:pactId/cancel') async cancel(@Param('pactId') id: string, @Req() req: Request) { return { pact: await this.pacts.cancel(id, principal(req).id) }; }
}
