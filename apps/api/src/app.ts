import cors from "@fastify/cors";
import Fastify from "fastify";
import { env, getEnvDiagnostics } from "./env.js";
import { registerApiRoutes } from "./presentation/registerApiRoutes.js";
import { loggerOptions } from "./shared/infrastructure/logging/logger.js";
import { registerErrorHandler } from "./shared/presentation/registerErrorHandler.js";

export async function createApp() {
  const app = Fastify({ logger: env.NODE_ENV === "test" ? false : loggerOptions });
  for (const diagnostic of getEnvDiagnostics()) {
    app.log[diagnostic.level]({ event: "backend_env_diagnostic", code: diagnostic.code, missing: diagnostic.missing }, diagnostic.message);
  }
  await app.register(cors, { origin: env.WEB_ORIGIN, credentials: true });
  registerErrorHandler(app);
  await registerApiRoutes(app);
  return app;
}
