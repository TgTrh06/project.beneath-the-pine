import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configureApp } from './bootstrap';
import { readConfig } from './shared/config';

async function main() {
  loadEnv({ path: resolve(__dirname, '../../../.env'), quiet: true });
  const config = readConfig();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  configureApp(app, config);
  app.enableShutdownHooks();
  await app.listen(config.SERVER_PORT, '0.0.0.0');
}

main().catch(() => {
  // Never print environment values or connection URLs on startup failure.
  console.error('Core service startup failed. Check configuration and service dependencies.');
  process.exitCode = 1;
});
