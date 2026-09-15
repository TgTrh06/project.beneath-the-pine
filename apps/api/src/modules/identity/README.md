# Identity — Wanderer and Pine Keeper

Implemented: email/password register/login/logout, cookie session, CSRF and role-guarded account listing. See [ADR-0013](../../../../../docs/04-engineering/adr/0013-wanderer-pine-keeper-auth.md).

## Setup (explicit operations, not run automatically)

1. Configure `API_DATABASE_URL` and `API_WEB_ORIGIN` in `apps/api/.env`. The origin must exactly match the browser (including localhost vs 127.0.0.1). Use HTTPS outside local development.
2. Review `apps/api/drizzle/0000_identity_accounts_sessions.sql` and the intended database. After approval, run from the repository root:

```sh
pnpm --filter @beneath-the-pine/api db:migrate
```

3. Set `PINE_KEEPER_EMAIL` and `PINE_KEEPER_PASSWORD` (12–64 characters) in that server-only env file. After approving the seed target:

```sh
pnpm --filter @beneath-the-pine/api db:seed
```

4. Start `pnpm dev:api` and `pnpm dev`. Open `http://127.0.0.1:5173/`. Vite proxies `/api/v1` to port 8081. Production needs its own same-origin reverse proxy. Optional `VITE_API_URL` overrides the base URL; never put Keeper credentials in frontend env.

Seed creates one Keeper if absent; repeated runs preserve password and role. An existing Wanderer email produces a failure without privilege escalation. Missing/invalid env fails before connecting. Seed logs only status, not credentials. It never runs at ordinary application startup.

## HTTP contract

- `GET /api/v1/auth/session`: current public identity or anonymous session plus CSRF token.
- `POST /api/v1/auth/register`: strict `{email,password}`; creates Wanderer.
- `POST /api/v1/auth/login`: same credentials; rotates session.
- `POST /api/v1/auth/logout`: revokes cookie session, 204.
- `GET /api/v1/admin/accounts?offset=0`: Pine Keeper only; 50 rows/page and `hasMore`. Only id, email, role and creation date.

All mutations require `Origin` and `X-XSRF-TOKEN`; cookies use credentials include. Password hashes and session token hashes never appear in response DTOs. Recovery/email verification and personal-data endpoints are not implemented. An unavailable database returns 503, not a fake authenticated user.

## Tests

`pnpm test:api` runs isolated HTTP tests and skips the PostgreSQL integration test unless `BTP_TEST_DATABASE_URL` is explicitly set to a disposable test database. That test creates/drops only a randomly named `identity_test_*` schema. Never point it to production. It checks SQL, unique emails, session cascade and seed idempotency/conflict.

Migration rollback is not automatic deletion: preserve identity tables and use a compatible code rollback or forward migration. No migration or seed was applied to the user's current database as part of implementation.
