# Pyneath Assistance demo script — local/preview only

## Setup

1. Use an isolated development database with the existing migrations reviewed and applied. Do not use a pilot or production database.
2. Configure the API with `API_ASSISTANCE_PROVIDER=openai`, `OPENAI_MODEL=gpt-6-luna` (or another reviewed model ID) and a server-only `OPENAI_API_KEY`. Configure the web with `VITE_ASSISTANCE_DEMO=true`. Keep the flags disabled outside local/preview.
3. Review the OpenAI project spend limit and current retention terms. Use only fictional text in demo accounts. Verify `/health/ready` before starting.

## Walkthrough

1. On Return, enter fictional work such as “Mở tài liệu giả và viết tiêu đề”. Observe the disclosure, request one start suggestion, edit it, apply it, and confirm Focus duration did not change. Start the Solo session separately.
2. At checkout, choose an outcome and “Viết điểm tiếp tục mới”. Type fictional rough context, request a Seed draft, edit or discard it, then confirm checkout separately. Reopen Return and confirm only the chosen Seed was saved.
3. Repeat with the API provider disabled or web flag off. The manual Solo → checkout → Seed flow must still work; Camp/Pact controls remain unaffected.
4. With a fake provider in automated checks, exercise malformed output, moderation refusal, timeout and quota. Confirm fallback leaves input intact and request/interaction logs contain only allowlisted event data.

## Evidence record

Record date, environment, model ID, anonymous run ID, result for each step, fallback case, lint/test/build output and remaining limits. Do not paste prompts, generated text, key, Seed or session cookies into the repo. A live OpenAI request has not been demonstrated until an operator supplies a demo key and records the observed result. No deployment or real-data processing is authorized by this script.

## Local verification — 2026-10-24

- Temporary PostgreSQL 17 container and one API instance; existing migrations applied only to that disposable database. Browser used a newly created test account and fictional text.
- With a fake OpenAI transport, Step Coach returned one editable 5-minute proposal. Applying it changed the intention field; the Solo session began only after the separate **Bắt đầu phiên** action, retaining the chosen 10-minute Focus duration.
- Return Coach returned one editable sentence in checkout. Discard left the original note intact; a second request was edited and applied, then the separate checkout action saved it as the account's Open Seed. The Return page displayed that Seed.
- With the API provider disabled, both coach buttons returned a manual fallback and retained the form contents. Solo start, checkout and Seed save still completed. Keyboard Tab reached the coach; after a generated result, focus moved into the editable draft, and applying it returned focus to the main input.
- Event inspection found only allowlisted capability metadata for request/view/edit/select/discard, with no test text in metadata. The PostgreSQL quota race check allowed exactly 10 requests for one account and 100 globally.
- Limits: no real OpenAI key was present, so no paid provider call or provider-side retention was observed. Browser review covered the in-app browser at its available viewport; 320 px, screen reader and a separate browser engine were not checked in this demo.
