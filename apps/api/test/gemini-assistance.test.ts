import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assistanceToolRequestSchema, type AssistanceRequest, type AssistanceToolName } from '@pyneath/contracts';
import { GeminiHttpTransport } from '../src/modules/assistance/infrastructure/gemini-http';
import { readApiConfig } from '../src/platform/config/api-config';
import { GeminiAssistanceProvider } from '../src/modules/assistance/infrastructure/gemini-assistance.provider';
import { AssistanceContext } from '../src/modules/assistance/infrastructure/assistance-context';
import { assistanceConfiguration } from '../src/modules/assistance/infrastructure/assistance-configuration';
import { AssistanceService } from '../src/modules/assistance/application/assistance.service';
import type { SeedAccess } from '../src/modules/seed/public-api';
import type { Analytics } from '../src/modules/analytics/public-api';

const config = () => readApiConfig({ API_ASSISTANCE_PROVIDER: 'gemini', GEMINI_API_KEY: 'fixture-key-not-real', GEMINI_MODEL: 'gemini-fixture', API_LOG_LEVEL: 'silent' });
const input: AssistanceRequest = { capability: 'stuck_recovery', currentStep: 'Viết đoạn giả lập', stuckMode: 'too_large' };
const step = { capability: 'stuck_recovery', version: '1', needsHumanSupport: false, fallback: 'manual_step', recoveryAction: 'smaller_step', recoveryStep: 'Viết một câu mô tả ý chính.' };
const completion = (output: unknown) => ({ candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text: JSON.stringify(output) }] } }] });
const toolReply = (names: string[], args: Record<string, unknown> = {}) => ({ candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: names.map(name => ({ functionCall: { name, args }, thoughtSignature: 'opaque-fixture-signature' })) } }] });

test('Gemini configuration is explicit and errors do not reveal keys; contracts reject excess grants', () => {
  assert.equal(readApiConfig({}).API_ASSISTANCE_PROVIDER, 'disabled');
  assert.throws(() => readApiConfig({ API_ASSISTANCE_PROVIDER: 'gemini', GEMINI_API_KEY: 'private-key' }), error => error instanceof Error && !error.message.includes('private-key'));
  assert.throws(() => readApiConfig({ GEMINI_MODEL: 'gemini-fixture/../../evil' }));
  assert.deepEqual(assistanceConfiguration(config()).capabilities, ['assisted_start', 'open_seed_draft', 'stuck_recovery']);
  const grant = { name: 'get_my_open_seed', consentToken: 'x' };
  for (const value of [{ request: input, grants: [grant, grant] }, { request: input, grants: [{ ...grant, accountId: 'other' }] }, { request: input, grants: [] }])
    assert.equal(assistanceToolRequestSchema.safeParse(value).success, false);
});

test('Gemini generates each capability with one bounded external request and no moderation/retry', async t => {
  for (const capability of ['assisted_start', 'open_seed_draft', 'stuck_recovery'] as const) {
    const request: AssistanceRequest = capability === 'assisted_start' ? { capability, description: 'Việc giả' } : capability === 'open_seed_draft' ? { capability, context: 'Điểm dừng giả' } : input;
    const output = capability === 'assisted_start' ? { ...step, capability, recoveryAction: undefined, recoveryStep: undefined, activationStep: 'Mở tài liệu.', estimatedMinutes: 3 }
      : capability === 'open_seed_draft' ? { ...step, capability, recoveryAction: undefined, recoveryStep: undefined, openSeedDraft: 'Lần sau đọc một đoạn.' } : step;
    let count = 0;
    t.mock.method(GeminiHttpTransport.prototype, 'request', async (url: string | URL | Request, options?: RequestInit) => {
      count++; assert.equal(String(url), 'https://generativelanguage.googleapis.com/v1beta/models/gemini-fixture:generateContent');
      assert.equal(new Headers(options?.headers).get('x-goog-api-key'), 'fixture-key-not-real');
      assert.equal(options?.redirect, 'error');
      const body = JSON.parse(String(options?.body)); assert.equal(body.generationConfig.responseMimeType, 'application/json');
      assert.equal(body.tools, undefined); assert.equal(body.contents.length, 1);
      return Response.json(completion(output));
    });
    const result = await new GeminiAssistanceProvider(config()).generate(request);
    assert.equal(result.kind, 'validated'); assert.equal(count, 1); t.mock.restoreAll();
  }
});

