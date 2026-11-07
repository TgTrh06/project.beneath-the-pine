import type { ProfileRecord, ProfileUpdate } from '../domain/profile';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
export interface ProfileAccess {
  get(accountId: string): Promise<ProfileRecord | null>;
  update(accountId: string, input: ProfileUpdate): Promise<ProfileRecord>;
}
export const PROFILE_ACCESS = Symbol('PROFILE_ACCESS');
export interface ProfileRepository {
  get(accountId: string, context?: TransactionContext): Promise<ProfileRecord | null>;
  save(profile: ProfileRecord, context?: TransactionContext): Promise<ProfileRecord>;
}
