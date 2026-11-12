# Assistance quality v1 — implementation record, 2026-11-13

## Scope and observed results

This is an implementation and mock-regression record for the internship Luna demo. It is **not** a 60-case model quality result. No Beeknoee/OpenRouter inference, database migration, production deployment or real-user pilot was run in this work.

| Gate | Result | Limit |
| --- | --- | --- |
| Local Luna configuration | `bee/gpt-6-luna` is the Beeknoee default in API config and sample env; existing ignored local env selects Beeknoee/Luna/`json_schema`. | Existing credit balance was not re-read in this work; normal demo requests still spend credit. |
| User control and errors | Coded discard reason, context-expiry reset, distinct quota/timeout/invalid-output/service wording, explicit request-again control; user text stays in the manual form. | Hook regression and mock browser check at 320px in light/dark; a real screen reader check remains pending. |
| API and provider | Provider usage can reach allowlisted diagnostic events; 429 maps to quota; Luna/OpenRouter adapter regression. | New diagnostics default off. Provider error without usage has no cost field. |
| Eval v1 | 60 fictional cases, 20/capability, frozen hash, development/holdout split, manifest and automatic response checks. | 0/60 inference cases run; 0/60 human graded, so no 80% claim or new accuracy estimate. Earlier nine Luna cases are historical model-selection evidence only. |
| Privacy | No private text/keys in diagnostic allowlist; account deletion cascade remains. | Retention job, reporting access and real-user consent still need separate approval before diagnostics can be enabled beyond synthetic local testing. |

## Verification commands

- `node --test scripts/assistance-eval.test.cjs`: 3 passed, 0 failed; verifies frozen 60-case shape, explicit grading and manifest/response checking without inference.
- `pnpm --filter @pyneath/api test`: 96 passed, 0 failed, 13 skipped optional database suites. Includes Beeknoee/OpenRouter, quota, privacy allowlist and new opt-in diagnostic tests.
- `pnpm --filter @pyneath/web test`: 112 Vitest tests and 2 architecture tests passed. Includes selection, context expiry, connection failure and coded discard flows.
- `pnpm lint`: passed for contracts, API and web.
- `pnpm build`: passed for contracts, API and web. Existing Vite/Zod annotation and large chunk warnings remain.
- `git diff --check`: passed; Git emitted only existing LF→CRLF notices.
- Temporary Vite preview with mocked `fetch`, no provider/API call: actual AssistanceCoach displayed at 320px in light and dark, `document.scrollWidth=320`; reason select and Tab → Enter on “Bỏ gợi ý” preserved the manual textarea and returned focus to the request button. The test-only page/server were removed. One preview-only HMR `createRoot` console error appeared after changing the temporary entry file; the final reload and interaction worked. This does not count as a screen-reader or production-browser acceptance run.

## Next evaluation gate

Before paid eval, approve call count and cost cap, confirm available balance and only synthetic case input, set a stop rule, then run a fixed version manifest. A reviewer grades content against [rubric and UX matrix](../05-machine-learning/assistance-quality-v1.md); compare on identical IDs and report all missing data. For pilot, first implement and verify diagnostic retention and data rights, then conduct accessible browser and screen-reader checks and obtain participant consent. No current evidence justifies increasing AI autonomy or declaring production readiness.
