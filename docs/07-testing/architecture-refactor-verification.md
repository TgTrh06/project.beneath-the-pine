# Architecture refactor — implementation and verification, updated 2026-11-09

Status: completed for the approved architecture refactor, 2026-11-09. This accepts source organization and the checks below; it does not accept a trained model or authorize deployment. Earlier slice results are retained as history and superseded by the whole-workspace evidence.

## Whole-workspace checks, 2026-11-09

- `pnpm lint` passed: backend 118 files and web 143 files, including architecture checks.
- `pnpm test` passed: API 94 passed / three separately executed live-suite skips; web 107 Vitest plus two architecture tests; two root audit-parser tests. The separate HTTP runner subsequently passed all 24 tests with no skips. Solo/Pact use the container URL; Camp invitations use an in-process Nest test application against the same disposable PostgreSQL database. The 24 tests are not all container-network tests.
- `pnpm build` passed for all workspace packages, with existing web chunk/annotation warnings. ML offline scoring was first attempted while API build was replacing `dist`, which caused a missing compiled policy module; rerunning after build completed passed all 35 tests. CI already sequences build before ML and does not have that overlap.
- `pnpm audit:security` initially timed out contacting the registry. A later retry passed the existing policy: zero unknown findings, one low and three moderate findings covered by existing development-tool exceptions, zero high/critical findings. No audit rule or dependency was changed; this is not a claim of zero vulnerabilities.
- Docker 29.5.3 resumed with the original labelled disposable PostgreSQL 17 container on loopback port 55432; existing migrations reconstructed its tmpfs database. API image `pyneath-api:refactor-test` built successfully, digest `sha256:c7133fc43545217fa209ca3f90d19fee193fa1c4f25bce61016b7e3d202cd29b`. The container ran as `node` on loopback port 18081 with Assistance disabled; liveness/readiness and Docker health passed. The existing persisted database on port 5433 was untouched.
- Current protected-source check: 32 files byte-identical; eight schema files differ only in imports. No contract, prompt/config or migration changes.
- Local command logs: `.git/pyneath-refactor-baseline/workspace-{lint,test,build}.log`, `workspace-audit-retry.log`, `container-build.log`, `container-http.log`. These are local executions of CI checks, not a remote GitHub Actions result. No commit, push or deployment was performed by this completion step.

## Acceptance against the approved phases

| Phase | Delivered | Evidence |
| --- | --- | --- |
| Baseline and boundaries | Saved existing Local AI work, ownership/transaction ledger, ADR-0030 | Baseline manifest/diff and protected-source comparison |
| Backend foundation | Pure kernel, opaque UnitOfWork, stable business errors, Assistance/Analytics/Profile/Seed ports | Architecture negative tests; quota, ownership, provider/fallback regression tests |
| Core modules | Identity, Camp/Pact/Focus/Presence, Memory/Preferences, Privacy separated by responsibility | Real PostgreSQL rollback, isolation, concurrency, authorization and after-commit tests; HTTP/socket regression suites |
| Web | Grouped API clients, session and Assistance orchestration, shared scenes, explicit feature entries | 107 Vitest + two architecture tests, lazy chunk build, browser flows below |
| ML and legacy | Common validation/identity/checkpoint rules, thin compatible CLIs, owner workflows; unused FastAPI/Maven removed | 35 ML CPU + 10 historical dataset tests; 16 CLI help comparisons; protocol and dataset parity |
| Workspace acceptance | Removed transitional exports, enforced backend/web/Python boundaries, container and browser verification | Local CI-equivalent checks above; no deployment or GPU claim |

No runtime dependency, database migration or public contract was added by the refactor. Backend schema exceptions are the 20 explicit pre-existing foreign-key/read-model edges, not permission for new cross-owner writes. The dependency graph and ownership ledger are in `docs/04-engineering/module-ownership.md`; operational structure is in `repository-structure.md` alongside it.

## ML refactor and legacy removal

