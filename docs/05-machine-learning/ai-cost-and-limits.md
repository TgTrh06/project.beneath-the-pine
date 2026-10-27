# Cost and Limits

Start with user-triggered synchronous requests behind the Pyneath API. Set an interaction timeout and return manual fallback on error; do not add queue/worker infrastructure before a concrete durable job exists.

Local GGUF inference can reduce external data transfer but still needs hardware sizing, model artifact review, observability and access control. A hosted provider requires processor, retention, region, cost and opt-out review before use. Rate limits and per-account quota must prevent abuse without blocking manual focus flows.

## OpenAI local/preview demo

The demo uses `gpt-6-luna` by default, with the model ID in API configuration. Before enabling it, review the current [model pricing](https://developers.openai.com/api/docs/models/gpt-6-luna) and set a separate OpenAI project spend limit outside this repo. Each request has a combined six-second provider timeout and at most 256 output tokens. A PostgreSQL-backed reservation in `product_events` caps requests at 10 per account and 100 globally per UTC day, including failed provider attempts. If the database, provider, quota or moderation check fails, the user gets the manual path. No queue or automatic retry calls the provider again.

The OpenAI API is used only on local/preview with fictional inputs. The API key stays on the server. Responses requests set `store: false`. OpenAI says API data is not used to train models by default unless the API customer opts in, while abuse-monitoring logs may contain prompt/response content for up to 30 days by default. `store: false` does not remove those logs. Review processor, region, retention, spend and opt-out before any pilot use. [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data)
