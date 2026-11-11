import { z } from 'zod';

const integer = (min: number, max: number) => z.coerce.number().int().min(min).max(max);
const schema = z.object({
  API_HOST: z.union([z.ipv4(), z.ipv6()]).default('127.0.0.1'),
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
  API_ASSISTANCE_PROVIDER: z.enum(['disabled', 'openai', 'local', 'gemini', 'openrouter']).default('disabled'),
  OPENROUTER_API_KEY: z.string().trim().min(1).optional(),
  OPENROUTER_MODEL: z.literal('deepseek/deepseek-v4-flash-0731').default('deepseek/deepseek-v4-flash-0731'),
  GEMINI_API_KEY: z.string().trim().min(1).optional(),
  GEMINI_MODEL: z.string().regex(/^gemini-[a-z0-9.-]+$/).optional(),
  API_LOCAL_AI_URL: z.string().url().refine(value => {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/';
  }).optional(),
  API_LOCAL_AI_TOKEN: z.string().min(24).optional(),
  API_LOCAL_AI_MODEL: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().min(1).default('gpt-6-luna'),
});

export class ConfigError extends Error {
  constructor(fields: string[]) { super(`Invalid API configuration: ${[...new Set(fields)].join(', ')}`); }
}

export function readApiConfig(env: NodeJS.ProcessEnv = process.env) {
  const result = schema.safeParse(env);
  if (!result.success) throw new ConfigError(result.error.issues.map(issue => issue.path.join('.')));
  if (result.data.API_ASSISTANCE_PROVIDER === 'local') {
    const missing = (['API_LOCAL_AI_URL', 'API_LOCAL_AI_TOKEN', 'API_LOCAL_AI_MODEL'] as const).filter(key => !result.data[key]);
    if (missing.length) throw new ConfigError(missing);
  }
  if (result.data.API_ASSISTANCE_PROVIDER === 'gemini') {
    const missing = (['GEMINI_API_KEY', 'GEMINI_MODEL'] as const).filter(key => !result.data[key]);
    if (missing.length) throw new ConfigError(missing);
  }
  if (result.data.API_ASSISTANCE_PROVIDER === 'openrouter' && !result.data.OPENROUTER_API_KEY) throw new ConfigError(['OPENROUTER_API_KEY']);
  return Object.freeze(result.data);
}

export type ApiConfig = ReturnType<typeof readApiConfig>;
export const API_CONFIG = Symbol('API_CONFIG');
