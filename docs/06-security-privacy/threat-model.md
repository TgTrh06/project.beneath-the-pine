# Threat Model

- **Status:** Initial
- **Method:** Lightweight STRIDE-style review

## Assets

- Account/session.
- Task, brain dump, check-in và reflection.
- Consent records.
- AI prompts/output.
- API/provider secrets.
- Export archives và backups.

## Threats and baseline controls

| Threat | Control |
|---|---|
| Account takeover | Managed auth, MFA option, secure session, rate limit |
| IDOR/cross-user access | Ownership check + integration tests |
| Sensitive logging | Central redaction + logging tests |
| Prompt injection in content | Treat user content as data; strict schema; no privileged tools |
| AI provider leakage | Minimize payload; contract/provider review; retention controls |
| Malicious export/delete | Re-authentication, audit trail, asynchronous verified flow |
| Secret exposure | Secret manager, rotation, CI scanning |
| SQL injection | Parameterized queries/ORM + validation |
| XSS from AI/user content | Escape by default; sanitize rich text; CSP |
| Abuse/cost exhaustion | Per-user/IP rate limits, quotas, alerts |

## Security gates

- Dependency and secret scanning in CI.
- Authorization test cho mọi user-owned endpoint.
- Threat model review trước private beta và public launch.
- Restore test và incident exercise.

