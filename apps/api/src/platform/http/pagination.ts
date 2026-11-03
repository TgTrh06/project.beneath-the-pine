import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { idSchema, utcDateTimeSchema } from '@pyneath/contracts';

const cursorSchema = z.object({ time: utcDateTimeSchema, id: idSchema, scope: z.string() }).strict();
export function decodeCursor(cursor: string | undefined, scope: string) {
  if (!cursor) return undefined;
  try {
    const value = cursorSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString()));
    if (value.scope !== scope) throw new Error();
    return {
      time: new Date(value.time),
      id: value.id
    };
  }
  catch {
    throw new BadRequestException('Invalid pagination cursor');
  }
}
export function encodeCursor(time: Date, id: string, scope: string) {
  return Buffer.from(JSON.stringify({ time: time.toISOString(), id, scope })).toString('base64url');
}
