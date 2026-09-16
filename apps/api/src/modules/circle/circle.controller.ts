import { Controller, Delete, Get, HttpCode, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { createCircleInviteSchema, createCircleSchema, transferOwnershipSchema, updateCircleSchema } from '@beneath-the-pine/contracts';
import { body, principal } from '../../platform/http/request';
import { CircleService } from './circle.service';

@Controller('api/v1')
export class CircleController {
  constructor(private readonly circles: CircleService) {}
  @Get('circles') async list(@Req() req: Request) { return { circles: await this.circles.list(principal(req).id) }; }
  @Post('circles') async create(@Req() req: Request) { const input = body(createCircleSchema, req); return { circle: await this.circles.create(principal(req).id, input.name) }; }
  @Get('circles/:circleId') async get(@Param('circleId') id: string, @Req() req: Request) { return { circle: await this.circles.get(id, principal(req).id) }; }
  @Patch('circles/:circleId') async update(@Param('circleId') id: string, @Req() req: Request) { return { circle: await this.circles.update(id, principal(req).id, body(updateCircleSchema, req)) }; }
  @Post('circles/:circleId/invites') async invite(@Param('circleId') id: string, @Req() req: Request) { const input = body(createCircleInviteSchema, req); return { invite: await this.circles.invite(id, principal(req).id, input.expiresInHours ?? 72) }; }
  @Delete('circles/:circleId/invites/:inviteId') @HttpCode(204) async revoke(@Param('circleId') circleId: string, @Param('inviteId') inviteId: string, @Req() req: Request) { await this.circles.revoke(circleId, inviteId, principal(req).id); }
  @Post('circle-invites/:token/accept') async accept(@Param('token') token: string, @Req() req: Request) { return { circleId: await this.circles.accept(token, principal(req).id) }; }
  @Delete('circles/:circleId/members/me') @HttpCode(204) async leave(@Param('circleId') id: string, @Req() req: Request) { await this.circles.leave(id, principal(req).id); }
  @Delete('circles/:circleId/members/:accountId') @HttpCode(204) async remove(@Param('circleId') id: string, @Param('accountId') target: string, @Req() req: Request) { await this.circles.remove(id, target, principal(req).id); }
  @Post('circles/:circleId/ownership-transfer') @HttpCode(204) async transfer(@Param('circleId') id: string, @Req() req: Request) { await this.circles.transfer(id, body(transferOwnershipSchema, req).accountId, principal(req).id); }
}
