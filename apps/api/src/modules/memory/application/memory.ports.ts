import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { CampMemoryRow, CompletedMemorySource, PersonalMilestone, SharedMilestone } from '../domain/memory';
export interface MemoryAccess { earnedThresholds(accountId: string, context: TransactionContext): Promise<number[]>; }
export const MEMORY_ACCESS = Symbol('MEMORY_ACCESS');
export interface MemoryRepository {
  exportPersonal(accountId: string): Promise<PersonalMilestone[]>;
  completedSources(accountId: string, context: TransactionContext): Promise<CompletedMemorySource[]>;
  insertPersonal(values: Array<PersonalMilestone & { accountId: string }>, context: TransactionContext): Promise<void>;
  personalMilestones(accountId: string, context: TransactionContext): Promise<PersonalMilestone[]>;
  earnedThresholds(accountId: string, context: TransactionContext): Promise<number[]>;
  list(accountId: string): Promise<SharedMilestone[]>;
  camps(accountId: string): Promise<CampMemoryRow[]>;
}

export interface MemoryPrivacyAccess {
  list(accountId: string): Promise<SharedMilestone[]>;
  exportPersonal(accountId: string): Promise<PersonalMilestone[]>;
}
