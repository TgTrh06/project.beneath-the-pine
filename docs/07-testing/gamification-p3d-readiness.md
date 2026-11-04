# P3D — Gamification evidence and pilot preparation

Date: 2026-11-03 (Asia/Saigon). Authorized by `accept plan P3D`. This phase verifies available behavior and prepares the observation protocol; it does not authorize product changes, participant invitations or pilot deployment.

## Outcome

The additional keyboard journey and semantic snapshots passed with the real React UI and synthetic responses. The field kit now includes four gamification tasks, neutral questions and recording rules. No participant research was conducted, and there is no evidence yet of improved retention, motivation or absence of pressure.

Native browser zoom, spoken screen-reader narration, physical mobile use and cross-engine parity remain unverified. P3D preparation is complete; pilot readiness is not complete. The existing [pilot opening conditions](private-beta-plan.md) still apply.

## Evidence matrix

| Area | Evidence | Status and limit |
| --- | --- | --- |
| Core keyboard route | New continuous Return → Solo start → stuck checkout + synthetic Seed → personal Memory → arrangement → shared journal → Camps → Camp → error retry | Passed at 1280×900 in headless Edge, static scene, synthetic HTTP; not a new real-backend acceptance run. |
| Arrangement keyboard | Native radio arrows and checkbox Space, hide/save/reopen/show/save; focus returns to edit button | Passed; version advanced twice in the fixture. This is interaction evidence, not server persistence evidence. |
| Milestone semantics | ARIA snapshots include earned/unearned text, dates, private/shared region labels, visible-item count and stored status | Observed in browser accessibility representation; not screen-reader speech. |
| Async semantics | Arrival, saved arrangement, Camp loading and Camp failure expose status content; retry reachable by Tab/Enter | Passed structurally; announcement timing, duplication and speech interruption remain untested. |
| Reflow | P3C implementation and live rollout cover narrow widths, short viewport, text 200%, themes, focus and Canvas continuity | Existing evidence retained; enlarged root text does not establish native browser zoom. |
| Browser zoom 200% | A headed Edge attempt closed before initial navigation completed. Headless Ctrl-plus attempts left width=1280, DPR=1, root font=16px, visual scale=1 unchanged | Unverified. No zoom success inferred from screenshots or CSS. |
| Screen reader | No active NVDA/Narrator process observed; NVDA absent at the two common installation paths checked | No narrated walkthrough performed. This limited inventory does not prove no screen reader is installed. No install or OS-setting change was made. |
| Physical mobile | No physical-device session available in this work | Unverified: real keyboard, app background/resume, scrolling feel, GPU/battery and touch use. |
| Other browser engines | This run used Edge/Chromium only | WebKit/Gecko and final target browser coverage remain open. |
| User understanding/pressure | Source/UI copy explicitly describes cumulative milestones, preserved memories during absence and reversible hiding | Copy exists; user comprehension and behavior are unknown until consented observation. |

## New keyboard walkthrough

After an initial route setup, the tested journey used Tab, Enter, Space, native select/radio arrow keys and text typing. It did not click controls, force focus with locator APIs or navigate routes directly between journey steps. Automatic app focus behavior remained active. The setup initially opened Camp, then navigated to Return to begin the journey; that setup is not counted as a user task.

Nineteen target-control checkpoints were recorded. They included starting a Solo session, choosing the stuck outcome, writing a synthetic restart note, following the earned-milestone link, saving a gathered layout with the seedling hidden and then visible, switching to the shared journal, reaching Camp through the existing navigation/list, closing Menu with Escape, and retrying a failed Camp progress load. Target focus was checked within the viewport. No focus trap or uncaught page error occurred in the completed run.

An early assertion checked the arrangement focus synchronously before its existing `requestAnimationFrame` callback ran. The harness was corrected to wait for the app's focus transition; product code was not changed. Counts of Tab presses are debugging evidence only, not usability results. The fixture's personal-history endpoint is empty independently of its completed-session counter; its empty history message is not evidence of a product data inconsistency.

