# ADR-0008 — Java and Spring Boot Backend Replacement

- **Status:** Accepted; foundation implemented; identity portion superseded by [ADR-0010](0010-first-party-spring-security-authentication.md)
- **Date:** 2026-09-09
- **Supersedes:** [ADR-0007](0007-node-typescript-primary-stack.md) for the backend

## Context

The project owner chose Java as the primary backend direction to create a more demanding learning path and a stronger Java portfolio for the Vietnam–Japan market. The former TypeScript/Fastify API was not deployed as an indispensable compatibility surface, so maintaining two application backends would create migration overhead without protecting active users.

## Decision

1. React and TypeScript remain the web stack.
2. Java 21 and Spring Boot are the application-backend baseline.
3. The former Fastify API is removed rather than kept as a parallel or fallback runtime.
4. The Java backend begins as a modular monolith with domain-oriented modules, Spring Security, PostgreSQL, Flyway, JUnit and Testcontainers.
5. Identity was initially assigned to Supabase Auth; [ADR-0010](0010-first-party-spring-security-authentication.md) supersedes this with first-party Spring Security sessions.
6. Task, next action, capture, consent and focus remain together in a Core Service boundary. They are not split into entity-level services.
7. Existing Supabase migrations are preserved as historical and product-schema inputs. No database migration or ownership transfer occurs as part of the repository restructure.
8. The project-owned Python inference runtime remains an external model provider and never owns application authorization or business data.
9. Redis, RabbitMQ, workers and additional services are separate delivery phases governed by [ADR-0009](0009-redis-rabbitmq-microservices.md).

## Alternatives considered

### Continue with Node.js as the primary backend

Rejected because it does not satisfy the deliberate Java learning constraint. Node.js remains a useful secondary skill and the frontend toolchain still uses it.

### Run Fastify and Spring side by side

Rejected for this repository state. There is no required live compatibility window, and parallel business implementations would increase security, contract and data-ownership risk.

### Create many Java microservices immediately

Rejected. Service boundaries must first be proven inside the modular monolith. AI processing and Engagement are only candidates after the core slice and messaging reliability exist.

## Consequences

- Former backend business routes are temporarily unavailable until reimplemented in Java.
- Web contracts that still describe those routes are retained as migration inputs, not evidence of a running backend.
- Java and web have separate build/test jobs.
- New Java persistence changes use service-owned Flyway migrations.
- The repository has one application-backend direction and no dual-write or route-cutover mechanism.

## Security and rollback

- The foundation returns sanitized security error envelopes with correlation IDs; the current account/session mechanism is defined by ADR-0010.
- Secrets remain environment-owned; browser-visible variables never contain privileged credentials.
- The removed API and its history remain recoverable from Git. Restoring it would require a new decision and security review; it is not an automatic runtime rollback.
- Schema changes must be backward compatible or have a reviewed forward-fix plan. This ADR does not authorize a production migration or deployment.

## Follow-up

- Reimplement one complete Core Service business slice with authorization, persistence and contract tests.
- Introduce Redis and RabbitMQ only after the triggers and failure behavior in ADR-0009 are satisfied.
