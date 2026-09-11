# Project Context for Implementation

## Direction and current work

Mobile is the primary long-term product; React/Vite web is built first against a shared API. The selected backend direction is NestJS + TypeScript, PostgreSQL and Drizzle ORM/Kit. [ADR-0011](../04-engineering/adr/0011-nestjs-drizzle-mobile-direction.md).

The approved scaffold now exists in apps/api: 12 Nest modules, platform, Drizzle/node-postgres connection and tests. Business logic, auth, schemas and migrations are not implemented. Legacy implementation and the unfinished direct-pg draft remain in services/core-service. Follow the [module delivery plan](../04-engineering/module-delivery-plan.md) for the next slice.

Core modular monolith is accepted; inference remains independent and workers require a concrete need. Redis/RabbitMQ and service extraction are conditional, not a required sequence. Read [Architecture Options](../04-engineering/architecture-options.md), [Repository Structure](../04-engineering/repository-structure.md) and [API Strategy](../04-engineering/web-mobile-api-strategy.md) before coding.

## Product invariants

A person sees one primary action that fits the present moment. Return reduces friction without backlog pressure, streak loss or shame. Current scope has no AI: capture is manual and reflection uses deterministic facts/templates. AI integration needs a future approved scope.

React Native + Expo is selected. First operating system, native authentication, push and offline synchronization remain open. Responsive web is the first client, not proof that a native product exists.

## Implementation boundaries

- API contracts stay independent of Nest, Drizzle tables and browser UI.
- Owner identity comes from authentication; repository filters resource and owner.
- Public Supabase RLS history is not authorization for core.*.
- Drizzle schema and migrations stay server-side; baseline must be reviewed before applying to any existing DB.
- Browser session/CSRF is the historical baseline; native credential lifecycle needs its own review.
- One data writer per entity; no hai backend dual writes.
- Python inference remains an isolated pilot with no current core caller.
- Analytics excludes raw content; provider/job payloads use minimum authorized data.

## Retention design

Return eligibility uses three days without a core event in profile timezone. Reminders begin opt-in/in-app, at most two slots. Theme/audio preferences are local in the first slice; server account data shared between web/mobile does not automatically imply offline preference sync. One open seed per user. These retention designs do not require distributed services.

The handbook and sequence examples are subordinate to current product/ADR decisions; old worker/broker examples are conditional designs, not authorization to add infrastructure.
