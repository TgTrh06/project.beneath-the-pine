# Test Strategy — Focus & Gentle Retention

- **Status:** Approved baseline
- **Last updated:** 2026-08-27

## Test layers

- **Unit/contract:** schemas, timezone threshold, seed state transitions, weekly evidence gating.
- **Integration:** migration/RLS, API authorization, bootstrap derivation, export/delete, idempotent reminder window.
- **UI:** Focus Studio audio-failure fallback, seed/reminder/return/letter states, keyboard and 320px behavior.
- **Non-functional:** analytics/log inspection for prohibited content, reduced motion, provider-unavailable behavior.

## Required scenarios

The executable planning matrix is [`../ai/retention/acceptance-matrix.md`](../ai/retention/acceptance-matrix.md). Add a regression test for every privacy, timezone or opt-out defect.

## Release gate

No P0/P1 in core focus or return; reminders cannot deliver after opt-out; Focus works without audio; no raw user content appears in analytics/logging; contract/migration tests and affected web/API checks pass.
