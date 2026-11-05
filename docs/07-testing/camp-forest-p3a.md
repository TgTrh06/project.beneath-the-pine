# Camp forest P3A — Implementation verification

Date: 2026-11-03. Authorized by `accept plan P3A`. See [design](../03-design/camp-forest-p3a.md) and [ADR-0028](../04-engineering/adr/0028-camp-forest-projection.md).

## Scope and changed files

- API: `memory.service.ts` and `memory.controller.ts` add the authenticated Camp aggregate read; `camp-forest-postgres.test.ts` covers its database/HTTP boundaries.
- Contracts/client: `packages/contracts/src/memory.ts` defines the safe response; web `shared/api/api.ts` validates it.
- Web: `CampForestJournal.tsx`, `MemoryView.tsx` and `memory.css` implement selection, static stages, per-Camp history, access refresh and obsolete-response protection.
- Documentation: design, ADR, core domain/privacy rules, indexes and this verification record.

No P3A migration, dependency, asset, environment configuration, analytics event or focus-lifecycle change was introduced. Existing P1/P2A/P2B work remains in the checkout. No dev/production rollout or existing-database mutation was performed. Tests used a disposable PostgreSQL 17 container on localhost:5544 and isolated Vite on localhost:5174, not the existing local database on port 5433. The temporary Vite process was stopped and the disposable container removed after verification.

## Automated evidence

The focused PostgreSQL/HTTP run passed 15 tests with zero skips across `camp-forest-postgres`, `core-postgres`, `personal-memory-postgres` and `privacy-postgres`. The new Camp suite includes its parent and five subtests:

- 0/1/2/3/6/7/>7 records, original milestone dates, empty Camps, duplicate-session uniqueness and persistence without source sessions.
- Separate Camps, archived history, tied timestamps and stable repeated reads.
- Removed membership hides both summary and history; rejoining restores previous shared history.
- Anonymous HTTP access is rejected; forged account/Camp parameters and user headers cannot change the actor. Responses use no-store, exclude source session IDs and sanitize database failures.
- Member deletion retains the remaining Camp history; Camp deletion cascades only its records.

Existing core/personal/privacy suites cover the unchanged shared-session lifecycle, completion/expiry, private Seed data and export revocation. Existing pg warnings about concurrent queries on one test client remain; the focused run has no failures.

Web tests pass 89/89 across 21 files. An initial concurrent run hit the existing Assistance dynamic-import test's 5-second timeout; a standalone rerun passed without changing code or timeout settings. API lint including production/test/tooling TypeScript and the 71-file import-boundary check passed. Web TypeScript passed. Workspace production builds passed for contracts, API and web. Existing Rollup warnings about Zod comment annotations and the shared Three chunk above 500 kB remain. `git diff --check` passed.

## Browser and UI review

Headless Edge exercised the real React UI with controlled HTTP fixtures and realtime disabled. This is browser implementation validation, separate from PostgreSQL/HTTP integration, not a live deployment test. Scripts/screenshots/results are retained locally in ignored `.openai/p3a-ui.cjs`, `.openai/p3a-layout.cjs` and `.openai/p3a-validation/`.

- 320/390/768/1440px in light/dark: select by keyboard, show earned/unearned stages, archived label, switch history, reset pagination and reflow at 200% text without horizontal overflow.
- One Camp omits the selector; no membership provides an actionable link to Camps.
- Either summary or history failure clears previous data, shows retry and recovers correctly.
- Revocation removes a Camp and filters out its entries even if the other endpoint returns an older list.
- Closing/reopening the Camp tab during a delayed request ignores the obsolete result. Logout/login during a delayed request cannot restore the previous account's Camp.
- Main browser run reports no uncaught page errors. Visibility transitions use dispatched browser events rather than a physical app-backgrounding test.

Visual review covered narrow light and wide dark journal layouts, shared forest illustration, wrapping Camp name, stage rows, native selector focus and pagination. A supplementary 320px run in both themes verified that the pagination button remains visible and operable at 200% text; viewport screenshots confirm it stays above the bottom navigation. Measured text/background contrast for heading, supporting text, stage title and selector is 5.91:1–11.13:1 in light and 7.59:1–10.60:1 in dark.

## Limits and next step

The source is existing shared-presence records; missing legacy records are not backfilled. Summary and history are separate read snapshots and can temporarily differ during a newly recorded session. A continuously visible client is not notified of membership changes in realtime; subsequent reads enforce current membership. The UI clears and reloads on visibility resumption and Camp-tab opening.

No retention improvement, high-volume query benchmark, physical mobile performance or screen-reader speech walkthrough is claimed. Deployment is separately authorized and must make the new API route available before the client. The separately authorized [P2B + P3A local dev rollout](personal-forest-p2b-p3a-dev-rollout.md) subsequently completed on 2026-11-03, with live integration and cleanup evidence.
