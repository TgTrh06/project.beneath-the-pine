# Test Strategy — Focus and Gentle Retention

- **Status:** Approved baseline
- **Last updated:** 2026-09-09

## Stack verification

The repository-level release checks are:

```sh
pnpm lint
pnpm test
pnpm build
```

Vitest is the current test runner for web and API workspaces. TypeScript compiler checks provide the current lint/type-check gate. Do not claim a formatter, browser E2E suite, containerized database suite or coverage gate until it exists in automation.

The approved Java target adds JUnit 5 and Testcontainers when its foundation is implemented. Until then, Java, Redis and RabbitMQ checks are planned requirements rather than passing gates.

## Test layers

- **Unit and contract:** Zod schemas, domain rules, timezone thresholds, seed transitions and weekly evidence gates.
- **Integration:** migrations/RLS, API identity and ownership, bootstrap derivation, export/delete and idempotent reminder windows against an isolated database.
- **UI:** local demo and authenticated states, Focus Studio audio fallback, seed/reminder/return/letter states, keyboard use and 320px layout.
- **Provider contract:** deterministic fallback, invalid AI output, timeout and unavailable-provider behavior.
- **Non-functional:** prohibited-content inspection in analytics/logs, reduced motion and safe degradation.

## Java and distributed-system gates

- Contract compatibility between retained web schemas and each new Spring route.
- Supabase JWT, role, ownership and private-content parity before route cutover.
- PostgreSQL integration through isolated Testcontainers with Flyway migrations.
- Redis TTL, namespace, cache-miss fallback, lock expiry and unavailable-cache behavior.
- RabbitMQ publisher confirms, outbox recovery, duplicate delivery, out-of-order delivery, bounded retry and DLQ routing.
- Consumer idempotency proven by delivering the same `messageId` more than once.
- Core task/focus behavior available when Redis, RabbitMQ, Engagement and AI are unavailable.
- Trace/correlation continuity across HTTP, outbox publication and message consumption without private payloads.
- Account deletion saga covers every service-owned store and reports incomplete cleanup visibly.

## Required scenarios

The executable planning matrix is the [retention acceptance matrix](../ai/retention/acceptance-matrix.md). Add a regression test for every authorization, privacy, timezone, encryption or opt-out defect.

## Data rules

- Automated tests use synthetic data only.
- Integration tests never point at production or a shared staging database.
- Logs and snapshots must not contain secrets or raw private content.
- RLS and API ownership checks are separate defenses and both require evidence.

## Release gate

- No P0/P1 defect in capture, next action, focus or return.
- Reminder delivery cannot continue after opt-out.
- Focus remains usable without audio or an AI provider.
- No raw user content appears in analytics or operational logs.
- Affected contract, migration, API and web checks pass.
- The documented root verification commands pass for the release commit.
- A migrated route has one active data writer and a tested routing rollback.
