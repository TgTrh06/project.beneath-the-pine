# ADR-0031 — OpenRouter Assistance in the internship MVP

Status: accepted for local implementation and at most 12 real verification requests on 2026-11-11, by `accept plan MVP OpenRouter + test thật`. No deployment is authorized.

## Decision

The internship MVP requires three working AI capabilities: assisted start, stuck recovery and Open Seed draft. Use the existing Assistance port with a new OpenRouter adapter and the exact model `deepseek/deepseek-v4-flash-0731`. Preserve the existing Gemini/OpenAI/local implementations and their uncommitted work. This supersedes earlier exclusions of AI from this local milestone, without claiming trained-model or pilot readiness.

Use native HTTPS to the fixed OpenRouter chat-completions endpoint. No new dependency, schema or migration. One external request per user action, 512 maximum completion tokens, reasoning disabled, 12-second deadline including context reads and body parsing; no application retries or model substitution. Provider routing sorts by price, requires supported parameters, denies provider data collection, and caps prompt/completion prices at $0.20/$0.60 per million tokens. If no compatible endpoint exists, fail to the manual fallback; do not silently relax these settings. Routing among endpoints for the same model is OpenRouter-managed.

## Data and authorization

Existing authenticated/CSRF-protected routes and transactional quotas (10 requests/account/UTC day, 100 globally) remain. Context preview returns only the principal's Focus/Seed data. Grants are bound to actor, context content, tool and five-minute TTL. For OpenRouter, the application reads only the selected grants before the single model request, rather than paying for a model tool-selection round. There are no model-executable tools. Preview performs no external call; content changed after consent causes fallback and requires preview/selection again.

Treat request/context text as untrusted data; validate output with the existing Zod protocol and policy. Never save an AI draft or start a session/break without the existing explicit user action. Missing configuration, provider errors, malformed/truncated output, quota and deadline preserve manual work. Provider refusal maps to a safe boundary message.

Keys remain in ignored server configuration. UI names OpenRouter and the provider running DeepSeek. Logs contain capability, model, outcome, elapsed time, call count and numeric token/cost usage only, never prompts, responses, consent tokens, credentials or account IDs. `data_collection=deny` is a routing preference, not a claim of zero retention by every intermediary. Verification uses fictional data. Production privacy/retention approval remains a separate release requirement.

## Verification and rollback

Tests cover all capabilities, one-call cost bounds, selected/invalid context, quota exhaustion, provider/network/schema failures, late completion/deadlines and editable UI state. Local database/browser evidence and real model results belong in the [acceptance record](../../07-testing/internship-mvp-ai-readiness.md). At most 12 paid requests are authorized for this run; track attempts, including failures.

Rollback: set `API_ASSISTANCE_PROVIDER=disabled` and `VITE_ASSISTANCE_DEMO=false`, restart local processes. No data rollback is required. Remove only the OpenRouter change if reverting source; preserve the earlier Gemini/Focus work. Adding `openrouter` to the provider enum requires matching API/contracts/web builds.

## References

- [Model](https://openrouter.ai/deepseek/deepseek-v4-flash-0731)
- [Structured outputs](https://openrouter.ai/docs/guides/features/structured-outputs)
- [Provider routing](https://openrouter.ai/docs/guides/routing/provider-selection)
- [Reasoning controls](https://openrouter.ai/docs/guides/best-practices/reasoning-tokens)
