# Observability

- **Status:** Baseline requirements; verify provider coverage before public launch
- **Last updated:** 2026-09-09

## Signals

### Application

- Request volume, error rate and latency by route group.
- Authentication/authorization failures without tokens or private payloads.
- Database connection pressure, slow queries and migration state.
- Scheduled job success, failure, duration and affected-record count.
- Per-service health/readiness, JVM resource pressure and downstream dependency latency after Java services exist.

### Redis and RabbitMQ target

- Redis latency, memory, eviction, connection failures and cache hit rate by owned use case.
- RabbitMQ queue depth, oldest-message age, publish-confirm failure, consumer throughput, redelivery and DLQ count.
- Outbox unpublished age and inbox duplicate count.
- Alert on stalled consumers and growing durable work before messages exceed the product service target.

### AI providers

- Provider, operation, latency, timeout and retry outcome.
- Model and prompt version.
- Token/cost estimates where a provider exposes them.
- Invalid-schema and safe-fallback rate.
- Aggregate safety flags and feedback, excluding raw private content.

### Product

- Activation, Stuck-to-Start and return funnel events.
- Consent and opt-out behavior as non-content metadata.
- No Brain Dump, task title, note, reflection or model prompt text in analytics.

## Logging contract

- Emit structured JSON from Spring Boot in deployed environments; the current local foundation uses console logs with correlation IDs.
- Attach a request/correlation ID and stable error code.
- Propagate trace, correlation, causation and message IDs across HTTP and message boundaries.
- Redact authorization headers, cookies, service keys and private user content.
- Avoid email addresses and external identity values unless a protected operational workflow explicitly requires them.
- Define access and retention per environment.

## Minimum alerts before public use

- Production API or web unavailable.
- Error rate or latency increases beyond an agreed threshold.
- Database storage or connection pressure approaches provider limits.
- Purge or other lifecycle job fails repeatedly.
- AI cost, timeout or invalid-output rate rises unexpectedly.
- Export/delete work exceeds its service target.
- Outbox, queue or DLQ age exceeds the agreed recovery window.

Thresholds, destination and on-call ownership must be filled with real provider configuration before this document is treated as an operational guarantee.
