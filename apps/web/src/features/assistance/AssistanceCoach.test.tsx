import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

describe('Pyneath Assistance demo controls', () => {
  it('are absent by default so the manual Solo and Seed forms remain available', async () => {
    vi.stubEnv('VITE_ASSISTANCE_DEMO', 'false');
    const { AssistanceCoach } = await import('./AssistanceCoach');
    expect(renderToStaticMarkup(<AssistanceCoach capability="assisted_start" value="Mở tài liệu" onChoose={() => {}} />)).toBe('');
  });

  it('discloses the external processor before an explicit request and limits blank input', async () => {
    vi.stubEnv('VITE_ASSISTANCE_DEMO', 'true');
    const { AssistanceCoach } = await import('./AssistanceCoach');
    const start = renderToStaticMarkup(<AssistanceCoach capability="assisted_start" value="Mở tài liệu giả" onChoose={() => {}} />);
    const emptySeed = renderToStaticMarkup(<AssistanceCoach capability="open_seed_draft" value="" onChoose={() => {}} />);
    expect(start).toContain('gửi nội dung vừa nhập tới OpenAI');
    expect(start).toContain('chỉ nhập dữ liệu giả');
    expect(start).toContain('Gợi ý một bước 3–10 phút');
    expect(emptySeed).toContain('Gợi ý câu quay lại');
    expect(emptySeed).toContain('disabled');
  });
});
