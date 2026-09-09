# Beneath the Pine

> A gentle Vietnamese companion that turns overwhelm into one small action a person can begin now.

Beneath the Pine helps people pause, identify what matters and take a calm next step. It does not treat productivity as a measure of personal worth, and it is not a diagnostic, treatment or replacement for professional care.

## Start here

| Goal | Read |
| --- | --- |
| Understand the product promise and boundaries | [Product Direction](docs/00-foundation/product-direction.md) |
| Understand delivery order and capability status | [Tiered Delivery Plan](docs/02-product/tiered-delivery-plan.md) |
| Work on the application | [Engineering Guide](docs/04-engineering/README.md) |
| Change a user-facing flow | [Design Guide](docs/03-design/README.md) |
| Change AI behavior | [AI Implementation Handbook](docs/ai/README.md) |
| Browse the complete decision record | [Documentation Map](docs/README.md) |

## Architecture at a glance

Current repository shape:

```text
React 19 + Vite web
        |
        | /api/v1 JSON + Supabase JWT
        v
Java 21 + Spring Boot 4 core-service skeleton
        |
        +-- Spring Security resource server
        +-- PostgreSQL + Flyway
        +-- Actuator health endpoints

Python inference-service (isolated pilot provider; not yet wired to core-service)
```

The previous Fastify API has been removed. The Java service currently supplies a production-shaped foundation and an authenticated diagnostic endpoint, not the former product business routes. Redis, RabbitMQ and additional deployables remain approved future slices; they are deliberately absent from the running skeleton. See [ADR-0008](docs/04-engineering/adr/0008-java-spring-backend-migration.md), [ADR-0009](docs/04-engineering/adr/0009-redis-rabbitmq-microservices.md) and the [Target Microservices Architecture](docs/04-engineering/microservices-architecture.md).

## Local development

### Prerequisites

- Node.js 22.12 or later and pnpm 10.32.1 for the web workspace
- Java 21 or later for compilation; Java 21 is the release target
- Docker for PostgreSQL integration tests and container builds
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) when local Auth or the retained Supabase schema is needed

### Web

1. Copy `.env.example` to `.env` and fill only the values needed for your local mode.
2. Run `pnpm install` from the repository root.
3. Run `pnpm dev`.

The web client runs at `http://localhost:5173`. Without Supabase browser settings it uses local demo mode; that mode is not equivalent to authenticated product behavior.

### Java core service

1. Start PostgreSQL/Supabase locally or provide the JDBC and Supabase JWT settings listed in `.env.example`.
2. From `services/`, run:

   ```sh
   ./mvnw -pl core-service spring-boot:run
   ```

   On Windows use `mvnw.cmd`. The service defaults to `http://localhost:8080`; liveness is available at `/actuator/health/liveness`.

3. Run the Java verification suite with `./mvnw verify`.

The integration suite uses Testcontainers and skips its PostgreSQL tests when Docker is unavailable.

### Commands

| Command | Purpose |
| --- | --- |
| `pnpm lint` | Type-check applicable web workspace packages |
| `pnpm test` | Run web workspace tests |
| `pnpm build` | Verify and produce the web production build |
| `services/mvnw verify` | Compile Java, run unit/integration tests and package the service |
| `docker build -f services/core-service/Dockerfile services` | Build the Java core-service image |

## Workspace map

| Path | Responsibility |
| --- | --- |
| `apps/web` | React/Vite product experience and beta-admin shell |
| `services/core-service` | Spring Boot backend foundation and service-owned Flyway migrations |
| `services/inference-service` | Python/FastAPI pilot inference provider |
| `packages/contracts` | Retained Zod schemas and browser-facing API types pending Java contract migration |
| `supabase` | Local Supabase configuration and retained historical/product schema migrations |
| `docs` | Product, design, engineering, safety, testing, operations and release decisions |
| `ml` | Reproducible AI-training material and safe public fixtures |

## Working rules

- Keep user data private by default. Never commit secrets, personal data or real research transcripts.
- Treat product, design, privacy and accepted ADRs as decision sources when implementation details conflict.
- The Java service owns new backend migrations. Existing Supabase migrations are retained and must not be edited in place.
- Update prompt records, output contracts, evaluation and safety policy together when AI behavior changes.
- Add Redis, RabbitMQ or another deployable only through the phases and safeguards accepted in ADR-0009.

## Project status

The repository contains the React/Vite client, shared contracts, retained Supabase migrations, the new Java core-service skeleton and the relocated Python inference provider. Rebuilding the former backend business capabilities in Java is the next implementation phase. No production deployment or database migration is performed by this repository restructure.
