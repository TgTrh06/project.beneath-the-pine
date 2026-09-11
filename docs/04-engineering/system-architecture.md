# System Architecture — Public Focus Companion

- **Status:** Java foundation with approved service target
- **Last updated:** 2026-09-10
- **Target stack:** [Java/Spring migration](adr/0008-java-spring-backend-migration.md) and [Redis/RabbitMQ services](adr/0009-redis-rabbitmq-microservices.md)

```text
React/Vite web
  ├─ Now, Capture, Focus Studio, Settings, Progress
  └─ local-only theme/audio preference
        │ authenticated REST
Spring Boot Core Service skeleton
  ├─ Spring Security account, session and CSRF boundary
  ├─ correlation/error and Actuator health foundation
  └─ product modules pending reimplementation
        │
PostgreSQL + Flyway
```

The web retains partial Tier 0–1 product behavior, while the Java backend currently provides only the service foundation. Engagement capabilities are designed for Tier 2, local Focus Studio personalization for Tier 3, public-product surfaces for Tier 4 and commercial/provider boundaries for Tier 5. Tier describes dependency order, not deployment topology or pricing.

The former Fastify API has been removed. Business behavior now moves into the Java Core Service one complete vertical slice at a time. Redis and RabbitMQ enter only after the first Java slice is stable. See [Target Microservices Architecture](microservices-architecture.md).

## Runtime ownership

- The React application owns interaction state and presentation, but never server authorization.
- The Core Service owns accounts and authentication. Spring Security verifies BCrypt password hashes, stores the authenticated principal in an HTTP session and validates CSRF tokens on state-changing requests.
- Spring MVC is the backend HTTP boundary. Product modules keep domain/application rules independent from presentation, security and infrastructure concerns.
- PostgreSQL is the source of truth for server-owned product data. Flyway owns new Java service migrations; retained Supabase migrations describe the previous/product schema and RLS baseline.
- Zod contracts validate data at boundaries shared by web and API.
- AI systems are providers behind the API. They do not own identity, authorization or product data.
- Scheduled lifecycle work has no active backend deployment configuration. A later approved phase can move suitable asynchronous work to RabbitMQ consumers and use Redis only for expiring coordination/cache state.

## Target service boundary

```text
React Web
  -> Gateway/BFF
      -> Core Service ------> Core PostgreSQL
      -> Engagement Service -> Engagement PostgreSQL
      -> AI job status ------> AI PostgreSQL
            |                       |
            +---- Redis             +---- RabbitMQ -> AI/Notification workers
```

Synchronous HTTP handles immediate user requests. Versioned messages handle durable work and independent reactions. No service reads or writes another service's tables.

## Engagement boundary

Engagement owns server-side preferences, reminder slots, Open Seeds and feedback. It reads focus/events to derive return eligibility and weekly facts, but does not own task content. The web owns local theme/audio URL. A future outbound provider sits behind an adapter and is not enabled in private beta.

## Data flow safeguards

Authorization occurs before module use cases; service repositories scope user-owned rows by the UUID in the authenticated account principal. Retained Supabase RLS describes the previous schema and is not the active guard for Flyway-owned tables. Raw content remains encrypted/excluded from analytics. The reminder job re-checks opt-in and uses slot/window idempotency. Full contracts and slices: [`../ai/retention/`](../ai/retention/README.md).

## Public and commercial boundaries

Public onboarding/demo remains a Web/application concern with an explicit local-versus-account data boundary. Future billing is isolated behind an adapter and an entitlement use case; redirects from a payment provider never grant access without verified provider state. Subscription state must not control core safety, data export/delete or access to user-created data.

Logical context, components, capability dependencies, entities and runtime sequences are maintained in [System Diagrams](system-diagrams.md) and [Sequence Diagrams](sequences/README.md).
