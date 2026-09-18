# Core Screen Specifications

## Return

### Step 5 — Marten companion, 2026-09-17

The shared SVG preserves the chestnut illustration; the landing wrapper retains its original positioning class and explicitly enables pointer tracking. Application Marten notes are static and decorative, appearing on Return and after a session ends, never during focus. Notes use existing theme tokens and do not represent AI analysis.

Return offers an explicitly expanded starting guide with three labelled, fixed examples. Choosing one fills the intention only; a different non-empty intention requires confirmation before replacement. Cancel preserves the draft. Confirm closes the guide and focuses the textarea without changing duration or starting a session. Closing the guide restores its trigger. No new API, storage or automatic messages were added.

Validation: production build and 22 existing web tests passed. Mounted Return browser fixtures passed at 320/390/768/1280/1920px in both themes without overflow. Additional assertions passed for replacement confirmation, cancel retaining text, confirm filling/focusing while preserving duration, and decorative/static app SVG. Desktop dark screenshot inspected. Landing SVG paths and pointer tracking logic were preserved by extraction; reduced-motion/touch guards were inspected, not physically device-tested. These checks are mocked component evidence, not backend integration. The outstanding two-account integration checks from step 4 remain outstanding.

Show active session recovery first, then the current Open Seed, then one intention input and duration choice. The primary action is resume or start, never both. A missing timezone blocks start with one explicit confirmation action.

### Return layout — step 2, 2026-09-17

The Return content is capped at 960px inside the existing application shell. Above 800px, a flexible main column sits beside a 248px appointments column; at 800px and below these stack in reading order. A single surface groups intention, duration and start. Open Seed is a flat text section with a chestnut marker; primary actions and selected durations retain pine tokens. Empty appointments use explanatory text rather than another card.

Both seed continuation and starting different work move focus into the intention input. Seeds over 280 characters remain intact and require an explicitly shortened intention. Submission locks the form and guards duplicate calls synchronously; retry keys and account-scoped drafts remain unchanged. Errors appear beside the relevant form or inside the delete confirmation. Reduced-motion disables Return control animation.

Validation: web build and 22 tests passed. An isolated mounted Return component with mocked HTTP responses was exercised in headless Edge at 320/390/768/1280/1920px in light and dark: no horizontal overflow with long seed content. Checks passed for long-seed handling/focus, failed-start draft retention, different-work focus, active-session priority/navigation, timezone gate, and disabled empty start. A desktop dark screenshot was inspected. These are component fixture checks, not real API integration, complete keyboard auditing, or physical-device validation.

## Circles

### Step 4 delivery — 2026-09-17

Circle lists use a 960px content cap and an explicitly opened create form. Detail prioritizes the Pact composer, with members and expandable owner management beside it on desktop; below 800px the composer precedes members. Archived groups omit the composer and use full-width member content. Owner actions retain confirmation; full groups explain the eight-person limit.

Pact composition keeps selected people, duration, date and stable retry information in account/Circle-scoped memory. Success clears the form; changing Circle/account does not reuse the draft. A refreshed member list removes stale selections and announces the change. The creator is excluded. Creation does not imply starting a session; copy now says “Hẹn ngay bây giờ” and explains the separate start action. Forbidden/not-found responses clear stale Circle data before refresh. Form fields are locked during submission, with a synchronous duplicate guard.

Invite tokens remain ephemeral. Clipboard feedback is local to the link. Invitation acceptance remains explicit and generic errors are retained because the API does not expose reliable distinctions for all failure causes. Pact distinguishes load, operation and clipboard errors and explains accepted-but-waiting state. Terminal Pact states expose no primary start/join command.

Validation: web build and 22 existing tests passed. Mounted CircleView with mocked HTTP was checked at 320/390/768/1280/1920px in light/dark with no horizontal overflow. Browser assertions passed for creator exclusion, draft remount recovery, deselection of a removed member, member/owner control separation and archived composer removal. Pact fixtures passed accepted waiting copy and absence of terminal primary commands. Local PostgreSQL port 5433 was unavailable; no two-account live integration, migration or database reset was performed. Full invite acceptance, clipboard permissions, all confirmation keyboard paths and real auth-expiry recovery remain integration/device validation items; fixture evidence is not a claim that those checks passed.

List only joined Circles. Circle detail shows members, private invite controls for the owner and a compact pact composer. Invite tokens are shown once for deliberate sharing.

## Pact

Show time, duration, participant responses and only actions permitted to the current account. Joining an active session replaces pact controls.

## Session

### Step 3 delivery — 2026-09-17

The standalone focus screen uses a 720px content cap, a compact return/theme toolbar, wrapping intention and tabular timer. Checkout groups four outcomes in two columns (one below 380px), with optional private seed text. Pending submission locks its fields and uses a synchronous guard against duplicate calls. Load errors and mutation errors are separate; snapshots do not clear mutation errors. Zero time displays server-confirmation status and disables opening a new checkout until reconciled. A terminal transition closes checkout, preserves seed text and focuses the ending heading. Explicit dialog dismissal restores the trigger and retains the draft.

Validation: web production build and 22 existing tests passed. Isolated mounted SessionView with mocked HTTP was checked in headless Edge at 320/390/768/1280/1920px, light and dark, with long intention text and no horizontal overflow. Escape/focus restoration, reopening with retained draft, terminal transition with retained seed/focused heading, and failed seed-save retention passed. These checks do not establish real backend/realtime integration, real reload timing, full keyboard accessibility, or physical-device behavior. Server time arithmetic and seed semantics remain covered by existing unit tests.

Full-screen, server-derived timer, connection state, private own intention and minimal shared presence. Check-out offers four neutral outcomes and an optional Open Seed.

Current backend boundary: manual check-out offers four outcomes while the participant is active. Once expiry finalizes the participant, the UI does not offer outcome editing; a new Open Seed can still be saved separately. Presence `break` never pauses the shared timer. Shared-session join currently has no intention input endpoint.

## Memory and Settings

Memory contains personal history and non-competitive Circle milestones. Settings owns profile, export, re-authenticated deletion and sign-out. No ranking, streak, feed or AI consent appears in core.

The client now provides a pending-Pact inbox and owner invitation metadata list. Invite preview remains unavailable. An invite link requires explicit acceptance; newly created tokens are shown in memory only. Theme is a browser preference; no persisted presence-sharing preference is implemented.

## Part 1 — Pact discovery and Circle lifecycle

The Cuộc hẹn navigation destination groups pending, upcoming, active and past Pacts with load-more pagination. Circle detail reuses the list, explicitly limited to the current participant. Profile timezone is used. Owners can list invitation metadata, revoke with confirmation, and archive/restore with impact copy. Active or scheduled Pacts block archive; pending links are revoked on archive and are not restored. See the part 1 verification report for live API/Socket.IO and separate UI fixture evidence.
