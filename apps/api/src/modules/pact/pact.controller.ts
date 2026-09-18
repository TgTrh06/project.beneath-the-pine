import { BadRequestException, Controller, Patch, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { createPactSchema, respondPactSchema, pactListQuerySchema, updateCircleSchema } from '@beneath-the-pine/contracts';
import { body, idempotencyKey, principal } from '../../platform/http/request';
import { PactService } from './pact.service';
@Controller('api/v1')
export class PactController {
  constructor(private readonly pacts: PactService) {}
  @Get('me/pacts') async list(@Req() req:Request) { const parsed=pactListQuerySchema.safeParse(req.query); if(!parsed.success) throw new BadRequestException(); return this.pacts.list(principal(req).id,parsed.data); }
  @Get('circles/:circleId/pacts') async circleList(@Param('circleId') id:string,@Req() req:Request) { const parsed=pactListQuerySchema.safeParse(req.query); if(!parsed.success) throw new BadRequestException(); return this.pacts.list(principal(req).id,parsed.data,id); }
  @Patch('circles/:circleId') async updateCircle(@Param('circleId') id:string,@Req() req:Request) { return {circle:await this.pacts.updateCircle(id,principal(req).id,body(updateCircleSchema,req))}; }
  @Post('circles/:circleId/pacts') async create(@Param('circleId') circleId: string, @Req() req: Request) { return { pact: await this.pacts.create(circleId, principal(req).id, body(createPactSchema, req), idempotencyKey(req)) }; }
  @Get('pacts/:pactId') async get(@Param('pactId') id: string, @Req() req: Request) { return { pact: await this.pacts.get(id, principal(req).id) }; }
  @Post('pacts/:pactId/respond') async respond(@Param('pactId') id: string, @Req() req: Request) { return { pact: await this.pacts.respond(id, principal(req).id, body(respondPactSchema, req).response) }; }
  @Post('pacts/:pactId/cancel') async cancel(@Param('pactId') id: string, @Req() req: Request) { return { pact: await this.pacts.cancel(id, principal(req).id) }; }
}
