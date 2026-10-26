# Privacy by Design

## Defaults

- Session intention and Open Seed are private to their account.
- Camp members see only permitted presence and pact state.
- Presence sharing and in-web Pact reminders default off for every account. Other participants see `hidden` until sharing is enabled, while `checked_out` stays visible.
- Membership never grants access to another member's private work text.
- No public discovery, DM, voice, video or profile search in MVP.
- Analytics/logging use allowlisted IDs/enums/timestamps only.

## Data inventory

| Data | Purpose | Visibility |
| --- | --- | --- |
| Profile/timezone | Account and scheduling | Account/API as needed |
| Camp/member data | Private pact coordination | Eligible members |
| Intention/Open Seed | Start and return ritual | Owner only |
| Session/presence state | Realtime coordination | Eligible participants |
| Milestone | Shared memory | Eligible Camp members |
| Preferences and reminder receipts | Optional sharing, preset and one in-web reminder per Pact | Account owner; included in data export and removed on account deletion |
| Soundscape selection and playback | Local focus ambience | Device only; not broadcast to Camp or analytics |

Consent is needed only for actual optional processing; the MVP has no AI/data-sharing consent purpose.
