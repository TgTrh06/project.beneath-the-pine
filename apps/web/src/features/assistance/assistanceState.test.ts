import { expect, it } from 'vitest';
import { assistanceResponseSchema } from '@pyneath/contracts';
import { assistanceReducer, initialAssistanceState, makeAssistanceRequest, visibleAssistanceResult } from './assistanceState';

const response = assistanceResponseSchema.parse({ status: 'suggestion', suggestionId: 'f9194eb2-3b02-47da-97fe-9ac81a6095ca',
  output: { capability: 'stuck_recovery', version: '1', needsHumanSupport: false, recoveryAction: 'smaller_step', recoveryStep: 'Mở tài liệu giả lập.', fallback: 'manual_step' } });

it('rejects old responses and errors after the input or stuck mode changes', () => {
  const waiting = assistanceReducer(initialAssistanceState, { type: 'request' });
  expect(assistanceReducer(waiting, { type: 'response', response, sentRevision: 1, currentRevision: 2 })).toBe(waiting);
  expect(assistanceReducer(waiting, { type: 'failure', sentRevision: 1, currentRevision: 2 })).toBe(waiting);
  const received = assistanceReducer(waiting, { type: 'response', response, sentRevision: 2, currentRevision: 2 });
  expect(visibleAssistanceResult(received, 2)).toBe(response);
  expect(visibleAssistanceResult(received, 3)).toBeNull();
  expect(makeAssistanceRequest('stuck_recovery', 'same input', 'too_large')).not.toEqual(makeAssistanceRequest('stuck_recovery', 'same input', 'low_energy'));
});

it('keeps the edited draft through a failed request until explicitly discarded', () => {
  let state = assistanceReducer(initialAssistanceState, { type: 'response', response, sentRevision: 0, currentRevision: 0 });
  state = assistanceReducer(state, { type: 'edit', draft: 'Bản nháp đã sửa' });
  state = assistanceReducer(state, { type: 'request' });
  state = assistanceReducer(state, { type: 'failure', sentRevision: 0, currentRevision: 0 });
  state = assistanceReducer(state, { type: 'settled' });
  expect(state).toMatchObject({ pending: false, draft: 'Bản nháp đã sửa', result: null });
  expect(state.error).toContain('vẫn ở đây');
  expect(assistanceReducer(state, { type: 'dismiss' }).draft).toBe('');
});

it('represents break and boundary responses without producing an application command', () => {
  const takeBreak = assistanceResponseSchema.parse({ ...response, output: { capability: 'stuck_recovery', version: '1', needsHumanSupport: false, recoveryAction: 'take_break', breakMinutes: 2, fallback: 'take_break' } });
  const state = assistanceReducer(initialAssistanceState, { type: 'response', response: takeBreak, sentRevision: 0, currentRevision: 0 });
  expect(state.draft).toBe(''); expect(state.result).toBe(takeBreak);
  const boundary = assistanceResponseSchema.parse({ status: 'boundary', output: { capability: 'stuck_recovery', version: '1', needsHumanSupport: true, message: 'Thông báo cố định của backend.', fallback: 'stop_and_return' } });
  expect(assistanceReducer(state, { type: 'response', response: boundary, sentRevision: 0, currentRevision: 0 }).result).toBe(boundary);
  expect(assistanceReducer(state, { type: 'choose' }).result).toBeNull();
});
