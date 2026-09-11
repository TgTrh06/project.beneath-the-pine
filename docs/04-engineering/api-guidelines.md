# API Guidelines

- **Style:** REST JSON under `/api/v1`

## Conventions

- UUID IDs, ISO-8601 UTC responses and IANA timezone input.
- Validate input/output at API boundary; ownership on every user resource.
- Error body contains stable code/message/request ID; no stack/raw content.
- Mutations that can be retried use idempotency keys once client retry is enabled.

## Implemented Core Service resources

The Java Core Service implements authenticated Task operations under `/tasks` and confirmed creation under `/next-actions`. See the [Task Module](task-module.md) for routes, ownership rules, state transitions and error codes.

Authentication lives under `/auth`: `GET /session`, `POST /register`, `POST /login` and `POST /logout`. The Web sends the `BTP_SESSION` cookie with `credentials: include`. Every state-changing request must include the current token in `X-XSRF-TOKEN`; the session, registration and login responses expose that token for the browser adapter.

## Retention resources

`/me/engagement`, `/me/engagement/preferences`, `/me/reminder-slots`, `/focus-seeds`, `/return-flow/complete`, `/weekly-letter`, `/weekly-letter/:id/feedback`.

The canonical endpoint request/response contract is [`../ai/contracts/engagement-api.md`](../ai/contracts/engagement-api.md). Client analytics cannot post arbitrary payloads.