test('Gemini calls only approved tools once and preserves model thought signatures for second round', async t => {
  const bodies: Record<string, any>[] = []; const reads: string[] = [];
  t.mock.method(GeminiHttpTransport.prototype, 'request', async (_url: unknown, options: RequestInit) => {
    bodies.push(JSON.parse(String(options.body)));
    return Response.json(bodies.length === 1 ? toolReply(['get_my_open_seed', 'get_current_focus_context']) : completion(step));
  });
  const result = await new GeminiAssistanceProvider(config()).generate(input, {
    names: ['get_current_focus_context', 'get_my_open_seed'], read: async name => { reads.push(name); return name === 'get_my_open_seed' ? { text: 'Fictional approved seed' } : null; }
  });
  assert.equal(result.kind, 'validated'); assert.equal(bodies.length, 2); assert.equal(reads.length, 2);
  assert.equal(JSON.stringify(bodies[0]).includes('Fictional approved seed'), false);
  assert.equal(bodies[1].contents[1].parts[0].thoughtSignature, 'opaque-fixture-signature');
  assert.equal(bodies[1].tools, undefined);
  assert.equal(bodies[1].contents[2].parts[0].functionResponse.response.data.text, 'Fictional approved seed');
});

test('invalid, unconsented, duplicate or repeated tools fail closed without unauthorized reads', async t => {
  for (const [names, args] of [[['delete_account'], {}], [['get_my_open_seed'], { accountId: 'other' }], [['get_my_open_seed', 'get_my_open_seed'], {}], [['get_current_focus_context'], {}]] as [string[], Record<string, unknown>][]) {
    let reads = 0, calls = 0;
    t.mock.method(GeminiHttpTransport.prototype, 'request', async () => { calls++; return Response.json(toolReply(names, args)); });
    await assert.rejects(new GeminiAssistanceProvider(config()).generate(input, { names: ['get_my_open_seed'], read: async () => { reads++; return null; } }));
    assert.equal(reads, 0); assert.equal(calls, 1); t.mock.restoreAll();
  }
  let calls = 0, reads = 0;
  t.mock.method(GeminiHttpTransport.prototype, 'request', async () => { calls++; return Response.json(toolReply(['get_my_open_seed'])); });
  await assert.rejects(new GeminiAssistanceProvider(config()).generate(input, { names: ['get_my_open_seed'], read: async () => { reads++; return null; } }));
  assert.equal(calls, 2); assert.equal(reads, 1);
});

test('Gemini rejects errors, oversized bodies, truncated output, invalid JSON and wrong capability', async t => {
  const responses = [new Response('unauthorized', { status: 401 }), new Response('quota', { status: 429 }), new Response('down', { status: 503 }),
    new Response('x'.repeat(32769)), Response.json({ candidates: [{ finishReason: 'MAX_TOKENS' }] }),
    Response.json(completion({ ...step, accountId: 'invented' })), Response.json(completion({ ...step, capability: 'assisted_start' })),
    Response.json({ candidates: [{ finishReason: 'STOP', content: { role: 'model', parts: [{ text: 'not json' }] } }] })];
  for (const response of responses) {
    let calls = 0; t.mock.method(GeminiHttpTransport.prototype, 'request', async () => { calls++; return response; });
    await assert.rejects(new GeminiAssistanceProvider(config()).generate(input)); assert.equal(calls, 1); t.mock.restoreAll();
  }
  t.mock.method(GeminiHttpTransport.prototype, 'request', async () => { throw new Error('network fixture'); });
  await assert.rejects(new GeminiAssistanceProvider(config()).generate(input));
});

