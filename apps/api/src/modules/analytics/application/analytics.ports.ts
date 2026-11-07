import type { AssistanceCapability, ProductEventName } from '@pyneath/contracts';
import type { TransactionContext } from '../../../shared/kernel/unit-of-work';
import type { EventMetadata } from '../domain/event-policy';

export interface Analytics {
  record(accountId: string, name: ProductEventName, subjectId?: string, metadata?: EventMetadata): Promise<void>;
  reserveAssistanceRequest(accountId: string, capability: AssistanceCapability): Promise<string | null>;
  ownsAssistanceRequest(accountId: string, suggestionId: string, capability: AssistanceCapability): Promise<boolean>;
}
export const ANALYTICS = Symbol('ANALYTICS');
export interface EventRecord { accountId: string; name: ProductEventName; subjectId?: string; metadata: EventMetadata; }
export interface AnalyticsRepository {
  append(event: EventRecord, context?: TransactionContext): Promise<void>;
  lockAssistanceQuota(context: TransactionContext): Promise<void>;
  countRequests(start: Date, end: Date, context: TransactionContext, accountId?: string): Promise<number>;
  ownsRequest(accountId: string, suggestionId: string, capability: AssistanceCapability): Promise<boolean>;
}
