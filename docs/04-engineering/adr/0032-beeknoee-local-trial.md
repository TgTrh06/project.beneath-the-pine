# ADR-0032 — Beeknoee local Assistance trial

Status: accepted and locally verified, 2026-11-13 (Asia/Saigon). User approved two candidates, 30 inference attempts and USD 0.05 (1,375 VND). When Management API revealed 2,000 VND rather than the assumed USD 0.73, the user explicitly retained the 1,375 VND cap. No deployment or payment authorization.

## Decision

Add Beeknoee behind the existing Assistance port; retain OpenRouter for rollback. Allow only `bee-tok/claude-haiku-5-5` and `bee/gpt-6-luna`, with a fixed `json_schema`, `json_object` or `prompt` format. Use native HTTPS to the fixed chat endpoint, without redirects, new dependencies or database migrations. Extract the existing capability JSON Schema into a shared helper; preserve OpenRouter's payload and behavior.

Each suggestion has one external call, 512 output tokens, a 12-second deadline including context/body reads, and a 32 KiB response limit. No automatic retries, model substitution, format negotiation or malformed-JSON repair. Local schema/policy validation remains authoritative. Do not forward OpenRouter routing/privacy parameters or expose executable tools to the model.

Only the principal's explicitly selected valid Focus/Seed grants leave the server. Preserve authentication, CSRF, transactional quotas, manual edit/use/discard and explicit save/start. Preview makes no inference call. Add `beeknoee` to provider metadata and disclose Beeknoee/upstream processing in UI. No claim of zero retention; use fictional data. Keys stay server-side; production logs contain outcome and numeric usage only.

## Trial boundary

Operator scripts are separate from normal app startup. Preflight reads authenticated balance, prices and usage. An exclusive lock and persistent ignored ledger reserve cost/count before sending, cap phase/total calls, prevent duplicate cases and stop on unresolved cost. A crash leaves a lock for inspection, not an automatic reset. Estimate conservatively with undiscounted rates, the largest input/cache rate, UTF-8 payload bytes plus framing, output ceiling, 15% fee allowance and 1 VND minimum.

Usage may identify a model by catalogue display name. Accept the captured name/ID only when exactly one new matching entry exists at the expected time; concurrent/ambiguous records stop the trial. Missing cost is never zero. These are application-side safeguards, not a provider-guaranteed billing cap. No other account activity should occur during attribution.

Compatibility can step down from schema to JSON object to prompt only after an explicit unsupported-format response. Both candidates returned valid outputs with `json_schema`; live format downgrade was unnecessary. A successful response does not establish gateway enforcement of every schema constraint.

## Selection and rollback

Luna passed 9/9 quality cases versus Haiku 8/9; both produced 9/9 valid suggestions. Luna passed three actual UI flows and was selected locally with `json_schema`. See [acceptance](../../07-testing/beeknoee-trial-readiness.md).

Rollback: set provider `openrouter` with its preserved key/model, restart API. Disable AI with provider `disabled` and `VITE_ASSISTANCE_DEMO=false`, restarting API/web. No data rollback. Matching contracts/API/web builds are required for the new enum. No commit/deployment included.

References: [Chat API](https://platform.beeknoee.com/docs/chat-completions), [Management API](https://platform.beeknoee.com/docs/management-api), [billing](https://platform.beeknoee.com/docs/pricing-explained). Authenticated account data, rather than public labels, determined actual costs.
