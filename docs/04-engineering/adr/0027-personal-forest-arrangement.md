# ADR-0027 — Personal forest arrangement

- Status: Accepted through `accept plan P2A`; dev rollout separately authorized by `accept plan rollout P2A dev` and completed on 2026-11-03. Other environment migrations/deployments require separate authorization.
- Date: 2026-11-03

## Decision

Extend account preferences with a private arrangement of the three P1 memories. The source of earned items remains the durable `personal_milestones` projection from ADR-0026. Arrangement never writes milestones, sessions, dates, counts, Seed text or Camp state.

`GET /api/v1/me/preferences` includes `forestArrangement: { layout, hidden, version }`. Layout is one of `clearing`, `gathered`, `arc`; hidden is a unique subset of thresholds 1, 3, 7. No saved row returns `clearing`, an empty hidden array and version 0. Newly earned items therefore appear without rewriting preferences. Clients render only earned items, regardless of arrangement values.

`PATCH /api/v1/me/preferences/forest` accepts that strict object; version is the version being replaced. Existing generic preferences PATCH rejects this field, so it cannot bypass compare-and-save. The identity guard supplies the owner and enforces existing CSRF/origin checks. No account ID is accepted in the body; owner query parameters/headers cannot change the actor.

Within a transaction, lock the account row (the same order as milestone projection), compare the stored forest version, and reject stale writes with 409. Check each hidden item against that account's materialized milestones, rejecting unearned items with 403. Upsert only the three forest fields and increment the version. This also serializes simultaneous first saves when no preferences row exists. A request arriving before history has been projected cannot hide an unrecorded item; the editor loads the personal forest before enabling editing. Existing earned items remain valid if a future session-retention policy removes session history.

The version applies only to arrangement. Sharing, reminders and focus preset updates neither bump the forest version nor overwrite its values; forest saves preserve those settings. A lost save response can produce a conflict on retry; users explicitly load the saved version rather than silently overwriting it. There is no last-write-wins or background retry.

## Client

The account-keyed personal forest provider stores arrangement only in memory, reloads on visible-tab resumption and accepts monotonically increasing versions. The editor copies saved state into a draft. External reloads do not replace an open draft. Save success updates the scene and summary; cancel makes no request. Save failure keeps the draft. A conflict disables Save until the user explicitly loads the saved version (the UI states that this replaces the draft) or cancels.

The shared ground-plane anchor table drives both a top-down SVG preview and the existing Three scene. The preview is explicitly labeled as a top view, not a perspective reproduction. Drafts affect only that preview; the scene changes after saving. All three objects are independent and remain in the existing patch beside the trunk. No extra Canvas, assets, lights, animation loops, dependencies or realtime channel are added. When preferences are unavailable, the editor offers retry, the scene waits for known arrangement, and the return summary can still show earned memories.

## Storage, privacy and reversal

Migration `0005_personal-forest-arrangement.sql` adds non-null `forest_layout`, `forest_hidden` and `forest_version` with defaults plus allowed-layout, allowed-hidden-values/size/null and nonnegative-version constraints. Existing preference values are preserved. Application validation additionally rejects duplicate hidden values. The existing account FK cascades deletion; existing own-account data export selects all preference columns and includes these fields without a new export path. No personal localStorage data or analytics event is introduced.

Apply only after a separately authorized database rollout and backup. Schema changes must precede the new API process because its reads select the added columns. P1 code can run with the additive columns left in place; do not drop columns or rewrite migration history as a rollback. Dropping them loses saved arrangements and needs separate review.

## Evidence

See [P2A verification](../../07-testing/personal-forest-p2a.md) for PostgreSQL forward migration, compare-and-save, HTTP authorization, privacy, frontend interaction and geometry evidence. Implementation validation used only disposable databases. The later, separately authorized [dev rollout](../../07-testing/personal-forest-p2a-dev-rollout.md) applied 0005 to `btp_review` after verified backup/restore and passed live integration checks.
