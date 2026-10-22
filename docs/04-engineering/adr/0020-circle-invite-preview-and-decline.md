# ADR-0020 — Circle invitation preview and personal decline

- Status: Accepted in the approved Step 3 plan
- Date: 2026-10-22

## Decision

A Circle invitation remains a shareable, single-use link. An authenticated recipient may preview only the Circle name and the link creator's display name (or null when unset) before joining. Preview requires an active Circle, a pending unexpired invitation, and no decline by that account. It never returns member identities, invitation identifiers, token hashes, expiry, private work, or Pact state. The raw token is returned only when the owner creates the invitation.

Declining records a row keyed by invitation and account; it does not change the shared invitation. The same account cannot later accept that link, while another account may accept it. Acceptance, decline, revocation and archive serialize on the Circle row before the invitation row. A repeated decline remains successful while the link is valid. Any acceptance after the link has been used returns conflict, including a retry by its original recipient. The client directs someone whose accept response was lost to their Circle list.

The new table cascades on account and invitation deletion. Account export includes the caller's decline rows. The preview route requires authentication; unsafe actions also require CSRF. Invalid token shapes and unknown tokens return 404, while unavailable links return 409. Response and logs do not echo tokens or private content.

## Validation and rollback

The forward migration creates only `circle_invite_declines` with its composite primary key, account index and cascading foreign keys. Apply it first to a disposable database, then run focused HTTP, authorization, lifecycle and race checks. Review the generated SQL before any later environment rollout. Reverting the API and web code can leave the table unused; dropping it would discard decline choices and needs a separate data review. No production migration or deployment is part of this decision.
