# ADR-0010 — First-Party Spring Security Authentication

- **Status:** Accepted; local implementation complete
- **Date:** 2026-09-10
- **Supersedes:** The Supabase Auth decision in [ADR-0008](0008-java-spring-backend-migration.md)

## Context

The project has no production accounts or identity data to migrate. The React application and Spring Core Service need one authentication model that can run locally without an external identity service. User-owned tables already use UUID ownership columns, and the current private-beta scope does not require federation or multiple OAuth clients.

## Decision

1. The Core Service owns account records in `core.accounts` and uses the account UUID as the stable user identifier.
2. Spring Security authenticates normalized email addresses and BCrypt password hashes. Application code does not implement password hashing or credential comparison primitives.
3. Successful registration or login creates a server-side HTTP session. The browser receives only the opaque `BTP_SESSION` cookie, which is HttpOnly and configurable as Secure and SameSite by environment.
4. Spring Security CSRF protection remains enabled. The Web obtains a token from `GET /api/v1/auth/session` and sends it as `X-XSRF-TOKEN` on every state-changing request.
5. Session IDs change when an existing session authenticates. Logout invalidates the server session and clears the session and CSRF cookies.
6. Login errors do not reveal whether an email exists. Authorization and resource ownership remain service responsibilities after authentication.
7. The first slice supports registration, login, session lookup and logout. Email verification, password recovery, MFA, credential breach checks and distributed session storage are release gates before accepting production accounts where those controls are required.

## Alternatives considered

### Keep Supabase Auth

This retains a managed dependency and the previous magic-link client, but it conflicts with the decision to own authentication in the Spring application.

### Run Keycloak

Keycloak provides a full OIDC identity platform, but it adds a separate runtime, realm configuration and redirect flow that this new private-beta codebase does not currently need.

### Issue application JWTs to the browser

Application-issued access and refresh tokens add key rotation, token revocation and browser token-storage concerns. A server-side session gives Spring Security a smaller browser attack surface for the current single Web/API boundary.

## Consequences

- The Core Service database and process become dependencies for login and authenticated requests.
- A process restart invalidates current in-memory sessions. Before running more than one API instance, use a shared Spring Session store and test expiry, revocation and failure behavior.
- The Web must use `credentials: include`, and deployed Web/API origins must be configured so browser cookie and CORS rules work together.
- `SESSION_COOKIE_SECURE=true` is mandatory behind production HTTPS. The chosen SameSite mode must match the deployed origin topology; cross-site hosting requires a reviewed cookie and CSRF configuration.
- Changing authentication after real accounts exist requires an explicit subject, credential and session migration plan.

## Security and rollback

- Passwords are accepted only over HTTPS outside local development, are never logged and are stored only as adaptive BCrypt hashes with work factor 12.
- Password input is 12–64 characters and at most 72 UTF-8 bytes, avoiding BCrypt input truncation. Registration normalizes email casing and database constraints enforce uniqueness.
- User-owned repositories query by both resource ID and the authenticated account UUID.
- The implementation is suitable for local development and continued private-beta engineering. Production account intake remains blocked until recovery, verification, abuse controls, monitoring and shared-session needs are explicitly resolved.
- Because there is no production identity data, rollback can remove `core.accounts` and restore a different provider before launch. After account creation in any shared environment, rollback requires a migration decision.

## Follow-up

- Add email ownership verification and a single-use password reset flow before users depend on account recovery.
- Add rate limiting and credential-stuffing monitoring before exposing login publicly.
- Add shared session persistence before horizontal scaling or zero-downtime instance replacement.
- Introduce roles only with a concrete operator capability and server-side authorization tests.
