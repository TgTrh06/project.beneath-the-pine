# ADR-0025 — Realtime session revocation and private exports

Status: Accepted for the approved local security remediation, 2026-11-02.

## Context

A Socket.IO handshake authenticates a point in time. Keeping that identity indefinitely allows a socket to outlive logout, rotation or account deletion. Room membership is also not proof of current Camp access.

## Decision

- PostgreSQL session lookup remains authoritative. Check expiry and the original account identity before subscribe, heartbeat, presence writes and every private snapshot/presence delivery, including server-initiated broadcasts. Recheck after asynchronous snapshot work before emitting.
- Identity emits an in-process notification only after a successful session revoke/rotation. Privacy emits the account-deleted notification only after the deletion transaction commits. Disconnect every affected local socket; another valid session of the same account remains usable.
- Maintain an expiry timer per socket, independent of client traffic. Clear timers and tracked sockets on connection close; unsubscribe internal event listeners and clear delayed presence cleanup on application shutdown.
- An established socket with invalid credentials receives `realtime.error` / `UNAUTHENTICATED`, then disconnects. If the session lookup fails, send `SERVICE_UNAVAILABLE`, then disconnect without private output or inbound presence writes. Initial handshake failures retain Socket.IO's existing `connect_error` behavior.
- Web session expiry enters the existing login flow without discarding same-account drafts. Service errors use bounded HTTP refresh/reconnect rather than recursively resubscribing. Logout retains its existing explicit draft-discard policy.
- Export milestones via an active-membership join. Historical membership rows remain, but current Camp `name` and `status` become `null` after membership removal. Account-owned session history remains exportable.
- Keep URLs, event names and the database schema. Allow CORS `PUT` and `Idempotency-Key`; keep exact configured origin and CSRF checks. JSON body parsing keeps the 32 KB limit and refuses compression with safe HTTP 415 errors.

## Consequences and limits

This is a single-process notification mechanism, with no Redis or distributed adapter. Another instance would not receive immediate local revocation notifications, but must still query PostgreSQL at every protected operation/delivery. An idle socket on that instance can remain connected until its next check or expiry timer; connection existence is never authorization. Multi-instance broadcast coordination is a separate architecture decision.

Database checks add lookup work to realtime delivery. They establish authorization at the check boundary; they do not make revocation, domain writes and network delivery one atomic distributed transaction. The existing delayed transition to disconnected presence remains lifecycle bookkeeping, not a client-authorized presence command.

Rollback reverses only this remediation's changes and restores its manifests/lockfile; it requires no schema rollback and must preserve pre-existing UI/ML edits.

## Evidence

See [security remediation verification](../../07-testing/security-remediation-2026-11-02.md), `realtime-revocation.test.ts`, `realtime.test.ts`, `privacy-postgres.test.ts`, `scaffold.test.ts` and `useSessionRealtime.test.ts`.
