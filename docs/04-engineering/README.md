# 04 — Engineering

This section explains how the product becomes a reliable service: its selected stack, system boundaries, data decisions and operating rules.

## Current shape

The repository uses a React 19/Vite client and a Java 21/Spring Boot Core Service foundation, with retained Zod contracts and Supabase PostgreSQL/Auth migrations. Former backend business behavior still needs Java reimplementation. Redis, RabbitMQ and additional services remain later approved phases, not current dependencies.

## Read by task

| Need | Read |
| --- | --- |
| Compare the current runtime with the approved Java target | [Technology Stack](technology-stack.md), [ADR-0008](adr/0008-java-spring-backend-migration.md) and [ADR-0009](adr/0009-redis-rabbitmq-microservices.md) |
| Understand service boundaries and extraction order | [Target Microservices Architecture](microservices-architecture.md) |
| Design commands, events, retries or cache usage | [Event-Driven Architecture](event-driven-architecture.md) and [Event Catalog](event-catalog.md) |
| Follow a request through the system | [System Architecture](system-architecture.md) |
| Inspect context, components, capabilities, domains and entitlement | [System Diagrams](system-diagrams.md) |
| Follow core focus, gentle return or commercial flows | [Sequence Diagrams](sequences/README.md) |
| Work with an API module or dependency boundary | [Modular Backend Architecture](modular-backend-architecture.md) |
| Work with the pilot inference service | [Local Inference Architecture](local-inference-architecture.md) |
| Change data or migrations | [Data Model](data-model.md) and [API Guidelines](api-guidelines.md) |
| Configure local or deployed environments | [Environment and Configuration](environment-and-config.md) |
| Prepare or review an implementation | [Engineering Standards](engineering-standards.md) |
| Record a durable architecture choice | [Architecture Decision Records](adr/README.md) |

## Working boundary

Architecture documents describe both current and intended shapes. Diagram labels—`implemented`, `partial`, `designed`, `planned` and `future`—prevent intended capabilities from being mistaken for running code. When implementation and an accepted decision disagree, investigate and record a new ADR before making a significant architecture change. For retention delivery, also read the [AI Implementation Handbook](../ai/README.md).
