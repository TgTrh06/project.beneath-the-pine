# Threat Model

| Threat | Baseline control |
| --- | --- |
| Account takeover | Secure session lifecycle, rate limit, re-auth for destructive actions |
| Cross-account/Circle access | Principal-derived ownership and two-account integration tests |
| Unauthorized realtime join | Authenticate socket, authorize every session/Circle subscription |
| Presence oversharing | Minimal state projection; private text never broadcast |
| Timer command race | Server state machine, transaction, idempotency key and durable snapshot |
| Invitation abuse | Expiry, revoke, membership checks and rate limits |
| Sensitive logs/export abuse | Redaction, audited export/delete and no raw text in telemetry |
| XSS/SQL injection | Validation, parameterized queries, output escaping/CSP |
| Unsafe/prompt-injected model output | Server-only model adapter, schema/safety validation and manual fallback |
| Training-data leakage | Synthetic/consented provenance, private manifests and no production-content training |

Public-room harassment and media-call threats are not addressed because those capabilities are not in scope.
