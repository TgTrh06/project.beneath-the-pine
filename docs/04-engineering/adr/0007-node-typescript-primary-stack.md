# ADR-0007 — Node.js and TypeScript as the Primary Application Stack

- **Status:** Superseded by [ADR-0008](0008-java-spring-backend-migration.md)
- **Date:** 2026-09-09

## Context

Beneath the Pine already has a working TypeScript monorepo: a React/Vite web client, a Fastify API, shared Zod contracts, Drizzle migrations and Supabase-backed PostgreSQL and authentication. Rewriting the API in Java/Spring or moving it to another Node.js framework would consume the remaining delivery window without validating a product assumption or fixing a demonstrated runtime constraint.

The project also needs to remain legible as a portfolio system. That requires an explicit primary stack, stable boundaries and evidence of production-minded engineering more than it requires a second backend implementation.

## Decision

1. TypeScript on Node.js 22 LTS is the primary application runtime.
2. React and Vite remain the web stack; Fastify remains the HTTP framework.
3. Product modules keep framework-independent domain and application layers. Fastify, Drizzle, Supabase and AI SDKs remain infrastructure or presentation concerns behind module boundaries.
4. Zod schemas in `packages/contracts` are the shared runtime contract between web and API.
5. PostgreSQL is the system of record. Supabase supplies managed PostgreSQL and identity; Drizzle owns versioned application schema changes.
6. Vercel hosts the web build. Render is the configured runtime for the API and scheduled data-lifecycle jobs.
7. Project-owned model inference may run as a separate Python service. It is an external provider to the Node.js application and does not own product business logic or user authorization.
8. Java remains a separate learning and portfolio track. It will not be introduced into this repository without a service requirement that specifically benefits from the JVM.

## Alternatives considered

### Rewrite the API with Java and Spring Boot

Not selected. It duplicates working behavior, raises migration and regression risk, and delays product completion. A separate Java service or project provides better learning isolation if JVM experience becomes a hiring requirement.

### Replace Fastify with NestJS

Not selected. The current modular boundaries already provide the conventions the project needs. A framework migration would add ceremony and rewrite cost without addressing a measured problem.

### Introduce a queue, cache or microservice topology now

Not selected. Current scheduled work and provider calls do not demonstrate the throughput, isolation or delivery requirements that justify extra infrastructure.

## Consequences

- Delivery effort stays focused on product behavior, tests, security and operability.
- Fastify-specific code must remain at the HTTP boundary so a future transport change is contained.
- Supabase-specific identity and data-access behavior must remain behind adapters and repository interfaces.
- The application remains a modular monolith until production evidence supports extracting a service.
- Java proficiency must be demonstrated outside this codebase rather than through a partial rewrite.

## Adoption triggers

| Technology or change | Evidence required before adoption |
| --- | --- |
| Redis | Measured hot-read pressure, distributed rate limiting, short-lived coordination or caching with an explicit invalidation policy |
| Message queue | Durable asynchronous delivery, retry/dead-letter handling or workload isolation that a database-backed job cannot meet |
| NestJS | Team-scale convention or framework capability that materially exceeds the current modular Fastify structure |
| Java/Spring service | A bounded service with JVM-specific ecosystem, performance, compliance or organizational requirements |
| Microservice extraction | Independent scaling or deployment need with clear ownership and acceptable operational cost |
| Kubernetes | Multiple independently operated services whose deployment and scheduling needs exceed managed platform capabilities |

Any adoption requires a separate ADR covering ownership, security, failure behavior, observability, cost and rollback.

## Security and rollback

This decision changes documentation only; it does not change authentication, data storage, deployment or production state. Reversal is a new architecture decision and an incremental migration plan. A runtime rewrite must never be performed as an in-place big-bang replacement.

## Follow-up

- Keep stack documentation synchronized with workspace manifests and deployment configuration.
- Close gaps in tests and operations as focused delivery slices.
- Revisit this ADR only when one of the adoption triggers is supported by production or team evidence.

## Supersession note

On 2026-09-09, the project deliberately adopted a Java/Spring target backend as a learning and portfolio constraint. The Node.js implementation remains the current runtime during an incremental migration; this record remains the historical explanation for that implementation.
