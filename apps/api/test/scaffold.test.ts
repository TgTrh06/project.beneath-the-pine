import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Controller, Get, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ModulesContainer } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { API_CONFIG, readApiConfig } from '../src/platform/config/api-config';
import { DatabaseService } from '../src/platform/database/database.service';
import { configureHttp } from '../src/platform/http/configure-http';
import { Public } from '../src/platform/security/public.decorator';

@Controller('test-only')
class ProbeController {
  @Get('protected')
  protected() { return { shouldNeverReach: true }; }
  @Post('protected')
  mutation() { return { shouldNeverReach: true }; }
  @Public()
  @Get('failure')
  failure() { throw new Error('private-database-url-and-password'); }
}

test('application composition, HTTP foundation and fail-closed access', async t => {
  const config = readApiConfig({});
  const module = await Test.createTestingModule({ imports: [AppModule], controllers: [ProbeController] })
    .overrideProvider(API_CONFIG).useValue(config).compile();
  const app = module.createNestApplication<NestExpressApplication>({ logger: false, bodyParser: false });
  configureHttp(app, config);
  await app.init();
  t.after(() => app.close());
  const server = app.getHttpServer();
  await t.test('all 12 modules compose; only Identity exposes account routes', async () => {
    const expected = ['Identity', 'Profile', 'Consent', 'Task', 'Focus', 'Capture', 'Engagement', 'Reflection', 'Habit', 'Analytics', 'Privacy', 'Access'].map(name => `${name}Module`);
    const names = [...app.get(ModulesContainer).values()].map(module => module.metatype.name);
    for (const name of expected) assert.ok(names.includes(name), `${name} missing`);
    assert.ok(!names.includes('AiModule'));
    for (const route of ['/api/v1/tasks', '/api/v1/captures']) {
      const response = await request(server).get(route).expect(404);
      assert.equal(response.body.code, 'NOT_FOUND');
    }
    await request(server).get('/api/v1/auth/session').expect(503);
  });
  await t.test('liveness works without DB and readiness reports unavailable truthfully', async () => {
    const response = await request(server).get('/health/live').expect(200);
    assert.equal(response.body.stage, 'scaffold');
    assert.equal(response.headers['cache-control'], 'no-store');
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.match(response.headers['x-request-id'], /^[0-9a-f-]{36}$/);
    const notReady = await request(server).get('/health/ready').expect(503);
    assert.equal(notReady.body.code, 'SERVICE_UNAVAILABLE');
    assert.equal(notReady.body.requestId, notReady.headers['x-request-id']);
  });
  await t.test('private routes reject absent or forged credentials', async () => {
    for (const headers of [{}, { Authorization: 'Bearer fabricated', Cookie: 'BTP_SESSION=fabricated', 'X-User-ID': 'owner' }]) {
      const response = await request(server).get('/test-only/protected').set(headers).expect(401);
      assert.equal(response.body.code, 'UNAUTHENTICATED');
      assert.ok(!JSON.stringify(response.body).includes('shouldNeverReach'));
    }
    await request(server).post('/test-only/protected').send({ userId: 'owner' }).expect(401);
  });
  await t.test('malformed and oversized JSON use safe error envelopes', async () => {
    const invalid = await request(server).post('/test-only/protected').set('Content-Type', 'application/json').send('{"secret":').expect(400);
    assert.equal(invalid.body.code, 'VALIDATION_FAILED');
    assert.ok(!JSON.stringify(invalid.body).includes('secret'));
    await request(server).post('/test-only/protected').send({ content: 'x'.repeat(40000) }).expect(413);
  });
  await t.test('unexpected errors redact private exception details', async () => {
    const response = await request(server).get('/test-only/failure').expect(500);
    assert.equal(response.body.code, 'INTERNAL_ERROR');
    assert.ok(!JSON.stringify(response.body).includes('private-database'));
  });
  await t.test('CORS uses the configured origin and does not reflect arbitrary origins', async () => {
    const allowed = await request(server).options('/health/live').set('Origin', config.API_WEB_ORIGIN)
      .set('Access-Control-Request-Method', 'GET').expect(204);
    assert.equal(allowed.headers['access-control-allow-origin'], config.API_WEB_ORIGIN);
    const denied = await request(server).get('/health/live').set('Origin', 'https://other.example').expect(200);
    assert.notEqual(denied.headers['access-control-allow-origin'], 'https://other.example');
  });
});

test('readiness success reports connectivity only with an injected reachable database', async t => {
  const config = readApiConfig({});
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(API_CONFIG).useValue(config)
    .overrideProvider(DatabaseService).useValue({ isReachable: async () => true }).compile();
  const app = module.createNestApplication<NestExpressApplication>({ logger: false, bodyParser: false });
  configureHttp(app, config);
  await app.init();
  t.after(() => app.close());
  await request(app.getHttpServer()).get('/health/ready').expect(200, {
    status: 'UP', service: 'core-api', stage: 'scaffold', checks: { database: 'UP' },
  });
});
