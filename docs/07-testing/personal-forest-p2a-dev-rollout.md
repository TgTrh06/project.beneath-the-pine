# Personal forest P2A — Dev rollout

Completed 2026-11-03 (Asia/Saigon), after explicit `accept plan rollout P2A dev` authorization. This report supplements the earlier [implementation verification](personal-forest-p2a.md) with actual API/browser/dev-database evidence.

## Target and scope

- Existing database: `btp_review`, `127.0.0.1:5433`, container `beneath-the-pine-local-postgres-1`.
- Existing journal: 0000–0004, verified against repository SQL SHA-256 hashes and timestamps before any migration.
- Applied only `0005_personal-forest-arrangement.sql`; journal now contains six migrations, 0000–0005.
- API: `http://127.0.0.1:8081`; web and allowed browser origin: `http://localhost:5173`.
- No production operation, dependency change, `.env` change or unrelated application-code change.

## Backup, restore and migration

Fresh custom-format backup retained locally:

`.openai/p2a-dev-rollout/btp_review-before-0005.dump`

- Size: 52,830 bytes.
- SHA-256: `03b84823eaba290f17d7ba0194d69a7d4e5e6df20117aad306e6327f13246e49`.
- SQL migration SHA-256: `35ad01318144491b718b9edf2c0ef8c2f0552229266bd15a0227718530758e8a`.

The dump was listed and restored with `pg_restore --exit-on-error --no-owner --no-acl` to an isolated PostgreSQL 17 container on loopback port 5544. Canonically sorted JSON row hashes and counts matched for all 17 public tables. The restored migration journal also matched 0000–0004.

Applied 0005 to the restored copy first. Verified the three new constraints were validated and all existing preference rows received `clearing`, an empty hidden array and version 0. Comparing all original columns across all 17 tables showed no data changes. The comparison excludes only the three newly added preference columns; those are checked separately.

Before applying to dev, rechecked the backup hash, exact pending migration hash, journal and full original-data fingerprints. Applied via the installed Drizzle migrator. All checks repeated successfully on dev: journal count six, three validated constraints, correct defaults and unchanged original data. No table or migration record was dropped.

## Startup and approval-review behavior

Workspace build passed; existing Rollup Zod annotation/shared Three chunk warnings remain. Started the built API as a hidden local process (PID 32508 at rollout), with assistance provider disabled for this run. API readiness reports database UP.

A combined command to start Vite and perform an HTTP health request was rejected by automatic review with only `blocked by policy`. A subsequent standalone `pnpm --filter @pyneath/web exec vite --host localhost --port 5173 --strictPort` command was accepted and runs in tool-managed session 75261. Health checks were then run separately. No policy setting was changed. The web response is HTTP 200; API readiness is UP. Both services are left running for use, subject to their local process/session lifetime.

## Live verification

Used real React, Nest HTTP, Socket.IO and the migrated dev database, with two isolated synthetic accounts. Responses were not mocked. One save request was deliberately aborted to verify network-failure recovery.

- New accounts receive P1-compatible arrangement defaults. Hiding an unearned lantern returns 403.
- Through browser controls, start and close a Solo session with the stuck outcome; save an Open Seed and earn the first memory.
- Save the gathered layout with seedling hidden; independently read the persisted values/version through API and SQL.
- Finish six additional synthetic sessions through the real API. At seven completed sessions, flower and lantern appear while the previously hidden seedling stays hidden.
- Open the editor in two tabs. First save succeeds; stale second save returns 409 and retains its draft. Explicit reload adopts the saved version and the next save succeeds.
- Abort a save request: draft and server version remain intact. Restore network access and save successfully.
- A forged owner query cannot modify another account. Own data export contains layout/hidden/version. Milestone dates/counts and the saved Seed remain unchanged by arrangement updates.
- Log in through the UI in an independent browser context. Saved layout and hidden item state survive login and reload.
- Reset to defaults through UI and verify the persisted values. Controls remain operable at 320px with 200% text; mobile screenshots were inspected.
- Render the saved forest in actual WebGL. Lose the context, switch to the static fallback, then edit/save successfully through the same live API.
- No uncaught browser page errors observed. API stderr was empty at verification.

## Cleanup and retained evidence

Deleted both synthetic accounts through the reauthenticated account-deletion API and verified cascading removal of preferences, personal milestones and Seed. Removed only the seven recorded synthetic session headers left anonymous by the product's deletion behavior. Account credentials were removed from the retained test ledger.

All original columns in 16 of 17 public tables still match the pre-rollout backup. `identity_sessions` changed from one row to zero: the restored backup confirmed that row was expired, and normal identity-session rotation purges expired sessions. No original work/session/Seed/milestone data changed.

Removed the labeled restore container and its anonymous volume; removed the staging dump from the existing container. The host backup and ignored `.openai/p2a-dev-rollout/` evidence remain: hashes, restore/migration results, live checks, screenshots, redacted test ledger and final fingerprints. Orchestration scripts are `.openai/p2a-rollout.cjs` and `.openai/p2a-live-rollout.cjs`.

## Reversal and limitations

The migration is additive. A P1 code rollback can leave the new columns and journal entry in place; do not drop saved arrangements or rewrite migration history. Restoring the pre-rollout backup would discard subsequent work and requires a separately reviewed restore plan.

This is local dev verification, not a production release or physical mobile GPU benchmark. Existing implementation checks (79 web tests, 24 affected API tests, lint and geometry bounds) are recorded in the linked implementation report; this rollout adds live integration evidence rather than repeating the whole test suite.
