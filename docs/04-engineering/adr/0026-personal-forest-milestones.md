# ADR-0026 — Personal forest milestones

- Status: Accepted for approved P1 implementation; existing-database migration and release require separate authorization.
- Date: 2026-11-03

## Decision

P1 records three private memories at 1, 3 and 7 completed focus sessions. `focus_sessions.status = completed` plus the account's unique session participation is the source of truth. All outcomes and durations count equally. Cancelled/active sessions do not count; a Pact participant's early checkout is counted only once the entire session closes. No streak, expiry, currency, ranking or repeatable reward is introduced.

`GET /api/v1/me/memory/personal` returns `{completedSessions, milestones: [{threshold, sourceSessionId, recordedAt}]}`. The global identity guard supplies the account ID; clients cannot choose another owner. This private, no-store GET idempotently materializes a bounded projection from existing durable session history before returning it. The side effect contains only derived data and requires no client-supplied command or CSRF input. This keeps memory failure outside checkout and Open Seed transactions and permits recovery on the next read without a worker, trigger or queue.

The short transaction locks the owning account row to serialize concurrent projection reads and account deletion. One query counts the lifetime history and returns only the first seven completed sessions, ordered by `coalesce(completed_at, ends_at), id`. The timestamp fallback supports older completed rows. The count is not taken from the 100-row history API. Missing milestones are inserted with conflict protection; existing rows and their original dates never change. Historical milestones are recorded on the first successful personal-forest read; migration does not scan or rewrite session history.

The new `personal_milestones` table has primary key `(account_id, threshold)`, an allowed-threshold constraint and an account foreign key with cascading deletion. `source_session_id` is an opaque reference, deliberately without a cascading session FK, so a future session-retention change does not silently revoke a memory. Any such retention change must also review the displayed lifetime count. Current session retention is unchanged. No intention, Seed text, duration, outcome, Camp name or other member's identity is copied into this table.

The memory module consumes focus's explicit public schema contract. Its own public API exposes its schema; the previously unused service re-export is removed to avoid an import cycle. Focus lifecycle code and its public endpoints are unchanged.

## Client and privacy

An account-keyed React provider loads the projection independently of focus data. It refreshes on return/journal entry, completed-session observation and visible-tab resumption. Stale requests cannot overwrite current data; unmount/account changes discard the in-memory cache. No progress is stored in localStorage. Errors have their own retry and never block starting a session or saving a Seed.

The post-session notice is shown only for a newly observed milestone whose source matches that session. It does not block navigation and links to the existing Memory route. Reloading historical progress does not replay unlocks. Simultaneous or delayed background reads may discover progress without a notice; the persistent journal remains authoritative. Other clients see progress on their next refresh; no new realtime broadcast is added.

Export includes materialized personal milestones; unmaterialized history remains available in the existing session export. Account deletion cascades these rows. Personal milestones remain private even when earned in a Camp; existing Camp milestone authorization is unchanged.

## Migration, reversal and validation

`0004_personal-forest-milestones.sql` only creates the table, key, check and FK. Generated Drizzle metadata is included. Verify both a fresh schema and an existing schema with completed history on a disposable database before rollout. Do not run it against an existing local/pilot/production database under implementation approval alone.

Code rollback can leave the unused table and migration history in place. Dropping it loses personal memory records and requires a separately reviewed migration. There is no destructive cleanup in this change and no new dependency.

The PostgreSQL regression suite covers historical projection, original dates, concurrent reads/checkouts, all outcomes, auto-expiry, cancellation, unfinished/finished Pacts, more than 100 sessions, authenticated ownership, safe dependency failure, Seed saving during memory outage, export and cascading deletion. UI evidence and performance limits are recorded in the P1 design document.
