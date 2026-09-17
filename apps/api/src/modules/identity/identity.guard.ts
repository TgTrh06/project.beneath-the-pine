import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_ROUTE } from '../../platform/security/public.decorator';
import { IdentityService } from './identity.service';

@Injectable()
export class IdentityGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly identity: IdentityService) {}
  async canActivate(context: ExecutionContext) {
    if (context.getType() !== 'http') return true;
    if (this.reflector.getAllAndOverride(PUBLIC_ROUTE, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest();
    const current = await this.identity.session(request);
    if (!current?.account) throw new UnauthorizedException();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) await this.identity.csrf(request);
    request.principal = current.account;
    return true;
  }
}
