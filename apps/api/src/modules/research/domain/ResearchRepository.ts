import type { StudyCondition } from "@beneath-the-pine/contracts";

export type StudyEnrollment = { id: string; participantCode: string; sequence: "control_first" | "intervention_first"; consentedAt: Date; withdrawnAt: Date | null; retentionUntil: Date };
export type StudySession = { id: string; condition: StudyCondition; stuckAt: Date; startedAt: Date | null; completedAt: Date | null; frictionBefore: number; frictionAfter: number | null; focusOutcome: string | null };
export interface ResearchRepository {
  enroll(userId: string, sequence: StudyEnrollment["sequence"], retentionUntil: Date): Promise<StudyEnrollment>;
  findEnrollment(userId: string): Promise<StudyEnrollment | null>;
  startSession(enrollmentId: string, condition: StudyCondition, frictionBefore: number): Promise<StudySession>;
  markStarted(id: string, enrollmentId: string, at: Date): Promise<StudySession | null>;
  completeSession(id: string, enrollmentId: string, input: { frictionAfter: number; focusOutcome: string; at: Date }): Promise<StudySession | null>;
  withdraw(userId: string): Promise<void>;
  purgeExpired(now: Date): Promise<number>;
}
