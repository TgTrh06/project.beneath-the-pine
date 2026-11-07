import type { AssistanceCapability, ProductEventName } from '@pyneath/contracts';
import type { Clock } from '../../../shared/kernel/clock';
import type { UnitOfWork } from '../../../shared/kernel/unit-of-work';
import { safeProductMetadata, type EventMetadata } from '../domain/event-policy';
import type { Analytics, AnalyticsRepository } from './analytics.ports';

export class AnalyticsService implements Analytics {
  constructor(private readonly repository: AnalyticsRepository, private readonly transactions: UnitOfWork,
    private readonly clock: Clock, private readonly nextId: () => string) {}

  async record(accountId: string, name: ProductEventName, subjectId?: string, metadata: EventMetadata = {}): Promise<void> {
    try { await this.repository.append({ accountId, name, subjectId, metadata: safeProductMetadata(name, metadata) }); }
    catch { /* Analytics is deliberately best effort. */ }
  }

  reserveAssistanceRequest(accountId: string, capability: AssistanceCapability): Promise<string | null> {
    const start = this.clock.now();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 86400000);
    return this.transactions.run(async context => {
      await this.repository.lockAssistanceQuota(context);
      if (await this.repository.countRequests(start, end, context) >= 100) return null;
      if (await this.repository.countRequests(start, end, context, accountId) >= 10) return null;
      const suggestionId = this.nextId();
      await this.repository.append({ accountId, name: 'assistance_requested', subjectId: suggestionId, metadata: { capability } }, context);
      return suggestionId;
    });
  }

  ownsAssistanceRequest(accountId: string, suggestionId: string, capability: AssistanceCapability): Promise<boolean> {
    return this.repository.ownsRequest(accountId, suggestionId, capability);
  }
}
