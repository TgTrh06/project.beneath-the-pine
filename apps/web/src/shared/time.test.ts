import { describe, expect, it } from 'vitest';
import { formatTimeWithOffset, localToIso } from './time';

describe('scheduled Pact time across daylight-saving changes', () => {
  it('shows the offset for the two repeated local times', () => {
    const first = formatTimeWithOffset('2026-11-01T05:30:00.000Z', 'America/New_York');
    const second = formatTimeWithOffset('2026-11-01T06:30:00.000Z', 'America/New_York');
    expect(first).toContain('01:30');
    expect(second).toContain('01:30');
    expect(first).toContain('GMT-4');
    expect(second).toContain('GMT-5');
  });

  it('rejects a local time skipped by the spring transition', () => {
    expect(localToIso('2026-03-08T02:30', 'America/New_York')).toBeNull();
    expect(formatTimeWithOffset('2026-03-08T07:30:00.000Z', 'America/New_York')).toContain('GMT-4');
  });
});
