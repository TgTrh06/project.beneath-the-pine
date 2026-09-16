# Module Delivery Plan

| Slice | Modules | Acceptance focus |
| --- | --- | --- |
| S1 | identity, profile, privacy | Principal, timezone, two-account ownership, export/delete baseline |
| S2 | seed, focus | Solo session state, terminal idempotency, Open Seed lifecycle |
| S3 | circle, pact | Membership/invite/pact authorization and expiry |
| S4 | presence, focus | Server time, join late, reconnect, duplicate command and terminal races |
| S5 | memory, analytics | Derived milestone and redacted event payloads |

Do not create empty service abstractions merely to mirror this table. Each module exports only a contract with a real consumer.
