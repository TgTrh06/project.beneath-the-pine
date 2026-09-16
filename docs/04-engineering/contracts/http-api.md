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
