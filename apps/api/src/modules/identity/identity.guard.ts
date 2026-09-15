import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_ROUTE } from '../../platform/security/public.decorator';
import { IdentityService } from './identity.service';

export const KeeperOnly = () => SetMetadata('keeper-only', true);
@Injectable()
export class IdentityGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly identity: IdentityService) {}
  async canActivate(context: ExecutionContext) {
    if (this.reflector.getAllAndOverride(PUBLIC_ROUTE, [context.getHandler(), context.getClass()])) return true;
    const request = context.switchToHttp().getRequest();
    const current = await this.identity.session(request);
    if (!current?.user) throw new UnauthorizedException();
    if (this.reflector.getAllAndOverride('keeper-only', [context.getHandler(), context.getClass()]) && current.user.role !== 'pine_keeper') throw new ForbiddenException();
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) await this.identity.csrf(request);
    request.principal = current.user;
    return true;
  }
}
