import { Inject, Injectable, ForbiddenException, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { API_CONFIG, ApiConfig } from '../../platform/config/api-config';
import { IdentityStore } from './identity.store';

export const sessionHash = (token: string) => createHash('sha256').update(token).digest('hex');
const cookieName = 'BTP_SESSION';
@Injectable()
export class IdentityService {
  private readonly attempts = new Map<string, { count: number; until: number }>();
  constructor(readonly store: IdentityStore, @Inject(API_CONFIG) private readonly config: ApiConfig) {}
  token(request: Request) {
    const value = request.headers.cookie?.split(';').map(item => item.trim()).find(item => item.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
    return value && /^[a-f0-9]{64}$/.test(value) ? value : undefined;
  }
  async session(request: Request) {
    const token = this.token(request);
    return token ? this.store.findSession(sessionHash(token)) : undefined;
  }
  async csrf(request: Request) {
    const current = await this.session(request);
    const token = request.get('X-XSRF-TOKEN');
    const expected = current?.session.csrfToken;
    if (request.get('origin') !== this.config.API_WEB_ORIGIN || !token || !expected || !/^[a-f0-9]{64}$/.test(token) || token.length !== expected.length
      || !timingSafeEqual(Buffer.from(token), Buffer.from(expected))) throw new ForbiddenException();
    return current;
  }
  private cookieOptions() {
    return { httpOnly: true, secure: this.config.API_WEB_ORIGIN.startsWith('https:'), sameSite: 'lax' as const, path: '/' };
  }
  async issue(request: Request, response: Response, user: { id: string; email: string; role: 'wanderer' | 'pine_keeper' } | null) {
    const token = randomBytes(32).toString('hex');
    const csrfToken = randomBytes(32).toString('hex');
    const maxAge = user ? 7 * 86400000 : 3600000;
    const oldToken = this.token(request);
    await this.store.rotateSession(oldToken ? sessionHash(oldToken) : undefined, {
      tokenHash: sessionHash(token), accountId: user?.id ?? null, csrfToken, expiresAt: new Date(Date.now() + maxAge),
    });
    response.cookie(cookieName, token, { ...this.cookieOptions(), maxAge });
    return { authenticated: Boolean(user), user, csrfToken };
  }
  async logout(request: Request, response: Response) {
    const token = this.token(request);
    if (token) await this.store.revoke(sessionHash(token));
    response.clearCookie(cookieName, this.cookieOptions());
  }
  limit(request: Request) {
    const now = Date.now();
    for (const [key, value] of this.attempts) if (value.until < now) this.attempts.delete(key);
    const key = request.ip ?? 'unknown';
    const entry = this.attempts.get(key) ?? { count: 0, until: now + 60000 };
    if (++entry.count > 20 || (!this.attempts.has(key) && this.attempts.size >= 10000)) throw new HttpException('Rate limited', 429);
    this.attempts.set(key, entry);
  }
}
