# Cost and Limits

Start with user-triggered synchronous requests behind the Pine API. Set an interaction timeout and return manual fallback on error; do not add queue/worker infrastructure before a concrete durable job exists.

Local GGUF inference can reduce external data transfer but still needs hardware sizing, model artifact review, observability and access control. A hosted provider requires processor, retention, region, cost and opt-out review before use. Rate limits and per-account quota must prevent abuse without blocking manual focus flows.
