import { Injectable } from '@nestjs/common';
import type { ProductEventName } from '@beneath-the-pine/contracts';
import { DatabaseService } from '../../platform/database/database.service';
import { productEvents } from './infrastructure/analytics.schema';

type EventMetadata = Record<string, string | number | boolean | null>;

export function safeProductMetadata(name: ProductEventName, metadata: EventMetadata): EventMetadata {
    if (name === 'solo_session_started' || name === 'pact_created') {
        const duration = metadata?.durationMinutes;
        return typeof duration === 'number' && [5, 10, 25, 50].includes(duration) ? { durationMinutes: duration } : {};
    }
    if (name === 'session_checked_out') {
        const outcome = metadata?.outcome;
        return typeof outcome === 'string' && ['completed', 'progress', 'stuck', 'stopped'].includes(outcome) ? { outcome } : {};
    }
    return {};
}

@Injectable()
export class AnalyticsService {
    constructor(private readonly database: DatabaseService) { }

    async record(accountId: string, name: ProductEventName, subjectId?: string, metadata: EventMetadata = {}) {
        try {
            await this.database.db.insert(productEvents).values({ accountId, name, subjectId, metadata: safeProductMetadata(name, metadata) });
        } catch {
            /* Analytics is deliberately best effort. */
        }
    }
}
