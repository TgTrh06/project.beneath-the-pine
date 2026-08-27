# Component Contracts

| Component | Inputs | States | Required behavior |
|---|---|---|---|
| FocusTimer | duration, running, outcome | idle/running/paused/complete | Announces textual time/state; controls usable without audio |
| TaskActionCard | title, minutes, seed? | ready/loading/error/empty | One primary CTA, recovery action secondary |
| AudioControl | source, permission/player state | idle/loading/playing/blocked/error | User initiates load/play; no autoplay; error stays local |
| SeedCard | seed, mutation state | open/opened/dismissed/error | Durable confirmation and direct dismiss |
| ReminderSlots | enabled, slots, timezone | disabled/editing/saving/error | Max 2, label timezone, immediate opt-out |
| ReturnRitual | seed?, action state | default/submitting/error | Focus-managed dialog; no backlog content |
| WeeklyLetter | facts, feedback | unavailable/ready/submitting/error | Evidence visible before feedback; status not color-only |
| InlineAlert | message, level | info/success/warning/error | Textual message, appropriate live region, not only toast |

Do not make a new component when an existing semantic component can accept a documented variant.
