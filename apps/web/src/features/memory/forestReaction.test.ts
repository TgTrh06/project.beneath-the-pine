import { describe, expect, it } from 'vitest';
import type { ForestThreshold } from '@pyneath/contracts';
import { forestReactionDuration, forestReactionReducer as reduce, forestReactions, initialForestReaction } from './forestReaction';
import { resolveMartenPose } from '../camps/scene/martenPoses';

const arrival = (threshold: ForestThreshold = 1, now = 100) => ({
  type: 'arrival' as const, milestone: { threshold, sourceSessionId: `session-${threshold}`, recordedAt: '2026-11-03T00:00:00Z' },
  now, visible: true, hasBaseline: true, fresh: true,
});
const enabled = () => reduce(initialForestReaction, { type: 'availability', allowed: true });

describe('one-time forest companion reaction', () => {
  it('uses the existing explicit pose instead of the ambient cycle during each reaction', () => {
    for (const threshold of [1, 3, 7] as const) {
      const { pose } = forestReactions[threshold];
      expect(resolveMartenPose(pose, false, false, true, 130)).toBe(pose);
      const state = reduce(enabled(), arrival(threshold));
      expect(state.active?.threshold).toBe(threshold);
      expect(state.active?.expiresAt).toBe(100 + forestReactionDuration);
    }
  });
  it('does not extend or replay an arrival after duplicate refreshes or expiration', () => {
    const started = reduce(enabled(), arrival());
    expect(reduce(started, arrival(1, 2000))).toBe(started);
    const ended = reduce(started, { type: 'expire', id: started.active!.id });
    expect(ended.active).toBeNull();
    expect(reduce(ended, arrival(1, 9000))).toBe(ended);
  });
  it('consumes arrivals in a session, static scene or disabled-motion surface without queuing them', () => {
    const missed = reduce(initialForestReaction, arrival());
    expect(missed.active).toBeNull();
    const later = reduce(missed, { type: 'availability', allowed: true });
    expect(reduce(later, arrival(1, 3000)).active).toBeNull();
    expect(reduce(later, arrival(3, 4000)).active?.threshold).toBe(3);
  });
  it('rejects hidden-tab arrivals even before the visibility listener updates the surface', () => {
    const hidden = reduce(enabled(), { ...arrival(), visible: false });
    expect(hidden.active).toBeNull();
    expect(reduce(hidden, arrival(1, 5000)).active).toBeNull();
  });
  it('does not celebrate historical progress before a baseline has loaded', () => {
    const historical = reduce(enabled(), { ...arrival(), hasBaseline: false });
    expect(historical.active).toBeNull();
    expect(reduce(historical, arrival(1, 5000)).active).toBeNull();
  });
  it('keeps delayed or retried responses from starting an out-of-context reaction', () => {
    const late = reduce(enabled(), { ...arrival(), fresh: false });
    expect(late.active).toBeNull();
    expect(reduce(late, arrival(1, 5000)).active).toBeNull();
  });
  it('ends on route exit, reduced motion, context loss or hiding, without replay on return', () => {
    const started = reduce(enabled(), arrival());
    const unavailable = reduce(started, { type: 'availability', allowed: false });
    expect(unavailable.active).toBeNull();
    const returned = reduce(unavailable, { type: 'availability', allowed: true });
    expect(reduce(returned, arrival(1, 200)).active).toBeNull();
  });
  it('ignores an old timeout when a later milestone is active', () => {
    const first = reduce(enabled(), arrival());
    const third = reduce(first, arrival(3, 500));
    expect(reduce(third, { type: 'expire', id: first.active!.id })).toBe(third);
  });
  it('keeps a repeated completion observation but cancels for another session or dismissal', () => {
    const started = reduce(enabled(), arrival());
    expect(reduce(started, { type: 'cancel', sourceSessionId: 'session-1' })).toBe(started);
    expect(reduce(started, { type: 'cancel', sourceSessionId: 'another-session' }).active).toBeNull();
    const dismissed = reduce(started, { type: 'cancel' });
    expect(reduce(dismissed, arrival(1, 5000)).active).toBeNull();
  });
  it('keeps account state separate and bounds consumed markers to the three milestones', () => {
    let first = enabled();
    for (let i = 0; i < 100; i++) for (const threshold of [1, 3, 7] as const) first = reduce(first, arrival(threshold, i));
    expect(first.seen).toEqual([1, 3, 7]);
    expect(initialForestReaction.seen).toEqual([]);
    expect(reduce(enabled(), arrival()).active?.threshold).toBe(1);
  });
});
