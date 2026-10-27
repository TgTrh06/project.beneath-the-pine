import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { ProductEventName } from '@pyneath/contracts';
import { and, count, eq, gte, lt, sql } from 'drizzle-orm';
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
    if (name.startsWith('assistance_')) {
        const capability = metadata?.capability;
        return capability === 'assisted_start' || capability === 'open_seed_draft' ? { capability } : {};
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

    async reserveAssistanceRequest(accountId: string, capability: 'assisted_start' | 'open_seed_draft'): Promise<string | null> {
        const start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        const end = new Date(start.getTime() + 86400000);
        return this.database.db.transaction(async tx => {
            // One global lock serializes account and demo-wide quota reservations.
            await tx.execute(sql`select pg_advisory_xact_lock(639104, 1)`);
            const today = and(eq(productEvents.name, 'assistance_requested'), gte(productEvents.occurredAt, start), lt(productEvents.occurredAt, end));
            const [global] = await tx.select({ total: count() }).from(productEvents).where(today);
            if (global.total >= 100) return null;
            const [account] = await tx.select({ total: count() }).from(productEvents).where(and(today, eq(productEvents.accountId, accountId)));
            if (account.total >= 10) return null;
            const suggestionId = randomUUID();
            await tx.insert(productEvents).values({ accountId, name: 'assistance_requested', subjectId: suggestionId, metadata: { capability } });
            return suggestionId;
        });
    }

    async ownsAssistanceRequest(accountId: string, suggestionId: string, capability: 'assisted_start' | 'open_seed_draft'): Promise<boolean> {
        const rows = await this.database.db.select({ metadata: productEvents.metadata }).from(productEvents)
            .where(and(eq(productEvents.accountId, accountId), eq(productEvents.subjectId, suggestionId), eq(productEvents.name, 'assistance_requested'))).limit(1);
        return rows[0]?.metadata.capability === capability;
    }
}
