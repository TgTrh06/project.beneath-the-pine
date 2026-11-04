# Core Domain Rules

- One account may have at most one active focus participation and one current Open Seed.
- A Camp is private, has one owner and at most eight active members. There is no discovery endpoint.
- Camp invitations are opaque, hashed at rest, revocable, single-use and expire after 1–168 hours.
- Every pact participant must be an active member when the pact is created. The creator is accepted automatically.
- A pact creator may start from ten minutes before until thirty minutes after its scheduled time. Later pacts expire.
- A shared timer never pauses. `break` is a participant presence state only.
- An active Pact stays joinable until the server's `endsAt` for an accepted participant who remains an active Camp member and has not joined, even after the creator checks out. Declined and unanswered invitations do not extend the session.
- Check-out outcomes are `completed`, `progress`, `stuck` and `stopped`; none is scored as failure.
- Intention and Open Seed are account-private. Camp projections expose display name and presence only.
- A shared-presence milestone is created once when a completed Camp session has at least two joined participants.
- Camp forest stages summarize 1, 3 and 7 recorded shared-presence memories, with original record dates. Existing records count; missing historical records are not backfilled. Only active members can read the Camp summary, including archived Camps and memories before joining. See ADR-0028.
- Personal forest memories appear at 1, 3 and 7 completed sessions, counting each joined session once regardless of outcome or duration. Active/cancelled sessions do not count; a Pact counts only after the whole session closes. Memories never expire from absence, stay account-private and include earlier eligible history. See ADR-0026.
- An owner transfers ownership before leaving. Account deletion transfers to the oldest active member or deletes an empty Camp.

All terminal commands are idempotent. Authorization is evaluated from the current server-side account and membership, never client-supplied ownership.

Pact discovery is participant-only and requires current active Camp membership, including for owners. Leaving/removal revokes Pact detail/respond/start/join and shared session snapshot/presence access; personal historical rows remain. Camp archival requires no scheduled/active Pact, revokes pending invitations, and prevents creation/acceptance until restored. Restoring does not revive links. Invitation listings expose metadata only, never tokens or hashes.
