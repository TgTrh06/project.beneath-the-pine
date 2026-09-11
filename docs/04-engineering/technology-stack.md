# Technology Stack

- **Status:** Current foundation plus approved expansion target
- **Last updated:** 2026-09-10
- **Decisions:** [ADR-0008](adr/0008-java-spring-backend-migration.md), [ADR-0009](adr/0009-redis-rabbitmq-microservices.md), [ADR-0010](adr/0010-first-party-spring-security-authentication.md)

## Current implemented stack

| Layer | Technology | Responsibility | Source of truth |
| --- | --- | --- | --- |
| Web | React 19, Vite 7, TypeScript 5.9 | Responsive product UI and local demo | `apps/web/package.json` |
| Backend foundation | Java 21 release target, Spring Boot 4.1.1, Maven 3.9.16 wrapper | Security, health, persistence foundation and service packaging | `services/pom.xml`, `services/core-service` |
| Contracts | Zod 3 workspace package | Retained browser schemas and migration inputs | `packages/contracts` |
| Data access | Spring Data JPA, PostgreSQL driver and Flyway | New service persistence and migrations | `services/core-service` |
| Identity | Spring Security, BCrypt, server-side HTTP session and CSRF protection | First-party account registration, login and authenticated identity | `services/core-service/.../identity`, `apps/web/src/shared/auth` |
| Database history | Supabase PostgreSQL migrations | Retained schema and RLS design input | `supabase` |
| Tests | Vitest, JUnit 5 and Testcontainers | Web checks plus Java unit/PostgreSQL integration evidence | Workspace scripts and Maven build |
| Hosting | Vercel for the web; backend undecided | The repository does not currently define a backend deployment | `vercel.json` |

The Java foundation is implemented, but the former backend business routes have not yet been rebuilt. A listed dependency is not evidence of a production deployment.

## Approved target stack

| Layer | Target technology | Intended responsibility | Implementation status |
| --- | --- | --- | --- |
| Web | React, Vite, TypeScript | Browser experience | Existing; retained |
| Gateway/BFF | Java, Spring | Public routing, entry authentication, rate limiting and composition | Planned |
| Core backend | Java 21, Spring Boot 4.1.1 | Consent, tasks, next actions, focus, capture, habits and data rights | Foundation implemented; business slices planned |
| Security | Spring Security session authentication | Password verification, session/CSRF protection and service-level authorization | Implemented local baseline |
| Persistence | PostgreSQL, Flyway, Spring Data JPA | Service-owned durable state and migrations | Foundation implemented; domain schema planned |
| Cache/coordination | Redis | Rate limits, bounded cache, expiring idempotency, progress and locks | Planned after Java slice |
| Broker | RabbitMQ | Durable commands/events, retry and dead-letter routing | Planned after Redis foundation |
| Tests | JUnit 5 and Testcontainers | Java unit, integration and PostgreSQL evidence | PostgreSQL foundation implemented; Redis/RabbitMQ planned |
| Observability | Actuator, Micrometer and OpenTelemetry-compatible telemetry | Health, metrics and distributed traces | Actuator foundation implemented; distributed telemetry planned |
| AI inference | Python, FastAPI, llama.cpp or external provider | Model execution behind AI Worker | Existing pilot boundary; retained |

Exact dependency versions are resolved by the Maven build. Redis and RabbitMQ dependencies are intentionally absent until their delivery phase.

## Service target

- **Core Service:** first Java backend and modular monolith.
- **AI Service/Worker:** first asynchronous extraction.
- **Engagement Service:** first business-service extraction.
- **Notification Worker:** later extraction only when outbound delivery is enabled.
- **Gateway/BFF:** introduced when more than one backend route needs stable public composition.

See [Target Microservices Architecture](microservices-architecture.md) and [Event-Driven Architecture](event-driven-architecture.md).

## Runtime rules

- The browser never connects to PostgreSQL, Redis or RabbitMQ directly and never holds privileged credentials.
- Each service verifies authorization and owns its data; the gateway is not the sole security boundary.
- PostgreSQL is the system of record. Redis stores only expiring or reconstructable state.
- RabbitMQ delivery is at least once. Outbox/inbox and idempotent consumers are mandatory.
- Private content and browser session credentials do not travel in messages.
- The core focus path degrades safely when cache, broker, Engagement or AI is unavailable.

## Explicitly excluded from the approved target

| Technology/topology | Reason |
| --- | --- |
| Kafka | No demonstrated long-retention event streaming, replay or throughput requirement |
| ActiveMQ | RabbitMQ better fits the approved routing/retry workload without adding JMS-specific value |
| Entity-level microservices | Task, capture and focus share a cohesive lifecycle and transaction boundary |
| Kubernetes | Managed container platforms are sufficient for the planned service count |
| Shared writable database | Breaks service ownership and independent migration |
