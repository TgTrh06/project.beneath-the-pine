# System Architecture

- **Status:** Approved for the web + Android research prototype
- **Version:** 2.0
- **Last updated:** 2026-08-09

## Logical architecture

```text
Expo app (Web + Android)
  ├─ Brain Dump, Now, Help Me Start, Reset and Return flows
  ├─ Consent and account UI
  └─ Privacy-safe analytics
        │
Node API
  ├─ Authentication and authorization
  ├─ Workflow service
  ├─ Consent and data-rights service
  └─ AI orchestration
       ├─ Prompt version
       ├─ Structured schema validation
       └─ Safety and fallback policy
        │
PostgreSQL via Drizzle
```

## AI lifecycle

1. Verify user identity, ownership and AI consent.
2. Send only context needed for Brain Dump Extraction or Help Me Start.
3. Request a structured result and validate it before storing or showing it.
4. Present the result as a suggestion requiring confirmation.
5. Preserve the user input and offer a manual path if the request fails or times out.

## Core event boundaries

- `brain_dump_submitted` begins a stuck-to-start observation.
- `next_action_confirmed` records user choice, not AI choice.
- `start_event` is the primary outcome event.
- `still_stuck`, `reset_completed` and `return_flow_completed` show recovery behaviour.

Raw personal content is excluded from analytics. All product times are stored in UTC and rendered in the user timezone.

## Deferred architecture

Weekly aggregation, reminders, offline sync, iOS, desktop, habit/goal services and long-lived AI coaching are not part of the prototype architecture.
