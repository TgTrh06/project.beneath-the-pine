# UI renovation delivery contract

Approved scope: responsive frontend, forest/chestnut light and night themes, restrained tactile motion, and existing solo/Circle/Pact API integration. No dependency, backend, schema, migration, seed or deployment changes.

## Identity
White paper and forest primary controls; chestnut secondary accents. SVN-Engine remains on prominent display headings, with Be Vietnam Pro for navigation, body and smaller headings. Center public content in a `min(1360px, 90vw)` canvas and limit reading copy to about 680px. The signed-in Wanderer workspace has a full-width sticky navbar, a 224px left navigation rail from 1024px upward, and a flexible content area capped at 1120px with fluid gutters; smaller screens use the existing menu dialog. Prefer spacing and quiet surfaces over decorative frames; controls have about 6px corners, cards 8px and dialogs 10px. Preserve the chestnut Marten gripping the example's thin top rail, centered rising mobile menu, compact reveal-on-scroll public header and borderless footer.

## Delivery slices
1. Semantic tokens, theme bootstrap, shared controls and states.
2. Public/app navigation, landing content, authentication return destination.
3. Return, server-derived session timer, reconnect, checkout and Open Seed.
4. Private Circle membership/invite controls and Pact state/permission handling.
5. History, milestones, profile/privacy settings and validation.

## Screen/state/API acceptance
| Screen | Required states | API | Acceptance |
|---|---|---|---|
| Return | loading/error, timezone, active session, seed, start | me/return, me/profile, focus-sessions, me/open-seed | One primary action; 280/500 limits remain distinct; stable start retry key |
| Session | loading/error, active, reconnecting, ended, checkout | focus-sessions/:id, check-out, realtime | No automatic join on GET failure; timer uses serverNow; no pause claim; no outcome changes after terminal state |
| Circle | loading/error/empty, owner/member, invite result | circles and membership subresources | Explicit acceptance; private token not logged/persisted; creator excluded by account ID |
| Pact | invited/accepted/declined, scheduled/active/terminal | pacts/:id, respond, cancel, start | Server-authoritative permissions; creator-only start/cancel; explicit join |
| Memory | independent loading/error/empty lists | me/focus-history, me/memory | No ranking/streak; no invented pagination or private text |
| Settings | loading/error, saving, export, delete confirmation | me/profile, me/data-export, me/account | Theme is browser-local; deletion requires password and confirmation |

## Known backend limits
No invite preview/list endpoint or pending Pact inbox. No shared-session intention input endpoint. No persisted presence preference. Expiry finalizes participants as stopped; do not offer outcome editing afterwards. Circle create/update responses differ from GET; refetch detail rather than cast. Backend still authorizes all operations.

## Validation
Web lint, tests, build; 320/390/768/1100/1280/1920 responsive checks; both themes, keyboard/dialog focus, reduced motion, contrast and long Vietnamese text. Local integration only if existing API/database are ready; never reset or migrate a database to obtain evidence. Record any unverified checks explicitly.

## Implementation evidence — 2026-09-16

Later solo-core integration evidence is recorded in [the 2026-09-17 verification](../07-testing/solo-core-verification.md). The API-unavailable note below describes the earlier UI review, not that later integration run.

- The Wanderer workspace layout was checked in isolated headless Edge at 320, 390, 768, 1023, 1024, 1280 and 1920 CSS pixels in both themes using a CSS fixture: no horizontal overflow, a 68px sticky navbar, a 224px sidebar from 1024px, and a 1120px content cap on wide screens. Light/dark mobile and desktop screenshots were visually inspected. A separate mounted `AppLayout` component fixture confirmed desktop navigation, mobile menu opening, Escape closure with trigger focus restored, and navigation from the menu back to focused main content. These checks used fixture content, not a live signed-in backend session.
- The softer 2XL layout was checked in isolated headless Chrome at 320, 390, 768, 960, 1100, 1280 and 1920 CSS pixels in both themes. Public canvas width followed `min(1360px, 90vw)` except for the 16px gutters on narrow phones; no horizontal overflow was observed. The hero stayed on two lines and Marten remained centered over the example's top rail. The demo updated after selection, and Escape closed the public menu and restored trigger focus. At that point, a CSS fixture confirmed the former signed-in shell widths and navigation breakpoint; this was not a signed-in backend session test. The later Wanderer workspace layout replaces those former dimensions.
- Web typecheck/build passed; 19 focused Vitest tests passed (including theme precedence, private invite routes/redaction, stable retry keys, timezone conversion/DST gaps, server timer arithmetic, Open Seed semantics and Pact permissions).
- Isolated headless Edge exercised the running Vite frontend. Landing plus Return, Circles, Circle detail, Pact, Memory, Settings and Session were checked in light/dark at 320, 390, 768, 1100, 1280 and 1920 CSS pixels; no document horizontal overflow was detected. Desktop/mobile screenshots were visually inspected for representative public and app screens.
- Public menu: reduced-motion animation is disabled; Escape closes the dialog and restores focus to its trigger. App mobile menu opens as a centered rising dialog.
- Theme checks: system light/dark changes propagate; explicit light stays light despite dark system preference; manual choice persists through reload.
- Controlled HTTP fixtures exercised Return → start → Session → checkout → Return; the POST start includes an idempotency key, and preserving the seed omits openSeed from checkout. These are frontend fixture checks, not backend integration evidence.
- Fixture invite/auth flow preserved the invite destination across the register switch and required a separate explicit accept action. Generated invite tokens were absent from localStorage; current-link revoke required confirmation and removed the displayed link after success.
- Independent history failure left the milestones section visible. A computed foreground/background scan of representative light/dark screens found no enabled static text below the applicable 4.5:1/3:1 thresholds; this is not a blanket accessibility certification.
- API at the configured local proxy target 127.0.0.1:8081 was not listening. Real cookie/CSRF persistence, two-account backend membership/Pact flows, realtime delivery/reconnect and database deletion/export were not integration-tested. No migration, seed, reset, dependency installation or deployment was performed.
- Physical-device keyboard occlusion and assistive-technology behavior still need device testing; the browser checks above do not substitute for those checks.
