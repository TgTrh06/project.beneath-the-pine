# Core Domain Rules

- One account may have at most one active focus participation and one current Open Seed.
- A Circle is private, has one owner and at most eight active members. There is no discovery endpoint.
- Circle invitations are opaque, hashed at rest, revocable, single-use and expire after 1–168 hours.
- Every pact participant must be an active member when the pact is created. The creator is accepted automatically.
- A pact creator may start from ten minutes before until thirty minutes after its scheduled time. Later pacts expire.
- A shared timer never pauses. `break` is a participant presence state only.
- Check-out outcomes are `completed`, `progress`, `stuck` and `stopped`; none is scored as failure.
- Intention and Open Seed are account-private. Circle projections expose display name and presence only.
- A shared-presence milestone is created once when a completed Circle session has at least two joined participants.
- An owner transfers ownership before leaving. Account deletion transfers to the oldest active member or deletes an empty Circle.

All terminal commands are idempotent. Authorization is evaluated from the current server-side account and membership, never client-supplied ownership.

Pact discovery is participant-only and requires current active Circle membership, including for owners. Leaving/removal revokes Pact detail/respond/start/join and shared session snapshot/presence access; personal historical rows remain. Circle archival requires no scheduled/active Pact, revokes pending invitations, and prevents creation/acceptance until restored. Restoring does not revive links. Invitation listings expose metadata only, never tokens or hashes.
