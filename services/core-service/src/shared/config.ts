import { randomBytes } from 'node:crypto';
import { z } from 'zod';

const boolean = z.enum(['true', 'false']).transform(value => value === 'true');
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SERVER_PORT: z.coerce.number().int().min(1).max(65535).default(8080),
  DATABASE_URL: z.string().url().refine(value => /^postgres(ql)?:\/\//.test(value)).default('postgresql://localhost:54322/postgres'),
  DATABASE_USERNAME: z.string().optional(),
  DATABASE_PASSWORD: z.string().optional(),
  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),
  SESSION_SECRET: z.string().min(32).optional(),
  SESSION_TIMEOUT: z.string().regex(/^[1-9]\d*[smh]$/).default('30m'),
  SESSION_COOKIE_SECURE: boolean.default('false'),
  SESSION_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(10).default(0),
});

export function readConfig(env: NodeJS.ProcessEnv = process.env) {
  const result = schema.safeParse(env);
  if (!result.success) {
    throw new Error(`Invalid configuration: ${result.error.issues.map(issue => issue.path.join('.')).join(', ')}`);
  }
  const config = result.data;
  if (new URL(config.WEB_ORIGIN).origin !== config.WEB_ORIGIN) throw new Error('WEB_ORIGIN must be an exact origin');
  if (config.SESSION_COOKIE_SAME_SITE === 'none' && !config.SESSION_COOKIE_SECURE) {
    throw new Error('SameSite=None requires secure cookies');
  }
  // The approved foundation uses process-local sessions, just like its predecessor.
  if (config.NODE_ENV === 'production') {
    throw new Error('Production requires a reviewed persistent session store and authentication release gates; this foundation is local/test only');
  }
  const units: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000 };
  const sessionMaxAge = Number(config.SESSION_TIMEOUT.slice(0, -1)) * units[config.SESSION_TIMEOUT.slice(-1)];
  if (!Number.isSafeInteger(sessionMaxAge) || sessionMaxAge > 86_400_000) throw new Error('SESSION_TIMEOUT must not exceed 24h');
  return { ...config, SESSION_SECRET: config.SESSION_SECRET ?? randomBytes(32).toString('hex'), sessionMaxAge };
}

export type AppConfig = ReturnType<typeof readConfig>;
