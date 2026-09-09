# Infrastructure Plan

- **Status:** Java foundation; backend hosting undecided
- **Last updated:** 2026-09-09

## Current topology

| Capability | Provider/runtime | Current configuration |
| --- | --- | --- |
| Web hosting | Vercel | Vite build from `apps/web`, configured by `vercel.json` |
| Backend hosting | Not selected | Spring Boot image definition exists; no deployment manifest |
| Scheduled lifecycle work | Not implemented | Reintroduce only with the owning Java module/worker |
| Database | Supabase PostgreSQL target/local PostgreSQL | Retained SQL/RLS history plus new service-owned Flyway migrations |
| Identity | Supabase Auth | Browser session plus server verification |
| AI | Isolated Python pilot | Provider integration into Java is not implemented |
| CI | GitHub Actions | Web verification plus Maven/JUnit/Testcontainers verification |

The Core Service is a modular-monolith foundation, not a deployed product backend. Product modules are not separate services.

## Environment isolation

- Staging and production use separate databases, keys and encryption material.
- Production access follows least privilege and is reviewed.
- Preview builds do not receive production server secrets.
- Data region and processor terms are reviewed before real user data is enabled.

## Reliability baseline

- Health endpoint for the API and deployment smoke checks.
- Bounded database connections and graceful API shutdown.
- Controlled migration execution, separate from ordinary API startup.
- Idempotent scheduled work with recorded success/failure.
- Budget and quota visibility for infrastructure and AI providers.
- Managed database backups with a tested restore procedure before public launch.

## Approved target topology

| Capability | Target | Status |
| --- | --- | --- |
| Core backend | Java/Spring Boot container | Foundation and image implemented; provider/deployment pending |
| Gateway/BFF | Java/Spring entry service | Planned when multiple backend routes require it |
| Cache/coordination | Managed Redis | Planned after the first Java slice |
| Durable messaging | Managed RabbitMQ | Planned with outbox and AI Worker |
| Engagement | Independent Spring Boot service | Planned after messaging reliability |
| AI processing | Java worker plus Python/external inference | Planned extraction |
| Telemetry | Central logs, metrics and distributed traces | Required before service extraction is production-ready |

The Vercel web configuration and Supabase assets remain. The obsolete Render manifest has been removed. Selecting and changing backend infrastructure requires a separately approved deployment plan. Kubernetes is not required for the planned service count.

## Migration path

1. Measure endpoint latency, database load, provider latency and job duration.
2. Optimize queries, indexes, payloads and process concurrency within the modular monolith.
3. Scale managed API or database capacity when measurement supports it.
4. Implement the Java task/focus slice with one data writer and a Git/application rollback plan.
5. Add Redis with explicit degradation behavior.
6. Add RabbitMQ, outbox/inbox and AI Worker before extracting Engagement.
7. Extract Engagement only after service ownership, telemetry and recovery gates pass.

See [Target Microservices Architecture](../04-engineering/microservices-architecture.md) for boundaries and phase outcomes.
