import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof AppError) return reply.code(error.statusCode).send({ error: error.code, message: error.message });
    if (error instanceof ZodError) return reply.code(400).send({ error: "INVALID_REQUEST", message: "Dữ liệu gửi lên chưa hợp lệ." });
    return reply.code(500).send({ error: "INTERNAL_ERROR", message: "Đã có lỗi xảy ra. Hãy thử lại sau." });
  });
}
