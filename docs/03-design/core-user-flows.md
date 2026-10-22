# Core User Flows

## Solo return

`Open app → Return Card → resume seed or choose new activation step → start session → check-out → create/replace seed`

Return shows the current private Seed with actions to continue from it, start something else, replace it immediately, or delete it. Replacing saves the full Seed text (up to 500 characters) without starting a session. If saving fails, preserve the draft and offer retry; do not replace the displayed Seed until the server confirms success. If no Seed exists, offer start without an empty dashboard.

## Focus Pact

`Create pact → choose Circle/members, duration and now/later → invitees accept/decline → waiting room → active session → each participant checks out → optional next pact`

Tasks remain private. A declined or expired invite is neutral and never exposed as a social failure.
Each participant may keep, replace or remove their own Open Seed at checkout; it is not part of the shared Pact or Circle projection.

## Realtime recovery

`Disconnect → show reconnecting state → fetch durable session snapshot → calculate countdown from server timestamps → restore permitted controls`

The client never assumes that a locally running timer is authoritative.

## Stuck state

During solo/shared session, user may choose: reduce the step, take a short break, stop honestly, or continue. The MVP uses manual choices; AI assistance is not required.
