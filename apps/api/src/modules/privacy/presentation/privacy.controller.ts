import { Controller, Delete, Get, HttpCode, Inject, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { deleteAccountSchema } from '@pyneath/contracts';
import { body, principal } from '../../../platform/http/request';
import { IDENTITY_ACCESS, type IdentityAccess } from '../../identity/public-api';
import { API_CONFIG, type ApiConfig } from '../../../platform/config/api-config';
import { clearSessionCookies, sessionTokensFromCookie } from '../../../platform/http/session-cookie';
import { PrivacyService } from '../application/privacy.service';

@Controller('api/v1/me')
export class PrivacyController {
  constructor(private readonly privacy: PrivacyService, @Inject(IDENTITY_ACCESS) private readonly identity: IdentityAccess, @Inject(API_CONFIG) private readonly config: ApiConfig) { }

  @Get('data-export')
  async export(@Req() req: Request) {
    return this.privacy.export(principal(req).id);
  }

  @Delete('account')
  @HttpCode(204)
  async remove(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const actor = principal(req);
    await this.privacy.remove(actor.id, body(deleteAccountSchema, req).password);
    await this.identity.logout(sessionTokensFromCookie(req.headers.cookie));
    clearSessionCookies(res, this.config.API_WEB_ORIGIN);
  }
}
