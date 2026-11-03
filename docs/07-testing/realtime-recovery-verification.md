# Realtime and session recovery verification — 2026-10-22

## Changes verified

- Pact join, checkout, presence updates and expiry finalization serialize on Circle, session and participant rows, then recheck current participant access inside the transaction.
- Expiry discovered during join, checkout, heartbeat or presence update is persisted as terminal before the request returns. Repeated terminal snapshots do not restore active controls.
- Snapshot reads use one repeatable-read view after expiry reconciliation. Presence heartbeats preserve a participant's selected break state; reconnect restores disconnected participants.
- Socket subscription authorizes before joining a room, then sends a fresh snapshot. Access failures remove the socket from the room. Presence notifications contain only `sessionId`, `accountId` and `presence`.
- The web client validates socket snapshots, ignores older snapshots and active snapshots after terminal state, retries subscription and HTTP synchronization, and exposes the last sync time plus a manual resync action.

## Automated results

- `pnpm lint` — passed.
- `pnpm test` — web: 32 passed; API: 20 passed, 5 PostgreSQL/HTTP-gated tests skipped without live test configuration.
- `pnpm build` — contracts, API and web production builds passed.
- API suite with `PYNEATH_TEST_DATABASE_URL` pointed at a disposable PostgreSQL 17 container — 22 passed, 0 failed, 3 HTTP-server-gated tests skipped. The PostgreSQL flow used two independent connections to race Pact start/cancel, Pact join/session checkout, and checkout/expiry. It also verified break-preserving heartbeat, reconnect from disconnected, and access denial after Circle removal.
- Socket.IO gateway test — two authenticated clients received the same minimal presence state; resubscribe to a terminal session returned the terminal snapshot; a socket whose current authorization failed received no presence payload. The event keys were asserted to be exactly `sessionId`, `accountId` and `presence`.
- Web state test — older snapshots and active snapshots after a terminal snapshot are rejected.

The temporary PostgreSQL container was removed after the run. The existing local PostgreSQL container on port 5433 was left running and was not used or reset. No schema or public API change was added.

## Not verified in this run

- The browser walkthrough for late join, page reload and offline/online recovery was not run. The environment rejected attempts to start a separate API process, so the HTTP-driven browser suite could not be pointed at the disposable database. The UI synchronization logic is covered by state tests, lint and production build, but those are not a substitute for that browser walkthrough.
- Broadcast remains process-local. Run one API instance until a shared Socket.IO adapter is separately approved and configured.
