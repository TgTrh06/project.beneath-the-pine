# ADR-0021 — Camp contract and accepted late join

Status: Accepted for the core closeout implementation (2026-10-24).

## Decision

Camp replaces Circle throughout the current web routes, HTTP payloads and endpoints, TypeScript contracts, analytics event names and PostgreSQL schema. No old route or field alias is retained. The forward migration renames existing objects and stored event names in place; UUIDs and foreign-key relationships remain unchanged. `#invite/:token` keeps its generic URL.

For an active Pact, a creator's checkout does not close the shared session while another accepted participant remains an active Camp member and has not joined. That participant may join until the server's `endsAt`. A declined or unanswered invitation does not keep the session open. After the last joined participant checks out and no eligible accepted participant is waiting, the session and Pact complete. Expiry remains server-authoritative. Camp, session and participant locks serialize join, checkout, presence and expiry.

## Consequences and rollout

The old Circle API and `#circles` / `#circle/:id` links stop working as soon as this release is applied. Migration 0002 must be reviewed with a backup and deployed with matching code; neither production migration nor deployment is authorized by this ADR. A code-only rollback after migration is unsafe; recovery requires a separately reviewed reverse migration or restore. Historical migrations and historical verification records keep their original names.

The Pact detail view explains that an accepted member may still join after others checkout. Session snapshots continue to expose only the requesting account's intention; presence payloads do not include intention or Open Seed. Validation must cover old-row preservation, clean setup, accepted late join, concurrent join/checkout, expiry, access revocation and independent browser sessions.
