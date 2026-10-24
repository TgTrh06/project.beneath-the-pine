# Event Catalog

| Event | Minimal payload | Private-content rule |
| --- | --- | --- |
| `seed_created` / `seed_resumed` | account pseudonym, timestamp | No seed text |
| `solo_session_started` / `session_checked_out` | session ID, duration enum, outcome enum | No intention |
| `camp_created` / `camp_invite_accepted` | pseudonymous IDs, state | No Camp name |
| `pact_created` / `pact_accepted` / `pact_cancelled` | pact ID, timing/duration enum | No invite copy |
| `session_joined` / `session_reconnected` | session ID, state | No presence history beyond need |
| `camp_milestone_recorded` | Camp pseudonym, type | No score or task data |
| `assistance_requested` / `assistance_fallback` | account ID, capability enum, request ID when reserved | No submitted text or model response |
| `assistance_viewed` / `assistance_selected` / `assistance_edited` / `assistance_discarded` | account ID, capability enum, owned suggestion ID | No suggestion or Seed text |

Ordinary analytics ingestion is best-effort: failure never blocks session behavior. An assistance request requires an atomic quota reservation before any provider call; failure returns the manual fallback.
