import type { ForestThreshold, PersonalMilestone } from '@pyneath/contracts';
import type { MartenPose } from '../camps/scene/martenPoses';
import type { MartenAction } from '../camps/scene/forestActivity';

export const forestReactionDuration = 3600;
export const forestReactions: Record<ForestThreshold, { pose: MartenPose; action: MartenAction }> = {
  1: { pose: 'look-back', action: 'look' },
  3: { pose: 'stand', action: 'sniff' },
  7: { pose: 'stretch', action: 'stretch' },
};
export type ForestReaction = { id: string; sourceSessionId: string; threshold: ForestThreshold; expiresAt: number };
type State = { allowed: boolean; seen: readonly ForestThreshold[]; active: ForestReaction | null };
type Event =
  | { type: 'availability'; allowed: boolean }
  | { type: 'arrival'; milestone: PersonalMilestone; now: number; visible: boolean; hasBaseline: boolean; fresh: boolean }
  | { type: 'expire'; id: string }
  | { type: 'cancel'; sourceSessionId?: string };
export const initialForestReaction: State = { allowed: false, seen: [], active: null };

/** Account-local, bounded by the three earned thresholds. Ineligible arrivals are consumed, never queued. */
export function forestReactionReducer(state: State, event: Event): State {
  switch (event.type) {
    case 'availability':
      return state.allowed === event.allowed && (event.allowed || !state.active) ? state
        : { ...state, allowed: event.allowed, active: event.allowed ? state.active : null };
    case 'arrival': {
      const { threshold, sourceSessionId } = event.milestone;
      if (state.seen.includes(threshold)) return state;
      return { ...state, seen: [...state.seen, threshold], active: state.allowed && event.visible && event.hasBaseline && event.fresh
        ? { id: `${sourceSessionId}:${threshold}`, sourceSessionId, threshold, expiresAt: event.now + forestReactionDuration } : null };
    }
    case 'expire':
      return state.active?.id === event.id ? { ...state, active: null } : state;
    case 'cancel':
      return state.active && state.active.sourceSessionId !== event.sourceSessionId ? { ...state, active: null } : state;
  }
}
