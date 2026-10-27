# Pyneath solo — a private place under an ancient pine

Approved on 2026-10-27. This applies to an authorized `solo` session after it has started. The intention/duration form on Return and the Pact session remain their existing flows.

## Scene and hierarchy

A single Wanderer sits between the giant Pine’s roots, leaning back with one leg extended, one knee loosely bent, hands resting on the thighs and gaze turned toward the forest. Marten curls up immediately beside the legs with its head lowered and eyes closed. The desk, stool, notebook, cup and backpack have been removed. A small ground lantern lights the pair at night. The close, lower orthographic camera frames both companions and the massive roots on desktop and mobile; the wider forest remains peripheral.

The intention is at upper left, return navigation above it, display controls at upper right, and a visible countdown in the open space above the seated pair. Sound, recovery and checkout actions sit in a bottom dock. Sound/recovery use native modal dialogs: side panels on desktop and bottom sheets on mobile. Closed tool dialogs stay mounted so closing the sound panel does not pause playback or clear its settings. Escape restores focus to the initiating control. A break reminder remains visible outside the recovery panel.

When the session ends, the existing private Open Seed form appears over the forest. A server end while editing checkout preserves the draft, closes the checkout dialog and moves focus to the ended heading. Graphics failures, light mode and reduced motion never disable the timer or checkout. The countdown continues using the existing server snapshot and performance clock; scene animation never drives session time.

## Shared environment and data boundaries

The solo variant reuses the lazy forest renderer and existing daylight/weather components. It loads `solo/pine-solo.glb`, uses a closer camera and draws one fixed generic Wanderer, Marten and wind branches. It omits the hearth and its light, using the real lantern position instead. Intention, private drafts, account ID and session times are not passed to the 3D renderer or baked into poster assets.

The scene preference key is `pyneath:solo-scene`; on first use it inherits Camp preferences if available. Subsequent changes are independent. Day/night follow the device clock by default, with manual time and simulated weather overrides. Light mode uses separate time-matched solo posters. Save-Data, reduced motion, hidden-page rendering, a loading timeout and a retryable error boundary follow the existing Camp behavior. Animation stops when the solo session ends. Audio remains explicitly user-started and independent of simulated weather.

`SceneBoundary.tsx` is shared with Camp; the model generator's `--solo` mode reuses forest geometry and outputs only the solo asset. No API, schema, dependency or deployment changes.

## Files

- `features/focus/SessionView.tsx`: conditional solo layout and tool-panel placement, preserving the existing business handlers.
- `SoloScene.tsx`, `SoloToolPanel.tsx`, `solo.css`: environment lifecycle/settings, persistent native dialogs and responsive overlay.
- `Soundscape.tsx`, `StuckRecovery.tsx`: optional solo copy and embedded recovery mode; prior unrelated edits preserved.
- `features/camps/scene/LodgeCanvas.tsx`, `SceneEnvironment.tsx`, `SceneBoundary.tsx`, `SoloRest.tsx`: shared renderer variants, lantern lighting and the solo resting poses.
- `scripts/build-camp-scene.mjs`, `public/solo/`: original model and four static fallback assets.

## Validation

Local browser fixtures only; no live sessions or remote writes. Checked 1600×1000, 1280×900, 390×844, 320×740 and 844×390. A 390×440 reduced viewport exercises a focused textarea and panel scrolling.

- A selected sound keeps playing after closing/reopening its panel. Browser audio is stubbed for deterministic lifecycle assertions, not a claim about acoustic quality.
- Recovery microstep, Open Seed draft and short-break state survive panel close and reload. The focus clock continues.
- A terminal realtime snapshot while editing checkout closes the dialog and preserves the typed seed. Saving it returns to Return.
- Checkout sends the expected outcome/seed payload once. A 409 leaves the draft intact, including after reload/reopening. Offline sync/retry does not erase recovery text.
- Light mode has no canvas; time-matched posters load. Forced model failure leaves checkout usable. Day/night, rain and mobile settings inspected.
- Pact still shows its legacy presence/actions, and the 8-member Camp still renders through the shared renderer.
- 28 existing focused tests passed: environment/static scene/membership (11), server-clock/checkout semantics/private drafts and related invariants (17). Production build passed with the known >500 KB lazy-renderer advisory.

Physical phone frame rate, Safari/iOS, screen-reader acceptance and actual audio playback remain unmeasured. No claims of live-backend validation or deployment.

## Resting pose refinement — 2026-10-27

Explicitly approved follow-up. Solo now has a separate ground-seated character pose with slight breathing and slow head movement. Marten has a curled sleeping pose and subtle breathing; reduced motion resets both to their rest transforms. Camera span reduced from 12 to 8 units on desktop and 7.8 to 4.2 on mobile, with a lower view aimed at the roots. Removed the old work-area clearing and furnishings; repositioned the lantern and its light beside the pair. Model is approximately 1.63 MB / 24 material batches; regenerated all four solo posters (30–47 KB). Session state and Camp poses remain unchanged.

Refinement validation: day/night captures reviewed at 1600x1000, 390x844, 320x740 and 844x390. The short landscape camera aims lower to keep Marten above the action dock. Audio/recovery/checkout controls remained accessible; reduced-motion canvas was still across frames, and the static fallback loaded without WebGL. No uncaught browser errors; production build passed with the existing lazy chunk advisory.
