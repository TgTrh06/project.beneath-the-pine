# Test Strategy

## Required layers

| Layer | Evidence |
| --- | --- |
| Domain | State-machine invariants for seed, Circle, invite, pact and session |
| API | Auth, validation, two-account ownership, stable errors and idempotency |
| Database | Constraints, transaction rollback and terminal-race behavior on PostgreSQL |
| Realtime | Authorized join, late join, reconnect snapshot, duplicate command and timer drift |
| Web | Responsive/keyboard flow, loading/error/recovery and privacy visibility |
| Mobile future | Native auth/resume/deep-link/notification tests after platform decision |
| Pine Assistance future | Frozen holdout, structured-output/safety tests, timeout/manual fallback and no-raw-text telemetry checks |

Timer display is not proof of work. Pilot evaluation combines event data and user feedback.