- Shared file/checksum, protocol, dataset/review, frozen-manifest, config and checkpoint logic now belongs to `ml/common`. Training keeps environment validation, tokenization/collation and QLoRA orchestration. Evaluation and export use the same checkpoint verifier without importing training internals.
- Existing training/evaluation/export CLI modules now parse and dispatch to implementation modules. Candidate authoring lives in `ml/authoring`. All 11 captured module `--help` outputs and five historical dataset script `--help` outputs match the pre-refactor text and exit status; documented direct-file wrappers also work outside the repository working directory. The notebook still uses the same entry point and needs no change.
- AST comparison confirms the 29 moved helper functions/classes preserve their non-import implementation exactly. No dataset, prompt, token mask, seed, budget or review status was edited. No GPU/runtime dependency was installed or model downloaded.
- Python architecture checks cover 46 source files, reject cross-workflow/shared-layer violations and CLI imports, and detect cycles. Function-local and literal dynamic imports are included; computed dynamic import paths remain a review concern. Nine focused architecture/CLI tests passed.
- Full ML CPU suite: 35 passed; historical v1 dataset suite: 10 passed. Zod protocol export check passed with contract SHA-256 `b843f4bd7708e641210e386b22dfedb631f438ce466f5e25c0768699ae883247`. Logs: `.git/pyneath-refactor-baseline/ml-test.log` and `ml-v1-test.log`.
- Reference audit (`git grep`, package scripts, CI, launcher and runbooks) found no product/CI consumer of the FastAPI app/tests/dependency declaration or Maven configuration. Removed those five tracked files; updated the inference environment example to the launcher's existing `PYNEATH_INFERENCE_TOKEN`. The standalone launcher is unchanged. No `.env`, virtualenv, private dataset or weight was removed. ADR-0029 now points to the superseding retention decision in ADR-0030; historical security evidence is retained.
- Historical dataset CLI implementations also moved to authoring/common/evaluation modules; their paths and flags remain. The 600-row fictional v0 generator output is byte-identical before/after refactor. All six existing v1 output checksums still match their frozen manifest. New v1 generations record the moved implementation hash; historical manifests are untouched. Removed one tracked generated Python bytecode file; source and the existing ignore rule are authoritative.
- The v2 candidate generator recreated all four draft/review files byte-for-byte in a temporary directory. Existing private data remained unchanged: 1,500 draft examples, zero approved examples, no independent final holdout. Human review remains required before formal training.
- CI now runs Python boundary checks before offline tests. GPU smoke/resume, QLoRA training, model-quality review, GGUF/runtime benchmark and deployment have not run in this refactor; the CPU tests prove pipeline guards, not successful GPU execution.

## Web refactor — code validation and browser evidence

- Shared HTTP transport is separate from nine API client groups; callers import their group directly. The old all-in-one client is removed. CSRF, cookie credentials, 401 session expiry, explicit idempotency keys, safe errors and payload-free logging are unchanged.
- `useAppSession` owns initialization and intended-route restoration. `useAssistance` owns request/config/telemetry/focus effects, with a pure reducer for pending/result/draft/error transitions; `AssistanceCoach` renders the controls.
- Common forest/Marten code lives in `shared/scene`. Camp owns membership selection and composes its Memory growth through a lazy Camp canvas adapter. Shared code imports no feature. Public feature entries have separate control/scene surfaces to avoid eager canvas imports.
- Web lint passed with 143 TypeScript files, no runtime import cycles and no eager Three.js path from `main.tsx`. Build passed; all canvas chunks remain separate. Existing Zod annotation and large-chunk warnings remain.
- 107 Vitest tests and two Node architecture tests passed. New tests cover stale/in-flight/unmounted Assistance responses, duplicate submits, explicit edit/select/discard/break, malformed output, timeout, login destination restoration, retry, session expiry and failed logout. The CPU hook fixture tests orchestration; it does not replace browser rendering checks.
- Chrome baseline: landing and Return inspected before moving scenes; 320px Return had `scrollWidth = innerWidth = 320`. After refactor, the same synthetic account retained its draft across Camp navigation, light/night Return remained readable at 320px, and keyboard Tab reached a duration control with a solid focus outline.
- Browser Solo: started a five-minute synthetic session, opened recovery, edited the local recovery draft, explicitly started a two-minute break, resumed, checked out with progress and a new Open Seed. Return showed the exact saved Seed and first milestone. No browser console errors were captured. Default viewport restored after responsive checks.
- Browser Pact: created a synthetic Camp/Pact, joined with a synthetic peer, started the session, edited recovery and explicitly began a two-minute break. Stopping the test API produced the disconnected state; guarded resume showed the fixed synchronization message and preserved the draft. Restarting the API reconnected and allowed resume/checkout. Test-only expiry of this account's sessions returned the browser to login; login restored the intended Camp route, and Return retained the exact earlier draft.
- Assistance browser checks used a temporary local Vite HTTP fixture, not a real model or external provider. Assisted Start covered edit/use/discard, delayed stale output and HTTP failure with input retained. Recovery showed a break suggestion without changing the timer, then started the existing two-minute break only on explicit click. Open Seed filled the editable draft; a database read confirmed no Seed before checkout, and explicit checkout saved the exact edited text. The fixture was stopped and normal Vite restored; Assistance controls were absent with the demo flag off and the real backend remained disabled.
- Real Chrome zoom: automatic access to browser settings was blocked, so the user set 200% manually and confirmed it. Observed pixel ratio 2; Return had `innerWidth = scrollWidth = 359`. At a 320 CSS-pixel viewport, both light/night had `innerWidth = scrollWidth = 320`. Open Seed controls were also inspected at 200%; viewport override was reset afterward. No horizontal overflow was observed. This supersedes the earlier unsuccessful zoom attempts.
- Before/after evidence combines initial landing/Return captures, post-refactor workflows and unchanged styling: all three relocated CSS files match their original line content, and Pact/Session view diffs only adjust imports. This is not a claim that every view has a pixel-diff baseline.
- Contrast calculation for unchanged forest tokens against their surface: light ink/muted/accent/focus = 11.13/5.91/6.29/7.35:1; night = 10.60/7.59/6.69/8.98:1. These solid-color pairs exceed normal-text or focus requirements as applicable; translucent/image surfaces and a full accessibility audit are outside this measurement. Keyboard focus was observed; CPU tests cover live-region/focus behavior, not a manual screen-reader certification.
- Local screenshots: `.git/pyneath-refactor-baseline/return-after-expiry.png`, `return-zoom-200.png`, `open-seed-zoom-200.png`, `return-320-night.png`, `return-320-light.png`.
- Logs: `.git/pyneath-refactor-baseline/web-lint.log`, `web-test.log`, `web-build.log`. Browser evidence uses fictional data in the isolated local test database only. No model was enabled or called.

