# Core HTTP Contract

All routes use `/api/v1`, cookie authentication and CSRF on unsafe methods. Create/start commands require `Idempotency-Key` (8–128 safe characters).

| Area | Routes |
| --- | --- |
| Identity | `GET auth/session`, `POST auth/register`, `POST auth/login`, `POST auth/logout` |
| Profile | `GET/PATCH me/profile` |
| Return | `GET me/return`, `GET/PUT/DELETE me/open-seed` |
| Focus | `POST focus-sessions`, `GET focus-sessions/active`, `GET focus-sessions/:id`, `POST focus-sessions/:id/join`, `POST focus-sessions/:id/check-out`, `GET me/focus-history` |
| Circle | `GET/POST circles`, `GET/PATCH circles/:id`, invite/member/ownership subresources |
| Pact | create under Circle; `GET`, `respond`, `start`, `cancel` under `pacts/:id` |
| Rights | `GET me/data-export`, `DELETE me/account` with current password |
| Memory | `GET me/memory` |

Errors use `{code,message,requestId,details}` and never echo private input. IDs and ownership in bodies do not grant access.
# Pact discovery and Circle lifecycle additions (2026-09-17)

- `GET /api/v1/me/pacts?group=pending|upcoming|active|past&limit=20&cursor=...`
- `GET /api/v1/circles/:circleId/pacts` accepts the same query; participant-only within the Circle.
- Both return `{items, nextCursor}`; each row contains id, circleId, circleName, startsAt, durationMinutes, status, response, isCreator and sessionId. No private intention/seed.
- `GET /api/v1/circles/:circleId/invites?limit=20&cursor=...` is owner-only and returns `{items,nextCursor}` with id, circleId, createdAt, expiresAt, status. No token/hash.
- Limit is 1–50; invalid/foreign-scope cursors return 400. Lists are live, so refresh page one after mutations.
- `PATCH /api/v1/circles/:circleId` retains name/status input. Archive returns 409 if open Pacts remain and revokes pending invitations atomically. Restore does not revive tokens. Archived Circles reject invitation creation/acceptance and new Pact creation.
- Creation of an invite returns the raw token once, with explicitly selected safe metadata. Repeated revoke of an already revoked invite succeeds without changing it.
