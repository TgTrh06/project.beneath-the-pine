import cors from "@fastify/cors";
import Fastify from "fastify";
import { env } from "./env.js";
import { registerApiRoutes } from "./presentation/registerApiRoutes.js";
import { registerErrorHandler } from "./shared/presentation/registerErrorHandler.js";

export async function createApp() {
  const app = Fastify({ logger: false });
  await app.register(cors, { origin: env.WEB_ORIGIN, credentials: true });
  registerErrorHandler(app);
  await registerApiRoutes(app);
  return app;
}