## Latest verified slice: Focus, Memory/Preferences, Privacy and final backend exports

- API lint/type checks passed: 118 source files, no import cycles. Public module interfaces contain no ORM/schema or concrete-service exports. The 20 existing foreign-key/read-model edges are enumerated in `schema-access.json`, with negative checks for new edges and foreign-table writes.
- API build passed. The PostgreSQL-enabled compiled API suite passed 94 tests, zero failures; the three live-HTTP suites skipped by that command all ran separately and passed 24 tests with zero skips/failures against the fresh build on port 18081.
- Focus failure injection verifies Pact activation and Seed writes roll back with session state; a second PostgreSQL connection observes committed Focus completion before derived Memory work. Preferences verifies persistence precedes sharing events and omitted settings remain unchanged.
- Privacy retains the exact export fields and delegates data access to owners. PostgreSQL injection after account deletion verifies rollback of successor promotion, Camp transfer, sole-owner Camp deletion and cascading Seed deletion. A second connection verifies account-deletion notification occurs after commit. The new observation query initially used the wrong physical table name; after correction, the focused test and complete suite passed.
- Of 40 protected baseline files, 32 remain byte-identical. Eight schema files change only import paths; their non-import content is identical to the committed baseline. Contract, migration history and ML configurations are unchanged. Whitespace checks passed.
- Full command logs for this local slice are in `.git/pyneath-refactor-baseline/`: `api-lint.log`, `api-build.log`, `api-test-final.log`, `privacy-test.log`, `api-http-final.log`. These contain synthetic test metadata only.
- At this slice, web/ML refactoring, browser comparison and container acceptance remained; subsequent sections above record newer evidence.

## Earlier verified slice: Camp and Pact

- API lint/type checks passed: 102 source files, no import cycles; legacy public-export groups reduced from 12 after Identity to 10.
- API build passed. PostgreSQL-enabled API suite passed 90 tests, with three live-HTTP suites skipped in that command and executed separately.
- All 24 live HTTP tests passed against the freshly rebuilt API on port 18081; zero failures/skips. Covers invitation/membership races, archive, Pact lifecycle, Solo concurrency, checkout/Seed idempotency, expiry and authentication.
- Real PostgreSQL injection tests prove owner transfer and invite-accept rollback, no telemetry on failed acceptance, cross-owner Camp/Pact archive rollback, and committed Pact expiry before conflict.
- Socket tests verify all three business-error mappings and removal of room subscriptions.
- All 40 protected baseline contract, schema, migration and ML-configuration files remain byte-identical. Diff whitespace check passed.
- No web, GPU or model checks were rerun for this backend-only slice. Their earlier evidence below is historical; remaining refactor phases still need their own validation.

## Preserved baseline

Before source migration, saved 654 source-file checksums, the tracked diff and 34 untracked files under `.git/pyneath-refactor-baseline/`. This preserves the prior uncommitted Local AI implementation. API baseline lint passed with 73 source files; baseline tests passed 52, skipped 10 database/live tests, failed zero.

## First implemented slice (historical)

- Shared framework-independent transaction interface, opaque context and business-error codes. PostgreSQL resolves contexts only inside the owning transaction; HTTP maps business errors to the existing redacted envelopes.
- Assistance application orchestration, domain policy and presentation separated from provider implementations. OpenAI and local providers now return the same internal validated-output shape. External wire contracts and provider request behavior remain unchanged.
- Analytics use cases and metadata policy separated from SQL; quota still locks globally, counts UTC global/account usage and inserts the reservation in the same transaction.
- Profile and Seed use cases, typed ports, repositories and presentation composed through NestJS factories. Existing Camp/Pact/Focus consumers use Analytics/Profile/Seed injection tokens instead of concrete cross-module service imports.
- Boundary checks reject inward shared-kernel/domain imports and new implementation exports through public interfaces. Fifteen legacy export groups remain explicitly inventoried; they are unfinished migration work.
- Added transaction-context, profile-patch, quota-order and business-error tests. Added a PostgreSQL test exercising rollback/commit across Profile, Seed and Analytics owner repositories.

