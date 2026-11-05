# Personal forest P2B — Implementation verification

Date: 2026-11-03. Authorized by `accept plan P2B`. This phase changes the web client and documentation only. No API behavior, database migration, model/image asset, dependency or environment configuration changes are required. No P2B rollout or existing-database mutation was performed as part of this verification.

## Scope and automated checks

See [P2B design and playback rules](../03-design/personal-forest-p2b.md). Main changes: the account-local reaction reducer/timer in personal memory, Return-scene eligibility, explicit pose/action through the existing Marten, and the static illustration in the existing arrival notice.

The web suite passes 89 tests across 21 files. Ten new reducer/pose cases cover all milestone mappings, fixed lifetime, duplicate refresh/expiration, ineligible and hidden arrivals, historical initialization, late/retried responses, interruption without replay, stale timeout protection, repeated completion versus a new session, dismissal and bounded account-local state. Existing 79 web tests remain passing.

Web TypeScript lint and production build pass. Existing Rollup warnings about Zod annotation comments and the shared Three chunk remain. API tests are not repeated for this frontend-only change.

## Browser evidence

Real React and Three UI run in headless Edge at isolated Vite port 5174, with synthetic HTTP fixtures and the realtime connection disabled. No live user account or existing database is used. The fixture closes sessions through the actual UI and preserves the same contract/Seed flow; timer completion is supplied as a server snapshot rather than waiting five real minutes.

Local scripts and results are retained in ignored `.openai/p2b-ui.cjs`, `.openai/p2b-edges.cjs`, and `.openai/p2b-validation/`.

- For milestones 1, 3 and 7: start/close a session through the UI with the stuck outcome, save Seed, observe the matching static image and explicit 3D action, then observe return to ambient behavior.
- Refresh while reacting, reload afterward, visit Memory, save a different arrangement and return: no replay. Seed remains saved.
- 320, 390, 768 and 1440px, both light/dark themes: reduced-motion/light-mode notice remains usable; 200% text has no horizontal page overflow; keyboard activation of Xem dấu chân opens the journal. Images are decorative and text/link remain the information channel.
- Route exit, hidden-tab event, motion off/on and WebGL loss/recovery terminate active playback without resuming it.
- A completed-session snapshot while Session remains open shows the static notice; the Seed editor stays usable and returning afterward does not queue a 3D reaction.
- A 4.5-second memory response, failure followed by retry, and arrival while hidden all preserve static feedback without late playback. Retrying memory leaves the current focus draft intact.
- Logout/account switch removes the old notice and reaction; the new account can receive its first milestone response independently. Browser timeout instrumentation observes at most one provider expiration timeout and zero after cancellation/expiration.
- With motion disabled, the renderer frame counter remains unchanged over a one-second observation after scene loading settles; enabling motion does not replay the consumed arrival.
- The arrival notice was visually reviewed at 320px in both themes. Computed text/background contrast is 8.67:1 for the message and 5.47:1 for its link in both themes. Main and supplementary browser runs report no uncaught page errors.

## Rendering measurements

At 1280×900 with motion enabled, measured total geometry/draw-call counts during milestones 1/3/7 are 47/119, 53/125 and 58/130. The total geometry counts after each response match their during-response counts. The exact geometry UUIDs used by every Marten mesh are also unchanged, demonstrating reuse rather than remounting. These counts describe the animated test configuration, not an FPS or physical-GPU benchmark.

The implementation adds no Canvas, geometry, material, light or per-frame callback. It overrides pose/action through the existing model and restores ambient behavior at expiration. The account provider owns only one expiration timeout; cleanup runs when canceled, replaced or unmounted.

## Limits

This is implementation validation with controlled browser/server responses, not a P2B live end-to-end rollout. Existing P2A dev rollout remains documented separately. P1's best-effort arrival discovery is preserved: a background read can discover a milestone before the completion-source read, in which case the durable journal can update without an arrival notice. Nothing depends on decorative feedback to save Seed or earn a milestone.

Visibility and WebGL interruption checks use browser-dispatched events with controlled restoration. No claim is made of retention improvement, cross-device exactly-once animation, physical mobile performance or a screen-reader speech walkthrough. Light/reduced-motion/context-loss modes deliberately retain static feedback.

## Subsequent dev rollout

The separately authorized [P2B + P3A local dev rollout](personal-forest-p2b-p3a-dev-rollout.md) completed on 2026-11-03. It adds real API/browser/database evidence, verified backup/cleanup, current runtime status and observed limitations.
