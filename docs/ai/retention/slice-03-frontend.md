# Slice 03 — Focus and Gentle Return UI

## Goal

Implement user-visible retention flows without reducing core focus usability.

## Scope

- Focus Room with local theme/audio preference and completion state.
- Open Seed composer/open/dismiss controls.
- Settings reminder opt-in/slots; no outbound email UI claim.
- Return ritual before Now and Weekly letter feedback.

## Acceptance criteria

- One primary action per decision state.
- Return screen hides backlog/streak; seed choice hides when none exists.
- Input persists on recoverable API errors; loading/error is announced.
- Timer works with audio disabled, unavailable or blocked.
- All controls keyboard usable and responsive at 320px.

## Validation

Component/unit tests, focused manual mobile/keyboard review, web lint/test/build.
