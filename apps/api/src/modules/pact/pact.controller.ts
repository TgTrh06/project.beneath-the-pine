import { BadRequestException, Controller, Patch, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { createPactSchema, respondPactSchema, pactListQuerySchema, updateCampSchema } from '@pyneath/contracts';
import { body, idempotencyKey, principal } from '../../platform/http/request';
import { PactService } from './pact.service';
@Controller('api/v1')
export class PactController {
  constructor(private readonly pacts: PactService) {}
  @Get('me/pacts') async list(@Req() req:Request) { const parsed=pactListQuerySchema.safeParse(req.query); if(!parsed.success) throw new BadRequestException(); return this.pacts.list(principal(req).id,parsed.data); }
  @Post('me/pact-reminders/claim-due') async claimDueReminders(@Req() req:Request) { return this.pacts.claimDueReminders(principal(req).id); }
  @Get('camps/:campId/pacts') async campList(@Param('campId') id:string,@Req() req:Request) { const parsed=pactListQuerySchema.safeParse(req.query); if(!parsed.success) throw new BadRequestException(); return this.pacts.list(principal(req).id,parsed.data,id); }
  @Patch('camps/:campId') async updateCamp(@Param('campId') id:string,@Req() req:Request) { return {camp:await this.pacts.updateCamp(id,principal(req).id,body(updateCampSchema,req))}; }
  @Post('camps/:campId/pacts') async create(@Param('campId') campId: string, @Req() req: Request) { return { pact: await this.pacts.create(campId, principal(req).id, body(createPactSchema, req), idempotencyKey(req)) }; }
  @Get('pacts/:pactId') async get(@Param('pactId') id: string, @Req() req: Request) { return { pact: await this.pacts.get(id, principal(req).id) }; }
  @Post('pacts/:pactId/respond') async respond(@Param('pactId') id: string, @Req() req: Request) { return { pact: await this.pacts.respond(id, principal(req).id, body(respondPactSchema, req).response) }; }
  @Post('pacts/:pactId/cancel') async cancel(@Param('pactId') id: string, @Req() req: Request) { return { pact: await this.pacts.cancel(id, principal(req).id) }; }
}
