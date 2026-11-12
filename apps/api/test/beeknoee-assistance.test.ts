import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { type AssistanceRequest } from '@pyneath/contracts';
import { readApiConfig } from '../src/platform/config/api-config';
import { BeeknoeeAssistanceProvider } from '../src/modules/assistance/infrastructure/beeknoee-assistance.provider';
import { BeeknoeeHttpTransport } from '../src/modules/assistance/infrastructure/beeknoee-http';
import { assistanceConfiguration } from '../src/modules/assistance/infrastructure/assistance-configuration';
import { AssistanceService } from '../src/modules/assistance/application/assistance.service';
import type { Analytics } from '../src/modules/analytics/public-api';

const config = () => readApiConfig({ API_ASSISTANCE_PROVIDER: 'beeknoee', BEEKNOEE_API_KEY: 'fixture-not-a-key', API_LOG_LEVEL: 'silent' });
const input: AssistanceRequest = { capability: 'stuck_recovery', currentStep: 'Viết đoạn mô tả dự án', stuckMode: 'too_large' };
const step = { capability: 'stuck_recovery', version: '1', needsHumanSupport: false, fallback: 'manual_step', recoveryAction: 'smaller_step', recoveryStep: 'Viết một câu mô tả ý chính.' };
const completion = (output: unknown) => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(output) } }], usage: { prompt_tokens: 300, completion_tokens: 90, cost: 0.00004 } });
const provider = () => new BeeknoeeAssistanceProvider(config(), new BeeknoeeHttpTransport());

test('configured JSON modes are fixed per request, validated locally, and never negotiated by retries', async t => {
  for (const format of ['json_schema', 'json_object', 'prompt'] as const) {
    const cfg = readApiConfig({ API_ASSISTANCE_PROVIDER: 'beeknoee', BEEKNOEE_API_KEY: 'fixture', BEEKNOEE_RESPONSE_FORMAT: format, API_LOG_LEVEL: 'silent' });
    let calls = 0;
    t.mock.method(BeeknoeeHttpTransport.prototype, 'request', async (options: RequestInit) => {
      calls++; const body = JSON.parse(String(options.body));
      assert.equal(body.response_format?.type, format === 'prompt' ? undefined : format);
      assert.match(body.messages[0].content, /JSON object/);
      assert.match(body.messages[0].content, /additionalProperties/);
      return Response.json(completion(step));
    });
    const candidate = new BeeknoeeAssistanceProvider(cfg, new BeeknoeeHttpTransport());
    assert.equal((await candidate.generate(input)).kind, 'validated'); assert.equal(calls, 1);
    t.mock.restoreAll(); calls = 0;
    t.mock.method(BeeknoeeHttpTransport.prototype, 'request', async () => { calls++; return new Response('response_format not supported', { status: 400 }); });
    await assert.rejects(candidate.generate(input)); assert.equal(calls, 1); t.mock.restoreAll();
  }
});

test('Beeknoee needs its own key, allows only the two approved models, and exposes all three capabilities', () => {
  assert.equal(readApiConfig({}).API_ASSISTANCE_PROVIDER, 'disabled');
  assert.throws(() => readApiConfig({ API_ASSISTANCE_PROVIDER: 'beeknoee', OPENAI_API_KEY: 'private-fixture' }), error => error instanceof Error && !error.message.includes('private-fixture'));
  assert.throws(() => readApiConfig({ BEEKNOEE_MODEL: 'another/model' }));
  assert.equal(readApiConfig({ BEEKNOEE_MODEL: 'bee/gpt-6-luna' }).BEEKNOEE_MODEL, 'bee/gpt-6-luna');
  assert.throws(() => readApiConfig({ BEEKNOEE_RESPONSE_FORMAT: 'auto' }));
  assert.equal(config().BEEKNOEE_MODEL, 'bee/gpt-6-luna');
  assert.deepEqual(assistanceConfiguration(config()), { enabled: true, processing: 'external', capabilities: ['assisted_start', 'open_seed_draft', 'stuck_recovery'] });
});

test('each capability uses a single bounded JSON request, without OpenRouter-specific routing', async t => {
  for (const capability of ['assisted_start', 'open_seed_draft', 'stuck_recovery'] as const) {
    const request: AssistanceRequest = capability === 'assisted_start' ? { capability, description: 'Soạn mục tiêu báo cáo' } : capability === 'open_seed_draft' ? { capability, context: 'Đã viết mục tiêu, lần sau thêm phương pháp' } : input;
    const output = capability === 'assisted_start' ? { ...step, capability, recoveryAction: undefined, recoveryStep: undefined, activationStep: 'Mở tài liệu và viết một mục tiêu.', estimatedMinutes: 3 }
      : capability === 'open_seed_draft' ? { ...step, capability, recoveryAction: undefined, recoveryStep: undefined, openSeedDraft: 'Lần sau viết một câu về phương pháp.' } : step;
    let calls = 0;
    t.mock.method(BeeknoeeHttpTransport.prototype, 'request', async (options: RequestInit) => {
      calls++; const body = JSON.parse(String(options.body));
      assert.equal(new Headers(options.headers).get('Authorization'), 'Bearer fixture-not-a-key');
      assert.equal(body.model, 'bee/gpt-6-luna'); assert.equal(body.max_tokens, 512);
      assert.equal(body.reasoning, undefined);
      assert.equal(new Headers(options.headers).get('User-Agent'), 'Pyneath/0.1');
      assert.equal(body.provider, undefined);
      assert.equal(body.response_format.type, 'json_schema'); assert.equal(body.tools, undefined);
      const branches = body.response_format.json_schema.schema.anyOf;
      assert.ok(branches.every((branch: any) => branch.additionalProperties === false && branch.properties.capability.const === capability));
      assert.ok(branches.filter((branch: any) => branch.properties.message).every((branch: any) => !branch.properties.activationStep && !branch.properties.recoveryStep && !branch.properties.openSeedDraft));
      assert.equal(body.messages.length, 2); assert.equal(JSON.parse(body.messages[1].content).authorizedContext, undefined);
      return Response.json(completion(output));
    });
    assert.equal((await provider().generate(request)).kind, 'validated'); assert.equal(calls, 1); t.mock.restoreAll();
  }
});

