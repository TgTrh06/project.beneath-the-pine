# ADR-0014 — Private Circles, Focus Pact and Solo Return

- **Status:** Accepted
- **Date:** 2026-09-15

## Context

The previous direction centered Brain Dump, AI extraction, task/habit modules and gentle-retention features. The product now needs a clearer mobile-first core that remains useful solo but can use trusted social presence without becoming a public social network or virtual coworking world.

## Decision

Adopt `solo return + private Circle + Focus Pact + realtime focus session + Open Seed` as the product core. Web validates shared API/realtime behavior; React Native + Expo remains the target client.

Pacts occur only among private Circle members. Intentions and Open Seed text are private by default; presence is minimal. Circle memory is non-competitive and cannot be currency, streak, rank or reward for elapsed minutes.

Public rooms, stranger matching, public Signal, voice/video, feed/DM, ranking, streaks and task/habit systems are out of current scope. Pine Assistance training/inference is a post-core roadmap capability, governed by ADR-0015; it is not required for MVP session flow.

## Consequences

- Domain and API focus on Circle, pact, session, participant/presence and seed.
- Server timestamps/state are authoritative for realtime recovery.
- ADR-0006 is superseded for product direction; its non-shaming/opt-in principles remain compatible.
- ADR-0013 remains valid only for the implemented authentication mechanics; its Wanderer/Pine Keeper product roles are superseded.
- Existing API modules and ML assets are legacy/experimental until a separately approved code migration.

## Validation

Run a 2–4 week private pilot that measures solo return, pact attendance, repeat pact, privacy comfort and reconnect reliability. Do not claim productivity or clinical outcomes.
