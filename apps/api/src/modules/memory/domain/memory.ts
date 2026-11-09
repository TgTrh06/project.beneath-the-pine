import type { ForestThreshold } from '@pyneath/contracts';
export interface CompletedMemorySource { id: string; endedAt: Date; total: number; }
export interface PersonalMilestone { threshold: number; sourceSessionId: string; recordedAt: Date; }
export interface CampMemoryRow {
  campId: string; name: string; status: 'active' | 'archived'; sharedSessions: number;
  first: Date | null; third: Date | null; seventh: Date | null;
}
export interface SharedMilestone { id: string; campId: string; sessionId: string; type: 'shared_presence'; recordedAt: Date; }
export function earnedMilestones(accountId: string, first: CompletedMemorySource[]) {
  return ([1, 3, 7] as const).flatMap(threshold => {
    const source = first[threshold - 1];
    return source ? [{ accountId, threshold, sourceSessionId: source.id, recordedAt: source.endedAt }] : [];
  });
}
export function personalProjection(first: CompletedMemorySource[], milestones: PersonalMilestone[]) {
  return { completedSessions: first[0]?.total ?? 0,
    milestones: milestones.map(item => ({ ...item, threshold: item.threshold as ForestThreshold, recordedAt: item.recordedAt.toISOString() })),
  };
}
export function campProjection(rows: CampMemoryRow[]) {
  return rows.map(({ first, third, seventh, ...camp }) => ({ ...camp,
    milestones: ([{ threshold: 1, date: first }, { threshold: 3, date: third }, { threshold: 7, date: seventh }] as const)
      .flatMap(({ threshold, date }) => date ? [{ threshold, recordedAt: date.toISOString() }] : []),
  }));
}
