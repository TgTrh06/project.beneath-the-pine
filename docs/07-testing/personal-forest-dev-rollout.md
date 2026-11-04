# Personal forest P1 — local dev rollout, 2026-11-03

## Authorization and target

The user approved the dev rollout, then explicitly approved the revised `0003 + 0004` scope after read-only inspection found that the existing database had only migrations `0000–0002`. This is a local dev rollout, not a production release.

- Existing container: `beneath-the-pine-local-postgres-1`, PostgreSQL 17 Alpine.
- Existing volume: `beneath-the-pine-postgres-local`; preserved in place.
- Database: `btp_review` at `127.0.0.1:5433`.
- Web: `http://localhost:5173`; API: `http://127.0.0.1:8081`.
- Existing `.env` files and Compose configuration were not rewritten. API/web were launched as hidden local processes. Assistance was disabled in the API process environment for this verification; no provider requests were needed.

## Backup and migration evidence

Applied migration hashes and journal timestamps matched the repository. The three new tables were absent before the rollout.

Created a PostgreSQL custom-format backup at `.openai/p1-dev-rollout/btp_review-before-0003-0004.dump` (48,035 bytes). SHA-256: `3243fcdde924254ebf2b561dd0af2974452b66752eda49e7430b51a8847774d2`. The backup contains private local database data, is ignored by Git, and must remain local.

The dump was listed successfully, restored into a separate disposable PostgreSQL container on port 5544, and compared against the source using count plus SHA-256 of canonically ordered JSON rows for every public table. All 14 existing tables matched. Both pending migrations were applied to the restored copy and then to dev using the existing Drizzle migration process:

1. `0003_account-preferences-and-pact-reminders`
2. `0004_personal-forest-milestones`

After each migration run, the journal had all five expected entries and all eight constraints across the three new tables were present. All 14 pre-existing table fingerprints remained unchanged immediately after migration, before starting the application.

On the restored copy, the personal-memory service was also checked against all three pre-existing accounts with completed history: lifetime counts and expected 1/3/7 thresholds matched independent SQL counts. This did not materialize memories for those accounts in dev; they remain derived on their next normal read.

## Live checks

Browser checks used the real React client, Nest API, Socket.IO and migrated dev PostgreSQL. No success payload was mocked. One scenario deliberately aborted only the personal-memory request to verify error recovery.

| Area | Observed result |
| --- | --- |
| Registration and target identity | Synthetic accounts registered through the same-origin API; SQL verified they existed in the intended dev database. |
| Preferences (`0003`) | Default presence sharing and Pact reminders were off. Preset/presence save and read worked. |
| Reminder receipts (`0003`) | An accepted upcoming Pact produced no reminder while disabled; opting in allowed one claim, and the next claim returned none. |
| First Solo / Open Seed | Browser start → `stuck` checkout → saved Seed → Return showed first milestone and the Seed. |
| Outcomes, duration and retries | All four outcomes counted equally. 5- and 50-minute choices each counted once. Repeated and simultaneous checkout requests did not increment twice. |
| Thresholds | Exactly three milestones appeared at counts 1, 3 and 7. |
| Pact | Early checkout did not increase personal progress while the shared session remained active. Both joined participants counted once after final closure. Outsider access to Pact/session returned 404. |
| Ownership and export | Supplying another account ID in the memory query did not change the authenticated owner. A's export contained three personal milestones; B's contained its one. No private Seed appeared in B's memory projection. |
| Separate login context | A separate browser context logged in through the UI, displayed persisted milestones and dates, and retained them on reload. Keyboard navigation reached Memory. Historical reload did not replay unlock notices. |
| Responsive UI | Return/Memory were exercised at 320, 390, 768 and 1440 px with both themes. Journal text reflowed at 200% without horizontal overflow. |
| Memory network failure | Aborting only the personal-memory request preserved the intention draft and left start usable. Retry restored real server progress. |
| 3D/fallback | The seventh-session geometry rendered with live progress. Simulated WebGL context loss retained the static earned mark and usable main UI. |
| Natural expiry | A five-minute session ran to its unmodified server deadline. The UI reconciled completion, displayed the first milestone and saved a new Open Seed. SQL confirmed the original duration was 300,000 ms and completion was at/after `ends_at`. |
| Deletion | Test accounts were deleted through the account API and their personal memories cascaded. Recorded orphan session headers were removed by their exact test IDs. |

The affected API suites were rerun on the isolated restored PostgreSQL service: **19 tests passed, zero failures, zero skips** (personal memory, core lifecycle, privacy and HTTP foundation). Existing pg single-client concurrency deprecation notices remain in test harnesses.

Early verification attempts needed harness corrections: the reminder POST correctly returns 201, and a static-scene initialization override had to be removed from the 3D scenario. One resumed browser authentication load required a reload; the subsequent independent UI login and completed scenarios passed. No application code change was required in this rollout.

## Cleanup and final state

Removed six synthetic accounts in total (including three from an interrupted verification attempt), nine recorded test sessions, the test Camp and all account-dependent milestones/preferences/reminder receipts/events. Cleanup verified zero remaining rows for the recorded test IDs. After runtime verification, 13 of the 14 original public table fingerprints still matched the pre-rollout backup; only `identity_sessions` differed, consistent with the application's login/logout and expired-session cleanup behavior. No original work/session/Seed data differed.

The disposable restore container and its volumes were removed after ownership-label verification. The temporary in-container dump was removed; the verified host backup remains. Synthetic passwords were removed from the retained test ledger after account deletion.

Dev PostgreSQL, API and web remain running for use. Final checks returned HTTP 200 for the web and `UP` for both API liveness and readiness. Process IDs and synthetic evidence are in ignored `.openai/p1-dev-rollout/`; API/web logs are local. The completed browser scenarios recorded no uncaught page errors.

## Limits and reversal

The browser was headless Edge/Chromium with software WebGL; responsive viewports are not physical-device GPU/battery measurements. A second browser context verifies separate authentication and persistent server state, not a physical second device. No real screen-reader speech walkthrough, production deployment or retention study was performed.

Code rollback can leave the additive tables unused. Do not drop the new tables or restore the backup over dev without separate authorization: either can lose post-backup changes. The backup has already passed restore validation and is retained for recovery planning.
