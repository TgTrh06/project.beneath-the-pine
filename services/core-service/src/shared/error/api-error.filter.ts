import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { AppError } from './app-error';

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorFilter.name);

  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const requestId = response.getHeader('X-Request-ID');
    const known = error instanceof AppError ? error : undefined;
    const frameworkStatus = error instanceof HttpException ? error.getStatus() : 500;
    const status = known?.status ?? frameworkStatus;
    if (status >= 500) {
      // Exception messages/stacks can contain SQL values, credentials or request bodies.
      this.logger.error({ event: 'request_failed', requestId, status });
    }
    response.status(status).json({
      code: known?.code ?? (status === 404 ? 'NOT_FOUND' : 'INTERNAL_ERROR'),
      message: known?.message ?? (status === 404 ? 'The route was not found.' : 'The request could not be completed.'),
      requestId,
      details: known?.details ?? [],
    });
  }
}
