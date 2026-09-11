import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import session from 'express-session';
import helmet from 'helmet';
import { randomUUID } from 'node:crypto';
import { AppConfig } from './shared/config';
import { ApiErrorFilter } from './shared/error/api-error.filter';
import { csrf } from './shared/security/session';

export function configureApp(app: NestExpressApplication, config: AppConfig): void {
  app.disable('x-powered-by');
  app.set('trust proxy', config.TRUST_PROXY_HOPS);
  app.use(helmet());
  app.use((request: Request, response: Response, next: NextFunction) => {
    const candidate = request.get('X-Request-ID');
    response.setHeader('X-Request-ID', candidate && /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/.test(candidate) ? candidate : randomUUID());
    response.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.enableCors({ origin: config.WEB_ORIGIN, credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Request-ID', 'X-XSRF-TOKEN'], exposedHeaders: ['X-Request-ID'] });
  app.useBodyParser('json', { limit: '32kb' });
  app.use(session({ name: 'BTP_SESSION', secret: config.SESSION_SECRET, resave: false, saveUninitialized: false,
    rolling: true, cookie: { path: '/', httpOnly: true, secure: config.SESSION_COOKIE_SECURE,
      sameSite: config.SESSION_COOKIE_SAME_SITE, maxAge: config.sessionMaxAge } }));
  app.use(csrf.csrfSynchronisedProtection);
  // Express middleware failures occur outside controller exception filters.
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const type = (error as { type?: string }).type;
    const status = error === csrf.invalidCsrfTokenError ? 403 : type === 'entity.parse.failed' ? 400 : type === 'entity.too.large' ? 413 : 500;
    response.status(status).json({
      code: status === 403 ? 'FORBIDDEN' : status === 400 ? 'MALFORMED_JSON' : status === 413 ? 'PAYLOAD_TOO_LARGE' : 'INTERNAL_ERROR',
      message: status === 403 ? 'Access is not allowed.' : status === 400 ? 'The request body is not valid JSON.' : 'The request could not be processed.',
      requestId: response.getHeader('X-Request-ID'), details: [],
    });
  });
  app.useGlobalFilters(new ApiErrorFilter());
}
