import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import helmet from 'helmet';
import type { ApiConfig } from '../config/api-config';
import { ApiErrorFilter, safeError } from './api-error.filter';

export function configureHttp(app: NestExpressApplication, config: ApiConfig): void {
  app.disable('x-powered-by');
  app.use(helmet());
  app.use((_request: Request, response: Response, next: NextFunction) => {
    // Generate at the server boundary, so untrusted input never reaches logs.
    response.setHeader('X-Request-ID', randomUUID());
    response.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.enableCors({ origin: config.API_WEB_ORIGIN, credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-XSRF-TOKEN', 'X-Request-ID'],
    exposedHeaders: ['X-Request-ID'] });
  app.useBodyParser('json', { limit: '32kb' });
  app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
    const type = (error as { type?: string }).type;
    const status = type === 'entity.parse.failed' ? 400 : type === 'entity.too.large' ? 413 : 500;
    response.status(status).json(safeError(status, response.getHeader('X-Request-ID')));
  });
  app.useGlobalFilters(new ApiErrorFilter());
}
