import type { FastifyInstance, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    const details = safeRequestErrorDetails(request, error);
    app.log[details.statusCode >= 500 ? "error" : "warn"](details, "API request failed");
    if (error instanceof AppError) return reply.code(error.statusCode).send({ error: error.code, message: error.message });
    if (error instanceof ZodError) return reply.code(400).send({ error: "INVALID_REQUEST", message: "Dữ liệu gửi lên chưa hợp lệ." });
    return reply.code(500).send({ error: "INTERNAL_ERROR", message: "Đã có lỗi xảy ra. Hãy thử lại sau." });
  });
}

export function safeRequestErrorDetails(request: FastifyRequest, error: unknown) {
  const statusCode = error instanceof AppError ? error.statusCode : error instanceof ZodError ? 400 : 500;
  const code = error instanceof AppError ? error.code : error instanceof ZodError ? "INVALID_REQUEST" : "INTERNAL_ERROR";
  return {
    event: "api_request_failed",
    requestId: request.id,
    method: request.method,
    route: request.routeOptions.url ?? "unmatched_route",
    statusCode,
    code,
  };
}
