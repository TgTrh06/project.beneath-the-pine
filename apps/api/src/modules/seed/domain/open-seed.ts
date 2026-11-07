export interface OpenSeedRecord {
  accountId: string; id: string; text: string; sourceSessionId: string | null; createdAt: Date; updatedAt: Date;
}
export interface SeedInput { text: string; sourceSessionId?: string | null; }
