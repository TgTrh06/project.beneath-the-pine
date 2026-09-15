import { z } from 'zod';

const integer = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const schema = z.object({
  API_HOST: z.string().ip().default('127.0.0.1'),
  API_PORT: integer(1, 65535).default(8081),
  API_WEB_ORIGIN: z.string().url().refine(value => {
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
    } catch { return false; }
  }).default('http://127.0.0.1:5173'),
  API_LOG_LEVEL: z.enum(['silent', 'error', 'warn', 'info', 'debug']).default('info'),
  API_DATABASE_URL: z.preprocess(value => value === '' ? undefined : value,
    z.string().url().refine(value => {
      try { return ['postgres:', 'postgresql:'].includes(new URL(value).protocol); }
      catch { return false; }
    }).optional()),
  API_DB_POOL_MAX: integer(1, 20).default(5),
  API_DB_TIMEOUT_MS: integer(100, 30000).default(3000),
});

export class ConfigError extends Error {
  constructor(fields: string[]) { super(`Invalid API configuration: ${[...new Set(fields)].join(', ')}`); }
}

export function readApiConfig(env: NodeJS.ProcessEnv = process.env) {
  const result = schema.safeParse(env);
  if (!result.success) throw new ConfigError(result.error.issues.map(issue => issue.path.join('.')));
  return Object.freeze(result.data);
}

export type ApiConfig = ReturnType<typeof readApiConfig>;
export const API_CONFIG = Symbol('API_CONFIG');
