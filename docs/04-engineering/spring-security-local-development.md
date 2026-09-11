# Local Spring Security Authentication

- **Status:** Implemented local baseline
- **Decision:** [ADR-0010](adr/0010-first-party-spring-security-authentication.md)

The Core Service owns synthetic local accounts in PostgreSQL. Do not reuse local passwords or copy production account records into this environment.

## Start the authenticated stack

1. Start PostgreSQL at the JDBC address configured by `DATABASE_URL`. The repository default is `jdbc:postgresql://localhost:54322/postgres`, which also matches the retained local Supabase database port.
2. Copy `.env.example` to an untracked `.env` or export the listed values in your shell.
3. Start the Core Service from `services/`:

   ```powershell
   .\mvnw.cmd -pl core-service spring-boot:run
   ```

4. Start the Web from the repository root:

   ```powershell
   pnpm dev
   ```

5. Open `http://localhost:5173`, choose **Đăng nhập beta**, and create a synthetic account with a 12–64 character password that is at most 72 UTF-8 bytes.

Flyway creates `core.accounts` and links `core.tasks.user_id` to the account UUID. Registration signs the new account in immediately.

## Browser protocol

1. `GET /api/v1/auth/session` returns the current account, if any, and a CSRF token.
2. `POST /api/v1/auth/register` and `POST /api/v1/auth/login` require the token in `X-XSRF-TOKEN` and create a `BTP_SESSION` cookie.
3. The Web uses `credentials: include` on every API request. Mutations also send the current CSRF token.
4. `POST /api/v1/auth/logout` invalidates the session and clears both cookies.

The password never leaves the login or registration request and is never stored by the Web. The server stores a BCrypt hash with work factor 12.

## Configuration

| Variable | Local default | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Browser API base URL |
| `WEB_ORIGIN` | `http://localhost:5173` | Exact browser origin accepted by CORS |
| `SESSION_TIMEOUT` | `30m` | Idle session timeout |
| `SESSION_COOKIE_SECURE` | `false` | Allows HTTP during local development; must be `true` under deployed HTTPS |
| `SESSION_COOKIE_SAME_SITE` | `lax` | Session cookie SameSite policy |

The CSRF cookie uses the same configured Secure and SameSite values as the session cookie. It is HttpOnly because the Web reads the token from the JSON response instead of browser cookie APIs. Do not use wildcard credentialed CORS origins.

## Verification

Run the affected automated checks from the repository root:

```powershell
.\services\mvnw.cmd -f .\services\pom.xml -B verify
pnpm lint
pnpm test
pnpm build
```

The integration suite verifies migration, BCrypt storage, generic invalid-credential behavior, session restoration, CSRF rejection and account-scoped task ownership with a PostgreSQL Testcontainer.

## Production gaps

This baseline does not yet provide email verification, password reset, MFA, shared session persistence or public-endpoint abuse controls. Complete the applicable controls and set `SESSION_COOKIE_SECURE=true` before accepting real accounts.
