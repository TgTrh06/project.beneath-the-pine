# Test Strategy

- **Status:** Baseline for the research prototype
- **Target:** Web + Android pilot

## Test layers

### Unit and contract

- Core task transitions: ready, done and deferred.
- Stuck-to-start event timing and timezone handling.
- Consent gates and AI structured-output validators.
- AI result never mutates user data without confirmation.

### Integration

- API, Drizzle migrations, authentication and ownership.
- Brain Dump Extraction and Help Me Start using synthetic fixtures.
- Export/delete and consent withdrawal.

### End-to-end

- Brain Dump → confirmation → Start.
- Help Me Start → smaller action → Start.
- Reset My Day and Return flow.
- Manual fallback after AI timeout.
- Responsive web and Android smoke paths.

### Non-functional

- Mobile touch targets, keyboard navigation and screen-reader smoke test.
- Analytics payload inspection: no raw brain dump/journal content.
- AI quality, safety and schema regression evaluation.

## Research validation

- Run moderated usability sessions with the target audience before pilot.
- Run a small pilot of roughly 10 users.
- Measure the interval from `brain_dump_submitted` or `still_stuck` to `start_event`.
- Collect a short post-session rating of whether the suggested step felt concrete and non-judgmental.

## Release gates

- No open P0/P1 in the core loop.
- Core web and Android paths pass.
- AI failures retain user input and expose manual fallback.
- Consent, export and delete smoke tests pass.
- No medical claim appears in product copy or AI output templates.
