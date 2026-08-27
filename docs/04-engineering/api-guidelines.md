# API Guidelines

- **Style:** REST JSON under `/api/v1`

## Conventions

- UUID IDs, ISO-8601 UTC responses and IANA timezone input.
- Validate input/output at API boundary; ownership on every user resource.
- Error body contains stable code/message/request ID; no stack/raw content.
- Mutations that can be retried use idempotency keys once client retry is enabled.

## Retention resources

`/me/engagement`, `/me/engagement/preferences`, `/me/reminder-slots`, `/focus-seeds`, `/return-flow/complete`, `/weekly-letter`, `/weekly-letter/:id/feedback`.

The canonical endpoint request/response contract is [`../ai/contracts/engagement-api.md`](../ai/contracts/engagement-api.md). Client analytics cannot post arbitrary payloads.
