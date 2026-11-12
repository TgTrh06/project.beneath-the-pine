import type { ProductEventName } from '@pyneath/contracts';
export type EventMetadata = Record<string, string | number | boolean | null>;

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
        if (capability !== 'assisted_start' && capability !== 'open_seed_draft' && capability !== 'stuck_recovery') return {};
        if (name === 'assistance_result') {
            const outcome = metadata?.outcome;
            if (!['suggestion', 'fallback', 'boundary', 'quota', 'context_expired', 'timeout', 'provider_error', 'invalid_output'].includes(String(outcome))) return {};
            const base: EventMetadata = { capability, outcome };
            for (const field of ['provider', 'model', 'promptRevision', 'policyRevision'] as const) {
                const value = metadata[field];
                if (typeof value === 'string' && /^[a-zA-Z0-9./_-]{1,80}$/.test(value)) base[field] = value;
            }
            const elapsedMs = metadata.elapsedMs;
            if (typeof elapsedMs === 'number' && Number.isInteger(elapsedMs) && elapsedMs >= 0 && elapsedMs <= 120000) base.elapsedMs = elapsedMs;
            for (const field of ['promptTokens', 'completionTokens'] as const) {
                const value = metadata[field];
                if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 1000000) base[field] = value;
            }
            const costUsd = metadata.costUsd;
            if (typeof costUsd === 'number' && Number.isFinite(costUsd) && costUsd >= 0 && costUsd <= 10) base.costUsd = costUsd;
            return base;
        }
        if (name === 'assistance_discarded' && ['irrelevant', 'too_large_or_vague', 'unclear', 'inappropriate', 'other'].includes(String(metadata.reason)))
            return { capability, reason: metadata.reason };
        return { capability };
    }
    return {};
}

