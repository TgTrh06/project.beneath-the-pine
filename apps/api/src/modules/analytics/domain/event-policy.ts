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
        return capability === 'assisted_start' || capability === 'open_seed_draft' || capability === 'stuck_recovery' ? { capability } : {};
    }
    return {};
}

