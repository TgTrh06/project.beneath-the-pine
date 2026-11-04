# P2B + P3A — Local dev rollout

Authorized by `accept plan rollout P2B + P3A dev`, 2026-11-03 (Asia/Saigon). This report covers the existing local dev environment only. Implementation evidence remains in [P2B](personal-forest-p2b.md) and [P3A](camp-forest-p3a.md).

## Target and preflight

- Database: `btp_review`, `127.0.0.1:5433`, container `beneath-the-pine-local-postgres-1`.
- API: `http://127.0.0.1:8081`; browser origin/web: `http://localhost:5173`.
- Verified all six migration journal entries against repository SQL hashes and timestamps: 0000–0005. No migration was run.
- Source and existing build artifacts were fingerprinted; artifact timestamps were newer than the relevant source. Existing implementation checks were retained rather than repeating unaffected tests.
- API and web ports were closed at preflight. Started the built API as a hidden process, with assistance disabled for this runtime, then started Vite on the approved origin. No `.env`, dependency or product-source changes were made.
- Readiness returned HTTP 200 with database UP. Anonymous `GET /api/v1/me/memory/camps` returned 401.

## Backup and restore evidence

Fresh custom-format backup: `.openai/p2b-p3a-dev-rollout/btp_review-before-p2b-p3a.dump`.

- Size: 53,401 bytes.
- SHA-256: `51b556a58491384a1ac3106083a5d934c3682bbb440ee3e87c953793a497cbea`.
- Backup listing validated. Restored with `pg_restore --exit-on-error --no-owner --no-acl` into an isolated PostgreSQL 17 container on localhost:5544.
- Canonically sorted full-row fingerprints matched all 17 public tables, including all P2A preference columns. Restored migration history also matched 0000–0005.
- Source/build manifest and a copy of current build artifacts are retained alongside the backup. These identify the tested P2B/P3A candidate; they are not represented as an independently verified P2A rollback release.

## Live verification

Completed against real React, Nest HTTP, Socket.IO and PostgreSQL. Responses were not fabricated. Network failure was tested by aborting a request; stale-response behavior was tested by delaying an actual API response. Evidence spans three synthetic-data batches plus a final continuation using the third batch.

- P2B: real UI checkout at milestones 1, 3 and 7 saved the Seed, showed the matching static illustration and played look/sniff/stretch respectively. Expiration returned to ambient behavior. Route exit and hidden-tab transitions stopped playback; motion toggles, static fallback, reload and account switching did not replay old milestones. The static notice remained available in light mode.
- P2A regression: the gathered layout with seedling hidden saved through the browser and persisted through reload, with expected server version. Seed remained intact.
- P3A: created three Camps through the API, including an empty Camp and a three-session Camp later archived. A seven-session Camp was checked at 0/1/3/7; counts and original milestone dates matched SQL reads. Repeated checkout did not mint duplicate records.
- Real UI Camp selection showed separate histories, reset pagination and rendered archived/empty states. Native keyboard selection and 320/390px layouts passed in both themes with 200% text and no horizontal overflow. Mobile and Marten screenshots were visually inspected.
- A nonmember with forged account/Camp query parameters received no Camp data. The aggregate contained no private Seed. Removal revoked both summary and history; reinvitation restored previous shared history.
- A failed request removed the old journal and retry recovered current access. A delayed real response did not restore a Camp after leaving and reopening the tab. Switching to the outsider account removed the previous account's Camp data and did not replay personal milestones.
- Completed browser checks recorded no uncaught page errors. Visibility changes were dispatched browser events, not physical device backgrounding.

### Harness corrections and runtime observations

Early harness attempts stopped because the saved-Seed UI requires choosing another task before the composer appears, and because API-created intermediate sessions can leave an already-mounted Return snapshot stale. The test was corrected to follow the Seed action and reload Return before the next tested completion. A delayed-response harness also needed its interception retained until completion instead of removing it mid-flight; the remaining checks then passed against the existing synthetic accounts. None of these corrections changed product source or environment configuration.

The API error log recorded two intermittent HTTP 503 responses during testing. A cleanup request was retried successfully; final authenticated scenarios and cleanup completed. Root cause was not established. The database log showed no statement-timeout, deadlock or connection-exhaustion markers in the inspected interval. Five final readiness checks returned 200/database UP. This is a local dev observation to monitor, not a claim of error-free runtime reliability.

## Cleanup and final state

Across all batches, nine synthetic accounts, 25 session IDs, three Camps and ten Pacts were tracked. Accounts were removed through reauthenticated deletion, cascade results verified, and only recorded anonymous synthetic session headers were removed with guarded ID-based SQL. One anonymous auth-probe session was removed by its exact generated CSRF value and null-account condition. Credentials were removed from retained ledgers.

All 17 public-table full-row fingerprints match the pre-rollout backup exactly after cleanup. Migration history remains 0000–0005. Source and build checksums still match the rollout manifest.

Removed the labeled restore container and its anonymous volume, plus the exact staging dump in the dev container. The host backup, current-build snapshot, redacted ledgers, checksums and screenshots remain under ignored `.openai/p2b-p3a-dev-rollout/`. Scripts are `.openai/p2b-p3a-rollout.cjs`, `.openai/p2b-p3a-live.cjs`, `.openai/p2b-p3a-clean.cjs` and `.openai/p2b-p3a-finish.cjs`.

API PID 25644 and Vite tool session 21859 were left running at handoff, subject to local process/session lifetime. Final checks: readiness 200/database UP, anonymous Camp summary 401, web 200. No production deployment, schema migration or application-code change occurred in this rollout.

## Reversal boundary

No schema rollback is needed. On runtime failure, stop only the newly started app processes and keep the database intact. A database restore would overwrite later work and requires a separate reviewed plan. Existing uncommitted P1–P3A source is preserved; no reset, revert, commit or push is part of this rollout.
