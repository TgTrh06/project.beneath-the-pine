# Stage 2 — Gentle support acceptance record

Dates: 2026-10-25–26. Scope: local web, one API instance and disposable PostgreSQL only. Two independent browser logins used fictional accounts and data. The user's existing local database was not migrated or reset. AI was disabled.

## S06–S07: presence and stuck recovery

| Check | Result | Evidence |
| --- | --- | --- |
| Presence defaults off and stays private | Đạt | In a live Pact, each account saw its own actual state; the other browser saw “Đã tham gia”. The isolated PostgreSQL core test covered default `hidden`, toggle on/off and snapshot replay. |
| Toggle applies during the active Pact | Đạt | Account A enabled then disabled sharing in Settings while account B kept Session open. B saw “Đang tập trung” then “Đã tham gia” without reload. The persisted participant state did not change. |
| Stuck choices and server timer | Đạt | Account A entered a private microstep and Seed draft, reloaded, and recovered the draft. A two-minute break displayed 120 seconds at start while the Focus timer continued; Pact presence changed to break and back. Saving the Seed left the session running. |
| Removed member access | Đạt | After the owner removed account B, B's Camp and completed Session routes returned the no-access state with retry/back controls. The live Pact suite also covers removal while active. |
| Forced network error while saving a stuck Seed | Đạt | During a Solo session, the API process was stopped before **Lưu Open Seed**. The UI reported connection failure and kept the entered text and retry button. After API restart, retry saved the Seed and the session remained active. |
| Keyboard path through stuck checkout | Đạt sau sửa | Enter toggled the stuck panel; Tab/Shift+Tab followed the visible controls. Enter opened checkout with `stuck` preselected. Escape returned focus to **Kết thúc và checkout** after the trigger was kept mounted. |

## S03–S05: invite again, repeat and reminders

| Check | Result | Evidence |
| --- | --- | --- |
| Recent co-participant quick select | Đạt | After both accounts completed a Pact, “Rủ lại người từng cùng Pact” appeared in the Camp form and selected only the actual eligible partner. It created no new Pact. Removing that partner hid the shortcut. |
| Repeat after checkout | Đạt sau sửa | “Hẹn lại Pact” opened a review dialog, then filled current member(s), old duration and scheduled mode with empty date/time. The create button remained disabled. With the former partner removed, the dialog reported one ineligible member, retained old duration, selected scheduled mode and required a new eligible member. |
| Reminder setting and one claim | Đạt | Reminder was off by default. A opted in, accepted a scheduled Pact and saw a banner inside the ten-minute window. With the profile set to `America/New_York`, the banner showed local time plus `GMT-4`. Opening another signed-in tab did not show a second banner; the DB held exactly one receipt. The isolated database test raced two claims and produced one receipt. |
| No reminder for canceled/expired/active or opted-out accounts | Đạt | The database test checks all three Pact statuses and the disabled account before claim. In the full browser flow, a banner already visible for a scheduled Pact disappeared after its creator canceled it and the 15-second revalidation ran. In a separate Chrome two-tab component harness, turning the preference off in the second tab removed the first tab's visible banner within one 15-second recheck; the claim count stayed at one. |
| Closed page and DST transition | Đạt for the tested cases | With the app tab closed before the ten-minute window, the DB receipt count stayed zero. Reopening the page displayed the banner and created one receipt. Unit tests distinguish the two repeated 01:30 times by `GMT-4`/`GMT-5` and reject the missing 02:30 at spring transition. |
| Hidden/background tab | Đạt for the reminder component in Chrome | An isolated headless Chrome profile switched a real tab from `visible` to `hidden` while the component's mocked preferences request was pending. The hidden tab made zero claim requests; after activation it made one. The in-app browser did not expose a genuine hidden state, so this Chrome component harness supplied the visibility check. The API claim and closed-page behavior were tested separately against PostgreSQL as recorded above. |

## S01–S02 and S08: sound, preset and guidance

