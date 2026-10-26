# Focus Pact verification — 2026-10-22

## Environment

- Ran against an empty PostgreSQL 17 Docker container bound to `127.0.0.1:5545`; the current repository migrations were applied only to this disposable database.
- Started the API on `127.0.0.1:8081` and the web app on `localhost:5173`. Both `/health/live` and `/health/ready` returned `UP`.
- Browser accounts, Circle, invitations, Pacts and sessions were test-only records in the disposable database. No production or existing local database was used.

## Automated results

- `pnpm lint` — passed for contracts, API and web.
- `pnpm test` — web: 31 passed; API: 20 passed, 5 database-gated tests skipped, 0 failed.
- `pnpm build` — contracts, API and web production builds passed.
- `pnpm --filter @beneath-the-pine/api exec node --test --test-concurrency=1 dist-test/test/pact-lists-http.test.js` with the Pact API and database environment pointed at the disposable services — 8 passed, 0 failed, 0 skipped.

The live Pact coverage verifies:

- Retrying creation with the same idempotency key returns one Pact; duplicate creator IDs still produce one accepted creator participant. New Pacts are `scheduled` with `sessionId: null`.
- A Circle member who is not a Pact participant and an outside account cannot read or respond to that Pact. Removing a participant revokes Pact and session access.
- An invitee can switch `accepted → declined → accepted` while scheduled. A declined scheduled Pact remains in the `pending` invitation list and is absent from `past`.
- A non-creator cannot start or cancel. Cancellation, expiry through detail/response/cancel/start, and completed checkout all prevent later response, cancel, start or join actions.
- Starting creates the session only on the explicit start request; joining requires an accepted participant and an active session. Checkout completes the Pact after all active participants check out.

## Browser walkthrough

Used two disposable browser accounts in a temporary Circle:

1. Created a scheduled Pact for 2026-10-23 at 15:00 Asia/Saigon. Its detail view showed **Đã hẹn**, the creator once as **Đã nhận lời**, and the invitee as **Chưa trả lời**. No session was started.
2. As invitee, changed the scheduled response to **Không tham gia**, then back to **Nhận lời**. The detail view retained the scheduled status and explained that the choice could be changed before start.
3. Created an immediate Pact. The creator saw **Bắt đầu Pact** as a separate action. Clicking it opened a session with the server-synchronized 05:00 timer; only then could the accepted invitee use **Tham gia phiên**.
4. Checked out both participants. The Pact detail changed to **Đã khép lại** and hid response, cancel, start and join controls.
5. Cancelled the separate scheduled Pact. Its detail changed to **Đã hủy** and likewise hid the Pact mutation controls.
6. Moved one test Pact's `startsAt` back 31 minutes in the disposable database, then refreshed its detail view. The page showed **Đã hết hạn** and hid response, cancel, start and join controls.
7. Confirmed the Circle Pact-list filter is labeled **Lời mời**, which includes scheduled invites that are still awaiting a response or were declined.

The live API suite also exercised expiry reconciliation through detail, response, cancel and start requests. The browser check advanced only a test-owned row instead of waiting 30 minutes. No database schema or public request/response shape was changed for this work; no migration was added and nothing was deployed.
