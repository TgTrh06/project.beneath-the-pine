# ADR-0019 — Private Pact discovery and Circle archival

- Status: Accepted in the approved part 1 plan
- Date: 2026-09-17

## Decision

Pact list/detail/commands require participation and current active Circle membership. Ownership alone does not grant access to other members' Pacts. Focus snapshots, presence and join recheck the same membership; historical personal session rows are retained. Realtime publishes account-specific snapshots and removes unauthorized sockets from the room when authorization fails.

Only current owners manage invitation metadata or archive/restore. Archive rejects any scheduled/active Pact (overdue scheduled Pacts are first expired), revokes pending invitations, and prevents new invites/Pacts or invitation acceptance. Restore never revives revoked tokens. It does not cancel existing sessions.

Writes serialize on the Circle row before membership/Pact/invitation rows. Pact creation additionally serializes retries by actor using a transaction advisory lock and the existing unique request-key constraint. Queries inside a transaction reuse its connection. No schema or dependency change is required.

The PATCH Circle endpoint is coordinated by PactService/PactController so the open-Pact invariant and Circle update share a transaction without a Circle-to-Pact import cycle. Existing Circle public schema exports are the explicit persistence boundary. This is a focused coordination choice, not a new service layer.

Lists use bounded cursor pagination (20 default, 50 maximum); cursors are validated and bound to account/filter/Circle. Authorization is independently checked and does not trust cursor contents. Pact ordering uses startsAt/id; invite ordering normalizes creation timestamps to milliseconds plus id to match JSON precision. Lists are live views, not immutable snapshots; mutations refresh page one.

Return/solo start release a revoked participant's stale active slot as stopped after rechecking membership under the Circle lock. This avoids blocking a new private session while retaining the historical row and denying shared snapshots.

Invitation DTOs explicitly select safe fields. Only creation returns the raw token, once; list responses never return token or tokenHash. No new analytics fields include private content.

## Validation and rollback

See [part 1 verification](../../07-testing/pact-discovery-verification.md). Rollback reverts the focused contracts, endpoints and client together without a database migration. Already archived Circles and revoked invitations remain so; rollback must not revive those links. Do not revert unrelated prior UI work.
