# Architecture Decision Records

Use `NNNN-short-title.md` for each durable architecture decision.

## Template

```markdown
# ADR-NNNN — Title

- Status: Proposed / Accepted / Superseded
- Date: YYYY-MM-DD

## Context
## Decision
## Alternatives considered
## Consequences
## Follow-up
```

## Current records

- [ADR-0006 — Gentle Retention and Reminder Delivery](0006-gentle-retention-and-reminders.md)
- [ADR-0007 — Node.js and TypeScript as the Primary Application Stack](0007-node-typescript-primary-stack.md) — superseded for the backend
- [ADR-0008 — Java and Spring Boot Backend Replacement](0008-java-spring-backend-migration.md)
- [ADR-0009 — Redis, RabbitMQ and Incremental Service Extraction](0009-redis-rabbitmq-microservices.md)

The earlier `0001`–`0005` topics remain gaps to document if a future change depends on them. Do not create placeholder records: write an ADR when there is a concrete decision, alternatives and consequences to preserve.
