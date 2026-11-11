import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('Pyneath Assistance demo controls', () => {
  it('are absent by default so the manual Solo and Seed forms remain available', async () => {
    vi.stubEnv('VITE_ASSISTANCE_DEMO', 'false');
    const { AssistanceCoach } = await import('./AssistanceCoach');
    expect(renderToStaticMarkup(<AssistanceCoach capability="assisted_start" value="Mở tài liệu" onChoose={() => {}} />)).toBe('');
  });

  it('waits for runtime capability config before rendering an AI control', async () => {
    vi.stubEnv('VITE_ASSISTANCE_DEMO', 'true');
    const { AssistanceCoach } = await import('./AssistanceCoach');
    const start = renderToStaticMarkup(<AssistanceCoach capability="assisted_start" value="Mở tài liệu giả" onChoose={() => {}} />);
    const emptySeed = renderToStaticMarkup(<AssistanceCoach capability="open_seed_draft" value="" onChoose={() => {}} />);
    expect(start).toBe('');
    expect(emptySeed).toBe('');
  });

  it('uses the selected mode in recovery requests and discloses the actual processor', async () => {
    const { makeAssistanceRequest, assistanceDisclosure } = await import('./assistanceState');
    expect(makeAssistanceRequest('stuck_recovery', '  Mở tài liệu  ', 'low_energy')).toEqual({ capability: 'stuck_recovery', currentStep: 'Mở tài liệu', stuckMode: 'low_energy' });
    expect(assistanceDisclosure('self_hosted')).toContain('máy chủ Pyneath');
    expect(assistanceDisclosure('self_hosted')).not.toContain('OpenAI');
    expect(assistanceDisclosure('external')).not.toContain('OpenAI');
    expect(assistanceDisclosure('external', 'gemini')).toContain('Google Gemini');
    expect(assistanceDisclosure('external', 'gemini')).toContain('free tier');
    expect(assistanceDisclosure('external', 'openrouter')).toContain('OpenRouter');
    expect(assistanceDisclosure('external', 'openrouter')).toContain('DeepSeek');
    expect(assistanceDisclosure('external', 'openrouter')).not.toContain('Gemini');
  });
});
