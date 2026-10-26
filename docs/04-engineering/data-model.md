# Data Model

- **Status:** Target conceptual model; no migration authorization

| Entity | Core fields and invariants |
| --- | --- |
| Account | Stable ID, credentials/session ownership |
| Profile | Account ID, display name optional, timezone |
| Camp | Owner, private name, active/archived state |
| CampMembership | Camp/account, role, joined/removed state; unique active membership |
| CampInvite | Recipient/link, expiry, accepted/declined/revoked state |
| FocusPact | Creator, Camp, scheduled start, duration, draft/scheduled/waiting/active/terminal state |
| PactInvitation | Pact/member response and expiry; response is idempotent |
| FocusSession | Pact nullable for solo; server start/end timestamps and terminal outcome |
| SessionParticipant | Session/account, join/check-out timestamps, minimal presence state |
| OpenSeed | Account-owned private text; at most one current seed in MVP |
| CampMilestone | Derived record of valid shared attendance; no score/points field |

Foreign keys and ownership checks enforce private resource access. Intentions and seed text never belong to Camp or milestone entities.
