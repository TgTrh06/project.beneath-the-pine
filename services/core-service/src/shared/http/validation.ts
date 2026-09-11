import { z } from 'zod';
import { AppError } from '../error/app-error';

export function parse<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new AppError('VALIDATION_FAILED', 'The request could not be processed.', 400,
      result.error.issues.map(issue => ({ field: issue.path.join('.'), code: 'INVALID' })));
  }
  return result.data;
}

export const uuid = z.string().uuid();
