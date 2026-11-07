import { IdentityHttpAdapter } from '../src/modules/identity/presentation/identity-http.adapter';
import { assistanceConfiguration } from '../src/modules/assistance/infrastructure/assistance-configuration';
import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createServer } from 'node:http';
import { Test } from '@nestjs/testing';
import { APP_GUARD } from '@nestjs/core';
import request from 'supertest';
import { assistanceOutputSchema, assistanceRequestSchema, assistanceSystemPrompt } from '@pyneath/contracts';
import { readApiConfig } from '../src/platform/config/api-config';
import { LocalAssistanceProvider } from '../src/modules/assistance/infrastructure/local-assistance.provider';
import { AssistanceService } from '../src/modules/assistance/application/assistance.service';
import { AssistanceController } from '../src/modules/assistance/presentation/assistance.controller';
import { IdentityGuard } from '../src/modules/identity/presentation/identity.guard';
import { createIdentity } from './helpers/module-fixtures';
import type { Analytics } from '../src/modules/analytics/public-api';
import { safeProductMetadata } from '../src/modules/analytics/domain/event-policy';

const input = { capability: 'stuck_recovery', currentStep: 'Viết đoạn đầu', stuckMode: 'too_large' } as const;
const step = { capability: 'stuck_recovery', version: '1', needsHumanSupport: false, recoveryAction: 'smaller_step', recoveryStep: 'Viết một câu mô tả ý chính.', fallback: 'manual_step' } as const;
const pause = { capability: 'stuck_recovery', version: '1', needsHumanSupport: false, recoveryAction: 'take_break', breakMinutes: 2, fallback: 'take_break' } as const;
const token = 'local-fixture-token-not-a-real-secret';

test('recovery contract accepts step/break and rejects cross-task or extra fields', () => {
  assert.equal(assistanceRequestSchema.safeParse(input).success, true);
  for (const value of [step, pause]) assert.equal(assistanceOutputSchema.safeParse(value).success, true);
  for (const value of [{ ...step, breakMinutes: 2 }, { ...pause, recoveryStep: 'Extra' }, { ...pause, breakMinutes: 3 }, { ...step, estimatedMinutes: 3 }, { ...step, suggestionId: 'invented' }, { ...step, capability: 'assisted_start' }, { ...step, message: '' }]) {
    assert.equal(assistanceOutputSchema.safeParse(value).success, false);
  }
  assert.equal(assistanceRequestSchema.safeParse({ ...input, campId: 'foreign' }).success, false);
  assert.equal(assistanceRequestSchema.safeParse({ ...input, stuckMode: 'diagnosis' }).success, false);
});

test('local configuration is opt-in and never exposes secrets in errors', () => {
  assert.equal(readApiConfig({}).API_ASSISTANCE_PROVIDER, 'disabled');
  assert.throws(() => readApiConfig({ API_ASSISTANCE_PROVIDER: 'local' }), /API_LOCAL_AI/);
  assert.throws(() => readApiConfig({ API_LOCAL_AI_URL: 'https://secret:password@example.com' }), error => error instanceof Error && !error.message.includes('password'));
});

test('fake inference HTTP server: bounded response, strict policy, no external calls', async t => {
  let output: unknown = step;
  let code = 200;
  let raw: string | undefined;
  let requests = 0;
  const server = createServer(async (req, res) => {
    requests++;
    assert.equal(req.url, '/v1/chat/completions');
    assert.equal(req.headers.authorization, `Bearer ${token}`);
    let body = ''; for await (const chunk of req) body += chunk;
    const payload = JSON.parse(body);
    assert.equal(payload.messages[0].content, assistanceSystemPrompt);
    assert.deepEqual(JSON.parse(payload.messages[1].content), input);
    assert.equal(payload.max_tokens, 512);
    res.writeHead(code, { 'Content-Type': 'application/json' });
    res.end(raw ?? JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(output) } }] }));
  });
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const address = server.address(); if (!address || typeof address === 'string') throw new Error('Missing port');
  const config = readApiConfig({ API_ASSISTANCE_PROVIDER: 'local', API_LOCAL_AI_URL: `http://127.0.0.1:${address.port}`, API_LOCAL_AI_TOKEN: token, API_LOCAL_AI_MODEL: 'fixture-v2', API_LOG_LEVEL: 'silent' });
  const provider = new LocalAssistanceProvider(config);
  for (const valid of [step, pause]) { output = valid; assert.equal((await provider.generate(input)).kind, 'validated'); }
  output = { capability: 'stuck_recovery', version: '1', needsHumanSupport: true, message: 'Untrusted boundary copy', fallback: 'stop_and_return' };
  assert.deepEqual(await provider.generate(input), { kind: 'boundary' });
  for (const invalid of [{ ...step, capability: 'open_seed_draft' }, { ...step, recoveryStep: '1. Làm một việc\n2. Làm tiếp' }, { ...step, accountId: 'foreign' }]) { output = invalid; await assert.rejects(provider.generate(input)); }
  raw = 'not json'; await assert.rejects(provider.generate(input));
  raw = 'x'.repeat(33000); await assert.rejects(provider.generate(input));
  raw = undefined; code = 401; await assert.rejects(provider.generate(input));
  code = 503; await assert.rejects(provider.generate(input));
  assert.equal(requests, 10, 'each attempt makes exactly one local call');
});