Local evidence: ignored `.openai/p3d-validation/keyboard-results.json`, `zoom.json`, `arrival.aria.txt`, `personal-journal.aria.txt`, `arrangement-saved.aria.txt`, `shared-journal.aria.txt`, `camp-summary.aria.txt`, `camp-loading.aria.txt`, `camp-error.aria.txt`. Script: `.openai/p3d-check.cjs`. Any text in these snapshots is synthetic. Earlier failure screenshots are diagnostic history, not a final failed product check.

## Meaning of progression

Code/document inspection agrees that personal thresholds are cumulative 1/3/7 eligible completed sessions, and the journal explains that absence does not remove memories. The arrangement editor explicitly says hiding keeps the memory and recorded date. Camp growth projects existing durable shared-presence records, with one record per session/type.

The current shared rule is a **completed Camp session with at least two joined participants**, per [ADR-0028](../04-engineering/adr/0028-camp-forest-projection.md) and `FocusService.deriveMilestone`. It does not establish a minimum productive duration, rank outcomes, or require every participant to submit a manual checkout. Do not teach those extra conditions in the pilot. Existing P3A/P3B rollout evidence covers counts, dates, uniqueness and access; this phase did not rerun the PostgreSQL suites.

The broad critical-test item about valid attendance remains open: historical happy-path evidence and code inspection alone are not a newly executed, explicit negative-case acceptance matrix. A follow-up should map completed/cancelled, one/two participants, expiry, duplicate checkout and absence of rank/score fields to concrete evidence before changing that checkbox.

## Remaining verification cards

| Card | Procedure and required evidence | Completion condition |
| --- | --- | --- |
| Browser zoom | On a supported headed browser, record browser/OS version and the browser's visible 200% setting; repeat Return, Memory/editor and Camp including error/recovery, with keyboard | Content reflows, controls/focus stay reachable, no essential clipping or horizontal page overflow. Keep a synthetic-data screenshot and actual zoom evidence. |
| Spoken screen reader | Record OS, browser, reader/version and Vietnamese voice; read earned/unearned entries, hide/save/retry and switch personal/shared views | Names, states and reading order understandable; status changes heard without blocking core work; no trap. Record concise observed announcements, not an assumed pass from ARIA. |
| Physical mobile | Record device/OS/browser; touch through start/check-out/Seed/editor/Camp; open keyboard, rotate, background/resume; compare static/3D and reduced motion | Drafts remain, controls stay visible, access refreshes appropriately, experience remains usable. Note timing/resource observations without inventing FPS/battery claims. |
| Target browsers | Confirm pilot browser support list, then repeat the affected core journey on each engine in scope | Supported browsers have actual evidence or separately accepted exceptions. |
| User understanding | Run the four tasks and neutral questions in the field kit only after consent and pilot gates | Report opportunity denominators, self-completion, prompts, misunderstanding and pressure; never substitute synthetic tests for user findings. |

Owners for device/screen-reader observations and the final browser support list are not assigned in this phase. These cards are ready for an operator; no request to contact participants was sent.

## Priorities and next decision

1. **Before pilot opening:** obtain narrated screen-reader, true browser zoom and target-browser evidence; finish target-environment, consent, support and release prerequisites already listed in the private pilot plan. Physical mobile evidence is needed before making a mobile usability claim.
2. **During an authorized pilot:** assess whether users understand accumulated memories, reversible decoration and shared progress. Investigate reported pressure or reward-driven checkout using the existing pause rules; do not infer satisfaction from silence.
3. **After evidence:** propose a narrow fix if a concrete blocker is found. Additional items/milestones and P4 mobile implementation are not approved by this work and should be driven by findings.

No new product defect requiring a code change was established by the completed checks. The open items are evidence gaps, not claims that those capabilities are broken. No product source, analytics, dependency, database or remote-service mutation was needed. The temporary fixture Vite server is stopped after verification. P3C dev source remains unchanged.
