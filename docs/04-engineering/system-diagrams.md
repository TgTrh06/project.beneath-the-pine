# System Diagrams — Public Focus Companion

- **Status:** Draft aligned with PRD 1.0
- **Last updated:** 2026-09-09
- **Legend:** `[I]` implemented, `[P]` partial, `[D]` designed, `[N]` planned, `[F]` future

These diagrams describe logical boundaries and dependencies. They do not prescribe server sizing, database capacity, deployment topology or a payment provider.

The first diagrams below distinguish the implemented Java foundation from product behavior that still needs backend reimplementation. The approved Redis/RabbitMQ deployment target is documented separately in [Target Microservices Architecture](microservices-architecture.md); it is not yet implemented.

## 1. System context

```mermaid
flowchart LR
    user[User]
    operator[Product operator]
    web[Web application\nReact and Vite]
    api[Core Service foundation\nJava and Spring Boot]
    inference[Inference service\nPython pilot]
    db[(Application data\nPostgreSQL)]
    identity[Identity provider\nSupabase Auth]
    model[AI model provider]
    payment[Payment provider\nFuture adapter]
    outbound[Outbound reminder provider\nFuture adapter]

    user -->|capture, focus, return, settings| web
    operator -->|beta approval, support, release| web
    web -->|authenticated JSON contracts| api
    api -->|identity verification| identity
    api -->|user-owned data| db
    api -->|structured inference request| inference
    api -.->|planned growth assistant path| model
    inference -->|pilot model path| model
    payment -.->|signed lifecycle events| api
    api -.->|opted-in delivery only| outbound
```

The Web and API own the product experience. Identity, model, payment and outbound services are external processors behind explicit boundaries. Dashed relationships are future capabilities.

## 2. Runtime components and ownership

```mermaid
flowchart TB
    subgraph WEB[apps/web]
      entry[main and providers I]
      shell[app layout and router I]
      now[Now partial]
      capture[Capture partial]
      focus[Focus Room partial]
      settings[Settings partial]
      review[Review partial]
      authui[Auth dialogs partial]
      webapi[Shared API client partial]
      entry --> shell
      shell --> now
      shell --> capture
      shell --> focus
      shell --> settings
      shell --> review
      shell --> authui
      now --> webapi
      capture --> webapi
      focus --> webapi
      settings --> webapi
      review --> webapi
      authui --> webapi
    end

    subgraph CONTRACTS[packages/contracts]
      schema[Shared schemas partial]
    end

    subgraph API[services/core-service]
      routes[Spring security and HTTP foundation I]
      usermod[User and consent planned]
      capturemod[Capture and AI planned]
      taskmod[Task and focus planned]
      analyticsmod[Analytics and quota planned]
      engagementmod[Engagement designed]
      reflectionmod[Reflection designed]
      entitlementmod[Entitlement future]
      routes --> usermod
      routes --> capturemod
      routes --> taskmod
      routes --> analyticsmod
      routes -.-> engagementmod
      routes -.-> reflectionmod
      routes -.-> entitlementmod
    end

    subgraph INFERENCE[services/inference-service]
      pilot[Pilot inference partial]
    end

    subgraph DATA[PostgreSQL and Flyway]
      core[(Core service schema foundation I)]
      engagement[(Engagement schema designed)]
      commerce[(Commerce schema future)]
    end

    webapi --> schema
    schema -.-> routes
    capturemod -.-> pilot
    usermod -.-> core
    capturemod -.-> core
    taskmod -.-> core
    analyticsmod -.-> core
    engagementmod -.-> engagement
    reflectionmod -.-> engagement
    entitlementmod -.-> commerce
```

## 3. Capability dependency graph

```mermaid
flowchart LR
    T0A[T0 product and UX rules]
    T0B[T0 contracts and identity]
    T0C[T0 privacy, quality and logs]
    T1A[T1 capture and next action]
    T1B[T1 Brain Dump and Help Me Start]
    T1C[T1 Focus Room lifecycle]
    T1D[T1 core events]
    T2A[T2 Open Seed]
    T2B[T2 return eligibility and ritual]
    T2C[T2 in-app reminder]
    T3A[T3 theme and local preference]
    T3B[T3 audio and YouTube]
    T3C[T3 focus presets]
    T4A[T4 landing, onboarding and demo]
    T4B[T4 Weekly Letter and feedback]
    T4C[T4 data rights and operations]
    T5A[T5 entitlement]
    T5B[T5 billing]
    T5C[T5 sync and outbound reminder]
    T5D[T5 advanced insights and ML]

    T0A --> T0B
    T0A --> T0C
    T0B --> T1A
    T0C --> T1A
    T1A --> T1B
    T1A --> T1C
    T1C --> T1D
    T1C --> T2A
    T1D --> T2B
    T2A --> T2B
    T2A --> T2C
    T1C --> T3A
    T1C --> T3B
    T3A --> T3C
    T3B --> T3C
    T1A --> T4A
    T1D --> T4B
    T2B --> T4B
    T0C --> T4C
    T4A --> T4C
    T4B --> T5A
    T4C --> T5A
    T5A --> T5B
    T3C --> T5C
    T5A --> T5C
    T4B --> T5D
    T5A --> T5D
```

