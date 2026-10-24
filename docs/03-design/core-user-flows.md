# Core User Flows

## Solo return

`Open app → Return Card → resume seed or choose new activation step → start session → check-out → create/replace seed`

Return shows the current private Seed with actions to continue from it, start something else, replace it immediately, or delete it. Replacing saves the full Seed text (up to 500 characters) without starting a session. If saving fails, preserve the draft and offer retry; do not replace the displayed Seed until the server confirms success. If no Seed exists, offer start without an empty dashboard.

## Focus Pact

`Create pact → choose Camp/members, duration and now/later → scheduled invitation → invitees accept/decline → creator starts separately → active session → each participant checks out → optional next pact`

Creation places the creator in the participant list once as accepted and does not create a focus session. Invitees may switch between accepted and declined while the Pact is scheduled. The creator starts the Pact separately during the allowed time window. Pact status is shown as scheduled, active, completed, cancelled or expired; terminal Pacts have no response, cancel, start or join actions. A scheduled Pact expires 30 minutes after its start time, including when a detail page or action request next reconciles its state. Tasks remain private. A declined or expired invite is neutral and never exposed as a social failure.
Scheduled invites remain in the “Lời mời” list while their response is invited or declined, so a participant can reopen a declined Pact and change their choice. A declined Pact is not shown as past until it reaches a terminal state.
Each participant may keep, replace or remove their own Open Seed at checkout; it is not part of the shared Pact or Camp projection.

## Camp invitation

`Owner creates a 72-hour link → recipient signs in → sees Camp name and link creator's display name → joins or chooses not to participate`

The preview does not disclose the member list or private work. Choosing not to participate records the choice for that account and link; the same link can still be used by another person. The recipient can join later only through a new valid link. Expired, revoked and already-used links show an unavailable state. A member can leave; the owner must transfer ownership to an active member first.

## Realtime recovery

`Disconnect → show reconnecting state → fetch durable session snapshot → calculate countdown from server timestamps → restore permitted controls`

The client never assumes that a locally running timer is authoritative.

## Stuck state

During solo/shared session, user may choose: reduce the step, take a short break, stop honestly, or continue. The MVP uses manual choices; AI assistance is not required.
