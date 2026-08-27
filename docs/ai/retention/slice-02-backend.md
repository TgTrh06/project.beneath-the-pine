# Slice 02 — Engagement Backend and Bootstrap

## Goal

Expose retention state safely through the existing API composition pattern.

## Scope

- Implement engagement domain/repository/use cases/controller.
- Add authenticated endpoints defined in [`../contracts/engagement-api.md`](../contracts/engagement-api.md).
- Extend Bootstrap with return eligibility, open seed and weekly-letter availability.
- Derive return from last core event in profile timezone; do not persist absence count.

## Acceptance criteria

- Non-owner receives forbidden/not found consistently.
- No seed returns `null`, not a fabricated task.
- User without events or with an event under 3 days does not enter return flow.
- API response excludes raw task/note from analytics-oriented objects.

## Validation

Use-case tests, controller/API integration tests, authorization tests and bootstrap regression tests.