test('local service normalizes boundary text and keeps quota/interaction metadata private', async () => {
  const config = readApiConfig({ API_ASSISTANCE_PROVIDER: 'local', API_LOCAL_AI_URL: 'http://127.0.0.1:8011', API_LOCAL_AI_TOKEN: token, API_LOCAL_AI_MODEL: 'fixture' });
  let reservations = 0;
  const analytics = { reserveAssistanceRequest: async () => { reservations++; return '00000000-0000-4000-8000-000000000001'; }, record: async () => {}, ownsAssistanceRequest: async () => false } as unknown as Analytics;
  const service = new AssistanceService(assistanceConfiguration(config), { generate: async () => ({ kind: 'validated', output: step }) }, analytics);
  assert.equal((await service.suggest('owner', input)).status, 'suggestion');
  assert.equal(reservations, 1);
  assert.deepEqual(service.configuration(), { enabled: true, processing: 'self_hosted', capabilities: ['assisted_start', 'open_seed_draft', 'stuck_recovery'] });
  const bad = new AssistanceService(assistanceConfiguration(config), { generate: async () => { throw new Error('PRIVATE_TEXT'); } }, analytics);
  assert.equal(JSON.stringify(await bad.suggest('owner', input)).includes('PRIVATE_TEXT'), false);
  const boundary = new AssistanceService(assistanceConfiguration(config), { generate: async () => ({ kind: 'validated', output: { capability: 'stuck_recovery', version: '1', needsHumanSupport: true, message: 'PRIVATE_TEXT', fallback: 'stop_and_return' } }) }, analytics);
  assert.equal(JSON.stringify(await boundary.suggest('owner', input)).includes('PRIVATE_TEXT'), false);
  assert.deepEqual(safeProductMetadata('assistance_selected', { capability: 'stuck_recovery', prompt: 'PRIVATE_TEXT' }), { capability: 'stuck_recovery' });
  await assert.rejects(service.interaction('outsider', { capability: 'stuck_recovery', suggestionId: '00000000-0000-4000-8000-000000000001', action: 'selected' }));
});

test('config endpoint uses identity guard and exposes only client-safe metadata', async t => {
  const module = await Test.createTestingModule({ controllers: [AssistanceController], providers: [
    { provide: AssistanceService, useValue: { configuration: () => ({ enabled: false, capabilities: [], processing: 'disabled' }) } },
    { provide: IdentityHttpAdapter, useValue: { session: async (req: { headers: Record<string, string> }) => req.headers.authorization === 'test-session' ? { account: { id: 'owner', email: 'test@example.test' } } : null } },
    { provide: APP_GUARD, useClass: IdentityGuard }
  ] }).compile();
  const app = module.createNestApplication({ logger: false }); await app.init(); t.after(() => app.close());
  await request(app.getHttpServer()).get('/api/v1/me/assistance/config').expect(401);
  const response = await request(app.getHttpServer()).get('/api/v1/me/assistance/config').set('Authorization', 'test-session').expect(200);
  assert.deepEqual(response.body, { enabled: false, capabilities: [], processing: 'disabled' });
});

test('local provider aborts stalled response without retry or hosted fallback', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (_url: unknown, init: RequestInit) => {
    calls++;
    return new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new Error('Aborted')), { once: true });
    });
  });
  const config = readApiConfig({ API_ASSISTANCE_PROVIDER: 'local', API_LOCAL_AI_URL: 'http://127.0.0.1:8011', API_LOCAL_AI_TOKEN: token, API_LOCAL_AI_MODEL: 'fixture', API_LOG_LEVEL: 'silent' });
  const start = performance.now();
  await assert.rejects(new LocalAssistanceProvider(config).generate(input));
  assert.equal(calls, 1);
  assert.ok(performance.now() - start < 7500);
});
