# Pyneath rebrand verification — 2026-10-28

Scope approved by the user: rename product branding and technical namespaces, preserving existing browser state and login sessions. Decision and rollout boundaries: [ADR-0024](../04-engineering/adr/0024-pyneath-brand-transition.md).

## Changed surfaces

- Product name in public/auth/application headers, footers, titles, accessibility labels, marketing copy and social metadata; data export filename and redacted frontend log label.
- Root package `pyneath` and workspace packages `@pyneath/web`, `@pyneath/api`, `@pyneath/contracts`; consumers, scripts, lockfile, Docker/Vercel/CI settings and test variable names updated together. An offline frozen-lockfile install refreshed workspace links with lifecycle scripts disabled; no dependency version upgrades were introduced by this rename.
- Inference service package/title/prompt and `PYNEATH_GGUF_PATH` / `PYNEATH_MODEL_VERSION`; ML/documentation terminology, renamed assistance/role ADR filenames and references.
- Browser preference/hint/draft namespaces and session cookie, with explicit compatibility readers/tests. Generic tree geometry asset paths remain descriptive names; GLB scene labels were regenerated as Pyneath without changing geometry.
- New local Compose defaults with explicit existing-project/volume/database/user/password overrides. Real `.env` files, live databases/volumes and remote project names were not changed. No migration, Compose startup, deploy or release ran.

## Executed checks

| Check | Result |
| --- | --- |
| Web suite | 56 tests passed across 14 files, including preference migration, quota failure and private-draft isolation/cleanup. |
| API suite | 31 passed, 6 skipped, 0 failures; skipped tests require explicitly configured isolated/live test database endpoints. |
| Cookie migration | Preserves account, token, CSRF and expiry; new cookie precedence; malformed/unknown cookies denied; foreign Origin/missing CSRF denied; dual-cookie logout revokes both. |
| Workspace build | Contracts, web and API passed. Final web build repeated after the dialog CSS namespace rename. Existing lazy 3D chunk size advisory remains. |
| Workspace lint | Passed, including API tooling/tests type checks and boundary check: 71 TypeScript files, no import cycles. |
| Compose | `docker compose -f compose.local.yml config --quiet` passed; no containers were created or changed. |
| Python | Inference entrypoint parsed successfully with Python AST; no model/provider call or training run. |
| Naming/documentation | All renamed Pyneath document links resolve. GLB node labels inspected. Remaining old branding references are limited to state/cookie compatibility, its tests and transition documentation; package integrity hashes are not branding. |
| Diff | Normal repository line-ending/whitespace check passed. |

## Browser observations

Local Edge with fixture API/WebSocket responses, no real registration or API writes:

- Pyneath wordmark, menu name, tab title and Open Graph title; no old brand names in rendered landing/register text.
- Landing at 1440, 1200, 390 and 320 CSS pixels, without horizontal overflow. The navbar appearance button remains usable beside the entry action; mobile menu uses the new name.
- A former dark-theme setting transfers to the new key before the app renders. A subsequent light choice survives reload and is not overwritten by the old value.
- Old landing/camp/solo scene choices remain readable and move to the new keys on access.
- An account-scoped draft created under the former prefix appears unchanged in Return; the migrated old key is removed.
- Solo can switch from its migrated light preference back to WebGL; model loads successfully with the renamed scene metadata.
- No uncaught browser errors in these flows. Screenshots: `.openai/pyneath-qa/`; harness: `.openai/pyneath-browser-check.cjs`.

This is local fixture evidence. Physical-phone GPU performance, native Safari/iOS and production migration/deployment were not exercised. The checkout folder keeps its existing absolute path so the current workspace remains attached.
