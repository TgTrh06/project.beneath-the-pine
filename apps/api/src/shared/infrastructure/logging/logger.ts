import pino from "pino";
import { env } from "../../../env.js";

export const loggerOptions = {
  level: env.LOG_LEVEL,
  base: undefined,
  transport: env.NODE_ENV === "development"
    ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname", singleLine: false } }
    : undefined,
};

export const logger = pino(loggerOptions);
