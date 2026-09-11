import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PUBLIC_ROUTE } from './public.decorator';

@Injectable()
export class DenyUntilAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean {
    if (this.reflector.getAllAndOverride<boolean>(PUBLIC_ROUTE, [context.getHandler(), context.getClass()])) return true;
    // There is no authentication adapter yet. Never trust bearer headers,
    // cookies or a client-supplied user ID to create an authenticated identity.
    throw new UnauthorizedException();
  }
}
