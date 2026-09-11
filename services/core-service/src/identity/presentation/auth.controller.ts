import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { parse } from '../../shared/http/validation';
import { Public } from '../../shared/security/session.guard';
import { csrf, establishSession, saveSession } from '../../shared/security/session';
import { IdentityService } from '../application/identity.service';

const credentials = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(12).max(64).refine(value => value.trim().length > 0 && Buffer.byteLength(value, 'utf8') <= 72),
});

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly identity: IdentityService) {}

  @Public()
  @Get('session')
  async session(@Req() request: Request) {
    const csrfToken = csrf.generateToken(request);
    await saveSession(request);
    return { authenticated: Boolean(request.session.user), user: request.session.user ?? null, csrfToken };
  }

  @Public()
  @Post('register')
  async register(@Body() body: unknown, @Req() request: Request) {
    const input = parse(credentials, body);
    return establishSession(request, await this.identity.register(input.email, input.password));
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(@Body() body: unknown, @Req() request: Request) {
    const input = parse(credentials, body);
    return establishSession(request, await this.identity.login(input.email, input.password));
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    await new Promise<void>((resolve, reject) => request.session.destroy(error => error ? reject(error) : resolve()));
    response.clearCookie('BTP_SESSION', { path: '/' });
    response.clearCookie('XSRF-TOKEN', { path: '/' });
  }
}
