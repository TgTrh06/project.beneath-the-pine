import { Inject, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { API_CONFIG, type ApiConfig } from '../../../platform/config/api-config';
import { clearSessionCookies, cookieValue, sessionCookieName, legacySessionCookieName, sessionTokenFromCookie, sessionTokensFromCookie, sessionCookieOptions } from '../../../platform/http/session-cookie';
import type { AccountIdentity } from '../domain/identity';
import { IdentityService } from '../application/identity.service';

@Injectable()
export class IdentityHttpAdapter {
  constructor(readonly core: IdentityService, @Inject(API_CONFIG) private readonly config: ApiConfig) {}
  session(request: Request) { return this.core.session(sessionTokenFromCookie(request.headers.cookie)); }
  csrf(request: Request) {
    return this.core.csrf(sessionTokenFromCookie(request.headers.cookie), request.get('X-XSRF-TOKEN'), request.get('origin') === this.config.API_WEB_ORIGIN);
  }
  limit(request: Request) { this.core.limit(request.ip ?? 'unknown'); }
  migrateCookie(request: Request, response: Response, expiresAt: Date) {
    if (cookieValue(request.headers.cookie, legacySessionCookieName) === undefined) return;
    const token = sessionTokenFromCookie(request.headers.cookie);
    if (token && cookieValue(request.headers.cookie, sessionCookieName) === undefined) {
      response.cookie(sessionCookieName, token, { ...sessionCookieOptions(this.config.API_WEB_ORIGIN), expires: expiresAt });
    }
    response.clearCookie(legacySessionCookieName, sessionCookieOptions(this.config.API_WEB_ORIGIN));
  }
  async issue(request: Request, response: Response, account: AccountIdentity | null) {
    const result = await this.core.issue(sessionTokenFromCookie(request.headers.cookie), account);
    response.cookie(sessionCookieName, result.token, { ...sessionCookieOptions(this.config.API_WEB_ORIGIN), maxAge: result.maxAge });
    if (cookieValue(request.headers.cookie, legacySessionCookieName) !== undefined) response.clearCookie(legacySessionCookieName, sessionCookieOptions(this.config.API_WEB_ORIGIN));
    return result.response;
  }
  async logout(request: Request, response: Response) {
    await this.core.logout(sessionTokensFromCookie(request.headers.cookie));
    clearSessionCookies(response, this.config.API_WEB_ORIGIN);
  }
}
