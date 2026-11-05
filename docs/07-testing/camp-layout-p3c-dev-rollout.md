# P3C — Local dev rollout

Authorized by `accept plan rollout P3C dev`, completed 2026-11-03 (Asia/Saigon). See [implementation verification](camp-layout-p3c.md) for the full fixture-based viewport matrix.

## Target and transfer

- Web: `http://localhost:5173`; API: `http://127.0.0.1:8081`.
- Database: `btp_review`, `127.0.0.1:5433`, container `beneath-the-pine-local-postgres-1`.
- All six baseline/candidate checksums matched `.openai/p3c-validation/handoff.json`; no conflicting edits were found. Vite was not running before transfer.
- Copied exactly four source files (`AppLayout.tsx`, `CampView.tsx`, `CampLodge.tsx`, `lodge.css`) and two documentation files from the isolated P3C worktree. Original existing files were backed up under `.openai/p3c-dev-rollout/source-before/`.
- Post-transfer source checks confirmed only those four application files changed from the rollout baseline. No API, contract, `.env`, dependency, migration, timeout or rate-limit change was made. All earlier uncommitted P1–P3B work was preserved. No commit, push or production action occurred.
- API and web were started in managed sessions with assistance disabled for this API runtime.

## Backup

Fresh custom-format database backup: `.openai/p3c-dev-rollout/btp_review-before-p3c.dump`, **53,401 bytes**, SHA-256 `ed72bcb6ee8d3359bee0175603893d2f4dc2f02716eed43cec3688872cce22b7`.

The backup was restored into a labeled disposable PostgreSQL 17 container on localhost:5544. All **17 public-table full-row fingerprints** and migration hashes/timestamps **0000–0005** matched. No migration was run. The pre-transfer source/build manifest and build snapshot are retained with the backup.

## Integrated checks

- Web tests: **22 files, 93 tests passed**.
- Web build, including TypeScript: **passed**. Existing dependency-annotation and large-3D-chunk warnings remain.
- Real HTTP/browser smoke used two synthetic accounts, one Camp, one Pact and two focus sessions. React/Three, Nest, Socket.IO and PostgreSQL were real; successful responses were not fabricated. A network-failure check aborted the actual aggregate request.

Passed observations:

1. An empty Camp progressed to one shared session through actual acceptance/start/join/checkout. Its seedling appeared with the expected three meshes.
2. A long Camp name reflowed at **320/390/1440px**, in both themes and **100%/200% root text size**, without navigation/title/bottom-content overlap or horizontal overflow. Resizing retained the scene and one Canvas. Static and 3D screenshots were visually inspected.
3. At **320×480**, Menu, roster, Pact board and management were reachable; closing dialogs restored focus. Selected member, ten-minute duration and scheduled datetime survived resizing the open composer to 390×480. Hit testing verified focused controls were not covered.
4. Display controls remained operable. An aborted progress read showed an accessible retry, and retry restored current data.
5. Removing the real member revoked shared data and showed accessible recovery. Archiving the Camp kept its archived status visible at 320×480/200% and removed compose.
6. Return did not inherit Camp navigation; a real Solo session retained the original absolute scene/stage positioning and was checked out normally.
7. Completed browser checks recorded **no uncaught page errors**. No server-error or rate-limit interruption was observed, and the retained API log contains no new server-error record. The cause of older P3B-era 503 observations is still unknown.

This rollout used two-member Camps and the 0/1 transition. The implementation report retains eight-member, 0/1/3/7 and intermediate-width coverage. Root text enlargement and a reduced viewport were tested; native browser zoom, a physical mobile keyboard and hardware GPU benchmarks were not.

## Cleanup and handoff

- Both synthetic accounts were deleted through reauthenticated API calls. Related Camp, Pact, milestones, preferences and Seeds were verified removed.
- Only the two recorded session headers were deleted with ID and null-owner guards after account deletion. No tracked anonymous identity sessions remained for deletion. Synthetic credentials were removed from the retained ledger.
- All **17 public-table fingerprints match the pre-rollout baseline exactly**; migration history remains 0000–0005.
- Removed the labeled restore container and anonymous volume, and the exact staging dump in the dev container. Host backup, original-file copies, manifest, redacted ledger, logs and screenshots remain under ignored `.openai/p3c-dev-rollout/`.
- Final probes: readiness **3/3 HTTP 200/database UP**, web **200**, anonymous Camp aggregate **401**.
- API PID **14340**, managed session **27845**, and Vite PID **8512**, managed session **33077**, remain running at handoff, subject to local process/session lifetime.

Evidence includes `backup.json`, `restore-result.json`, `handoff.json`, `manifest.json`, `candidate-manifest.json`, `live-results.json`, `live-network.json`, cleanup `network.json`, `after-runtime.json`, `final-status.json`, `api.log` and `live-*.png`. The explicit API-call traces do not cover every browser request. Scripts are `.openai/p3c-rollout.cjs`, `p3c-live.cjs` and `p3c-clean.cjs`.

## Reversal boundary

There is no schema rollback. If needed, stop the newly started web process and restore only the transferred files from `source-before/`, checking for intervening edits first. Do not reset the wider uncommitted working tree. A database restore could overwrite later work and requires a separately reviewed plan.
