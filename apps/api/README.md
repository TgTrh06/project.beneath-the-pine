# Core API

NestJS modular monolith with PostgreSQL, Drizzle and Socket.IO. The core modules implement account/profile, private Circle invitation, Focus Pact, solo/shared session, Open Seed, presence, milestone, privacy export/deletion and allowlisted events.

## Commands

```sh
pnpm dev:api
pnpm lint:api
pnpm test:api
pnpm build:api
```

Node >=22.12 and pnpm 10.32.1 are required by workspace metadata. Docker-backed local PostgreSQL is available through `pnpm db:local:up`; this is local development only.

`drizzle/0000_core_baseline.sql` is a pre-launch baseline. Do not apply it over a database that used the removed identity-only `0000`; recreate an explicitly disposable development database instead. No migration, deployment or remote action is implied by this README.
