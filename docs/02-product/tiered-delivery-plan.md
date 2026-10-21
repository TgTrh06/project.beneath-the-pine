# Delivery Plan

| Phase | Outcome | Baseline status (2026-10-21) | Remaining estimate | Exit evidence |
| --- | --- | --- | --- | --- |
| P0 Foundation | Identity, ownership, privacy and contracts are stable | Đã xong: standard workspace build/lint/test pass; 4 opt-in database/migration suites remain skipped | XS | Two-account authorization and data-rights tests pass; run isolated DB suites only when their test database is approved |
| P1 Solo return | User can start, check out and resume a seed | Đã xong: current live Solo HTTP suite passes; browser evidence remains historical | XS | Core flow works through recoverable failures; rerun live browser checks |
| P2 Circle pact | Private Circle can make and keep a focus pact | Đã xong: current live Pact/Circle HTTP and Socket.IO suite passes; full browser E2E remains unverified | XS | Invitation lifecycle and access rules pass; add full browser acceptance evidence |
| P3 Realtime reliability | Session state is correct across join/reconnect/terminal races | Đã xong: realtime event path and current live snapshot/revocation checks pass; database-backed two-client event acceptance remains unverified | XS | Server-authoritative integration tests pass across reconnect and terminal races |
| P4 Pilot memory | Circle milestone supports reflection without comparison | Chưa xong: implementation exists, pilot evidence chưa có | M | Pilot feedback finds no pressure/grind incentive |
| P5 Mobile rituals | Native client reaches return/start flow in a few actions | Chưa xong: native client and platform decisions are not evidenced | L | Native auth/notification/platform decisions reviewed |
| P6 Conditional assistance | Optional AI/personalisation adds verified value | Chưa xong; conditional on evidence and safety gates | M–L | Privacy, safety, cost and user evidence gate passes |

Estimate scale: XS < 1 day; S 1–3 days; M 4–10 days; L > 10 days. These are relative engineering estimates, not calendar commitments. P0–P3 define the thesis implementation; P4+ are product roadmap and not an implied delivery commitment.

## Core Baseline — 2026-10-21

| Flow | Status | Evidence and limits |
| --- | --- | --- |
| Solo | Đã xong: current live HTTP suite passes | Current live suite passes five lifecycle groups covering validation/privacy/outcomes, seed replay, concurrent starts, expiry, and auth recovery. Browser run remains historical evidence from 2026-09-17. |
| Open Seed | Đã xong: current live HTTP coverage passes | Current Solo suite covers seed validation/privacy and keep/replace/delete/replay semantics. No current browser E2E rerun. |
| Circle | Đã xong: current live API checks pass | Current live Pact suite covers membership, invite metadata, archive/restore, transfer and race behavior. No full two-browser acceptance run. |
| Pact | Đã xong: current live API checks pass | Current live suite covers participant-only lists, respond/start/join, revocation, archive and pagination. Responsive UI evidence uses controlled fixtures, not live browser E2E. |
| Realtime | Đã xong: current auth/snapshot/revocation and presence event checks pass | Realtime tests verify authenticated snapshots, `presence.updated` payload validation, current access recheck before delivery, and no duplicate event for an unchanged presence value. The live Pact suite verifies snapshot delivery and access revocation. A full DB-backed two-client presence event run remains unverified. |

## Current Checks and Blockers

| Check / issue | Result | Reproduction and impact |
| --- | --- | --- |
| Web unit tests | Đã xong | `pnpm --filter @beneath-the-pine/web test` — 22 tests pass. |
| Web production build | Đã xong | `pnpm --filter @beneath-the-pine/web build` — passes. |
| API default suite | Đã xong | `pnpm test` — API default suite has 20 pass, 4 opt-in database/migration suites skipped. |
| Live Solo/Pact API suites | Đã xong | With the local API and PostgreSQL running, compile test files and run `node --test dist-test/test/solo-http.test.js dist-test/test/pact-lists-http.test.js` using localhost `BTP_SOLO_API_URL`, `BTP_SOLO_DATABASE_URL` and `BTP_SOLO_WEB_ORIGIN` — 12 pass, 0 skipped/failed. No migration was run. |
| Workspace build, lint and tests | Đã xong | `pnpm build` and `pnpm lint` pass. `pnpm test` passes the web suite (22 tests) and API default suite (20 pass, 4 opt-in database/migration suites skipped). The earlier TS5095 failure was caused by combining CommonJS output with Bundler module resolution in the contracts project; using Node resolution resolves the mismatch. |
| Realtime presence event | Đã xong qua regression tests | `pnpm test:api` exercises the gateway event path with an authenticated Socket.IO client, validates the declared payload, and confirms sockets that fail the current snapshot authorization do not receive it. A FocusService regression confirms no event is published for an unchanged presence value. Full DB-backed two-client verification remains future coverage. |

Local PostgreSQL was healthy and API readiness reported database UP during the live suite rerun. No UI defect was reproduced. Component-level browser coverage and keyboard-only acceptance remain incomplete. Historical browser evidence is retained as historical and is not presented as a current rerun.
