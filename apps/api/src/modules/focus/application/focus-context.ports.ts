import type { OwnFocusContext } from '@pyneath/contracts';
/** Owner-only projection. Must not reconcile expiry or mutate presence. */
export interface FocusContextReader { readOwnContext(accountId: string): Promise<OwnFocusContext>; }
export const FOCUS_CONTEXT_READER = Symbol('FOCUS_CONTEXT_READER');
