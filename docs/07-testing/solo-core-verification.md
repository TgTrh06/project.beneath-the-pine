# Solo core verification — 2026-09-17

## Scope

Approved core step 1: verify the solo lifecycle on the existing local API and PostgreSQL baseline, fix demonstrated failures, and add regressions. No migration, reset, production change or deployment. Circle/Pact end-to-end acceptance and subsequent UI redesign steps remain outside this slice.

## Fixes

- Concurrent same-key starts recover one session; conflicting different-key starts return 409 rather than 500.
- Replaying an old checkout cannot replace/delete a newer Open Seed or duplicate the checkout analytics event.
- Expired sessions no longer appear as active or accept a late manual outcome.
- Socket authentication completes before the first subscribe message.
- Return and checkout drafts survive same-account reauthentication in memory; identity switches and explicit logout discard them.
- A checkout/expiry race retains an unsaved replacement seed for explicit saving.

## Automated evidence

- API lint/typechecks and module boundary check passed.
- API default suite: 19 passed, 3 skipped, 0 failed. The skipped tests are two opt-in database/migration suites and the opt-in live solo suite.
- Web: 22 tests passed; production build passed. Three draft-cache tests cover same-account recovery, account isolation/stale writes, and clearing.
- Live solo HTTP suite previously passed 6 tests (parent plus five groups) against the existing local database. It covers all four outcomes and supported durations, 280/500 text limits, two-account privacy, keep/replace/delete seed semantics, replay, concurrent starts, expiry and authentication expiry.
- The realtime regression deliberately delays authentication by 50 ms; it failed before the middleware fix and passes after it. Foreign Origin is rejected before connection.

## Browser evidence and limits

An isolated headless Edge run against the real local API passed registration/timezone, starting after a lost committed response, reload/resume with the same server deadline, live realtime snapshot, checkout network failure/retry, 500-character seed handling, Return draft recovery after authentication expiry, offline/reconnect, and a checkout/expiry race retaining the unsaved seed.

The final rerun, extended to expire authentication while the checkout dialog is open, could not reach registration: local PostgreSQL was unavailable and readiness returned 503. API/Vite were restarted; Docker Desktop startup was requested, but the database had not become reachable at the time of recording. Thus checkout-dialog reauthentication is implemented and supported by cache tests, but this additional browser assertion is not yet verified. This does not invalidate the earlier completed live run above.

Expiry tests advance timestamps only on sessions belonging to generated test accounts; they do not wait 50 minutes or alter the system clock. Concurrent HTTP requests cover the server race corresponding to two tabs; this is not a full two-browser UI test. At the time of this verification, unsaved draft recovery was in-memory only and did not survive a full reload. Physical-device and assistive-technology checks are not part of this verification.

## Follow-up — 2026-10-22

Solo intention, duration, start-retry payload/key, and Solo checkout drafts now opt into account-scoped `sessionStorage` so same-tab reloads restore unfinished work. Circle/Pact composer drafts remain memory-only. Logout, account deletion and account changes clear the relevant stored drafts; completing start/checkout clears its draft. Web tests now cover same-tab reload restoration, account isolation/cleanup, memory-only non-opted-in drafts and stable start keys across serialization.

Current web verification: 25 tests passed; web lint and production build passed. Current API default verification: 20 passed, 4 database/live suites skipped. Docker Desktop was unavailable for this follow-up, so the live Solo/database/browser acceptance scenarios above were not rerun; the September 17 live and browser evidence remains historical only. No migration or database reset was run.

## Follow-up — 2026-10-22 — Checkout and Open Seed

Return now supports replacing the current Open Seed directly, with a 500-character editor, cancel, and retry after recoverable failure. The current Seed record changes only after the API confirms the replacement. The session checkout still provides four neutral outcomes and keep/replace/remove; after expiry, Seed entry remains separate from the terminal outcome. Each Pact participant writes only their own account Seed.

Web verification: 25 tests passed; web lint and production build passed. Browser acceptance on the local API confirmed checkout replacement, Return display, cancel preserving the prior saved value, direct replacement, failure while the API was unavailable retaining the draft, and successful retry after the API restarted. API live suites passed 13 tests with `node --test --test-concurrency=1 dist-test/test/solo-http.test.js dist-test/test/pact-lists-http.test.js`: concurrent Seed upserts leave one current row, Pact participants retain separate Seeds, shared Circle/Pact/session projections omit Seed text, and existing keep/replace/delete, ownership and replay checks pass. The initial parallel live-suite attempt hit the API's auth rate limit (429); the sequential rerun passed. No migration or reset was run.

## Repeating the live HTTP suite

Compile API tests with `pnpm --filter @beneath-the-pine/api exec tsc -p tsconfig.test.json`. From `apps/api`, run `node --test --test-concurrency=1 dist-test/test/solo-http.test.js dist-test/test/pact-lists-http.test.js` with these process environment variables:

- `BTP_SOLO_API_URL`: existing local API base including `/api/v1` (or the Vite proxy).
- `BTP_SOLO_DATABASE_URL`: the same existing local database used by that API.
- `BTP_SOLO_WEB_ORIGIN`: the configured allowed web Origin.

Do not print credentials. The suite checks local hosts, creates unique fixture accounts, verifies API/database identity alignment, and cleans its own sessions/accounts. It never applies migrations. Leave `BTP_TEST_DATABASE_URL` unset when running the default suite if schema-mutating tests are not authorized.
