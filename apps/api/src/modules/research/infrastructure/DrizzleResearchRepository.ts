import { and, eq, lt } from "drizzle-orm";
import { researchEnrollments, researchSessions } from "../../../db/schema.js";
import type { Database } from "../../../db/client.js";
import type { ResearchRepository, StudyEnrollment, StudySession } from "../domain/ResearchRepository.js";

const mapEnrollment = (row: typeof researchEnrollments.$inferSelect): StudyEnrollment => ({ id: row.id, participantCode: row.participantCode, sequence: row.sequence as StudyEnrollment["sequence"], consentedAt: row.consentedAt, withdrawnAt: row.withdrawnAt, retentionUntil: row.retentionUntil });
const mapSession = (row: typeof researchSessions.$inferSelect): StudySession => ({ id: row.id, condition: row.condition as StudySession["condition"], stuckAt: row.stuckAt, startedAt: row.startedAt, completedAt: row.completedAt, frictionBefore: row.frictionBefore, frictionAfter: row.frictionAfter, focusOutcome: row.focusOutcome });
export class DrizzleResearchRepository implements ResearchRepository {
  public constructor(private readonly db: Database) {}
  async enroll(userId: string, sequence: StudyEnrollment["sequence"], retentionUntil: Date) { const [row] = await this.db.insert(researchEnrollments).values({ userId, sequence, participantCode: `P-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, retentionUntil }).onConflictDoNothing().returning(); return row ? mapEnrollment(row) : (await this.findEnrollment(userId))!; }
  async findEnrollment(userId: string) { const [row] = await this.db.select().from(researchEnrollments).where(eq(researchEnrollments.userId, userId)).limit(1); return row ? mapEnrollment(row) : null; }
  async startSession(enrollmentId: string, condition: StudySession["condition"], frictionBefore: number) { const [row] = await this.db.insert(researchSessions).values({ enrollmentId, condition, frictionBefore }).returning(); return mapSession(row); }
  async markStarted(id: string, enrollmentId: string, at: Date) { const [row] = await this.db.update(researchSessions).set({ startedAt: at, updatedAt: new Date() }).where(and(eq(researchSessions.id, id), eq(researchSessions.enrollmentId, enrollmentId))).returning(); return row ? mapSession(row) : null; }
  async completeSession(id: string, enrollmentId: string, input: { frictionAfter: number; focusOutcome: string; at: Date }) { const [row] = await this.db.update(researchSessions).set({ frictionAfter: input.frictionAfter, focusOutcome: input.focusOutcome, completedAt: input.at, updatedAt: new Date() }).where(and(eq(researchSessions.id, id), eq(researchSessions.enrollmentId, enrollmentId))).returning(); return row ? mapSession(row) : null; }
  async withdraw(userId: string) { await this.db.update(researchEnrollments).set({ withdrawnAt: new Date(), updatedAt: new Date() }).where(eq(researchEnrollments.userId, userId)); }
  async purgeExpired(now: Date) { const rows = await this.db.delete(researchEnrollments).where(lt(researchEnrollments.retentionUntil, now)).returning({ id: researchEnrollments.id }); return rows.length; }
}
