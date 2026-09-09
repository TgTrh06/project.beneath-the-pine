# CI/CD

- **Status:** Current verification pipeline; deployment automation deferred
- **Last updated:** 2026-09-09

## Current GitHub Actions pipeline

On pull requests and pushes to `main`, `.github/workflows/ci.yml`:

1. Checks out the repository in separate web and Java jobs.
2. Configures pnpm 10.32.1 and Node.js 22 with dependency caching.
3. Runs a frozen pnpm install, lint, test and build.
4. Configures Temurin Java 21 with Maven caching.
5. Runs `services/mvnw -B -f services/pom.xml verify`, including PostgreSQL Testcontainers integration tests.

The pipeline verifies the web workspaces and Java foundation but does not deploy, run production database migrations, create a Supabase environment or perform dedicated secret/dependency scanning. Those are readiness gaps, not existing guarantees.

## Deployment policy

- No backend deployment manifest exists; CI never deploys the Java service.
- Production release requires manual approval during beta.
- Migrations are controlled release steps with logs and a compatibility plan.
- Deploy only commits that passed the same verification commands used locally.
- Environment secrets must never appear in workflow output or preview builds.
- Prompt, model and provider configuration changes are versioned and reviewed like code.

## Planned hardening

- Add compiler/style and coverage gates once the first Java business slice exists.
- Run PostgreSQL, Redis and RabbitMQ integration tests in isolated CI dependencies for affected modules.
- Validate message schemas and backward compatibility.
- Build and identify each deployable independently while preserving one release correlation ID.
- Add migration and RLS integration checks against an isolated database.
- Add secret and dependency scanning.
- Add staging smoke checks before production approval.
- Preserve immutable build/release identifiers across the selected backend provider and Vercel.

Each addition should be delivered as a focused change with a working failure signal; do not document a check as enforced before CI actually runs it.