## 4. Domain relationship model

```mermaid
erDiagram
    USER ||--|| PROFILE : owns
    USER ||--o{ CONSENT : grants
    USER ||--o{ BRAIN_DUMP : creates
    USER ||--o{ TASK : owns
    TASK ||--o{ NEXT_ACTION : contains
    TASK ||--o{ FOCUS_SESSION : starts
    NEXT_ACTION o|--o{ FOCUS_SESSION : guides
    USER ||--o{ CHECKIN : records
    USER ||--o{ PRODUCT_EVENT : emits
    USER ||--o{ AI_USAGE : consumes

    USER ||--o| ENGAGEMENT_PREFERENCE : configures
    USER ||--o{ REMINDER_SLOT : selects
    ENGAGEMENT_PREFERENCE ||--o{ REMINDER_SLOT : enables
    USER ||--o{ FOCUS_SEED : leaves
    TASK o|--o{ FOCUS_SEED : references
    FOCUS_SESSION o|--o| FOCUS_SEED : produces
    USER ||--o{ WEEKLY_REVIEW : receives
    WEEKLY_REVIEW ||--o| WEEKLY_LETTER_FEEDBACK : receives
    USER ||--o{ EXPERIMENT : chooses

    USER ||--o{ SUBSCRIPTION : may_have
    PLAN ||--o{ SUBSCRIPTION : defines
    PLAN ||--o{ PLAN_CAPABILITY : includes
    CAPABILITY ||--o{ PLAN_CAPABILITY : granted_by
    SUBSCRIPTION ||--o{ BILLING_EVENT : reconciled_by
```

Core entities exist in retained Supabase migration history but are not yet mapped into the Java service. Engagement relationships are designed and require migration/RLS delivery. Commerce entities are Tier 5 concepts and must not be introduced before paid validation.

## 5. Entitlement relationship

```mermaid
flowchart LR
    request[Capability request]
    policy[Capability policy]
    core[Core safety and data rights\nAlways available]
    free[Free capabilities\nManual capture, focus, return]
    quota[Free quota\nAI-assisted actions]
    plus[Pine Plus hypothesis\nPresets, library, sync, advanced insight]
    denied[Upgrade context\nNo data loss]
    allowed[Capability execution]

    request --> policy
    policy --> core
    policy --> free
    policy --> quota
    policy --> plus
    core --> allowed
    free --> allowed
    quota -->|quota available| allowed
    plus -->|active entitlement| allowed
    quota -->|quota exhausted| denied
    plus -->|inactive entitlement| denied
```

Entitlement belongs at the application boundary and is enforced by the API for paid capabilities. UI checks improve presentation but are not authorization. Focus sessions already in progress, user-created data and data-rights actions remain accessible regardless of plan state.

## 6. Diagram-to-implementation index

| Need | Canonical detail |
|---|---|
| Capability scope and gate | [Tiered Delivery Plan](../02-product/tiered-delivery-plan.md) |
| Core focus runtime behavior | [Core Focus Sequences](sequences/core-focus-flow.md) |
| Seed, return, reminder and letter behavior | [Gentle Return Sequences](sequences/gentle-return-flow.md) |
| Entitlement and billing behavior | [Commercial Sequences](sequences/commercial-flow.md) |
| Endpoint payloads for retention | [Engagement API Contract](../ai/contracts/engagement-api.md) |
| Logical data rules | [Data Model](data-model.md) |
| Safety/privacy invariants | [Privacy by Design](../06-security-privacy/privacy-by-design.md) |
| Java migration and target services | [Target Microservices Architecture](microservices-architecture.md) |
| RabbitMQ, outbox/inbox, retry and Redis | [Event-Driven Architecture](event-driven-architecture.md) |
| Planned integration messages | [Event and Command Catalog](event-catalog.md) |
