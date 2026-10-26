# Core HTTP Contract

All routes use `/api/v1`, cookie authentication and CSRF on unsafe methods. Create/start commands require `Idempotency-Key` (8–128 safe characters).

| Area | Routes |
| --- | --- |
| Identity | `GET auth/session`, `POST auth/register`, `POST auth/login`, `POST auth/logout` |
| Profile | `GET/PATCH me/profile` |
| Preferences | `GET/PATCH me/preferences` |
| Return | `GET me/return`, `GET/PUT/DELETE me/open-seed` |
| Focus | `POST focus-sessions`, `GET focus-sessions/active`, `GET focus-sessions/:id`, `POST focus-sessions/:id/join`, `POST focus-sessions/:id/check-out`, `GET me/focus-history` |
| Camp | `GET/POST camps`, `GET/PATCH camps/:id`, invite/member/ownership subresources |
| Pact | create under Camp; `GET`, `respond`, `start`, `cancel` under `pacts/:id` |
| Rights | `GET me/data-export`, `DELETE me/account` with current password |
| Memory | `GET me/memory` |
| Pine Assistance demo | `POST me/assistance`, `POST me/assistance/interactions` (204) |

`GET me/preferences` returns `{preferences:{sharePresence:false,remindAcceptedPacts:false,focusPreset:null}}` when no row exists. `PATCH me/preferences` accepts a non-empty subset of those fields; `focusPreset` is null or `{durationMinutes:5|10|25|50,soundscapeId:"rain"|"forest"|"stream"|null}`. Unknown fields are rejected. Both routes are account-only; PATCH requires CSRF. A missing row is created on the first update.

`GET camps/:campId/recent-partners` returns `{accountIds:[...]}` (at most seven) for actual co-participants of completed Pact sessions who are still active Camp members. It requires current active Camp membership and contains no personal text. `POST me/pact-reminders/claim-due` requires login and CSRF. It returns `{serverNow,items:[{id,campName,startsAt,durationMinutes}]}` (at most five). Claims are one per account/Pact across concurrent requests and only for accepted, scheduled Pacts in active Camps from now through ten minutes ahead when the caller opted in. No background notification is sent.

Errors use `{code,message,requestId,details}` and never echo private input. IDs and ownership in bodies do not grant access.

Pine Assistance is an authenticated, CSRF-protected local/preview demo endpoint. The request is either `{capability:"assisted_start",description:string}` (1–280 characters) or `{capability:"open_seed_draft",context:string}` (1–500 characters). The response is `{status:"suggestion"|"fallback"|"boundary",output,suggestionId?}`; `output` uses [Pine Assistance Output Contracts](../../05-machine-learning/ai-output-contracts.md), and an opaque `suggestionId` appears only for a suggestion. Provider failure and quota exhaustion return a stable manual fallback without echoing input. Interactions accept only `{capability,suggestionId,action:"viewed"|"selected"|"edited"|"discarded"}`. Neither route starts a session, changes a Pact or saves a Seed.

Pact creation returns a `scheduled` Pact and `sessionId: null`. The creator appears once as an accepted participant; creation does not start a session. Only the creator can call `POST /pacts/:pactId/start`, separately, from 10 minutes before through 30 minutes after `startsAt`. Invitees may switch their response between `accepted` and `declined` while the Pact remains scheduled. After the start window closes, detail reads and response, cancel or start requests reconcile a still-scheduled Pact to `expired`; response and cancel/start requests then return a conflict. A Pact that is active or terminal does not accept response changes, cancellation, or another start; only accepted Pact participants may join the active session. Pact details and lists require current Camp membership and Pact participation. Creator checkout does not close an active session while an accepted, authorized invitee has yet to join; join remains possible until the server's `endsAt`.

The `pending` Pact list filter returns scheduled Pact invitations whose response is `invited` or `declined`, allowing a participant to revisit a declined invitation while it remains scheduled. The `past` filter contains only terminal Pacts; the web label for `pending` is “Lời mời” because it can contain an already-recorded response.
# Pact discovery and Camp lifecycle

- `GET /api/v1/me/pacts?group=pending|upcoming|active|past&limit=20&cursor=...`
- `GET /api/v1/camps/:campId/pacts` accepts the same query; participant-only within the Camp.
- Both return `{items, nextCursor}`; each row contains id, campId, campName, startsAt, durationMinutes, status, response, isCreator and sessionId. No private intention/seed.
- `GET /api/v1/camps/:campId/invites?limit=20&cursor=...` is owner-only and returns `{items,nextCursor}` with id, campId, createdAt, expiresAt, status. No token/hash.
- Limit is 1–50; invalid/foreign-scope cursors return 400. Lists are live, so refresh page one after mutations.
- `PATCH /api/v1/camps/:campId` retains name/status input. Archive returns 409 if open Pacts remain and revokes pending invitations atomically. Restore does not revive tokens. Archived Camps reject invitation creation/acceptance and new Pact creation.
- Creation of an invite returns the raw token once, with explicitly selected safe metadata. Repeated revoke of an already revoked invite succeeds without changing it.
- `GET /api/v1/camp-invites/:token/preview` requires authentication and a pending, unexpired link in an active Camp. It returns `{invite:{campName,inviterName}}`; `inviterName` is null when the creator has no display name. It does not return member names, IDs, private text, expiry, or the token. Unknown tokens return 404; unavailable or personally declined links return 409.
- `POST /api/v1/camp-invites/:token/decline` requires authentication and CSRF, returns 204, and records a decline for the caller and link. Repeated decline is idempotent while the link remains valid. Other accounts may still use the link. Acceptance after a personal decline, or after expiry, revocation or another account's acceptance, returns 409. A repeated accept of an already-used link also returns 409.

Circle endpoints, fields and web routes are not aliases for Camp. Existing clients must upgrade with migration 0002; old `#circles` and `#circle/:id` links stop working. The generic `#invite/:token` route remains.
