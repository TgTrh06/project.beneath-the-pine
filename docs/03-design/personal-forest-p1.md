# Personal forest P1 — 2026-11-03

## Scope and experience

Approved P1 adds persistent, private forest memories to Pyneath. The existing mobile focus ritual stays the primary action. Expression is quiet, layout follows the existing woodland pages, and the new progression itself is static. P2 decoration placement and companion reactions, and P3 Camp progression, are not included.

| Completed sessions | Memory | Scene change |
| --- | --- | --- |
| 1 | Mầm cây đầu tiên | A small two-leaf seedling beside the Pine |
| 3 | Một khoảng hoa | Three flowers beside the seedling |
| 7 | Ánh đèn thân quen | A small lantern marking the same patch |

These are cumulative session thresholds, not consecutive days. Every checkout outcome and duration contributes equally once the session is completed; cancellation does not. A Pact counts after the whole session closes. No absence penalty or reward collection button exists. Earlier eligible history contributes on first load.

Return keeps the start/resume action first and adds a compact forest summary beneath it. A newly observed milestone after checkout produces a small inline notice with a link to Memory. Auto-ended sessions can show the notice below Seed controls without blocking them. The personal Memory tab shows earned dates and unearned possibilities with no progress countdown, urgency or forced task. Camp memory retains its existing separate tab and authorization.

## Rendering and states

The Return and Memory 3D scene uses a fixed geometry patch: 3 meshes at the first stage, 9 at the second, 14 at the third. There is no per-frame handler, additional light, shadow caster, texture, remote asset or random spawn. Existing scene lifecycle, retained Canvas, light mode, reduced motion and context-loss fallback remain responsible for rendering.

An inline SVG and text show the same earned stage in Return and Memory, including when 3D is unavailable. Unearned journal rows explicitly say when they will appear; color and imagery are never the only status indicator. Existing typography, forest colors, keyboard focus and mobile navigation are reused. Personal progress uses independent loading/error/retry states, preserving focus input and Seed drafts.

## Evidence

Synthetic browser screenshots and measurements live in ignored `.openai/p1-forest-qa/`; they contain no real user work. Backend checks used a separate PostgreSQL 17 container on port 5544. The existing local/pilot database was not migrated and nothing was deployed.

- Workspace `pnpm lint` passed, including the API import-boundary check. Workspace `pnpm build` passed; the web production build was repeated after the final scene-position adjustment and passed. Existing Zod annotation and shared Three.js chunk-size advisories remain.
- Web: 19 files / 76 tests passed. The affected API suites (personal memory, core PostgreSQL lifecycle, privacy and HTTP foundation) passed 19 tests with no skips. The new personal-memory suite accounts for seven of those, including its parent test. It exercises both a forward migration with existing history and fresh migrations in the companion suites.
- Browser fixtures: Return and Memory at 320, 390, 768 and 1440 px, both themes, explicit earned/unearned states, Camp/personal switching, static mode and 200% text reflow. No horizontal overflow or uncaught page errors in the completed checks. Keyboard activation of the memory link reaches the journal.
- A failed memory request preserved the intention draft and left the start button usable. Retrying restored the forest. A `stuck` checkout saved its Open Seed and showed the first milestone; navigating/reloading did not replay the notice. Signing out and into another synthetic account cleared personal progress. Timer reconciliation showed the third-session milestone while the Seed save remained usable.
- WebGL context loss retained the static earned mark and the main form. All four stages were rendered at desktop/mobile sizes; navigating between Return and Memory retained the Canvas and geometry counts. Final visual inspection moved the patch into the exposed area to the right of the Pine so desktop forms do not cover it. On narrow screens the inline mark carries progress where content covers the background.
- At a fixed 1280×900 software-rendered scene, baseline was 110 draw calls / 214,736 triangles; stages 1/3/7 were 113/119/124 calls and 214,920/215,040/215,112 triangles. Stage 7 adds 14 calls and 376 triangles; there is no growth over repeated page navigation. These are structural rendering measurements, not physical mobile FPS evidence.
- Measured foreground/background contrast for the new summary, journal and notice text/link pairs is 5.47:1–11.87:1. The SVG is decorative and each stage/status also has text. A real screen-reader speech walkthrough and physical GPU/battery measurements were not performed.

The browser scenarios use synthetic HTTP fixtures with the real React/Three.js UI; the Nest HTTP/authorization and persistence checks run separately against PostgreSQL. This is not a deployed end-to-end pilot or evidence of retention improvement.

## Product follow-up

The separately authorized local dev migration and live end-to-end verification completed on 2026-11-03. See [dev rollout evidence](../07-testing/personal-forest-dev-rollout.md) for backup/restore checks, `0003 + 0004`, real API/browser scenarios, cleanup and remaining limits.

Pilot evaluation should measure whether people return to start another session and whether this feels motivating or pressuring. P1 does not add analytics events or private-work telemetry. Neither retention gains nor physical-device frame rates are established by implementation tests.
