import { Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { checkOutSchema, startSoloSessionSchema } from '@beneath-the-pine/contracts';
import { body, idempotencyKey, principal } from '../../platform/http/request';
import { PactService } from '../pact/public-api';
import { ProfileService } from '../profile/public-api';
import { SeedService } from '../seed/public-api';
import { FocusService } from './focus.service';

@Controller('api/v1')
export class FocusController {
  constructor(private readonly focus: FocusService, private readonly profiles: ProfileService, private readonly seeds: SeedService, private readonly pacts: PactService) {}
  @Get('me/return') async returnState(@Req() req: Request) { const actor = principal(req); const profile = await this.profiles.get(actor.id); return { profileReady: Boolean(profile?.timezone), openSeed: await this.seeds.get(actor.id), activeSession: await this.focus.active(actor.id), upcomingPacts: await this.pacts.listUpcoming(actor.id) }; }
  @Post('focus-sessions') async start(@Req() req: Request) { return { session: await this.focus.startSolo(principal(req).id, body(startSoloSessionSchema, req), idempotencyKey(req)) }; }
  @Get('focus-sessions/active') async active(@Req() req: Request) { return { session: await this.focus.active(principal(req).id) }; }
  @Get('focus-sessions/:sessionId') async get(@Param('sessionId') id: string, @Req() req: Request) { return { session: await this.focus.snapshot(id, principal(req).id) }; }
  @Post('focus-sessions/:sessionId/check-out') async checkout(@Param('sessionId') id: string, @Req() req: Request) { return { session: await this.focus.checkout(id, principal(req).id, body(checkOutSchema, req)) }; }
  @Post('focus-sessions/:sessionId/join') async join(@Param('sessionId') id: string, @Req() req: Request) { return { session: await this.focus.join(id, principal(req).id) }; }
  @Post('pacts/:pactId/start') async startPact(@Param('pactId') id: string, @Req() req: Request) { return { session: await this.focus.startPact(id, principal(req).id, idempotencyKey(req)) }; }
  @Get('me/focus-history') async history(@Req() req: Request) { return { sessions: await this.focus.history(principal(req).id) }; }
}
