# Environment and Configuration

- **Status:** Current baseline
- **Last updated:** 2026-09-09

## Environments

| Environment | Purpose | Real user data | Expected services |
| --- | --- | --- | --- |
| Local | Development and manual checks | No | Local web/core-service; local Supabase when authenticated flows are needed |
| Test | Automated checks | Synthetic only | Isolated process state and Testcontainers PostgreSQL |
| Preview | Review a web change | No production data | Vercel preview with non-production configuration |
| Staging | Release rehearsal and private QA | Consented tester data only | Separate Supabase project, API service and secrets |
| Production | Beta or public service | Yes | Production providers are not yet selected for the Java backend |

Staging and production must not share database projects, service-role keys, encryption keys or provider credentials.

## Configuration ownership

| Variables | Consumer | Exposure rule |
| --- | --- | --- |
| `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_LOG_LEVEL` | Web build | Browser-visible; never place privileged secrets in a `VITE_` variable |
| `SERVER_PORT`, `WEB_ORIGIN`, `LOG_LEVEL` | Core Service | Server configuration |
| `DATABASE_URL`, `DATABASE_USERNAME`, `DATABASE_PASSWORD` | Core Service | Server-only connection settings and credentials |
| `SUPABASE_ISSUER`, `SUPABASE_JWKS_URI` | Core Service | JWT verification endpoints; credentials are not used |

`.env.example` is the canonical repository-level inventory. Spring configuration in `services/core-service/src/main/resources/application.yml` defines backend defaults and typed bindings.

## Planned Java and distributed infrastructure configuration

The following categories are target design only and must not be added to `.env.example` until the corresponding implementation slice is approved:

| Category | Intended consumers | Rules |
| --- | --- | --- |
| Service database URLs/roles | Each owning service | One least-privilege credential per service/schema |
| Redis endpoint/credentials | Gateway and explicitly approved services | TLS in deployed environments; key namespaces and timeouts per owner |
| RabbitMQ endpoint/vhost/credentials | Publishers and consumers | Separate least-privilege users; publisher confirms and bounded prefetch |
| Internal service identity | Gateway and services | Rotatable credentials; never reuse the Supabase service-role key |
| Telemetry exporter | All services/workers | Redaction before export; consistent trace propagation |

Java integration tests already use a PostgreSQL Testcontainer. Redis and RabbitMQ containers are deferred with their implementation slices.

## Rules

- Commit `.env.example`; never commit a real `.env` or secret value.
- Startup diagnostics name missing variables but never log their values.
- Limited local mode may warn about missing backend configuration. AI-provider settings will return when the Java AI adapter is implemented.
- Production secrets belong in provider secret stores and follow least privilege.
- Preview builds never receive production server secrets.
- Do not copy production records into local or automated tests.
- A new environment variable must update `.env.example`, the parser, deployment configuration and this ownership table in the same change.

## Local modes

- **UI demo:** run the web client without Supabase; private demo state stays in the browser.
- **Java foundation:** run web, Core Service and local PostgreSQL/Supabase with synthetic data; former product API routes are not yet implemented.
- **Inference pilot:** run `services/inference-service` independently with its service token and model settings.

Demo mode is a development convenience, not a production fallback for authentication or persistence.
