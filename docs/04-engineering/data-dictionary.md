# Data Dictionary

## Sensitive/private fields

| Field | Owner | Visibility | Analytics rule |
| --- | --- | --- | --- |
| `open_seed.text` | Account | Owner only | Never send raw text |
| `session.intention` | Account | Owner only | Never send raw text |
| `profile.timezone` | Account | API only as needed | Do not log full value |
| `presence.state` | Participant | Eligible Camp/session members | Enum only |

## Shared fields

| Field | Visibility |
| --- | --- |
| Camp name/member display name | Active Camp members |
| Pact schedule/duration/state | Eligible pact participants |
| Session server timestamps | Eligible session participants |
| Milestone timestamp/summary | Active Camp members |

Retention, export and deletion rules are defined in [Privacy](../06-security-privacy/privacy-by-design.md).
