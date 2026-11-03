# Circle and invitation verification — 2026-10-22

## Scope and environment

Step 3 covers Circle creation, list/detail, member management, leaving, ownership transfer, invitation preview, acceptance, decline, revocation and expiry. The new decline migration was reviewed and applied only to a disposable PostgreSQL 17 container. The container had no volume and was separate from the local application database. No production data, migration or deployment was touched.

## Automated evidence

- `pnpm lint` passed, including API module boundaries and TypeScript checks.
- `pnpm build` passed for contracts, web and API. The default root `pnpm test` run passed with 30 web tests and 20 API tests; five opt-in API tests were skipped by default.
- Web suite: 30 passed. The Circle and invitation rendering tests cover the limited preview, terminal link state, loading/error retry and empty/populated Circle lists.
- API suite with `PYNEATH_SOLO_DATABASE_URL` pointed at the disposable database: 29 passed, 4 unrelated opt-in suites skipped. The eight live Circle cases cover preview field minimization, missing/invalid authentication or tokens, per-account decline and idempotence, used/revoked/expired links, owner transfer, leave/removal, dependent Pact access, full membership, and accept/decline/revoke/archive races. The HTTP suite removed its test accounts and Circles. Browser fixtures were kept until browser inspection ended, then removed with the disposable container.
- The separate Pact live HTTP/Socket.IO suite against the same disposable database and running API: 7 passed. It confirms current-membership access to Pact data and realtime, removal revocation, invitation metadata and archive behavior.

## Browser evidence

Using the running local web/API with synthetic accounts on that disposable database, a Circle owner created a Circle and shared an invitation. A signed-out recipient registered and returned to the invitation. The preview showed Circle name and inviter display name, with no member list. That recipient declined; reopening the link hid the participation actions. A different recipient accepted the same link and saw the Circle detail and member list. Reopening the used link showed it unavailable. After leaving, the former member's Circle list was empty and direct detail access returned an unavailable view. The owner view showed the remaining one-person Circle and the used invitation status.

Browser checks cover the main acceptance and decline flows, while expiry, revocation, full-capacity and concurrent transitions were exercised by live HTTP tests. The browser was not tested on a physical mobile device or with assistive technology. A browser setup attempt at `127.0.0.1:5173` failed CSRF validation because the API allowed Origin was `http://localhost:5173`; repeating from the configured origin worked. An initial live Pact suite attempt used `localhost` for an IPv4-bound API and failed to connect; the same suite passed against `127.0.0.1`.

## Repeating the checks

Apply `apps/api/drizzle/0001_white_spacker_dave.sql` to a disposable, empty PostgreSQL database through `pnpm --filter @pyneath/api db:migrate` with `API_DATABASE_URL` set privately. Set `PYNEATH_SOLO_DATABASE_URL` to that database and `PYNEATH_SOLO_WEB_ORIGIN` to the allowed web origin, then run `pnpm --filter @pyneath/api test`. Run `pnpm --filter @pyneath/web test` and `pnpm lint` from the root. For the external Pact suite, start the API against the same database and run `node --test --test-concurrency=1 dist-test/test/pact-lists-http.test.js` from `apps/api` with `PYNEATH_SOLO_API_URL`, `PYNEATH_SOLO_DATABASE_URL` and `PYNEATH_SOLO_WEB_ORIGIN` set. Keep the API URL on the address family where the server binds. Test suites create and remove only their own fixtures; they do not apply migrations.
