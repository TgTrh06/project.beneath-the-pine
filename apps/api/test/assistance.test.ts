import 'reflect-metadata';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assistanceRequestSchema, assistanceResponseSchema } from '@beneath-the-pine/contracts';
import { safeProductMetadata } from '../src/modules/analytics/analytics.service';
import type { AnalyticsService } from '../src/modules/analytics/analytics.service';
import type { AssistanceProvider } from '../src/modules/assistance/assistance.provider';
import { OpenAiAssistanceProvider } from '../src/modules/assistance/assistance.provider';
import { AssistanceService } from '../src/modules/assistance/assistance.service';
import { readApiConfig } from '../src/platform/config/api-config';

const privateText = 'PRIVATE_INTENTION_AND_SEED_MARKER';

function fixture(provider: AssistanceProvider, enabled = true, quota = true) {
  const events: unknown[] = [];
  let reservations = 0;
  const analytics = {
    reserveAssistanceRequest: async () => { reservations++; return quota ? '00000000-0000-4000-8000-000000000001' : null; },
    ownsAssistanceRequest: async (accountId: string, id: string) => accountId === 'owner' && id === '00000000-0000-4000-8000-000000000001',
    record: async (_accountId: string, name: string, subjectId?: string, metadata?: unknown) => { events.push({ name, subjectId, metadata }); }
  } as unknown as AnalyticsService;
  const config = readApiConfig({ API_ASSISTANCE_PROVIDER: enabled ? 'openai' : 'disabled', OPENAI_API_KEY: enabled ? 'test-key' : undefined });
  return { service: new AssistanceService(config, provider, analytics), events, reservations: () => reservations };
}

test('assistance contract validates capability inputs and rejects private extra fields', () => {
  assert.equal(assistanceRequestSchema.safeParse({ capability: 'assisted_start', description: 'Mở tài liệu' }).success, true);
  assert.equal(assistanceRequestSchema.safeParse({ capability: 'open_seed_draft', context: 'Đọc lại đoạn đầu' }).success, true);
  assert.equal(assistanceRequestSchema.safeParse({ capability: 'assisted_start', description: 'x'.repeat(281) }).success, false);
  assert.equal(assistanceRequestSchema.safeParse({ capability: 'open_seed_draft', context: 'ghi chú', campId: 'foreign' }).success, false);
});

test('disabled provider keeps manual path usable without quota or model call', async () => {
  const provider: AssistanceProvider = { generate: async () => { throw new Error('must not call'); } };
  const { service, reservations } = fixture(provider, false);
  const result = await service.suggest('owner', { capability: 'assisted_start', description: privateText });
  assert.equal(result.status, 'fallback');
  assert.equal(reservations(), 0);
  assert.equal(JSON.stringify(result).includes(privateText), false);
});

test('start and Seed suggestions use the same validated response contract', async () => {
  const provider: AssistanceProvider = { generate: async input => input.capability === 'assisted_start'
    ? { kind: 'suggestion', text: 'Mở tài liệu và đọc một đoạn.', estimatedMinutes: 5 }
    : { kind: 'suggestion', text: 'Đọc lại đoạn vừa đánh dấu.' } };
  const { service } = fixture(provider);
  const start = await service.suggest('owner', { capability: 'assisted_start', description: privateText });
  const seed = await service.suggest('owner', { capability: 'open_seed_draft', context: privateText });
  assert.equal(start.status, 'suggestion');
  assert.equal(start.output.estimatedMinutes, 5);
  assert.equal(seed.status, 'suggestion');
  assert.equal(seed.output.openSeedDraft, 'Đọc lại đoạn vừa đánh dấu.');
  assert.equal(assistanceResponseSchema.safeParse(start).success, true);
  assert.equal(assistanceResponseSchema.safeParse(seed).success, true);
});

test('quota, invalid provider result and crisis cues return safe responses', async () => {
  const badProvider: AssistanceProvider = { generate: async () => ({ kind: 'suggestion', text: privateText.repeat(100), estimatedMinutes: 9 as 5 }) };
  const limited = fixture(badProvider, true, false);
  assert.equal((await limited.service.suggest('owner', { capability: 'assisted_start', description: 'Mở tài liệu' })).status, 'fallback');
  const invalid = fixture(badProvider);
  const result = await invalid.service.suggest('owner', { capability: 'assisted_start', description: 'Mở tài liệu' });
  assert.equal(result.status, 'fallback');
  assert.equal(JSON.stringify(result).includes(privateText), false);
  const boundary = await invalid.service.suggest('owner', { capability: 'assisted_start', description: 'Tôi muốn tự tử' });
  assert.equal(boundary.status, 'boundary');
  assert.equal(invalid.reservations(), 1);
});

