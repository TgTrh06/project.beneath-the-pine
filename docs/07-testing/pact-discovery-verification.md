# Part 1 verification — 2026-09-17

## Implemented

- Personal Pact inbox and participant-only Circle Pact list: pending/upcoming/active/past, stable bounded cursors.
- Owner-only invitation metadata, safe create DTO, idempotent revoke.
- Archive/restore controls with server-enforced open-Pact guard and permanent revocation of pending links.
- Current membership authorization for Pact and shared focus/realtime reads and commands.
- Circle-row serialization for membership, invite, archive, Pact creation/respond/start/join; stable same-key creation retries.

## Observed evidence

Existing local API and PostgreSQL were healthy. No migration/reset/dependency installation was performed. The opt-in `apps/api/test/pact-lists-http.test.ts` created four isolated accounts and test Circles, verified HTTP/SQL database alignment, and cleaned only its own fixtures.

Five live groups passed (six TAP tests including parent): same-key create and participant-only inbox; accept/start/join and membership revocation; archive/revoked link/restore; cursor pagination and ownership transfer; archive raced against creation and invite acceptance three times. An authenticated Socket.IO client received its initial snapshot; after removal its heartbeat received an error. Nonparticipants and outsiders were denied. Invitation DTOs had neither raw token nor hash. Tests accelerated only their own session's endsAt for expiry.

Combined live solo and Pact suites: 12 passed, 0 skipped/failed. Default API suite: 19 passed, 4 opt-in database suites skipped. API lint/typechecks/boundary check passed. Web suite: 22 passed; production build passed.

Mounted PactsView with controlled HTTP fixtures was checked at 320/390/768/1280/1920px in both themes: no horizontal overflow with long Circle names. Load-more append, filter cursor reset, failed-next-page preservation and retry passed. Desktop dark screenshot inspected. This is UI fixture evidence, separate from the live HTTP/Socket.IO tests; it is not a full two-browser UI end-to-end run or physical-device accessibility audit.

## Repeat

Final regression also confirmed a removed participant can return and start a solo session: a stale active slot is released without granting renewed access to the shared session. InviteList browser fixtures confirmed Escape cancels revocation and restores trigger focus; confirming revocation reloads metadata and removes the available action.

Compile with `pnpm --filter @beneath-the-pine/api exec tsc -p tsconfig.test.json`. Run `node --test dist-test/test/pact-lists-http.test.js` from apps/api with BTP_SOLO_API_URL, BTP_SOLO_DATABASE_URL and BTP_SOLO_WEB_ORIGIN set privately to the existing local API/database/allowed Origin. No migration runs. Leave BTP_TEST_DATABASE_URL unset unless schema-mutating test suites are separately authorized.
