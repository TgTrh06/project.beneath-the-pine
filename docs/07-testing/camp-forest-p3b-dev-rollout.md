# P3B — Local dev rollout

Authorized by `accept plan rollout P3B dev`, completed 2026-11-03 (Asia/Saigon). This report covers the existing local dev environment. See [implementation verification](camp-forest-p3b.md) for the broader fixture-based UI matrix.

## Target and preflight

- Database: `btp_review`, `127.0.0.1:5433`, container `beneath-the-pine-local-postgres-1`.
- API: `http://127.0.0.1:8081`; web/browser origin: `http://localhost:5173`.
- Migration hashes and timestamps matched all six entries, 0000–0005. No migration was run.
- API/contracts source and build hashes matched the preceding verified P2B/P3A rollout. The web build was newer than all web source inputs, with the existing 93-test/build evidence retained.
- Source and build manifests were captured and matched again after verification. Existing uncommitted P1–P3B work was preserved. No product source, `.env`, dependency, timeout, pool or rate-limit change was made.
- API and web were started in managed tool sessions. Assistance was disabled for this runtime. No production action, commit or push occurred.

## Backup and restore

Fresh backup: `.openai/p3b-dev-rollout/btp_review-before-p3b.dump`.

- Size: **53,401 bytes**.
- SHA-256: `72464c062083d71c8ba2f4bfbe3fa2ed22edeb060b4571be090df57f63ff3f1f`.
- Backup listing validated; restored with `pg_restore --exit-on-error --no-owner --no-acl` into an isolated PostgreSQL 17 container on localhost:5544.
- Canonically sorted full-row fingerprints matched all **17 public tables** and migration history 0000–0005.
- Current build artifacts and source/build checksums were retained alongside the backup. This snapshot identifies the P3B candidate, not a separately validated prior release.

## Real integration verification

Tests used the real React/Three client, Nest API, Socket.IO and dev PostgreSQL. Three synthetic accounts, two Camps, seven Pacts and eight focus sessions were recorded in a cleanup ledger. Successful HTTP responses were not fabricated. Network failure used a request abort; stale-response checks delayed an actual fetched response.

Passed scenarios:

- Camp A progressed through 0/1/3/7 shared sessions via actual Pact acceptance, start, join and checkout. SQL row counts and milestone dates matched the API, static summary and 0/3/9/14 patch meshes. Duplicate checkout did not add records.
- Progress changes retained the same Three scene and one Canvas. Reload retained seven-session progress.
- Real-data 3D views at desktop and 390px mobile, static 320px views, both themes, 200% root text size and keyboard composer activation passed the functional smoke checks.
- Member selection, composer, Pact board and management remained usable. Aborting the aggregate request removed old patch geometry; retry restored it and preserved the selected member and ten-minute composer duration.
- Reduced-motion scenes stopped advancing frames while settled. WebGL context loss retained the static summary; retry restored the 14-mesh patch.
- A delayed real response for Camp A could not overwrite empty Camp B.
- Removing the member through the API removed Camp A from that account's aggregate; resuming the page cleared its scene and summary. Rejoining restored its existing history.
- An outsider received no Camp data even with forged account/Camp query parameters. Aggregate data contained no private Seed. Logging out and into the outsider account prevented a delayed old-account response from restoring shared progress.
- Archiving Camp A preserved its patch and removed the compose action.
- Personal arrangement saved with its expected version and remained available after reload. Return and Solo showed no shared summary; the synthetic Solo session was checked out normally.
- Completed browser checks recorded no uncaught page errors.

Screenshots were visually inspected. At normal mobile text size, the shared patch and summary remain visible and core actions are clear. At **320px with 200% text**, the existing full-screen Camp title/description and gathering caption can overlap. The action dock and summary remain accessible by keyboard/scrolling. This visual limitation is recorded for a focused layout follow-up; rollout did not modify application CSS. Text enlargement is not a native browser-zoom or physical-device test.

The earlier implementation matrix retains coverage of eight members and additional viewport sizes; this real-data rollout used two-member Camps. Visibility transitions were browser-dispatched events, not physical device backgrounding. Software WebGL observations are not hardware performance benchmarks.

## Runtime stability

Six protected reads per mode were exercised in bounded groups against `/me/return`, `/me/memory/personal` and `/me/memory/camps`, plus an auth-session read in each mode:

| Scene | Measured protected reads | Maximum observed duration |
| --- | ---: | ---: |
| 3D, reduced motion | 6 | 96ms |
| Static | 6 | 40ms |

All expected-success requests in the completed smoke passed. No new 503 or rate-limit interruption was observed; the retained API log contains no server-error records. Three final readiness probes returned HTTP 200/database UP. These small local samples are not SLO or load-test evidence. The cause of the earlier rollout's two 503s remains unknown; see [bounded stability investigation](dev-stability-before-p3b.md).

## Harness corrections

An initial readiness probe incorrectly used `/api/v1/health/ready`; it was corrected to the existing `/health/ready` endpoint before creating data. The first UI pass used Return's `Chế độ nhẹ · Tắt` label for the Camp control, whose off label is `Chế độ nhẹ`. The script was corrected and resumed using the same synthetic accounts and existing seven-session Camp. No product change was needed.

The first pass's 0/1/3/7 evidence is retained under `attempt-1/`. The resumed run completed the remaining checks. Per-request `network.json` is not a complete trace: cleanup rewrote the top-level request file. The separate stability samples, first-pass trace, cumulative scenario results and API log are retained; no total-request coverage claim is made.

## Cleanup and handoff

- All three synthetic accounts were deleted through reauthenticated API requests. Camp, Pact, participant, milestone, preference and Seed cleanup was verified.
- Only the eight recorded focus-session headers were deleted with ID and null-owner guards after account deletion. Ten anonymous identity-session hashes had been tracked; none remained to delete at final cleanup.
- All **17 public-table fingerprints match the pre-rollout baseline exactly**. Migration history remains 0000–0005.
- Synthetic passwords were removed from the retained ledger.
- The labeled restore container and its anonymous volume were removed. The exact staging dump in the dev container was removed. Host backup, build snapshot, redacted ledger, logs, results and screenshots remain in ignored `.openai/p3b-dev-rollout/`.
- API PID **8736**, managed session **58542**, and Vite PID **22520**, managed session **35497**, remain running at handoff, subject to local process/session lifetime.
- Final checks: readiness 3/3 HTTP 200/database UP, web HTTP 200, anonymous Camp aggregate HTTP 401, source/build manifest unchanged, and `git diff --check` with no whitespace errors.

Scripts: `.openai/p3b-rollout.cjs`, `p3b-live.cjs`, `p3b-clean.cjs`. Evidence includes `backup.json`, `restore-result.json`, `manifest.json`, `live-results.json`, `stability.json`, `attempt-1/rendering.json`, `after-runtime.json`, `final-status.json`, `api.log` and `live-*.png`.

## Reversal boundary

There is no schema rollback. On runtime failure, stop only the newly started API/web processes and preserve the database. Restoring the database could overwrite subsequent work and requires a separate reviewed plan. No reset/revert of the existing uncommitted source is authorized by this rollout.
