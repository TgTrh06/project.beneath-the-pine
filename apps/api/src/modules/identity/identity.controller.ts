import { BadRequestException, ConflictException, Controller, Get, Post, Req, Res, Query, UnauthorizedException, HttpCode } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../platform/security/public.decorator';
import { IdentityService } from './identity.service';
import { KeeperOnly } from './identity.guard';
import { credentialsSchema, hashPassword, verifyPassword } from './password';

@Controller('api/v1')
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}
  @Public() @Get('auth/session')
  async session(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.identity.limit(req);
    const current = await this.identity.session(req);
    return current ? { authenticated: Boolean(current.user), user: current.user, csrfToken: current.session.csrfToken } : this.identity.issue(req, res, null);
  }
  @Public() @Post('auth/register')
  async register(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.identity.limit(req);
    await this.identity.csrf(req);
    const input = credentialsSchema.safeParse(req.body);
    if (!input.success) throw new BadRequestException();
    const user = await this.identity.store.createAccount(input.data.email, await hashPassword(input.data.password));
    if (!user) throw new ConflictException();
    return this.identity.issue(req, res, { id: user.id, email: user.email, role: user.role });
  }
  @Public() @Post('auth/login') @HttpCode(200)
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.identity.limit(req);
    await this.identity.csrf(req);
    const input = credentialsSchema.safeParse(req.body);
    if (!input.success) throw new BadRequestException();
    const user = await this.identity.store.findAccount(input.data.email);
    if (!await verifyPassword(input.data.password, user?.passwordHash) || !user) throw new UnauthorizedException();
    return this.identity.issue(req, res, { id: user.id, email: user.email, role: user.role });
  }
  @Post('auth/logout') @HttpCode(204)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) { await this.identity.logout(req, res); }
  @KeeperOnly() @Get('admin/accounts')
  async accounts(@Query('offset') offset = '0') {
    if (!/^\d{1,7}$/.test(offset)) throw new BadRequestException();
    const entries = await this.identity.store.listAccounts(Number(offset));
    return { entries: entries.slice(0, 50), hasMore: entries.length > 50 };
  }
}
