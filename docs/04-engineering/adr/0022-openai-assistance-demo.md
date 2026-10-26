# ADR-0022 — OpenAI provider for a local Pine Assistance demo

- **Status:** Accepted for the approved local/preview demo only
- **Date:** 2026-10-24

## Decision

Add one NestJS Assistance boundary for `assisted_start` and `open_seed_draft`. Clients use the Pine contract, never OpenAI directly. The provider is `disabled` by default or `openai` when configured. `stuck_recovery` and the local Pine model path in ADR-0015 remain separate future work. The web control is also disabled by default.

The OpenAI provider uses the Responses API with structured output, `store:false`, no tools, bounded output and a six-second deadline. Moderation and local checks precede rendering. Provider errors return fixed manual text. Suggestions are transient until the user edits and confirms a normal core operation.

## Data, cost and reversal

Only explicitly submitted fictional demo text may leave the API. The server key is never exposed to web config, logs or analytics. `product_events` records request reservations and enum-only interactions, using the existing table without migration. Ten requests per account and 100 total per UTC day are reserved atomically. Disable both environment flags to remove the AI controls and outbound calls while keeping Focus, Camp and Open Seed available. The model ID can change without changing the public contract, but each change requires the prompt/evaluation review in the ML docs.

OpenAI API data is not used for training by default, while its default abuse-monitoring retention may be up to 30 days and may include content. See [data controls](https://developers.openai.com/api/docs/guides/your-data). Hosting, external spend configuration, real-data processing and pilot deployment require separate review and approval.
