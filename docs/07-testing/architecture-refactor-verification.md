# Architecture refactor — first slice, 2026-11-07

Status: in progress. This report does not accept the project-wide refactor.

## Preserved baseline

Before source migration, saved 654 source-file checksums, the tracked diff and 34 untracked files under `.git/pyneath-refactor-baseline/`. This preserves the prior uncommitted Local AI implementation. API baseline lint passed with 73 source files; baseline tests passed 52, skipped 10 database/live tests, failed zero.

## Implemented slice

- Shared framework-independent transaction interface, opaque context and business-error codes. PostgreSQL resolves contexts only inside the owning transaction; HTTP maps business errors to the existing redacted envelopes.
- Assistance application orchestration, domain policy and presentation separated from provider implementations. OpenAI and local providers now return the same internal validated-output shape. External wire contracts and provider request behavior remain unchanged.
- Analytics use cases and metadata policy separated from SQL; quota still locks globally, counts UTC global/account usage and inserts the reservation in the same transaction.
- Profile and Seed use cases, typed ports, repositories and presentation composed through NestJS factories. Existing Camp/Pact/Focus consumers use Analytics/Profile/Seed injection tokens instead of concrete cross-module service imports.
- Boundary checks reject inward shared-kernel/domain imports and new implementation exports through public interfaces. Fifteen legacy export groups remain explicitly inventoried; they are unfinished migration work.
- Added transaction-context, profile-patch, quota-order and business-error tests. Added a PostgreSQL test exercising rollback/commit across Profile, Seed and Analytics owner repositories.

## Executed evidence

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

Identity, Camp/Pact/Focus/Presence, Memory/Preferences and Privacy conversion remain. Web architecture refactor, ML CLI/common-layer refactor, removal of unused FastAPI/Maven assets, complete boundary checks across web/Python, browser QA, container verification and final acceptance also remain. No deployment or training is authorized by this report.
