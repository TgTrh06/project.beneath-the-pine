export type MemberStatus = "waitlisted" | "active" | "revoked";
export type CurrentUser = { id: string; email: string; isAdmin: boolean };
export type Profile = { id: string; displayName: string | null; timezone: string; onboardingCompletedAt: Date | null };
export type Consent = { aiProcessing: boolean; contentRetention: boolean; researchAnalytics: boolean };

export interface UserRepository {
  ensureProfile(id: string, displayName?: string): Promise<void>;
  activateAdmin(id: string): Promise<void>;
  getMembershipStatus(id: string): Promise<MemberStatus | null>;
  isAdmin(id: string): Promise<boolean>;
  getProfile(id: string): Promise<Profile | null>;
  recordConsent(id: string, consent: Consent): Promise<void>;
  getCurrentConsent(id: string): Promise<Consent | null>;
  deleteUser(id: string): Promise<void>;
  activateMember(id: string, approvedBy: string): Promise<void>;
}
