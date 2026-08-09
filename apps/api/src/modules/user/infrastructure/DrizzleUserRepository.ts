import { and, desc, eq, sql } from "drizzle-orm";
import type { Database } from "../../../db/client.js";
import { betaMembers, consents, profiles, roles } from "../../../db/schema.js";
import type { Consent, MemberStatus, Profile, UserRepository } from "../domain/UserRepository.js";

export class DrizzleUserRepository implements UserRepository {
  public constructor(private readonly db: Database) {}
  public async ensureProfile(id: string, displayName?: string): Promise<void> { await this.db.insert(profiles).values({ id, displayName }).onConflictDoNothing(); }
  public async activateAdmin(id: string): Promise<void> {
    await this.db.insert(betaMembers).values({ userId: id, status: "active", approvedAt: new Date() }).onConflictDoUpdate({ target: betaMembers.userId, set: { status: "active", updatedAt: new Date() } });
    await this.db.insert(roles).values({ userId: id, role: "admin" }).onConflictDoUpdate({ target: roles.userId, set: { role: "admin", updatedAt: new Date() } });
  }
  public async getMembershipStatus(id: string): Promise<MemberStatus | null> { const [row] = await this.db.select({ status: betaMembers.status }).from(betaMembers).where(eq(betaMembers.userId, id)).limit(1); return row?.status ?? null; }
  public async isAdmin(id: string): Promise<boolean> { const [row] = await this.db.select({ role: roles.role }).from(roles).where(eq(roles.userId, id)).limit(1); return row?.role === "admin"; }
  public async getProfile(id: string): Promise<Profile | null> { const [row] = await this.db.select().from(profiles).where(eq(profiles.id, id)).limit(1); return row ?? null; }
  public async recordConsent(id: string, consent: Consent): Promise<void> { await this.db.insert(consents).values({ userId: id, ...consent }); await this.db.update(profiles).set({ onboardingCompletedAt: new Date(), updatedAt: new Date() }).where(eq(profiles.id, id)); }
  public async getCurrentConsent(id: string): Promise<Consent | null> { const [row] = await this.db.select().from(consents).where(and(eq(consents.userId, id), sql`${consents.revokedAt} IS NULL`)).orderBy(desc(consents.createdAt)).limit(1); return row ? { aiProcessing: row.aiProcessing, contentRetention: row.contentRetention, researchAnalytics: row.researchAnalytics } : null; }
  public async deleteUser(id: string): Promise<void> { await this.db.delete(profiles).where(eq(profiles.id, id)); }
  public async activateMember(id: string, approvedBy: string): Promise<void> { await this.db.insert(betaMembers).values({ userId: id, status: "active", approvedAt: new Date(), approvedBy }).onConflictDoUpdate({ target: betaMembers.userId, set: { status: "active", approvedAt: new Date(), approvedBy, updatedAt: new Date() } }); }
}