test('interaction records and metadata never include prompt or suggestion text', async () => {
  const { service, events } = fixture({ generate: async () => ({ kind: 'boundary' }) });
  await service.interaction('owner', { capability: 'open_seed_draft', suggestionId: '00000000-0000-4000-8000-000000000001', action: 'edited' });
  await assert.rejects(service.interaction('other', { capability: 'open_seed_draft', suggestionId: '00000000-0000-4000-8000-000000000001', action: 'selected' }));
  await assert.rejects(service.interaction('other', { capability: 'open_seed_draft', suggestionId: '00000000-0000-4000-8000-000000000002', action: 'selected' }));
  assert.equal(JSON.stringify(events).includes(privateText), false);
  assert.deepEqual(safeProductMetadata('assistance_selected', { capability: 'assisted_start', prompt: privateText, suggestion: privateText }), { capability: 'assisted_start' });
  assert.deepEqual(safeProductMetadata('assistance_fallback', { capability: privateText }), {});
});

test('OpenAI adapter sends only explicit text with store disabled and validates moderation', async t => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ path: string; body: Record<string, unknown> }> = [];
  globalThis.fetch = async (input, init) => {
    const path = String(input);
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    requests.push({ path, body });
    if (path.endsWith('/moderations')) return Response.json({ results: [{ flagged: false }] });
    return Response.json({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ activationStep: 'Mở tài liệu và đọc đoạn đầu.', estimatedMinutes: 5 }) }] }] });
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const adapter = new OpenAiAssistanceProvider(readApiConfig({ OPENAI_API_KEY: 'test-key', OPENAI_MODEL: 'gpt-6-luna' }));
  const result = await adapter.generate({ capability: 'assisted_start', description: privateText });
  assert.deepEqual(result, { kind: 'suggestion', text: 'Mở tài liệu và đọc đoạn đầu.', estimatedMinutes: 5 });
  const generation = requests.find(request => request.path.endsWith('/responses'))?.body;
  assert.equal(generation?.store, false);
  assert.equal(generation?.model, 'gpt-6-luna');
  assert.equal(generation?.max_output_tokens, 256);
  assert.equal(JSON.stringify(generation).includes(privateText), true);
  assert.equal(requests.filter(request => request.path.endsWith('/moderations')).length, 2);
});

test('OpenAI adapter refuses unsafe or malformed generated output', async t => {
  const originalFetch = globalThis.fetch;
  let modelCalls = 0;
  globalThis.fetch = async (input) => {
    if (String(input).endsWith('/moderations')) return Response.json({ results: [{ flagged: false }] });
    modelCalls++;
    return Response.json({ output: [{ content: [{ type: 'output_text', text: JSON.stringify({ activationStep: '1. Bắt đầu\n2. Làm tiếp', estimatedMinutes: 5 }) }] }] });
  };
  t.after(() => { globalThis.fetch = originalFetch; });
  const adapter = new OpenAiAssistanceProvider(readApiConfig({ OPENAI_API_KEY: 'test-key' }));
  await assert.rejects(adapter.generate({ capability: 'assisted_start', description: 'Mở tài liệu' }));
  assert.equal(modelCalls, 1);
  assert.deepEqual(await adapter.generate({ capability: 'assisted_start', description: 'Tôi muốn tự tử' }), { kind: 'boundary' });
  assert.equal(modelCalls, 1);
});

test('OpenAI adapter aborts a stalled provider within the six-second budget', async t => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_input, init) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  });
  t.after(() => { globalThis.fetch = originalFetch; });
  const adapter = new OpenAiAssistanceProvider(readApiConfig({ OPENAI_API_KEY: 'test-key' }));
  const started = Date.now();
  await assert.rejects(adapter.generate({ capability: 'assisted_start', description: 'Mở tài liệu' }));
  assert.ok(Date.now() - started >= 5900);
  assert.ok(Date.now() - started < 10000);
});
