import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import type { LogLevel } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { API_CONFIG, ApiConfig, ConfigError, readApiConfig } from './platform/config/api-config';
import { configureHttp } from './platform/http/configure-http';

async function main() {
  loadEnv({ path: resolve(__dirname, '../.env'), quiet: true });
  const config = readApiConfig();
  const levels: Record<ApiConfig['API_LOG_LEVEL'], LogLevel[]> = {
    silent: [], error: ['error'], warn: ['error', 'warn'],
    info: ['error', 'warn', 'log'], debug: ['error', 'warn', 'log', 'debug'],
  };
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false, logger: levels[config.API_LOG_LEVEL] });
  configureHttp(app, app.get<ApiConfig>(API_CONFIG));
  app.enableShutdownHooks();
  await app.listen(config.API_PORT, config.API_HOST);
}

main().catch(error => {
  console.error(error instanceof ConfigError ? error.message : 'API scaffold startup failed. Check port and configuration.');
  process.exitCode = 1;
});
