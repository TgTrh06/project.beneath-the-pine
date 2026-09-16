# ADR-0013 — Wanderer / Pine Keeper browser authentication

Status: Superseded by ADR-0017 on 2026-09-16. Cookie/session/CSRF mechanics remain an implementation reference; the role and seed design below is historical and is no longer implemented. No deployment or migration execution authorized by this ADR.

## Decision

Replace the active local demo and waitlist flow with email/password accounts. Public registration creates `wanderer` only. `pine_keeper` is seeded from server-only `PINE_KEEPER_EMAIL` and `PINE_KEEPER_PASSWORD`. Seed is idempotent, preserves existing Keeper passwords, and rejects an email already owned by a Wanderer. No public role mutation endpoint.

Keep NestJS, PostgreSQL and Drizzle. Identity owns accounts and sessions. Use native asynchronous scrypt with random salts, N=32768, r=8, p=3, a 64-byte output, and a 12–64-character password policy. Parameters follow the [OWASP scrypt guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html); no new password library is required. The current `scrypt` encoding identifies these fixed parameters; a future cost change must version the encoding and retain verification for this version.

A random 256-bit opaque cookie identifies a database session through its SHA-256 hash. Cookies are HttpOnly, SameSite=Lax, Path=/ and Secure with an HTTPS web origin. Production requires HTTPS and same-site web/API hosting. Anonymous CSRF sessions expire after one hour; authenticated sessions expire absolutely after seven days. Login/register rotates the session and CSRF secret; logout revokes it. Expired rows are cleaned on session issuance. Account deletion cascades sessions. Retention/lifecycle for account deletion and password recovery is a separate feature.

All non-public controllers require a valid session. Unsafe methods also require the configured exact Origin and a session-bound CSRF token. Pine Keeper routes additionally check the current database role on every request. Client user IDs, roles and bearer headers grant no access. Only account metadata is exposed to Keepers, not notes or passwords. Future resource repositories must scope queries to the authenticated account UUID; no task/content endpoints ship in this slice.

Authentication requests are limited per IP (20/minute, bounded map) in this single API process. A multi-instance deployment requires a shared limiter or rate limiting at the ingress; this in-process limiter resets on restart. Proxy trust is not enabled implicitly. Anonymous session creation is also rate limited.

## Scope and alternatives

No dynamic permission editor, role hierarchy, external identity provider, native token adapter, email verification, password reset or MFA in this slice. A persistent session store was selected over self-contained JWTs for immediate revocation and fresh role checks. Personal business screens show unavailable states until their real API exists; removed the active demo execution path rather than return fake successful data.

## Verification and rollout

HTTP tests exercise registration, CSRF, session rotation/expiry/revocation, login errors, rate limiting, role denial and account identity separation using an isolated test repository. The optional PostgreSQL test verifies generated SQL, uniqueness, foreign keys and seed behavior in a random test schema. It never defaults to `API_DATABASE_URL`. See the Identity README for setup.

Migration and seed must be run explicitly against a reviewed target. Do not apply the new baseline over historical account tables as if they were this schema; there is no automatic legacy-user import. Code rollback must retain the new account tables and session records. Do not drop tables to roll back a release; use a forward fix or a compatible artifact. No production credentials, seeded accounts or external service state are changed by preparing these files.