## First-slice executed evidence (historical)

| Check | Result |
| --- | --- |
| API lint/type checks | Passed; 88 source files, no import cycles |
| API tests after first slice, before Docker recovery | 57 passed, 11 skipped, zero failures |
| API suite with isolated PostgreSQL after Docker recovery | 82 passed, 3 live-HTTP suites skipped pending separate execution, zero failures |
| Separate live Solo/Pact/Camp HTTP suites | 24 passed, zero skipped, zero failures; covers all three suites skipped by the main run |
| Owner repository transaction test | Passed on PostgreSQL: rollback/commit across three owners and repeatable-read snapshot across two connections |
| API build | Passed |
| Web regression tests | 94 passed across 22 files |
| Web production build | Passed; existing large-canvas-chunk and third-party annotation warnings remain |
| ML CPU tests | 26 passed |
| Shared protocol check | Passed, revision `pyneath-assistance-v2.1` |
| Baseline checksum comparison | All 39 protected contract/schema/migration/ML-config files unchanged |
| Diff whitespace check | Passed |

The owner-repository rollback test was initially skipped, then executed successfully after Docker recovery. It now verifies actual PostgreSQL rollback/commit and repeatable-read isolation; the fake-driver unit tests separately verify context ownership, lifetime and option forwarding.

The separate live HTTP run completed all three previously skipped suites against the built API on port 18081. Covered concurrent starts, idempotent checkout, private Open Seeds, expiry, access revocation, invitation acceptance/decline races, archive races and cursor ownership. The first-slice PostgreSQL gate is now satisfied; project-wide acceptance still requires the remaining migrations and their own regression runs.

## Environment gate and remaining work

Docker Desktop was started for local disposable-database testing. Its backend failed to initialize the `dockerInference` socket; the Linux engine is unavailable. No Docker reset, update installation, existing-database migration or production change was performed. The hanging read-only Docker query was stopped after the backend failure was confirmed.

The user chose to restore Docker. Docker subsequently answered with server version `29.5.3`. Created a separate test container `pyneath-refactor-test-pg` from the already available `postgres:17-alpine`, bound only to `127.0.0.1:55432`, with PostgreSQL data on tmpfs. The existing local PostgreSQL container and its persisted volume were left untouched. Existing migrations were applied only to the new disposable test database. PostgreSQL suites passed; the earlier skipped results above remain historical evidence. A separate API test process on port 18081 serves this disposable database for the live HTTP suites.

Added explicit transaction isolation options after identifying existing `repeatable read` queries in Focus. Eight focused foundation/boundary tests passed, including default/explicit isolation forwarding. A subsequent real PostgreSQL test confirmed snapshot stability while another connection commits a Profile update. PostgreSQL suites emitted existing `pg` warnings about concurrent queries on a single client; no assertions failed.

Identity conversion passed API build, 86 API tests with PostgreSQL (three live suites run separately), and all 24 live HTTP tests before the pause. Four new application tests verify rotation failure emits no revocation/cookie, successful persistence precedes notification, absent-account login still verifies a dummy password, and failed logout emits no revocation. The PostgreSQL identity test also injects a duplicate-token collision and verifies the old-token deletion and expired-session cleanup roll back.

After resuming on 2026-11-08, the workspace contained commits `516c7e5` (Local AI) and `512c10a` (first refactor slices), with no pending changes. Docker was restarted; only the existing labelled tmpfs test container on port 55432 was started. Existing migrations recreated its disposable database after tmpfs loss. Camp application/domain/repository separation and transaction-context handoff through Pact/Focus passed lint, build, 87 PostgreSQL-enabled API tests and all 24 live HTTP tests. The subsequent Pact application/repository conversion passed lint and 90 API tests (three live suites still run separately). A new PostgreSQL test verifies owner transfer rollback, failed invite acceptance rollback/no telemetry, and the existing rollback of an expired invitation marker. This is not yet project-wide acceptance.

Pact no longer writes Camp tables directly; archive uses Camp owner ports within the same opaque transaction. Added real PostgreSQL failure injection after Pact expiry and Camp invitation revocation to verify both roll back on a failed Camp update. A separate assertion confirms response-triggered Pact expiry commits before conflict. Three socket tests verify framework-independent business errors retain their wire codes and remove the room subscription. Whole-workspace, web/ML and container evidence above supersedes these intermediate slice statuses. No deployment or training is authorized by this report.