test('only selected context is read once, included as untrusted data, without extra model calls', async t => {
  const reads: string[] = []; let calls = 0;
  t.mock.method(BeeknoeeHttpTransport.prototype, 'request', async (options: RequestInit) => {
    calls++; const body = JSON.parse(String(options.body));
    assert.deepEqual(JSON.parse(body.messages[1].content).authorizedContext, { get_my_open_seed: { text: 'Fictional approved seed' } });
    assert.equal(body.tools, undefined); return Response.json(completion(step));
  });
  assert.equal((await provider().generate(input, { names: ['get_my_open_seed'], read: async name => { reads.push(name); return { text: 'Fictional approved seed' }; } })).kind, 'validated');
  assert.deepEqual(reads, ['get_my_open_seed']); assert.equal(calls, 1);
});

test('context errors, oversized context, unknown and duplicate tools never reach the provider', async t => {
  let calls = 0; t.mock.method(BeeknoeeHttpTransport.prototype, 'request', async () => { calls++; throw new Error('unexpected call'); });
  await assert.rejects(provider().generate(input, { names: ['get_my_open_seed'], read: async () => { throw new Error('stale consent'); } }));
  await assert.rejects(provider().generate(input, { names: ['get_my_open_seed'], read: async () => 'x'.repeat(8193) }));
  await assert.rejects(provider().generate(input, { names: ['delete_account' as any], read: async () => { throw new Error('must not read'); } }));
  await assert.rejects(provider().generate(input, { names: ['get_my_open_seed', 'get_my_open_seed'], read: async () => null }));
  assert.equal(calls, 0);
});

test('errors, invalid JSON, schema violations, truncation, tool calls and oversized bodies fail without retry', async t => {
  const responses = [new Response('unauthorized', { status: 401 }), new Response('quota', { status: 429 }), new Response('down', { status: 503 }),
    new Response('x'.repeat(32769)), new Response('not json'), Response.json(completion({ ...step, accountId: 'invented' })),
    Response.json(completion({ ...step, capability: 'assisted_start' })), Response.json(completion({ ...step, recoveryStep: '- item\n- item' })),
    Response.json({ choices: [{ finish_reason: 'length', message: { content: '{}' } }] }),
    Response.json({ choices: [{ finish_reason: 'stop', message: { content: 'not json' } }] }),
    Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(step), tool_calls: [{}] } }] })];
  for (const response of responses) {
    let calls = 0; t.mock.method(BeeknoeeHttpTransport.prototype, 'request', async () => { calls++; return response; });
    await assert.rejects(provider().generate(input)); assert.equal(calls, 1); t.mock.restoreAll();
  }
});

test('provider refusal and sensitive context produce boundary without exposing provider messages', async t => {
  t.mock.method(BeeknoeeHttpTransport.prototype, 'request', async () => Response.json({ choices: [{ finish_reason: 'content_filter', message: { content: null, refusal: 'private provider detail' } }] }));
  assert.deepEqual(await provider().generate(input), { kind: 'boundary' }); t.mock.restoreAll();
  let calls = 0; t.mock.method(BeeknoeeHttpTransport.prototype, 'request', async () => { calls++; throw new Error('must not call'); });
  assert.deepEqual(await provider().generate(input, { names: ['get_my_open_seed'], read: async () => ({ text: 'Yêu cầu chẩn đoán' }) }), { kind: 'boundary' });
  assert.equal(calls, 0);
});

test('deadline includes an unresponsive provider and context reads; no late model call after abort', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let signal: AbortSignal | null | undefined, calls = 0;
  t.mock.method(BeeknoeeHttpTransport.prototype, 'request', async (options: RequestInit) => { calls++; signal = options.signal; return new Promise<Response>(() => {}); });
  const pending = provider().generate(input); t.mock.timers.tick(12001); await assert.rejects(pending, /deadline/); assert.equal(signal?.aborted, true);
  let release!: (value: unknown) => void;
  const waiting = provider().generate(input, { names: ['get_my_open_seed'], read: () => new Promise(resolve => { release = resolve; }) });
  t.mock.timers.tick(12001); await assert.rejects(waiting, /deadline/);
  release(null); await Promise.resolve(); await Promise.resolve(); assert.equal(calls, 1);
});

test('quota exhaustion and unavailable provider preserve the service fallback without raw errors', async t => {
  let calls = 0;
  t.mock.method(BeeknoeeHttpTransport.prototype, 'request', async () => { calls++; throw new Error('private provider detail'); });
  const analytics = { reserveAssistanceRequest: async () => null, record: async () => {} } as unknown as Analytics;
  const service = new AssistanceService(assistanceConfiguration(config()), provider(), analytics);
  assert.equal((await service.suggest('owner', input)).status, 'fallback'); assert.equal(calls, 0);
  analytics.reserveAssistanceRequest = async () => 'a96f77d6-070b-4425-a095-c8e3009d39eb';
  const result = await service.suggest('owner', input); assert.equal(result.status, 'fallback');
  assert.equal(JSON.stringify(result).includes('private provider detail'), false); assert.equal(calls, 1);
});
