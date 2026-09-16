# Core State Machines

```text
Circle: active -> archived
Membership: active -> removed
Invite: pending -> accepted | revoked | expired
Pact: scheduled -> active -> completed
                  \-> cancelled | expired
Participant response: invited -> accepted | declined
Session: active -> completed | cancelled
Presence: active <-> break; active/break -> disconnected -> active; any live state -> checked_out
Open Seed: absent <-> current (replace is an atomic upsert)
```

Terminal states never transition back. Duplicate create/start/check-out commands return the already-created resource. Session expiry is reconciled on reads and by the API finalizer, so process restarts do not reset time.
