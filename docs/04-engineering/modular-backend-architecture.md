# Modular Backend Architecture

- **Status:** Java foundation and module convention
- **Last updated:** 2026-09-10
- **Historical stack record:** [ADR-0007](adr/0007-node-typescript-primary-stack.md)
- **Migration decision:** [ADR-0008](adr/0008-java-spring-backend-migration.md)

The backend foundation in `services/core-service` is a Spring Boot modular monolith. Product behavior will be rebuilt around these domain boundaries:

- `identity`: first-party accounts, credential verification and browser sessions.
- `user`: beta authorization, profile, consent, bootstrap and account data.
- `beta`: waitlist, invitation and beta approval.
- `task`: next actions and focus sessions.
- `habit`: the three-habit limit and daily completion.
- `capture`: Brain Dump, check-in, weekly review, encrypted-content export and purge.
- `analytics`: product events and AI quota.

Each module uses `domain`, `application`, `infrastructure` and `presentation` packages only when behavior needs them. Spring configuration composes adapters and use cases. Domain and application code must not depend on Spring MVC, JPA, PostgreSQL, Supabase or provider SDKs; HTTP, persistence and provider details remain at the boundary.

Do not create empty `workspace`, `project`, `note` or `notification` modules before the product has corresponding behavior and data. New capabilities follow the same boundaries instead of creating global controller, service or repository folders.

## Dependency direction

```text
presentation -> application -> domain
       |               ^
       v               |
infrastructure --------+
```

- Presentation translates HTTP requests and responses.
- Application coordinates authorization-aware use cases and ports.
- Domain contains product rules and value semantics.
- Infrastructure implements ports for PostgreSQL and external providers; Spring Security supplies the authentication boundary.
- Cross-module calls use explicit application contracts, not another module's infrastructure.

## Extraction rule

A module is not a microservice by default. Extract it only when it needs independent deployment or scaling, has clear data ownership, and the operational cost is justified. A queue, cache or second runtime requires its own ADR and failure model.

## Java migration mapping

Use a domain-oriented Java structure rather than global `controller/service/repository` layers:

```text
core-service/src/main/java/.../
├── task/{domain,application,infrastructure,presentation}
├── focus/{domain,application,infrastructure,presentation}
├── capture/{domain,application,infrastructure,presentation}
├── consent/{domain,application,infrastructure,presentation}
└── shared/
```

Task/focus is the first planned business vertical slice. The removed backend is a reference in Git, not an active writer. Engagement remains a module until the Java core and messaging reliability are proven, then follows the extraction gates in [Target Microservices Architecture](microservices-architecture.md).
