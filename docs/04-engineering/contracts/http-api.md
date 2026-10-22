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

Pact creation returns a `scheduled` Pact and `sessionId: null`. The creator appears once as an accepted participant; creation does not start a session. Only the creator can call `POST /pacts/:pactId/start`, separately, from 10 minutes before through 30 minutes after `startsAt`. Invitees may switch their response between `accepted` and `declined` while the Pact remains scheduled. After the start window closes, detail reads and response, cancel or start requests reconcile a still-scheduled Pact to `expired`; response and cancel/start requests then return a conflict. A Pact that is active or terminal does not accept response changes, cancellation, or another start; only accepted Pact participants may join the active session. Pact details and lists require current Circle membership and Pact participation.

The `pending` Pact list filter returns scheduled Pact invitations whose response is `invited` or `declined`, allowing a participant to revisit a declined invitation while it remains scheduled. The `past` filter contains only terminal Pacts; the web label for `pending` is “Lời mời” because it can contain an already-recorded response.
# Pact discovery and Circle lifecycle additions (2026-09-17)

- `GET /api/v1/me/pacts?group=pending|upcoming|active|past&limit=20&cursor=...`
- `GET /api/v1/circles/:circleId/pacts` accepts the same query; participant-only within the Circle.
- Both return `{items, nextCursor}`; each row contains id, circleId, circleName, startsAt, durationMinutes, status, response, isCreator and sessionId. No private intention/seed.
- `GET /api/v1/circles/:circleId/invites?limit=20&cursor=...` is owner-only and returns `{items,nextCursor}` with id, circleId, createdAt, expiresAt, status. No token/hash.
- Limit is 1–50; invalid/foreign-scope cursors return 400. Lists are live, so refresh page one after mutations.
- `PATCH /api/v1/circles/:circleId` retains name/status input. Archive returns 409 if open Pacts remain and revokes pending invitations atomically. Restore does not revive tokens. Archived Circles reject invitation creation/acceptance and new Pact creation.
- Creation of an invite returns the raw token once, with explicitly selected safe metadata. Repeated revoke of an already revoked invite succeeds without changing it.
- `GET /api/v1/circle-invites/:token/preview` requires authentication and a pending, unexpired link in an active Circle. It returns `{invite:{circleName,inviterName}}`; `inviterName` is null when the creator has no display name. It does not return member names, IDs, private text, expiry, or the token. Unknown tokens return 404; unavailable or personally declined links return 409.
- `POST /api/v1/circle-invites/:token/decline` requires authentication and CSRF, returns 204, and records a decline for the caller and link. Repeated decline is idempotent while the link remains valid. Other accounts may still use the link. Acceptance after a personal decline, or after expiry, revocation or another account's acceptance, returns 409. A repeated accept of an already-used link also returns 409.
