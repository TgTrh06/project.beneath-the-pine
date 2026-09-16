# Core User Flows

## Solo return

`Open app → Return Card → resume seed or choose new activation step → start session → check-out → create/replace seed`

If saving fails, preserve local text and offer retry. If no seed exists, offer start without an empty dashboard.

## Focus Pact

`Create pact → choose Circle/members, duration and now/later → invitees accept/decline → waiting room → active session → each participant checks out → optional next pact`

Tasks remain private. A declined or expired invite is neutral and never exposed as a social failure.

## Realtime recovery

`Disconnect → show reconnecting state → fetch durable session snapshot → calculate countdown from server timestamps → restore permitted controls`

The client never assumes that a locally running timer is authoritative.

## Stuck state

During solo/shared session, user may choose: reduce the step, take a short break, stop honestly, or continue. The MVP uses manual choices; AI assistance is not required.
