import { Controller, Delete, Get, HttpCode, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { deleteAccountSchema } from '@beneath-the-pine/contracts';
import { body, principal } from '../../platform/http/request';
import { IdentityService } from '../identity/public-api';
import { PrivacyService } from './privacy.service';
@Controller('api/v1/me')
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService, private readonly identity: IdentityService) {}
  @Get('data-export') async export(@Req() req: Request) { return this.privacy.export(principal(req).id); }
  @Delete('account') @HttpCode(204) async remove(@Req() req: Request, @Res({ passthrough: true }) res: Response) { const actor = principal(req); await this.privacy.remove(actor.id, body(deleteAccountSchema, req).password); await this.identity.logout(req, res); }
}
