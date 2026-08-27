# Definition of Done

A story is complete only when:

- Its acceptance criteria and `docs/ai/retention/acceptance-matrix.md` row are met.
- Focused tests and applicable lint/typecheck/build pass.
- Loading, empty, recoverable error, authorization and mobile/keyboard states are handled.
- New persistence has additive migration, RLS, export/delete behavior and forward-fix note.
- Reminder has explicit opt-in, immediate opt-out, timezone behavior and idempotency test.
- Analytics/logging exclude raw content, task title, audio URL and notification copy.
- API/contract, privacy inventory, data model and ADR are updated when affected.
- No provider, dependency, external delivery or production rollout occurs without separate approval.
