# ADR-0024 — Pyneath naming and state transition

Date: 2026-10-28. Status: accepted for local implementation under the approved rename plan; no deployment authorized.

## Decision

Pyneath is the product name. Workspace packages use `@pyneath/*`, infrastructure defaults and artifact names use `pyneath`, and test/inference-specific environment variables use `PYNEATH_*`. Generic `API_*`/`VITE_*` configuration and domain entities (Camp, Pact, Open Seed, Marten) retain their meanings. Pine trees and existing tree asset filenames describe the forest, not the product brand. The checkout directory and remote repository are not renamed.

UI copy, metadata, docs, imports, build filters, Docker/CI examples and model scene labels use the new name. Runtime `.env` files, live databases, volumes and external projects are not changed.

## Persisted browser data

The theme uses `pyneath.theme`; scene choices, hints and account-scoped drafts use `pyneath:` keys. Only the known former keys are read by `brandStorage.ts`. On access, copy a former value if a new one does not exist, then remove the former key only after a successful copy. New values always win. Full/read-only storage keeps the former value readable rather than discarding it. The initial inline theme lookup also accepts the former key so the first paint matches the saved theme.

Draft access still requires the current authenticated owner. Account switching and logout clear both namespaces for the same isolation rules as before; a failed storage migration must not make another account's draft accessible. Unrelated storage keys are not touched.

## Authentication compatibility

Issue only `PYNEATH_SESSION`. `BTP_SESSION` remains a compatibility input for existing HTTP and WebSocket sessions. A present new cookie takes precedence even if invalid, preventing fallback to a different identity. Authentication still validates the token shape, hash lookup and database expiry; Origin/CSRF and resource authorization are unchanged.

After a successful session lookup, the session endpoint writes the same token with the original expiry under the new name and expires the former cookie. No token, CSRF value, account or database row changes during this transfer. Login/registration keep their existing rotation. Logout revokes distinct valid token values supplied under both names and clears both cookies. No SQL migration is required.

## Existing infrastructure and rollback

New installations use the renamed defaults. Existing PostgreSQL volumes retain their actual database/user/password regardless of changes to Compose environment variables. Set `PYNEATH_COMPOSE_PROJECT`, `PYNEATH_POSTGRES_VOLUME`, `PYNEATH_POSTGRES_DB`, `PYNEATH_POSTGRES_USER` and `PYNEATH_POSTGRES_PASSWORD` to the existing inspected values before reusing such a deployment. Keep `API_DATABASE_URL` aligned with the actual database, not with the new defaults. Do not delete a volume or initialize a fresh one as a rename shortcut. This task does not run Compose, migrations or database-changing tests.

Operators must explicitly update test-runner variables and inference `PYNEATH_GGUF_PATH` / `PYNEATH_MODEL_VERSION` before using those tools. External service/project/domain names require separate authorization.

For a code rollback after rollout, retain the compatibility reader and new cookie/storage namespaces; an unmodified pre-rename client/server cannot read already-transferred state. Do not reverse-copy over newer drafts or restore an expired/revoked session. Remove legacy compatibility only after a separately reviewed expiry/retention window and verification of remaining old clients. Existing private drafts have no blanket expiration, so their reader must not be removed solely because cookies have expired.

## Validation

Focused migration tests cover newer-key precedence, quota failure, account isolation/logout cleanup, same-token/same-expiry cookie transfer, no invalid-cookie downgrade, CSRF rejection and dual-cookie revocation. Full web/API tests and builds, branding scans and responsive browser verification are recorded in the rebrand verification document.
