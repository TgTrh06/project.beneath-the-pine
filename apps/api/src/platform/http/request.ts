import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { ZodType } from 'zod';
import { idempotencyKeySchema } from '@beneath-the-pine/contracts';

export type Principal = { id: string; email: string };
export function principal(request: Request): Principal {
  const value = (request as Request & { principal?: Principal }).principal;
  if (!value) throw new UnauthorizedException();
  return value;
}
export function body<T>(schema: ZodType<T>, request: Request): T {
  const result = schema.safeParse(request.body);
  if (!result.success) throw new BadRequestException();
  return result.data;
}
export function idempotencyKey(request: Request): string {
  const result = idempotencyKeySchema.safeParse(request.get('Idempotency-Key'));
  if (!result.success) throw new BadRequestException();
  return result.data;
}
export function validTimezone(value: string): boolean {
  try { new Intl.DateTimeFormat('en-US', { timeZone: value }); return true; } catch { return false; }
}
