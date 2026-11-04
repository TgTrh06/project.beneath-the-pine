# Personal forest P2B — A brief response from Marten

Accepted through `accept plan P2B`, 2026-11-03. This is a frontend-only addition to P1/P2A. It introduces no API, database migration, dependency, asset or reward rule. Existing-database/runtime rollout is outside this implementation approval.

## Experience

When an eligible new personal milestone is confirmed after a completed focus session, the existing Marten responds for 3.6 seconds:

| Milestone | Existing pose/action | Inline fallback |
| --- | --- | --- |
| 1: seedling | look-back / look | look-back.webp |
| 3: flowers | stand / sniff, a small curious movement | stand.webp |
| 7: lantern | stretch / stretch | stretch.webp |

The existing arrival notice gains a small static Marten illustration beside the same text and Memory link. It remains below the main Return actions or Session Seed controls. The illustration is decorative; the text carries the milestone and the link retains its accessible name. No sound, modal, reward-claim action, mood meter, streak or absence penalty is added. All outcomes and durations retain P1's equal treatment.

## Playback rules

Playback is optional, account-local feedback. The forest journal remains the durable record.

- Only Return can enable a 3D response, with motion on, visible tab and no light/reduced-motion/context-loss fallback. Session and other routes cannot enable it.
- The account provider must already have a personal-forest baseline. Historical initialization cannot start a response.
- A completion read has a 3.6-second freshness window from the first pending source-session request. Overlapping reads for that source do not extend it. A failed latest read disables that pending response; a later retry can still recover the notice and memories.
- A newly observed threshold is consumed even if unavailable, hidden, late or static. Enabling motion, revisiting Return or restoring WebGL does not queue/replay it.
- Once started, the reaction expires at a fixed monotonic-clock deadline 3.6 seconds later. Refreshes and preference updates do not restart it. A loading scene can show only the unexpired portion; a scene that becomes available after expiration shows normal ambient behavior.
- Leaving Return, hiding the tab, disabling motion, switching to a static scene or dismissing the notice cancels the active response. Changing accounts discards all state. At most three consumed threshold markers are held in memory; nothing is persisted in localStorage or synchronized between devices.
- A milestone observed while a session is still displayed uses the static notice. Returning later does not start a deferred response, and Seed editing remains independent.

P1's discovery semantics remain best effort: if an unrelated background read discovers a milestone before its completion-source read, it may enter the journal without an arrival notice. P2B does not change focus lifecycle or durable memory calculation to guarantee decorative playback.

## Implementation and accessibility

`forestReaction.ts` owns the small reducer and pose mapping. The account-keyed `PersonalForestProvider` owns its state and one cleanup-managed expiration timeout. `ReturnScene` declares playback eligibility; `ReturnCanvas` passes the explicit pose/action to the already mounted Marten. The model's existing frame callback and pose interpolation do the movement. Ambient behavior resumes after expiration; the model, materials and geometry are not remounted for the reaction.

No additional Canvas, render loop, light or 3D object is introduced. Existing scene motion/visibility settings remain authoritative. The inline illustration uses existing rendered WebP files, a fixed 64px box (48px on narrow screens), existing colors and a wrapping text column. It adds no focus stop or live-region duplicate; the original status text and link remain functional with keyboard and increased text size.

See [P2B verification](../07-testing/personal-forest-p2b.md) for implementation checks, browser evidence and limits.
