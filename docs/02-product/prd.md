# Product Requirements Document — Focus Pact and Return

- **Status:** Approved product baseline
- **Delivery target:** Private web pilot; mobile-ready API

## Promise

Pine helps a person start a small piece of personal work and leave a clear return point. They may do this alone or in a private Circle with trusted people; no one needs to reveal what they are working on.

## Core outcomes

1. A new or returning user can start a solo session without setting up projects or a backlog.
2. A user can resume or replace one private Open Seed.
3. A Circle member can create, accept and join a Focus Pact.
4. Participants see a consistent session state after reconnecting.
5. Check-out never treats being stuck, pausing or leaving as failure.

## Functional requirements

| Area | Requirement |
| --- | --- |
| Solo | Enter a short intention, choose duration, start/end session, save seed |
| Return | Show active seed first; user can resume, replace or dismiss it |
| Circle | Create/join/leave Circle; invite/revoke membership; private member list |
| Pact | Create immediate/scheduled pact; accept/decline/cancel/expire invitation |
| Realtime | Server owns lifecycle/timestamps; client can join late and resync after reconnect |
| Presence | Circle sees only opted-in minimal session state, never intention or seed text |
| Memory | Record non-competitive Circle milestone only after valid shared attendance |
| Rights | Export/delete user-owned data; leave/removal behavior is explicit |

## Non-functional requirements

- Keyboard and responsive web support for pilot.
- Safe recovery for expired invite, duplicate request, disconnect and terminal session retry.
- No raw private text in logs or analytics.
- API business rules independent from web so a mobile client can share account/session data.

## Future Pine Assistance

After P0–P3 evidence, the API may offer user-triggered assisted start, stuck recovery and Open Seed draft. Model output is structured, validated, private to the requester and manually confirmable. Training/inference is governed by [ML documentation](../05-machine-learning/README.md); it never replaces the manual MVP flow.
