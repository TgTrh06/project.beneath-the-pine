import type { Preferences } from '@pyneath/contracts';
import type { EventSource } from '../../../shared/kernel/events';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { PreferencesRecord, PreferencesPatch } from '../domain/preferences';
export interface PreferencesAccess {
  readonly presenceSharingChanges: EventSource<string>;
  get(accountId: string): Promise<Preferences>;
  lockReminders(accountId: string, context: TransactionContext): Promise<boolean>;
}
export const PREFERENCES_ACCESS = Symbol('PREFERENCES_ACCESS');
export interface PreferencesRepository {
  get(accountId: string, context?: TransactionContext): Promise<PreferencesRecord | undefined>;
  lockReminders(accountId: string, context: TransactionContext): Promise<boolean>;
  save(accountId: string, patch: PreferencesPatch, now: Date): Promise<PreferencesRecord>;
  arrange(accountId: string, values: Pick<PreferencesRecord, 'forestLayout' | 'forestHidden' | 'forestVersion'>, now: Date, context: TransactionContext): Promise<PreferencesRecord>;
}

export interface PreferencesPrivacyAccess { exportPreferences(accountId: string): Promise<PreferencesRecord | null>; }
