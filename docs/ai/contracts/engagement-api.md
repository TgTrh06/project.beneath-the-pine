# Engagement API Contract

## Rules

All endpoints require active beta membership and use `/api/v1`. ISO UTC timestamps in responses; local schedule input includes IANA timezone. Return `400` validation, `401/403` authorization and `404` missing owned resource without leaking another user’s data.

## Endpoints

| Method/path | Request | Response |
|---|---|---|
| `GET /me/engagement` | — | preferences, openSeed, returnState, weeklyLetter availability |
| `PUT /me/engagement/preferences` | theme, remindersEnabled, timezone | sanitized preferences |
| `PUT /me/reminder-slots` | up to 2 slots | slots |
| `POST /focus-seeds` | taskId?, prompt?, remindAt? | seed |
| `POST /focus-seeds/:id/open` | — | seed status |
| `POST /focus-seeds/:id/dismiss` | — | seed status |
| `POST /return-flow/complete` | chosenPath enum | completed state |
| `GET /weekly-letter` | — | facts, observation, evidence, experiment? |
| `POST /weekly-letter/:id/feedback` | verdict useful/not_accurate | feedback |

Create/mutate endpoints accept idempotency key once client retry behavior is introduced. Event recording remains server-side or uses existing constrained events endpoint; clients never submit arbitrary analytics payloads.
