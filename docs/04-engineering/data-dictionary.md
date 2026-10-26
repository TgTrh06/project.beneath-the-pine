# Data Dictionary

## Sensitive/private fields

| Field | Owner | Visibility | Analytics rule |
| --- | --- | --- | --- |
| `open_seed.text` | Account | Owner only | Never send raw text |
| `session.intention` | Account | Owner only | Never send raw text |
| `profile.timezone` | Account | API only as needed | Do not log full value |
| `presence.state` | Participant | Eligible Camp/session members | Enum only |
| `account_preferences.share_presence` | Account | Owner writes; API uses it for per-recipient Pact projection | Boolean only; default `false` |
| `account_preferences.remind_accepted_pacts` | Account | Owner and reminder service | Boolean only; default `false` |
| `account_preferences.preset_duration_minutes` / `preset_soundscape_id` | Account | Owner only | Do not include in group events |
| `pact_reminder_receipts.claimed_at` | Account/Pact | Owner via claim response; API internal for deduplication | No private text |

## Shared fields

| Field | Visibility |
| --- | --- |
| Camp name/member display name | Active Camp members |
| Pact schedule/duration/state | Eligible pact participants |
| Session server timestamps | Eligible session participants |
| Milestone timestamp/summary | Active Camp members |

Retention, export and deletion rules are defined in [Privacy](../06-security-privacy/privacy-by-design.md).

The browser stores a private per-account, per-tab microstep/Seed draft in `sessionStorage`. It is cleared with the account draft lifecycle and is never a Camp/Pact field. First-use hint dismissal is stored locally per account and has no private text. Soundscape audio and volume are local device state; the preset stores only the sound ID, never audio data.