| Check | Result | Evidence |
| --- | --- | --- |
| Soundscape | Đạt for local demo | Three bundled CC0 Ogg recordings are documented in `apps/web/public/sounds/README.md`. Audio did not play on selection or reload; play was enabled only after user action. Rain/forest/stream controls loaded in Chrome; play made Stop available. Checkout removed playback controls and paused the local audio. Chrome decoded all three assets: rain 1.48 MB / 110 s, forest 7.16 MB / 434 s, stream 1.09 MB / 31 s, with nonzero signal and sampled peaks below clipping. In two independent Chrome tabs using the same Pact session ID, account A selected rain and account B selected stream; each retained its own account-scoped choice and enabled Play control. The user listened to the three recordings and judged them acceptable for now on 2026-10-26, with better recordings to be sourced later. Another browser engine remains unchecked. |
| Focus preset | Đạt | A saved five-minute/rain preset did not overwrite an in-progress ten-minute/stream form draft on reload. Explicit Apply filled duration/sound without starting a Focus session or playing audio. |
| Contextual hints | Đạt for tested keyboard controls | Return, Camp composer, Pact detail and Open Seed showed short in-place hints. Enter dismissed and reopened a hint; after dismissal, focus returned to its **Xem hướng dẫn** button, and reload kept it collapsed. A full screen-reader pass remains a pilot gate item. |

## Build, migration and privacy evidence

- `pnpm lint`: passed; `pnpm build`: passed. A database-enabled `pnpm test` run with the temporary API passed web 41/41 and API 56/56 with zero skips. A later audit reran lint/build and tests against a fresh disposable PostgreSQL database: web 41/41, API 32 passed and three HTTP suites skipped because the temporary API process was not started for that rerun. No product code changed after the full live pass except the web reminder visibility guard, which passed web lint/test/build and the Chrome component check.
- Isolated PostgreSQL core test passed, including presence projection, recent partners, concurrent reminder claims, ownership and terminal races. Live Solo/Pact HTTP suites: 15 tests passed. The Camp invitation live suite: eight subtests passed.
- Clean disposable database: the workspace migrator applied 0000–0003. Old-data disposable database: applied 0000–0002, inserted one fixture account/Seed, applied 0003; account ID, Seed ID/text and the new preference FK remained valid. No migration was applied to the existing local database.
- A fictional private marker was stored in one account Seed. A query found one owned Seed and zero matches in `product_events` metadata/subject. The other account's browser projection showed no intention or Seed. API test assertions cover projection privacy and `presence.updated` shape.
- The isolated PostgreSQL test now checks that data export contains the owner's preference and reminder receipt, then that deleting the account cascades to both records.
- One temporary test run pointed HTTP suites at a non-listening port and returned `fetch failed`; rerunning those 15 tests against the actual API port passed, followed by a full database-enabled run with zero failures. This was a test URL error, not an application failure.

## Defects found and rerun

| Area / impact | Reproduction before fix | Change and rerun |
| --- | --- | --- |
| S04 UI, medium: repeat dialog did not open | Complete Pact → click **Hẹn lại Pact**. The Camp effect cleared the source before `getPact` resolved. | Clear source after resolution; browser rerun showed review dialog and prefilled form. |
| S04 UI, low: removed partner lost old scheduling choices | Remove former participant → click **Hẹn lại Pact**. A notice appeared, but duration/scheduled mode were unchanged. | Offer the review dialog with zero eligible recipients; browser rerun kept old duration, set scheduled mode/empty time and disabled create. |
| S05 UI, medium: one-time reminder disappeared in React StrictMode | Accept near-term Pact → reload development web. First discarded mount claimed the receipt, then its banner was discarded. | Defer initial claim until the stable mount; a newly accepted Pact showed the banner after reload. |
| S07 UI, low: new break briefly displayed over 120 seconds | Start a two-minute break after component mounted earlier. Display used a stale local `now`. | Set the display clock when starting the break; browser rerun began at 120 seconds. |
| S07 keyboard, medium: Escape lost focus after checkout opened from the stuck panel | Open stuck panel by keyboard → **Kết thúc và checkout** → Escape. The trigger was unmounted before the dialog restored focus. | Keep the trigger mounted while checkout is open; browser rerun returned focus to **Kết thúc và checkout**. |
| S08 keyboard, low: dismissing a hint lost focus | Activate **Tôi đã hiểu** by Enter. Its button disappeared and focus fell to the document. | Focus the persistent **Xem hướng dẫn** control after dismissal; browser rerun verified focus and reopen by Enter. |

## Remaining limits and gate

The local Stage 2 demo gate is met for the two-account journeys, API privacy/race checks, Chrome hidden-tab component check, independent sound choice, user listening review and affected automated suites. Another browser engine and a full screen-reader pass remain open before pilot. A once-only reminder receipt is committed before the UI displays it, so a browser crash in that narrow window can lose the banner; a durable inbox would require a separate design. The broader pilot gate remains open. Real-data migration, deployment and participant invitations require separate approval.
