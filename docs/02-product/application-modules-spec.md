# Application Modules — Focus & Gentle Retention

- **Status:** Approved implementation scope
- **Last updated:** 2026-08-27

| Module | Responsibility | Primary data | Boundary |
|---|---|---|---|
| Identity & Consent | Auth, profile, timezone, data rights | profiles, consents | Consent does not imply reminder opt-in |
| Capture & Actions | Brain Dump, next action, Help Me Start | brain_dumps, tasks, next_actions | User confirms AI output |
| Focus Studio | Timer, local theme/audio, focus outcome | focus_sessions, local storage | Audio is optional and local-only |
| Engagement | Open Seed, reminder preferences, Return state | preferences, slots, seeds | No streak/backlog pressure |
| Reflection | Weekly letter, evidence, feedback | reviews, feedback | No mood/clinical inference |
| Analytics & Operations | Minimal events, quotas, jobs | product_events, delivery metadata | No raw content |
| Privacy & Data Rights | Export/delete/retention | all user-owned rows | New engagement data included |

## Engagement dependencies

Focus completion may create one Open Seed. Bootstrap derives Return after 3 local days without a core event. Reminder uses explicit preference and in-app state first. Weekly letter reads aggregate facts only. Details for coding AI are in [`../ai/retention/`](../ai/retention/README.md).

## Explicit exclusions

No outbound provider, push, social, leaderboard, streak, economy or productivity-suite behavior is included in this module boundary.
