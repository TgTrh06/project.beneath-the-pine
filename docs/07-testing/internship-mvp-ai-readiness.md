# Internship MVP with OpenRouter Assistance — 2026-11-11

Status: **local internship MVP acceptance passed** on 2026-11-11. The three AI capabilities produced usable, editable suggestions from the approved model. This is evidence for the internship demonstration, not a pilot/deployment or final-thesis readiness claim.

Approved model: `deepseek/deepseek-v4-flash-0731`. Provider: OpenRouter. Real verification budget: at most 12 requests with fictional data, including unsuccessful attempts. Existing database and prior Gemini work are preserved.

## Local setup

Set server-only `OPENROUTER_API_KEY`, `API_ASSISTANCE_PROVIDER=openrouter` and `OPENROUTER_MODEL=deepseek/deepseek-v4-flash-0731` in `apps/api/.env`. Set `VITE_ASSISTANCE_DEMO=true` in `apps/web/.env`. Restart API and web. A missing key fails configuration clearly without revealing the key. Do not copy secrets into screenshots, report text or client variables.

One request per suggestion, including selected context; 512 output tokens, 12-second deadline and no app retry. Existing quota is 10/account/day and 100 globally/day, UTC. Provider prices capped at $0.20 input / $0.60 output per million tokens; routing requires requested capabilities and denies provider data collection. Rejected requests show the manual fallback. Usage/cost in logs is provider-reported, not a promise about account billing.

## Acceptance evidence

Evidence is checked into [evidence/openrouter-mvp-2026-11-11](evidence/openrouter-mvp-2026-11-11/README.md). Tests used fictional accounts/content and an isolated PostgreSQL 17 database on port 55435; browser checks used local API/web on ports 18085/15175. Existing local database configuration was preserved. No dependency, schema migration, release or deployment was added.

Cleanup completed: the temporary API/web process trees and labeled disposable database container were removed; ports 18085, 15175 and 55435 no longer listened. Local ignored environment files retain the OpenRouter configuration for the next demo. The changed/new files were checked for the configured credential without printing it; none contained it. Both environment files are ignored by Git. Acceptance links and `git diff --check` passed.

| Check | Result and evidence |
| --- | --- |
| Workspace validation | `pnpm lint` and `pnpm build` passed on the final source. Existing Zod annotation and large web chunk warnings remain. |
| Workspace regression | `pnpm test`: 109 web tests, 2 web architecture tests, 112 API tests and 2 root audit-script tests passed. Three opt-in HTTP suites skipped here; they were run separately below. |
| Core HTTP integration | 24 tests passed, zero skipped, for Solo/Seed, Camp membership/invitations and Pact lifecycle against disposable PostgreSQL. |
| Final OpenRouter adapter | 8 tests passed after refining the response schema and prompt. Covers all three capabilities, one-call payload and price/token bounds, selected/invalid context, provider/schema/truncation/refusal errors, deadline and quota fallback. Network responses in these unit tests are mocked. |
| Actual assisted start | Model output shown in browser; user edited/accepted it into the manual intention. No session started until explicit start. Session started successfully. Desktop, 768px, 320px and dark screenshots captured. |
| Actual stuck recovery | Model output shown during an active session, edited and used as the microstep. Session stayed active. Selected own Focus context was sent in the same single model call. |
| Actual Open Seed | Model output edited and accepted into checkout; server Seed unchanged until explicit checkout. Saved Seed survived reload and populated the next intention via “Tiếp tục từ đây”. |
| Context authorization | Three anonymous read routes denied; another account's context hidden; stolen/stale grants rejected before model call; two malformed inputs rejected. This live API check used zero inference calls. Actual assisted-start inference also used selected own Seed context. |
| Failure/discard | A real transport timeout produced manual fallback. Browser-injected network failure and replayed success tested preservation of manually entered text and discard without changing it. These injected checks made zero inference calls. |
| Mobile/keyboard | At 320px, both theme variants showed the use/discard controls after dialog scrolling, with no horizontal overflow. Enter accepted the edited draft; Escape restored focus; selection alone did not save Seed. Recorded actual model output was replayed for this check, with zero inference calls. Button text contrast after theme transition: light 9.92:1, dark 8.67:1. |

