import { BadRequestException, Controller, Delete, Get, HttpCode, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { inviteListQuerySchema, createCampInviteSchema, createCampSchema, transferOwnershipSchema } from '@pyneath/contracts';
import { body, principal } from '../../platform/http/request';
import { CampService } from './camp.service';

@Controller('api/v1')
export class CampController {
  constructor(private readonly camps: CampService) {}
  @Get('camps') async list(@Req() req: Request) { return { camps: await this.camps.list(principal(req).id) }; }
  @Post('camps') async create(@Req() req: Request) { const input = body(createCampSchema, req); return { camp: await this.camps.create(principal(req).id, input.name) }; }
  @Get('camps/:campId') async get(@Param('campId') id: string, @Req() req: Request) { return { camp: await this.camps.get(id, principal(req).id) }; }
  @Get('camps/:campId/invites') async invites(@Param('campId') id:string,@Req() req:Request) { const parsed=inviteListQuerySchema.safeParse(req.query); if(!parsed.success) throw new BadRequestException(); return this.camps.listInvites(id,principal(req).id,parsed.data); }
  @Post('camps/:campId/invites') async invite(@Param('campId') id: string, @Req() req: Request) { const input = body(createCampInviteSchema, req); return { invite: await this.camps.invite(id, principal(req).id, input.expiresInHours ?? 72) }; }
  @Delete('camps/:campId/invites/:inviteId') @HttpCode(204) async revoke(@Param('campId') campId: string, @Param('inviteId') inviteId: string, @Req() req: Request) { await this.camps.revoke(campId, inviteId, principal(req).id); }
  @Get('camp-invites/:token/preview') async preview(@Param('token') token: string, @Req() req: Request) { return { invite: await this.camps.preview(token, principal(req).id) }; }
  @Post('camp-invites/:token/decline') @HttpCode(204) async decline(@Param('token') token: string, @Req() req: Request) { await this.camps.decline(token, principal(req).id); }
  @Post('camp-invites/:token/accept') async accept(@Param('token') token: string, @Req() req: Request) { return { campId: await this.camps.accept(token, principal(req).id) }; }
  @Delete('camps/:campId/members/me') @HttpCode(204) async leave(@Param('campId') id: string, @Req() req: Request) { await this.camps.leave(id, principal(req).id); }
  @Delete('camps/:campId/members/:accountId') @HttpCode(204) async remove(@Param('campId') id: string, @Param('accountId') target: string, @Req() req: Request) { await this.camps.remove(id, target, principal(req).id); }
  @Post('camps/:campId/ownership-transfer') @HttpCode(204) async transfer(@Param('campId') id: string, @Req() req: Request) { await this.camps.transfer(id, body(transferOwnershipSchema, req).accountId, principal(req).id); }
}
