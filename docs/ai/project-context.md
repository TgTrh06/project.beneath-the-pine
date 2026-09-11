# Project Context for Implementation

## Product invariant

A person should see one primary action that fits the present moment. Retention must reduce the friction of returning; it must not add pressure or create backlog overload.

## Current architecture

- `apps/web`: React/Vite UI with first-party session authentication and local demo behavior when the API is not configured.
- `services/core-service`: Java/Spring Boot modular monolith with account/session authentication and the Task vertical slice.
- `packages/contracts`: shared Zod schemas and event types.
- `supabase`: versioned SQL migrations and row-level security.
- Vercel: web build hosting.
- Backend hosting: not selected or configured by the repository.
- `services/inference-service`: optional Python pilot provider, not a product backend and not yet wired to Java.

Java/Spring Boot is the backend direction and its service foundation is implemented. The next phase rebuilds a complete Core Service business slice; Redis, RabbitMQ/AI Worker and an extracted Engagement Service remain planned. Do not describe planned components as implemented. See [Technology Stack](../04-engineering/technology-stack.md), [Target Microservices Architecture](../04-engineering/microservices-architecture.md) and the [Event Catalog](../04-engineering/event-catalog.md).

## Existing conventions

- API routes live under `/api/v1`; authenticated member routes pass through authorization guards.
- Raw Brain Dump and check-in content is encrypted; analytics excludes raw content.
- User-owned persistence requires ownership checks in the API and RLS in the database.
- The web application must preserve local demo behavior; server-only behavior needs an explicit fallback.
- Domain and application layers do not import Spring MVC, JPA, Supabase or AI SDKs.
- Shared request and response changes begin in `packages/contracts`.
- Each entity has one active writer; never introduce parallel or dual-write implementations.
- Private AI input is referenced rather than copied into RabbitMQ messages whenever possible.

## Retention decisions

- Return eligibility begins when no core event exists for three days in the profile timezone.
- Reminders are off by default, allow at most two slots and begin with in-app delivery; an outbound provider is deferred.
- Theme and audio URL remain local-only in the first phase.
- Each user can have at most one `open` Focus Seed.
