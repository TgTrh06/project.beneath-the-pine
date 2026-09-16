# Event Catalog

| Event | Minimal payload | Private-content rule |
| --- | --- | --- |
| `seed_created` / `seed_resumed` | account pseudonym, timestamp | No seed text |
| `solo_session_started` / `session_checked_out` | session ID, duration enum, outcome enum | No intention |
| `circle_created` / `circle_invite_accepted` | pseudonymous IDs, state | No Circle name |
| `pact_created` / `pact_accepted` / `pact_cancelled` | pact ID, timing/duration enum | No invite copy |
| `session_joined` / `session_reconnected` | session ID, state | No presence history beyond need |
| `circle_milestone_recorded` | Circle pseudonym, type | No score or task data |

Analytics ingestion must be best-effort: failure never blocks session behavior.
