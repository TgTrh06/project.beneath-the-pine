import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { OpenSeedRecord, SeedInput } from '../domain/open-seed';
export interface SeedAccess {
  get(accountId: string, context?: TransactionContext): Promise<OpenSeedRecord | null>;
  upsert(accountId: string, input: SeedInput, context?: TransactionContext): Promise<OpenSeedRecord>;
  remove(accountId: string, context?: TransactionContext): Promise<void>;
}
export const SEED_ACCESS = Symbol('SEED_ACCESS');
export interface SeedRepository {
  get(accountId: string, context?: TransactionContext): Promise<OpenSeedRecord | null>;
  upsert(accountId: string, input: { text: string; sourceSessionId: string | null }, now: Date, context?: TransactionContext): Promise<OpenSeedRecord>;
  remove(accountId: string, context?: TransactionContext): Promise<void>;
}
