# Core State Machines

```text
Camp: active -> archived
Membership: active -> removed
Invite: pending -> accepted | revoked | expired
Invite decision per account: open -> declined (the shared invite remains pending)
Pact: scheduled -> active -> completed
                  \-> cancelled | expired
Participant response: invited -> accepted <-> declined (while scheduled)
Session: active -> completed | cancelled
Presence: active <-> break; active/break -> disconnected -> active; any live state -> checked_out
Open Seed: absent <-> current (replace is an atomic upsert)
```

Terminal states never transition back. A Pact is created as `scheduled`; creating it does not create a focus session. Only its creator can start it, as a separate action, from 10 minutes before through 30 minutes after its scheduled time. A scheduled Pact expires after `startsAt + 30 minutes`; detail reads and response, cancel, and start requests reconcile that transition. Participants may switch between accepted and declined only while the Pact remains scheduled. Once it becomes active or terminal, responses are locked. Cancelled, expired and completed Pacts expose no mutating Pact actions, and a completed Pact cannot be reopened by a repeated start request.

Duplicate create/start/check-out commands return the already-created resource while that operation remains valid. Session expiry is reconciled on reads and by the API finalizer, so process restarts do not reset time.

Pact join, checkout, presence changes and expiry finalization serialize on the Camp, session and participant rows in that order. Each Pact mutation rechecks current membership while holding the Camp lock. An active Pact remains open until `endsAt` while an accepted, currently authorized participant has not joined, even if every joined participant has checked out. It closes early only when nobody is active and no eligible accepted participant is waiting to join. Declined and unanswered invitations do not hold the session open. Session snapshots use one repeatable-read view after expiry reconciliation; a terminal session cannot be reopened by a late join, heartbeat or stale browser snapshot.

A declined account cannot accept the same Camp link. Another account may accept it while the shared invitation is still pending. Accepting an already-used link returns a conflict; it does not create or restore membership.
