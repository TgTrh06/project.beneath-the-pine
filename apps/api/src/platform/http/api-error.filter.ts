import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';

const errors: Record<number, [string, string]> = {
  400: ['VALIDATION_FAILED', 'The request could not be processed.'],
  401: ['UNAUTHENTICATED', 'Authentication is required.'],
  403: ['FORBIDDEN', 'Access is not allowed.'],
  404: ['NOT_FOUND', 'The route was not found.'],
  413: ['PAYLOAD_TOO_LARGE', 'The request body is too large.'],
  503: ['SERVICE_UNAVAILABLE', 'The service is not ready.'],
};

export function safeError(status: number, requestId: unknown) {
  const [code, message] = errors[status] ?? ['INTERNAL_ERROR', 'The request could not be completed.'];
  return { code, message, requestId, details: [] };
}

@Catch()
export class ApiErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiErrorFilter.name);
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    const requestId = response.getHeader('X-Request-ID');
    if (status >= 500) this.logger.error({ event: 'request_failed', requestId, status });
    response.status(status).json(safeError(status, requestId));
  }
}
