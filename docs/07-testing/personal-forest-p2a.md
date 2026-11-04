# Personal forest P2A — Implementation verification

**Subsequent dev rollout completed:** the separately authorized migration and live browser/API checks are recorded in [P2A dev rollout](personal-forest-p2a-dev-rollout.md). The scope and limitations below describe the earlier implementation phase.

Date: 2026-11-03. Scope authorized by `accept plan P2A`: code, additive migration and disposable database validation. Existing `btp_review` on port 5433 was not migrated; no production action or dependency change.

## Database and HTTP

Use PostgreSQL 17 in the disposable `pyneath-p2a-validation` container, bound only to 127.0.0.1:5545. Tests create/drop isolated schemas and use two independent database connections for save races. All test data is synthetic.

`forest-arrangement-postgres.test.ts` covers:

- Apply 0000–0004, insert legacy preference values, then apply 0005: preserve sharing/preset values, default forest values, reject invalid DB values.
- Reject hiding a locked item, materialize seven real completed-session fixtures, save independent visibility/layout, preserve milestone dates/count and unrelated preferences.
- Concurrent updates and concurrent first inserts produce exactly one winner; stale retries return 409; nonexistent owner is rejected.
- Actual Nest/Supertest HTTP stack: absent authentication, missing CSRF, invalid/extra input, duplicate/unknown items, generic-PATCH bypass, forged owner query/header, private no-store response, stale version and dependency failure without partial save or SQL leakage.
- Own export includes arrangement; account deletion cascades preferences and milestones without changing the other account.

Affected P1/core/scaffold regressions also passed on this disposable database: 24 tests passed, zero failures or skips. The test harness's single injected pg client produces the existing pg warning about queued queries; runtime uses a pool.

## Browser and UI review

Headless Edge/Playwright ran real React and Three UI on isolated Vite port 5174 with controlled HTTP fixtures, including failure/conflict cases. Screenshots and machine-readable results are kept in ignored `.openai/p2a-validation/`; reproducible session scripts are `.openai/p2a-ui.cjs`. These are local QA evidence, not shipped application dependencies.

- 320, 390, 768, 1440px in both light/dark themes: edit, save, reload saved state; 200% text without horizontal page overflow.
- Native keyboard toggle and focus restoration, locked item labels, empty state, cancel without PATCH, default reset saved deliberately, pending controls disabled.
- Keyboard submit and Save/Cancel remain operable at 200% text on 320px. Logout followed by another account's login clears the first account's arrangement; logging back into the first account restores the server fixture's saved choices. Supplementary evidence is `.openai/p2a-focused-ui.cjs` and `focused-ui-results.json`.
- Save failure retains choices; a newly earned flower appears while the earlier seedling stays hidden.
- Two pages share fixture server state: stale save preserves draft and current saved version; failed conflict reload preserves draft; explicit successful reload allows the next save.
- Preferences loading/error/retry leaves editing unavailable until data is known.
- All three 3D layouts render 14 personal meshes within 52 total geometries and 124 total draw calls (same as P1). Six hide/reset cycles return to the same geometry count and retain the same Canvas. Hiding the seedling leaves 11 personal meshes.
- WebGL loss switches to the static scene; preview/edit/save continue to work. No uncaught page errors observed.
- Measured normal text/button pairs in the editor have a minimum contrast ratio of 5.91:1. Screenshots reviewed for light/dark and mobile/desktop treatment.

Web regressions: 79 tests passed, including three forest visibility cases (P1 defaults, unearned protection and newly earned visibility). Workspace build and lint/boundary checks passed; existing Rollup Zod-comment and large shared Three chunk warnings remain.

## Limits and rollout

Browser persistence/conflict tests use an in-memory fixture; persistence/concurrency/authorization are separately exercised against PostgreSQL via the actual Nest HTTP stack. A supplemental combined command to migrate the temporary runtime database and launch a standalone API was rejected by automatic approval review with the generic reason `blocked by policy`; it was not executed. No claim is made of a newly started end-to-end dev API/browser rollout. Software WebGL evidence is not a physical mobile GPU benchmark.

Next rollout needs its own authorization: inspect the existing dev target/journal, back up and verify restore, test 0005 on the restored copy, apply 0005, restart the API with the new build, and verify save/reload/login and unchanged focus/Seed behavior with disposable accounts. Keep additive columns on code rollback. Delete no existing arrangements or migration records.
