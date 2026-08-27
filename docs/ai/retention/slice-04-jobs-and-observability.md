# Slice 04 — Reminder Jobs and Observability

## Goal

Prepare reliable in-app reminder state and measurable retention behavior.

## Scope

- Job/query for due in-app reminder state.
- Idempotency by slot/window and preference re-check immediately before marking delivery.
- Record event metadata only; add aggregate operational metrics.
- Define outbound adapter interface only. Do not add a provider or send email.

## Acceptance criteria

- Disabled/deleted slot never produces delivery state.
- Repeated job execution does not duplicate one slot/window.
- Timezone/DST edge cases have explicit tests.
- Logs contain failure codes, never notification content or private task data.

## Validation

Deterministic clock tests, idempotency tests, observability payload inspection and job failure tests.
