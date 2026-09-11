# ADR-0009 — Redis, RabbitMQ and Incremental Service Extraction

- **Status:** Superseded by [ADR-0012](0012-modular-monolith-proposal.md).
- **Purpose:** Historical decision summary.

The earlier plan prescribed Redis, RabbitMQ, an AI worker and subsequent business-service extraction.

The accepted architecture now keeps Core as a modular monolith and inference independent. A worker is introduced only for a concrete durability, scheduling or resource-isolation need. Redis, RabbitMQ, a gateway and service extraction are not mandatory milestones.

If messaging is later selected, durable delivery, idempotency, bounded retry, consent checks and recovery still require explicit design. See [Architecture Options](../architecture-options.md) and [Event-Driven Architecture](../event-driven-architecture.md) for conditional patterns. No infrastructure installation or deployment follows from this historical record.
