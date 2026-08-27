# Slice 01 — Engagement Data and Contracts

## Goal

Define stable schemas before UI/API work.

## Scope

- Add Zod schemas/types for preference, reminder slot, seed action, return state and weekly-letter feedback.
- Add event names from `00-foundation/metrics.md`.
- Add additive tables/indexes/RLS specified in [`../contracts/engagement-data-migration.md`](../contracts/engagement-data-migration.md).

## Acceptance criteria

- Invalid timezone/time/day input rejected at boundary.
- One active seed and two active slots enforced.
- All new user rows owner-only via RLS.
- Export/delete impact is documented and covered by tests.

## Validation

Contract tests, migration smoke test against local Supabase, RLS ownership tests, `pnpm lint` and relevant API tests.
