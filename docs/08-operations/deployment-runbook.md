# Deployment Runbook

This runbook prepares a consented private pilot. It does not authorize choosing a hosting provider, changing a remote service, running a migration against a pilot database, or deploying.

## Current deployment artifact

- The web client is a static Vite build in `apps/web/dist`; `vercel.json` defines its current build settings.
- The API is packaged as a Docker image from the repository root with `docker build -t beneath-the-pine-api .`.
- The API container listens on `0.0.0.0:8081` by default. The host must route HTTP and WebSocket traffic to the same API instance and preserve Socket.IO upgrade requests.
- The container does not run migrations on startup. Run `node scripts/migrate.cjs` as an explicit one-off command using the same image and the target database URL, only after its migration review is approved.

## Required configuration

Set server configuration through the hosting platform's secret/environment manager. Never bake `.env` files or credentials into the image.

| Variable | Required value |
| --- | --- |
| `API_HOST` | `0.0.0.0` in the container. |
| `API_PORT` | The port routed by the host, normally `8081`. |
| `API_WEB_ORIGIN` | Exact HTTPS origin of the deployed web app, without a path or trailing slash. Used for credentialed HTTP and Socket.IO origin checks. |
| `API_DATABASE_URL` | PostgreSQL connection URL from a least-privilege server-side secret. Never expose it to the web build. |
| `API_DB_POOL_MAX` | Set to fit the database connection budget across the maximum API instance count; default is `5` per instance. |
| `API_DB_TIMEOUT_MS` | Database timeout in milliseconds; default is `3000`. |
| `VITE_API_URL` | Web build-time API base URL, including `/api/v1`, or empty when the web host routes that path to the API on the same origin. |
| `VITE_REALTIME_URL` | Web build-time Socket.IO origin, or empty when realtime is served through the same origin. |

The web host must route `/api/v1` and the Socket.IO `/realtime` namespace/transport to the API. Configure TLS at the public edge and verify secure cookie behavior with the selected proxy before pilot use. Do not enable caching for authenticated API responses.

## Pre-pilot sequence

1. **Approve the target.** Record web/API/database hosts, public origins, websocket routing, service owner, expected instance count, and who can access production secrets. Stop if these are undecided.
2. **Review the release.** Confirm CI passed, inspect the exact image/revision, review all pending SQL migrations and their compatibility, and confirm no test or local data will be promoted.
3. **Prepare recovery.** Verify a recent database backup and a restore procedure on a disposable database. Decide whether a failed release can be rolled back without reversing a migration or needs a forward-fix. Do not claim rollback safety for destructive or incompatible migrations.
4. **Configure secrets and origins.** Set the required API and web variables in the selected hosts; check that credentials are not present in image layers, build output, logs, or client-visible variables.
5. **Apply the reviewed migration.** Take/verify the required backup, then explicitly run the one-off migration command against the approved target. Stop on any migration error and preserve logs with credentials redacted.
6. **Start the API and verify health.** `GET /health/live` must return success, then `GET /health/ready` must return success with database status `UP`. Stop if readiness fails.
7. **Run smoke checks.** Through the public web origin, verify web load, registration/login/logout, cookie and CSRF behavior, a Solo start/check-out, Circle/Pact membership access, and a Socket.IO connection/subscription plus access revocation. Confirm an unauthorized origin is rejected and authenticated responses are not cached.
8. **Observe before inviting pilot users.** Review API availability, readiness, redacted error logs, database health/connection use, and websocket disconnects. Keep pilot access closed until the owner accepts the checks.

## Failure handling

- If image build, migration, readiness, auth, privacy, or realtime smoke checks fail, stop the release and do not invite pilot users.
- If failure occurs before migration, restore the previous image/configuration and re-run health and smoke checks.
- If migration completed, first assess whether the previous application version is compatible with the new schema. Restore from backup only under an approved recovery procedure; otherwise prepare a reviewed forward-fix. Never run an unreviewed reverse migration against pilot data.
- Record the affected revision, migration status, user impact, recovery action, and verification evidence in the release record.

## CI evidence

GitHub Actions uses a disposable PostgreSQL service to run opted-in database tests, apply the reviewed baseline migration, build and start the API image, check liveness/readiness, and run live Solo/Pact/realtime HTTP suites. CI data is discarded with the job and must never contain pilot data.
