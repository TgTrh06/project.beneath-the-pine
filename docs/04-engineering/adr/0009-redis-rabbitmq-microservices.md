# ADR-0009 — Redis, RabbitMQ and Incremental Service Extraction

- **Status:** Accepted target architecture; implementation not started
- **Date:** 2026-09-09
- **Depends on:** [ADR-0008](0008-java-spring-backend-migration.md)

## Context

AI generation, reminders, weekly reflection and external delivery have different latency and failure characteristics from the core focus flow. They benefit from durable asynchronous work, independent retries and isolation. Rate limiting, idempotency windows, short-lived progress and scheduler coordination need fast expiring state, but PostgreSQL must remain the durable system of record.

## Decision

1. RabbitMQ is the target durable message broker for commands and domain events.
2. Redis is used for rate limits, bounded caches, expiring idempotency keys, job progress and distributed scheduler locks.
3. PostgreSQL remains the durable business state. Redis Pub/Sub is not an integration bus and Redis is not the source of truth.
4. Delivery semantics are at least once. Producers use a transactional outbox; consumers use idempotent handlers and inbox/deduplication records.
5. Retry is bounded and ends in a service-owned dead-letter queue. Replay is an explicit, audited operation.
6. Message contracts use versioned names and a standard envelope with message, correlation and causation identifiers.
7. Private content, access tokens and provider secrets are excluded from messages. Prefer reference IDs and an authorized internal retrieval path when a worker needs content.
8. The first asynchronous extraction is AI processing. Engagement is the first business service extracted after the Java Core Service is stable. Notification remains an Engagement worker until outbound delivery justifies an independent service.
9. Kafka, ActiveMQ, Kubernetes and entity-level microservices are not part of the approved target.

## Service boundaries

- **Gateway/BFF:** public routing, JWT entry verification, rate limiting and response composition.
- **Core Service:** profile, consent, tasks, next actions, focus, habits, capture and data rights.
- **Engagement Service:** Focus Seeds, return state, reminder preferences/scheduling, Weekly Letter and feedback.
- **AI Service/Worker:** job orchestration, provider calls, output validation, retry and result state.
- **Notification Worker:** optional later extraction for external delivery side effects.

## Failure behavior

- The core task/focus path remains usable if Redis, RabbitMQ, AI or Engagement is unavailable.
- Redis cache misses fall back to a durable source; locks have expiry and ownership tokens.
- A broker outage accumulates unpublished outbox rows without losing the business transaction.
- Duplicate and out-of-order messages are expected and tested.
- Poison messages enter a DLQ with redacted diagnostics; they are never retried forever.

## Security

- The browser never connects to Redis or RabbitMQ.
- Each service uses separate database and broker credentials with least privilege.
- User JWTs are not placed on messages. Internal calls use service identity plus the minimum user subject context.
- Logs, traces, queues and DLQs exclude raw Brain Dump, reflection, task title and provider secrets by default.

## Rollout and rollback

Roll out in phases: Java modular monolith, Redis, RabbitMQ/outbox with AI Worker, then Engagement extraction. Each dependency has a feature flag or routing boundary. Rollback disables the new consumer/route while retaining durable outbox/job state for later recovery. Removing a queue or cache must not require deleting business data.

## Consequences

- Local and deployed operations gain more processes, credentials and failure modes.
- Eventual consistency replaces some immediate cross-module updates.
- Distributed tracing, queue metrics and runbooks become release requirements.
- The architecture provides meaningful Java, messaging and reliability practice without splitting the core domain prematurely.
