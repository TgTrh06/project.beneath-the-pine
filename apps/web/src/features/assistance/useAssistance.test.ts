import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { AssistanceResponse } from '@pyneath/contracts';
import type { createHookHarness } from '../../tests/hookHarness';
const h = vi.hoisted(() => ({ hooks: null as ReturnType<typeof createHookHarness> | null,
  config: vi.fn(), request: vi.fn(), track: vi.fn() }));
vi.mock('react', async () => { const { createHookHarness } = await import('../../tests/hookHarness'); h.hooks = createHookHarness(); return h.hooks.react; });
vi.mock('../../shared/api/clients/assistance', () => ({ getAssistanceConfig: h.config, requestAssistance: h.request, recordAssistanceInteraction: h.track }));

beforeEach(() => {
  h.hooks?.reset(); vi.clearAllMocks(); vi.stubEnv('VITE_ASSISTANCE_DEMO', 'true');
  h.config.mockResolvedValue({ enabled: true, processing: 'self_hosted', capabilities: ['assisted_start', 'stuck_recovery'] });
  h.track.mockResolvedValue(undefined); vi.stubGlobal('requestAnimationFrame', (callback: () => void) => { callback(); return 1; });
});
afterEach(() => { h.hooks?.cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };
const suggestion: AssistanceResponse = { status: 'suggestion', suggestionId: 'f9194eb2-3b02-47da-97fe-9ac81a6095ca',
  output: { capability: 'stuck_recovery', version: '1', needsHumanSupport: false, recoveryAction: 'smaller_step', recoveryStep: 'Mở tài liệu giả.', fallback: 'manual_step' } };

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
  await render().ask(); render().dismiss(); expect(render().draft).toBe('');
  expect(h.track.mock.calls.at(-1)?.[0].action).toBe('discarded');
  h.request.mockResolvedValue({ ...suggestion, output: { capability: 'stuck_recovery', version: '1', needsHumanSupport: false, recoveryAction: 'take_break', breakMinutes: 2, fallback: 'take_break' } });
  await render().ask(); expect(onTakeBreak).not.toHaveBeenCalled();
  breakDisabled = true; render().takeBreak(); expect(onTakeBreak).not.toHaveBeenCalled();
  breakDisabled = false; render().takeBreak(); expect(onTakeBreak).toHaveBeenCalledTimes(1);
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
