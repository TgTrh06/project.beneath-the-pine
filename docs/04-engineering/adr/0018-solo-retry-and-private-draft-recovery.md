# ADR-0018 — Solo retries and private draft recovery

- **Status:** Accepted within the approved core step 1
- **Date:** 2026-09-17

## Context and decision

Concurrent solo starts must rely on the existing database uniqueness constraints. A repeated actor/request key returns the winning session; a different key conflicting with an active session returns 409. Unexpected database failures still propagate through the safe API error filter.

Checkout locks the session before its participant, matching expiry lock order. Only the first valid active checkout changes an Open Seed or records a checkout event. Expired sessions finish with the existing stopped outcome; a stale checkout cannot replace a newer seed. The client checks persisted seed state before clearing a replacement draft.

Socket.IO namespace middleware completes cookie and Origin authentication before accepting subscription messages. The web client uses WebSocket transport; existing HTTP refresh remains available when realtime is unavailable.

Unsaved Return and checkout drafts survive reauthentication in tab memory, scoped to the account ID. They are discarded on explicit logout, account deletion, successful completion, or account change. Account-bound views remount on identity change, and stale callbacks cannot write to another account's cache. No private work text is written to localStorage or sessionStorage. Full reload or closing the tab loses unsaved drafts; committed sessions and seeds remain server-owned.

## Validation and rollback

See [solo verification](../../07-testing/solo-core-verification.md) for focused concurrency, privacy, auth and realtime evidence. No schema, dependency or public endpoint was added. Rollback consists of reverting the focused service/gateway and draft-recovery changes together; it requires no data migration but reintroduces the documented retry and recovery defects. Preserve unrelated UI changes when reverting.
