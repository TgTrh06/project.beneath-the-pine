# Core Screen Specifications

## Return

Show active session recovery first, then the current Open Seed, then one intention input and duration choice. The primary action is resume or start, never both. A missing timezone blocks start with one explicit confirmation action.

## Circles

List only joined Circles. Circle detail shows members, private invite controls for the owner and a compact pact composer. Invite tokens are shown once for deliberate sharing.

## Pact

Show time, duration, participant responses and only actions permitted to the current account. Joining an active session replaces pact controls.

## Session

Full-screen, server-derived timer, connection state, private own intention and minimal shared presence. Check-out offers four neutral outcomes and an optional Open Seed.

Current backend boundary: manual check-out offers four outcomes while the participant is active. Once expiry finalizes the participant, the UI does not offer outcome editing; a new Open Seed can still be saved separately. Presence `break` never pauses the shared timer. Shared-session join currently has no intention input endpoint.

## Memory and Settings

Memory contains personal history and non-competitive Circle milestones. Settings owns profile, export, re-authenticated deletion and sign-out. No ranking, streak, feed or AI consent appears in core.

The current client does not show a pending-Pact inbox or invite preview/list because those endpoints do not exist. An invite link requires explicit acceptance; newly created tokens are shown in memory only. Theme is a browser preference; no persisted presence-sharing preference is implemented.
