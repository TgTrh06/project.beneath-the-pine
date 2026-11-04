# ADR-0028 — Camp forest from durable shared presence

- Status: Accepted through `accept plan P3A`; implementation approved; [local dev rollout](../../07-testing/personal-forest-p2b-p3a-dev-rollout.md) subsequently authorized separately and completed.
- Date: 2026-11-03

## Decision and contract

`GET /api/v1/me/memory/camps` returns `{ camps: [{ campId, name, status, sharedSessions, milestones: [{ threshold, recordedAt }] }] }`. Thresholds are 1, 3 and 7; each Camp has at most three. The authenticated account is the only actor. Query parameters and headers cannot choose another owner. The existing identity guard and no-store response policy apply.

The source of truth is existing `camp_milestones` of type `shared_presence`, uniquely constrained by session/type. The existing focus lifecycle records one after a completed Camp session with at least two joined participants. P3A does not change that lifecycle or rank outcomes, duration or individual participation.

One SQL statement ranks authorized memories by recorded time and ID within each Camp, counts them and selects the first/third/seventh dates. Both the ranked source and Camp selection require active membership for the requesting account. Left joins include Camps with no memories. Archived Camps remain readable while membership is active. Ordering of Camps uses creation time and ID. No new table, migration, index, write-on-read projection, dependency, backfill or analytics event is introduced.

## Privacy and retention

Names, counts and dates are available only to active members. New/rejoined members see earlier shared history under the existing Camp memory policy; removed members receive no row for that Camp. The response includes no session IDs, participant IDs, intentions, outcomes or Seeds.

The shared records have no session foreign key and survive session cleanup. They cascade with Camp deletion. Deleting a member does not erase the remaining Camp's collective history; account deletion still follows existing ownership transfer/empty-Camp deletion rules. Existing authorized exports already include the underlying records, so no new stored export field is needed. Export authorization remains governed by ADR-0025.

Existing recorded history contributes immediately. P3A does not reconstruct sessions missing a shared-presence record. Dates are original memory-record timestamps, which may reflect lazy completion reconciliation rather than the precise scheduled end. No new historical-completeness claim is made.

## Client lifecycle

The Camp tab loads this summary and the existing `/me/memory` list together, and filters entries against the authorized Camp IDs before rendering. These are separate read snapshots, not an atomic combined response; a newly completed session can appear in one before the other until refresh. This does not affect persisted milestones.

The component mounts only while the Camp tab is selected beneath the account-keyed layout. Opening the tab and resuming visibility reload both responses. Loading, either request failing, hiding, closing the tab and account changes discard the old display. A request sequence prevents late responses from restoring discarded data. Selection is retained if still authorized, otherwise the first authorized Camp is shown; pagination resets for selection/reload. No data is persisted in browser storage or broadcast.

Revocation takes effect on subsequent server reads; P3A does not add realtime membership notifications or promise immediate removal of content already delivered to a continuously visible client. Client filtering supplements server authorization and is not its substitute.

## Reversal and validation

Reverting the new client/API code removes the presentation without data loss. There is no schema rollback or destructive action. A later rollout must coordinate API availability before enabling the new client; an older API makes the Camp tab show a retryable error, not cached data. P2B rollout is a separate work item.

See [P3A verification](../../07-testing/camp-forest-p3a.md) for focused PostgreSQL/HTTP and browser evidence and limits. Representative high-volume query performance and production deployment are not established by these checks.
