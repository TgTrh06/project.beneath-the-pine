# Beeknoee Assistance — local acceptance, 2026-11-13

**Passed for the local internship demo.** Selected `beeknoee` / `bee/gpt-6-luna` / `json_schema`. All three Assistance flows ran against the real provider. This supplements [OpenRouter acceptance](internship-mvp-ai-readiness.md), not production/pilot or final-thesis acceptance.

## Account and cost

Initial authenticated promotional balance: **2,000 VND (~USD 0.073)**, not USD 0.73. The user reconfirmed a **1,375 VND / USD 0.05** trial cap after that discovery. Final balance: **1,963.10 VND**; actual spend: **36.90 VND (~USD 0.001342)**. Balance decrease matches the sum of Usage charges; all costs reconciled.

**23/30 authorized inference attempts**: 2 compatibility, 18 evaluation, 3 actual browser UI. No inference retries, format downgrades, reserve calls or new OpenRouter calls. Additional mobile/keyboard/error checks used mock/replay, zero inference. No package bought or balance topped up.

## Candidate comparison

Same nine fictional Vietnamese scenarios per candidate, three per capability, in `scripts/beeknoee-cases.cjs`. Structural validity and manually reviewed relevance/actionability are separate.

| Candidate | Valid within 12s | Quality | Nine-case cost | Median inference latency |
| --- | --- | --- | --- | --- |
| `bee-tok/claude-haiku-5-5` | 9/9 | 8/9 | 19.31 VND | 2.330 s |
| `bee/gpt-6-luna` | 9/9 | 9/9 | 10.36 VND | 3.281 s |

Haiku's `start-seed` proposed a generic feature description instead of following the selected Seed's first step of Focus creation. Its other cases passed and each capability reached 2/3. Luna followed that context and passed all nine. No accepted policy violation observed. Luna wins by the agreed quality rule and also cost in this sample; Haiku was faster. This small manually judged sample is not a benchmark or guarantee of future cost/quality. Both models returned valid JSON with `json_schema`; provider-side schema enforcement is not proven by this sample.

## Validation

See [evidence index](evidence/beeknoee-trial-2026-11-13/README.md).

- Workspace lint/build passed. Existing Zod annotation/large bundle warnings remain.
- 27 provider/context tests passed: 9 Beeknoee, 8 OpenRouter, 10 Gemini/shared context. Covers fixed modes, one-call bounds, malformed/oversized/truncated data, refusal, 401/429/503, deadline, quota and context ownership/expiry.
- 12 web Assistance tests passed: disclosure, selected grants for both Beeknoee/OpenRouter, late/duplicate responses, edit/use/discard and failure preservation.
- 5 operator tests passed: durable ledger/restart/lock, cost/call/phase limits, unresolved charges, byte/output/cache estimates, ID/display-name usage matching.
- Live authorization: three anonymous routes denied, another account's context hidden, stolen/stale grants rejected before inference, malformed input rejected. Zero external calls.
- Actual browser walkthrough: 13 checkpoints, zero page errors. Selected own Seed at start and own Focus during recovery; edited suggestions; session only started explicitly; Seed saved only after checkout, survived reload and resumed work. Subsequent network failure/discard checks were mocked.
- 320px light/dark replay: no overflow, controls reachable by scrolling, Enter selection, Escape focus restoration, no premature save. Button contrast 11.13:1 light / 10.60:1 dark. Live walkthrough also covered 768px/1280px.

Environment: headless Microsoft Edge; disposable PostgreSQL 17 at port 55436, API 18086, web 15176. Existing migrations applied only to the new temporary database. Existing persistent database unchanged. No physical-device or multi-browser testing.

Cleanup completed: the verified temporary API/web process trees and labeled PostgreSQL container were removed; all three trial ports were closed. Environment files remain ignored by Git. Changed/new files were scanned for credential patterns without printing keys; none found. Documentation links and `git diff --check` passed.

Harness corrections: first browser launch stopped before inference on an old ledger filename; corrected walkthrough passed. First model response was valid but reconciliation stopped because Usage returned a display name; the existing charge was reconciled after adding catalogue-name matching. Neither correction required a paid retry.

## Demo setup

Local ignored `apps/api/.env` now selects:

```dotenv
API_ASSISTANCE_PROVIDER=beeknoee
BEEKNOEE_MODEL=bee/gpt-6-luna
BEEKNOEE_RESPONSE_FORMAT=json_schema
```

Keep `BEEKNOEE_API_KEY` server-only and `VITE_ASSISTANCE_DEMO=true` in `apps/web/.env`. Start the normal local database when needed with `pnpm db:local:up`, then `pnpm dev:api` and `pnpm dev` in separate terminals. Follow existing database migration-state instructions in the [README](../../README.md); trial storage is disposable.

Demo: fictional intention → request/edit/use start → explicitly start Focus → ask for recovery → request/edit/use Seed → confirm checkout → reload and “Tiếp tục từ đây”. Normal quotas remain 10/account/day and 100 globally/day UTC.

**The 1,375 VND/30-call guard belongs to the operator harness, not ordinary app usage.** Future demo clicks consume credit under normal quota. Do not automatically rerun this experiment. Replace the key pasted into chat directly in the local environment before longer-term use; do not screen-share the file.

## Operator tools and rollback

After building API, `node scripts/beeknoee-trial.cjs preflight` reads balance/catalogue without inference. `node scripts/beeknoee-run.cjs probe 0 json_schema` (or index `1`) explicitly calls the corresponding model. `evaluate 0 json_schema` or `evaluate 1 json_schema` runs fixed cases, skipping previously attempted ones. `reconcile` only reads pending Usage. `reserve <index> <format> <case-id>` explicitly consumes a reserved call within the original limits.

Ledger: `.openai/beeknoee-trial/ledger.json`; never reset/delete to bypass limits. A stale lock requires confirming no live process and inspecting the unresolved charge before removal. Resolve ambiguous usage before further inference. Browser monitoring used the same ledger, separate from normal app startup.

Rollback to `API_ASSISTANCE_PROVIDER=openrouter` and restart API; the original key/model remain. See [ADR-0032](../04-engineering/adr/0032-beeknoee-local-trial.md). No dependency/migration added; no commit/deployment performed.
