# Delivery Plan

## Current core closeout — 2026-10-24

Stage 1 was estimated at **8–12 engineering days** for C01–C05, including the breaking Circle → Camp migration and browser acceptance. The local core gate is now **met on an isolated PostgreSQL database and one API instance**. Remaining pre-pilot verification is **XS–S**: force a lost start response in a browser, then repeat smoke checks on the chosen pilot environment. This is relative effort, not a calendar promise. Earlier Circle evidence below remains historical; current Camp results are in [C01 baseline](../07-testing/core-c01-baseline.md) and the [demo record](../07-testing/core-closeout-demo.md).

| Task | Current status | Exit evidence still required |
| --- | --- | --- |
| C01 baseline | Đạt: pre-change inventory plus final live/browser table; workspace lint, test, build and health checks pass. | Preserve this record as the release baseline. |
| C02 Solo browser | Đạt for draft/reload, timer, checkout network retry, Seed and return; API live covers duplicate start. | Browser simulation of a lost start response remains an XS follow-up. |
| C03 Camp/Pact | Đạt: clean and old-data migration on disposable DB; two-account invite, immediate/scheduled Pact, response change, separate start, late join, checkout and cancel. | Rollout of the breaking contract requires its own deploy/migration approval. |
| C04 realtime/privacy | Đạt within one API instance: two browser sessions share timer/presence, reconnect, outsider denial and revoked-member recovery; privacy marker check passes. | Multi-instance broadcast and long-running pilot logs remain outside this core gate. |
| C05 blockers | Đạt: late-join domain defect and misleading join button after checkout fixed and rerun. | Track remaining non-blocking limits in the demo record. |

The **local core gate is met** for the Solo and Camp/Pact demo scripts. This does not open the pilot: hosting, backup, production secrets, real-data migration and deployment still require a separate plan and approval. Keep AI off the main screen until the pilot gate. See [ADR-0021](../04-engineering/adr/0021-camp-contract-and-late-join.md) for compatibility and rollback.

An exception for a **local/preview Pine Assistance demo** is approved behind disabled-by-default UI/API flags. It covers only `assisted_start` and `open_seed_draft` with fictional data; it does not open the pilot gate or change the P6 release status. See [ADR-0022](../04-engineering/adr/0022-openai-assistance-demo.md) and the [demo script](../07-testing/pine-assistance-demo.md).

## Historical baseline — 2026-10-21 (Circle contract)

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

## Historical checks and blockers — 2026-10-21

| Check / issue | Result | Reproduction and impact |
| --- | --- | --- |
| Web unit tests | Đã xong | `pnpm --filter @beneath-the-pine/web test` — 22 tests pass. |
| Web production build | Đã xong | `pnpm --filter @beneath-the-pine/web build` — passes. |
| API default suite | Đã xong | `pnpm test` — API default suite has 20 pass, 4 opt-in database/migration suites skipped. |
| Live Solo/Pact API suites | Đã xong | With the local API and PostgreSQL running, compile test files and run `node --test dist-test/test/solo-http.test.js dist-test/test/pact-lists-http.test.js` using localhost `BTP_SOLO_API_URL`, `BTP_SOLO_DATABASE_URL` and `BTP_SOLO_WEB_ORIGIN` — 12 pass, 0 skipped/failed. No migration was run. |
| Workspace build, lint and tests | Đã xong | `pnpm build` and `pnpm lint` pass. `pnpm test` passes the web suite (22 tests) and API default suite (20 pass, 4 opt-in database/migration suites skipped). The earlier TS5095 failure was caused by combining CommonJS output with Bundler module resolution in the contracts project; using Node resolution resolves the mismatch. |
| Realtime presence event | Đã xong qua regression tests | `pnpm test:api` exercises the gateway event path with an authenticated Socket.IO client, validates the declared payload, and confirms sockets that fail the current snapshot authorization do not receive it. A FocusService regression confirms no event is published for an unchanged presence value. Full DB-backed two-client verification remains future coverage. |

Local PostgreSQL was healthy and API readiness reported database UP during the live suite rerun. No UI defect was reproduced. Component-level browser coverage and keyboard-only acceptance remain incomplete. Historical browser evidence is retained as historical and is not presented as a current rerun.
