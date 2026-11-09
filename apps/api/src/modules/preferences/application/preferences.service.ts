import { forestArrangementSchema, type ForestArrangement, type Preferences, type UpdatePreferences } from '@pyneath/contracts';
import { BusinessError } from '../../../shared/kernel/business-error';
import type { Clock } from '../../../shared/kernel/clock';
import type { EventChannel } from '../../../shared/kernel/events';
import type { TransactionContext, UnitOfWork } from '../../../shared/kernel/unit-of-work';
import type { AccountAccess } from '../../identity/public-api';
import type { MemoryAccess } from '../../memory/public-api';
import { defaultPreferences, preferencePatch, projectPreferences } from '../domain/preferences';
import type { PreferencesAccess, PreferencesRepository } from './preferences.ports';

export class PreferencesService implements PreferencesAccess {
  async exportPreferences(accountId: string) { return await this.repository.get(accountId) ?? null; }
  readonly presenceSharingChanges;
  constructor(private readonly repository: PreferencesRepository, private readonly transactions: UnitOfWork,
    private readonly accounts: AccountAccess, private readonly memory: MemoryAccess, private readonly clock: Clock,
    private readonly changes: EventChannel<string>) {
    this.presenceSharingChanges = { subscribe: changes.subscribe.bind(changes) };
  }
  async get(accountId: string): Promise<Preferences> {
    const row = await this.repository.get(accountId);
    return row ? projectPreferences(row) : { ...defaultPreferences };
  }
  lockReminders(accountId: string, context: TransactionContext) { return this.repository.lockReminders(accountId, context); }
  async update(accountId: string, patch: UpdatePreferences): Promise<Preferences> {
    const saved = await this.repository.save(accountId, preferencePatch(patch), this.clock.now());
    if (patch.sharePresence !== undefined) this.changes.next(accountId);
    return projectPreferences(saved);
  }
  arrangeForest(accountId: string, input: ForestArrangement): Promise<ForestArrangement> {
    const patch = forestArrangementSchema.parse(input);
    return this.transactions.run(async context => {
      if (!await this.accounts.lock(accountId, context)) throw new BusinessError('NOT_FOUND');
      const current = await this.repository.get(accountId, context);
      if ((current?.forestVersion ?? 0) !== patch.version) throw new BusinessError('STATE_CONFLICT');
      const earned = await this.memory.earnedThresholds(accountId, context);
      if (patch.hidden.some(threshold => !earned.includes(threshold))) throw new BusinessError('FORBIDDEN');
      const values = { forestLayout: patch.layout, forestHidden: [...patch.hidden].sort((a, b) => a - b), forestVersion: patch.version + 1 };
      return projectPreferences(await this.repository.arrange(accountId, values, this.clock.now(), context)).forestArrangement;
    });
  }
}
