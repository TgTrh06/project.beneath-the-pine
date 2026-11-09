import type { CampForest, PersonalForest } from '@pyneath/contracts';
import { BusinessError } from '../../../shared/kernel/business-error';
import type { TransactionContext, UnitOfWork } from '../../../shared/kernel/unit-of-work';
import type { AccountAccess } from '../../identity/public-api';
import { campProjection, earnedMilestones, personalProjection } from '../domain/memory';
import type { MemoryAccess, MemoryRepository } from './memory.ports';
export class MemoryService implements MemoryAccess {
  exportPersonal(accountId: string) { return this.repository.exportPersonal(accountId); }
  constructor(private readonly repository: MemoryRepository, private readonly transactions: UnitOfWork, private readonly accounts: AccountAccess) {}
  /** Historical projection remains outside checkout and preserves original completion dates. */
  personal(accountId: string): Promise<PersonalForest> {
    return this.transactions.run(async context => {
      if (!await this.accounts.lock(accountId, context)) throw new BusinessError('NOT_FOUND');
      const first = await this.repository.completedSources(accountId, context);
      const earned = earnedMilestones(accountId, first);
      if (earned.length) await this.repository.insertPersonal(earned, context);
      return personalProjection(first, await this.repository.personalMilestones(accountId, context));
    });
  }
  earnedThresholds(accountId: string, context: TransactionContext) { return this.repository.earnedThresholds(accountId, context); }
  list(accountId: string) { return this.repository.list(accountId); }
  async camps(accountId: string): Promise<CampForest[]> { return campProjection(await this.repository.camps(accountId)); }
}