The full workspace regression preceded the last provider schema/prompt refinement. The final targeted adapter tests and workspace build/lint followed that refinement; no claim that the entire workspace suite was rerun afterward. Browser verification used local headless Microsoft Edge, not physical devices or a multi-browser matrix. The initial browser walkthrough stopped on an incorrect test locator after start/recovery; the corrected follow-up completed recovery, Seed persistence and failure/discard checks with zero page errors. See both browser evidence files rather than treating the partial run as a full end-to-end pass.

## Real model calls and cost

Exactly **11 of the 12 authorized inference attempts** were used; no more are needed for this acceptance. All requests used `deepseek/deepseek-v4-flash-0731`. The [sanitized call ledger](evidence/openrouter-mvp-2026-11-11/model-calls.json) records capability, context names, timing, usage and acceptance outcome without credentials or raw input.

- Eight attempts returned accepted suggestions; two HTTP-200 outputs were rejected by application validation; one timed out. This is a small debugging sample, not a measured accuracy or reliability rate.
- Attempt 1 mixed suggestion and fallback-message fields. The OpenRouter JSON Schema now explicitly describes mutually exclusive output branches; shared runtime validation remains authoritative.
- Attempt 5 used a prohibited completion-claim phrase. The provider-specific prompt was tightened; subsequent recovery suggestions passed the existing policy. The shared prompt version remains `pyneath-assistance-v2.1` plus the adapter's instructions.
- Attempt 10 still contained a stray `{` in its otherwise valid recovery sentence. The user-edit flow removed it before use. Semantic quality and punctuation are not guaranteed by schema validation, and were not silently reported as perfect.
- Ten received responses reported a combined **USD 0.0005860826**. The timeout returned no usage, so its possible charge is **unknown** and excluded. This is not the total account bill or a price guarantee. Received usage reported zero reasoning tokens. Successful HTTP response times ranged from about 1.7 to 7.2 seconds in this sample.

The server sends at most one model request per suggestion, including authorized context, and never automatically retries. A user can explicitly request another suggestion; that consumes another quota/call. The test harness counted unsuccessful attempts as well.

## Five-minute demonstration

Use the normal local database and start commands in the [root README](../../README.md). Keep the API key only in `apps/api/.env`; do not show that file while screen sharing. The disposable verification server/database are not the demo's persistent storage.

1. Start PostgreSQL if needed with `pnpm db:local:up`; start `pnpm dev:api` and `pnpm dev` in separate terminals. For an existing database, follow the README's migration-state instructions before applying any migration.
2. Sign in and enter a fictional intention such as “Viết phần mô tả ứng dụng hỗ trợ tập trung”. Request a starting step, edit it, choose “Dùng bản nháp”, then explicitly start a five-minute Focus session.
3. Open stuck recovery, optionally preview/select your own current Focus context, request a smaller step, edit and use it. Explain that choosing a suggestion does not finish the session.
4. Choose “Khép lại chặng này”, replace Open Seed, enter a short note and request “Gợi ý câu quay lại”. Edit/use the draft, then confirm checkout.
5. Reload the Return page and choose “Tiếp tục từ đây”. Show that the saved Seed returns. Mention that model errors/quota show manual fallback, and the person can always write their own text.

Each inference in a future demonstration consumes normal OpenRouter credit and app quota; the 11-call evidence above covers this verification session only. Do not rerun the paid verification automatically.

## Scope and remaining work

For the internship milestone, the core local flows and all three AI interactions have runnable evidence. For the final thesis, improve Vietnamese output quality using a broader evaluation set, assess real user benefit in a separately approved pilot, and complete the repository's release/privacy, physical-device and operational readiness checks. No claim of production reliability, medical support, or zero provider retention is made.

Main implementation: OpenRouter provider/HTTPS transport, API configuration/module/context wiring, shared provider metadata, UI disclosure and existing edit/use/discard flow. Documentation updates include [MVP scope](../00-foundation/mvp-scope.md), [tiered delivery](../02-product/tiered-delivery-plan.md), [ADR-0031](../04-engineering/adr/0031-openrouter-internship-mvp.md), and the [release checklist](../09-release/release-checklist.md). Earlier Gemini/Focus work remains in the working tree. No commit was created.
