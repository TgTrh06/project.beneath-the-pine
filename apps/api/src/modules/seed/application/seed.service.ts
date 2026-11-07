import type { Clock } from '../../../shared/kernel/clock';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { SeedInput } from '../domain/open-seed';
import type { SeedAccess, SeedRepository } from './seed.ports';
export class SeedService implements SeedAccess {
  constructor(private readonly repository: SeedRepository, private readonly clock: Clock) {}
  get(accountId: string, context?: TransactionContext) { return this.repository.get(accountId, context); }
  upsert(accountId: string, input: SeedInput, context?: TransactionContext) {
    return this.repository.upsert(accountId, { text: input.text, sourceSessionId: input.sourceSessionId ?? null }, this.clock.now(), context);
  }
  remove(accountId: string, context?: TransactionContext) { return this.repository.remove(accountId, context); }
}