test('provider safety blocks map to backend boundary, never raw provider text', async t => {
  for (const response of [{ promptFeedback: { blockReason: 'SAFETY' } }, { candidates: [{ finishReason: 'SAFETY' }] }]) {
    t.mock.method(GeminiHttpTransport.prototype, 'request', async () => Response.json(response));
    assert.deepEqual(await new GeminiAssistanceProvider(config()).generate(input), { kind: 'boundary' }); t.mock.restoreAll();
  }
});

test('six-second direct deadline aborts even an unresponsive transport', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let signal: AbortSignal | null | undefined;
  t.mock.method(GeminiHttpTransport.prototype, 'request', async (_url: unknown, options: RequestInit) => { signal = options.signal; return new Promise<Response>(() => {}); });
  const promise = new GeminiAssistanceProvider(config()).generate(input);
  t.mock.timers.tick(6001); await assert.rejects(promise, /deadline/); assert.equal(signal?.aborted, true);
});

test('twelve-second tool deadline includes tool reads and never starts a late second model call', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0, release!: (data: unknown) => void, entered!: () => void;
  const reading = new Promise<void>(resolve => { entered = resolve; });
  t.mock.method(GeminiHttpTransport.prototype, 'request', async () => { calls++; return Response.json(toolReply(['get_my_open_seed'])); });
  const promise = new GeminiAssistanceProvider(config()).generate(input, { names: ['get_my_open_seed'], read: async () => {
    entered(); return new Promise(resolve => { release = resolve; });
  } });
  await reading; t.mock.timers.tick(12001); await assert.rejects(promise, /deadline/);
  release(null); await Promise.resolve(); await Promise.resolve(); assert.equal(calls, 1);
});

test('consent binds account, tool, contents, TTL and one read; preview does not mutate or expose IDs', async t => {
  let text = 'Fictional seed'; const accessed: string[] = [];
  const seeds = { get: async (id: string) => { accessed.push(id); return { id: 'private-id', accountId: id, text }; } } as unknown as SeedAccess;
  const context = new AssistanceContext({ readOwnContext: async () => null }, seeds);
  const preview = await context.preview('owner');
  assert.equal(JSON.stringify(preview).includes('private-id'), false);
  const seed = preview.tools.find(tool => tool.name === 'get_my_open_seed')!;
  const grants = [{ name: seed.name, consentToken: seed.consentToken }];
  await assert.rejects(context.authorize('other', grants));
  const session = await context.authorize('owner', grants);
  await assert.rejects(session.read('get_current_focus_context'));
  assert.deepEqual(await session.read('get_my_open_seed'), { text });
  await assert.rejects(session.read('get_my_open_seed'));
  text = 'Changed seed'; await assert.rejects(context.authorize('owner', grants));
  text = 'Fictional seed'; const next = await context.authorize('owner', grants);
  text = 'Changed after authorization'; await assert.rejects(next.read('get_my_open_seed'));
  text = 'Fictional seed'; t.mock.method(Date, 'now', () => Number(seed.consentToken.split('.')[0]) + 1);
  await assert.rejects(context.authorize('owner', grants));
  assert.ok(accessed.includes('owner'));
});

test('tools share existing quota and fallback without a provider call when consent is stale', async () => {
  let reserved = 0, generated = 0;
  const analytics = { reserveAssistanceRequest: async () => { reserved++; return 'a96f77d6-070b-4425-a095-c8e3009d39eb'; }, record: async () => {} } as unknown as Analytics;
  const context = { preview: async () => ({ tools: [] }), authorize: async () => { throw new Error('stale'); } };
  const service = new AssistanceService(assistanceConfiguration(config()), { generate: async () => { generated++; return { kind: 'validated', output: step as any }; } }, analytics, context);
  const response = await service.suggest('owner', input, [{ name: 'get_my_open_seed', consentToken: 'stale' }]);
  assert.equal(response.status, 'fallback'); assert.equal(generated, 0); assert.equal(reserved, 0);
  assert.equal((await service.suggest('owner', input)).status, 'suggestion'); assert.equal(reserved, 1); assert.equal(generated, 1);
});
