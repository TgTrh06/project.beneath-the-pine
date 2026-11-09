import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
export interface AccountAccess { lock(accountId: string, context: TransactionContext): Promise<boolean>; }
export interface AccountRemoval {
  email(accountId: string): Promise<string | undefined>;
  remove(accountId: string, context: TransactionContext): Promise<void>;
}
export const ACCOUNT_ACCESS = Symbol('ACCOUNT_ACCESS');
export const ACCOUNT_REMOVAL = Symbol('ACCOUNT_REMOVAL');
