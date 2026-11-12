import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { AssistanceResponse } from '@pyneath/contracts';
import { ApiRequestError } from '../../shared/api/transport';
import type { createHookHarness } from '../../tests/hookHarness';
const h = vi.hoisted(() => ({ hooks: null as ReturnType<typeof createHookHarness> | null,
  config: vi.fn(), request: vi.fn(), track: vi.fn(), toolsConfig: vi.fn(), context: vi.fn(), toolsRequest: vi.fn() }));
vi.mock('react', async () => { const { createHookHarness } = await import('../../tests/hookHarness'); h.hooks = createHookHarness(); return h.hooks.react; });
vi.mock('../../shared/api/clients/assistance', () => ({ getAssistanceConfig: h.config, requestAssistance: h.request, recordAssistanceInteraction: h.track,
  getAssistanceToolsConfig: h.toolsConfig, getAssistanceContext: h.context, requestAssistanceWithTools: h.toolsRequest }));

beforeEach(() => {
  h.hooks?.reset(); vi.clearAllMocks(); vi.stubEnv('VITE_ASSISTANCE_DEMO', 'true');
  h.config.mockResolvedValue({ enabled: true, processing: 'self_hosted', capabilities: ['assisted_start', 'stuck_recovery'] });
  h.toolsConfig.mockResolvedValue({ enabled: false, provider: 'local', tools: [] });
  h.track.mockResolvedValue(undefined); vi.stubGlobal('requestAnimationFrame', (callback: () => void) => { callback(); return 1; });
});
afterEach(() => { h.hooks?.cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const suggestion: AssistanceResponse = { status: 'suggestion', suggestionId: 'f9194eb2-3b02-47da-97fe-9ac81a6095ca',
  output: { capability: 'stuck_recovery', version: '1', needsHumanSupport: false, recoveryAction: 'smaller_step', recoveryStep: 'Mở tài liệu giả.', fallback: 'manual_step' } };

it.each(['openrouter', 'beeknoee'])('%s previews locally, sends only selected grants, and ignores late results after consent changes', async provider => {
  const { useAssistance } = await import('./useAssistance');
  h.toolsConfig.mockResolvedValue({ enabled: true, provider, tools: ['get_current_focus_context', 'get_my_open_seed'] });
  h.context.mockResolvedValue({ tools: [
    { name: 'get_current_focus_context', data: null, consentToken: 'focus-consent' },
    { name: 'get_my_open_seed', data: { text: 'Fictional private seed' }, consentToken: 'seed-consent' }
  ] });
  const onChoose = vi.fn();
  const render = () => h.hooks!.render(() => useAssistance({ capability: 'stuck_recovery', value: 'Việc giả', onChoose }));
  render(); await flush(); await render().loadContext();
  expect(render().selectedTools).toEqual([]); expect(h.request).not.toHaveBeenCalled(); expect(h.toolsRequest).not.toHaveBeenCalled();
  h.request.mockResolvedValue(suggestion); await render().ask(); expect(h.request).toHaveBeenCalledTimes(1);
  render().toggleTool('get_my_open_seed', true); render();
  let resolve!: (value: AssistanceResponse) => void;
  h.toolsRequest.mockImplementation(() => new Promise<AssistanceResponse>(done => { resolve = done; }));
  const pending = render().ask();
  expect(h.toolsRequest.mock.calls[0][0]).toEqual({ request: { capability: 'stuck_recovery', currentStep: 'Việc giả', stuckMode: 'too_large' },
    grants: [{ name: 'get_my_open_seed', consentToken: 'seed-consent' }] });
  expect(JSON.stringify(h.toolsRequest.mock.calls)).not.toContain('Fictional private seed');
  render().toggleTool('get_my_open_seed', false); render(); resolve(suggestion); await pending;
  expect(render().visibleResult).toBeNull(); expect(onChoose).not.toHaveBeenCalled();
  render().toggleTool('get_my_open_seed', true); render(); await render().loadContext();
  expect(render().selectedTools).toEqual([]);
});

it('keeps manual input and direct assistance available if tools config or context fails', async () => {
  const { useAssistance } = await import('./useAssistance');
  h.toolsConfig.mockResolvedValue({ enabled: true, provider: 'gemini', tools: ['get_my_open_seed'] });
  h.context.mockRejectedValue(new Error('fixture unavailable')); h.request.mockResolvedValue(suggestion);
  const onChoose = vi.fn();
  const render = () => h.hooks!.render(() => useAssistance({ capability: 'stuck_recovery', value: 'Giữ nguyên bản nháp', onChoose }));
  render(); await flush(); await render().loadContext();
  expect(render().contextError).toContain('Chưa đọc'); expect(render().selectedTools).toEqual([]);
  await render().ask(); expect(h.request).toHaveBeenCalledTimes(1); expect(h.toolsRequest).not.toHaveBeenCalled();
  expect(onChoose).not.toHaveBeenCalled();
});

it('ignores an in-flight response after input/mode changes or unmount, and suppresses duplicate requests', async () => {
  const { useAssistance } = await import('./useAssistance');
  let resolve!: (value: AssistanceResponse) => void;
  h.request.mockImplementation(() => new Promise<AssistanceResponse>(done => { resolve = done; }));
  let value = 'Bản nháp một'; const onChoose = vi.fn();
  const render = () => h.hooks!.render(() => useAssistance({ capability: 'stuck_recovery', value, onChoose }));
  let coach = render(); await flush(); coach = render(); expect(coach.available).toBe(true);
  const waiting = coach.ask(); await coach.ask(); expect(h.request).toHaveBeenCalledTimes(1);
  value = 'Bản nháp hai'; coach = render(); coach.setMode('low_energy'); render();
  resolve(suggestion); await waiting; coach = render();
  expect(coach.visibleResult).toBeNull(); expect(coach.pending).toBe(false); expect(h.track).not.toHaveBeenCalled(); expect(onChoose).not.toHaveBeenCalled();
  const next = coach.ask(); h.hooks!.cleanup(); resolve(suggestion); await next;
  expect(h.track).not.toHaveBeenCalled(); expect(onChoose).not.toHaveBeenCalled();
});

it('allows editing, explicit selection and dismissal without saving or starting a break automatically', async () => {
  const { useAssistance } = await import('./useAssistance');
  h.request.mockResolvedValue(suggestion);
  const onChoose = vi.fn(), onTakeBreak = vi.fn(); let breakDisabled = false;
  const render = () => h.hooks!.render(() => useAssistance({ capability: 'stuck_recovery', value: 'Việc giả', onChoose, onTakeBreak, breakDisabled }));
  render(); await flush(); await render().ask();
  expect(onChoose).not.toHaveBeenCalled(); expect(onTakeBreak).not.toHaveBeenCalled();
  render().editDraft('  Bước đã sửa  '); render().editDraft('  Bước đã sửa lần hai  '); render().choose();
  expect(onChoose).toHaveBeenCalledExactlyOnceWith('Bước đã sửa lần hai'); expect(render().visibleResult).toBeNull();
  expect(h.track.mock.calls.map(([entry]) => entry.action)).toEqual(['viewed', 'edited', 'selected']);
  await render().ask(); render().setFeedbackReason('irrelevant'); render().dismiss(); expect(render().draft).toBe('');
  expect(h.track.mock.calls.at(-1)?.[0].action).toBe('discarded');
  expect(h.track.mock.calls.at(-1)?.[0].reason).toBe('irrelevant');
  h.request.mockResolvedValue({ ...suggestion, output: { capability: 'stuck_recovery', version: '1', needsHumanSupport: false, recoveryAction: 'take_break', breakMinutes: 2, fallback: 'take_break' } });
  await render().ask(); expect(onTakeBreak).not.toHaveBeenCalled();
  breakDisabled = true; render().takeBreak(); expect(onTakeBreak).not.toHaveBeenCalled();
  breakDisabled = false; render().takeBreak(); expect(onTakeBreak).toHaveBeenCalledTimes(1);
});

it('clears stale selected context after a fallback without changing manual text', async () => {
  const { useAssistance } = await import('./useAssistance');
  h.toolsConfig.mockResolvedValue({ enabled: true, provider: 'beeknoee', tools: ['get_my_open_seed'] });
  h.context.mockResolvedValue({ tools: [{ name: 'get_my_open_seed', data: { text: 'Seed giả' }, consentToken: 'fixture-grant' }] });
  h.toolsRequest.mockResolvedValue({ status: 'fallback', reason: 'context_expired',
    output: { capability: 'stuck_recovery', version: '1', needsHumanSupport: false,
      message: 'Chưa thể tạo gợi ý.', fallback: 'manual_step' } });
  const onChoose = vi.fn(), value = 'Nội dung thủ công';
  const render = () => h.hooks!.render(() => useAssistance({ capability: 'stuck_recovery', value, onChoose }));
  render(); await flush(); await render().loadContext(); render().toggleTool('get_my_open_seed', true); render();
  await render().ask();
  expect(render().selectedTools).toEqual([]); expect(render().context).toBeNull();
  expect(render().contextError).toContain('chọn lại'); expect(render().visibleResult).toBeNull();
  expect(onChoose).not.toHaveBeenCalled();
});

it('retains user input and the manual path on timeout, invalid schema and mismatched capability', async () => {
  const { useAssistance } = await import('./useAssistance'); const onChoose = vi.fn();
  const value = 'Bản nháp người dùng đang giữ';
  const render = () => h.hooks!.render(() => useAssistance({ capability: 'stuck_recovery', value, onChoose }));
  render(); await flush();
  for (const result of [null, { ...suggestion, output: { capability: 'assisted_start', version: '1', needsHumanSupport: false, activationStep: 'Bước giả', estimatedMinutes: 3, fallback: 'manual_step' } }]) {
    h.request.mockResolvedValue(result); await render().ask(); expect(render().error).toContain('vẫn ở đây'); expect(render().visibleResult).toBeNull();
  }
  h.request.mockRejectedValue(new Error('fixture timeout')); await render().ask();
  expect(render().pending).toBe(false); expect(render().error).toContain('vẫn ở đây'); expect(onChoose).not.toHaveBeenCalled(); expect(h.track).not.toHaveBeenCalled();
});

it('explains a connection failure and never retries automatically', async () => {
  const { useAssistance } = await import('./useAssistance');
  h.request.mockRejectedValue(new ApiRequestError('Không thể kết nối API.'));
  const onChoose = vi.fn();
  const render = () => h.hooks!.render(() => useAssistance({ capability: 'stuck_recovery', value: 'Việc giả đang nhập', onChoose }));
  render(); await flush(); await render().ask();
  expect(render().error).toContain('kiểm tra kết nối');
  expect(h.request).toHaveBeenCalledTimes(1); expect(onChoose).not.toHaveBeenCalled();
});
