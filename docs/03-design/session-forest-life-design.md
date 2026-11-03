# Session forest life — 2026-11-02

The Solo and group-session backgrounds now have a shared repertoire of ambient activity. The existing Pine, seated Wanderer, nearby Marten, terrain and stream remain the composition. This delivery does not change the timer, session API, checkout data, other page layouts or model assets.

## Experience

- Wind deforms the existing green foliage, bushes and grass with spatially offset waves and slow gusts. The brown trunk stays rooted. A matching shadow material follows the deformation; shadows refresh at a bounded frequency.
- Drifting needles, daytime dust, water-current streaks, foam, moving clouds, low mist and small lantern-light fluctuations give the scene continuous motion. Low-contrast moving shade is applied to the existing surfaces.
- One scheduled visitor/event can occur at a time: a butterfly or night moth that flies and settles, a bird that arrives/perches/preens/hops/departs, five distant flying birds, a needle shower, or a falling/bouncing pinecone. Visitors have quiet gaps; timing and the order on later rounds vary deterministically. Rain and night suppress inappropriate wildlife.
- Rain adds pooled canopy drips, alongside the existing rain and stream ripples. Drips and wet exposed surfaces decay over approximately 85 seconds after rain ends. Night/dusk adds slowly moving fireflies with independent soft pulses.
- The Solo Marten remains beside the Wanderer. It spends most of its cycle sleeping/resting, occasionally lying on its side, listening, yawning, stretching, sniffing, grooming, looking back or making a small grounded out-and-back walk. The walk combines a tangent-facing route with alternating paw motion. Existing body profiles and fur are reused. The seated Wanderer breathes, blinks, looks upward/sideways and makes a small arm adjustment.
- Optional camera drift translates the view very slowly within a small bounded range; document text and controls stay fixed. It is off by default and independently selectable.

## Preferences and lifecycle

`pyneath:session-life` stores a local `{level, drift}` preference shared by Solo and group sessions. Levels are **Tĩnh / Êm / Sinh động**. The default is lively, except an existing motion-off preference initializes to still. Gentle reduces wind strength, particle counts and visitor frequency; still stops the animation loop. Existing time, weather and light-mode preferences remain separate.

Session backgrounds animate only while the participant has an active session with time remaining, the tab is visible, motion is allowed and the renderer is available. Visible elapsed time drives activity; hidden or stopped periods do not accumulate a queue of visits. Reopening the tab resumes the scene while the session clock continues to use server time. Reduced-motion preferences, Save-Data/light mode, context-loss fallback and retry remain supported. Motion preferences are disabled where these constraints require a static scene.

## Implementation and budgets

- `forestActivity.ts`: preference parsing, gust sampling, visitor scheduling and companion activity sampling.
- `ForestLife.tsx`: reusable geometry/materials, instanced needles/dust/fireflies/drips/current/foam, pooled visitors, cloud/mist groups and optional camera drift.
- `forestMaterials.ts`: per-instance material and matching depth-shader deformation; cached GLB resources are not modified.
- `MartenCompanion.tsx`, `MartenModel.tsx`, `SoloRest.tsx`: companion activities, walking limbs, facial/ear/tail movements and seated-person animation. Torso profile attributes update only while morphing instead of rebuilding body normals every rendered frame.
- `SessionLifeControls.tsx`: shared local preference and native labelled controls.
- `SoloScene.tsx`, `ReturnScene.tsx`, `ReturnCanvas.tsx`, `LodgeCanvas.tsx`, `SceneEnvironment.tsx`, `SessionView.tsx` and `solo.css`: session-only integration, lifecycle, lighting and control layout.

Lively desktop uses at most 34 needles/dust particles and 22 fireflies; mobile uses at most 18 and 11 respectively. Gentle uses smaller pools and a render pixel ratio of 1; other session levels cap the ratio at 1.25. There are at most 24 drips, 28 current streaks and 12 foam pieces, with fewer current/foam pieces in the close Solo view. Effects reuse a sphere, cone and plane geometry. No object is spawned on an interval or added permanently as a visit finishes. No dependency, texture download or GLB rebuild is included.

## Validation

Browser evidence is stored in ignored `.openai/session-life-qa/`. The checks use synthetic accounts and software WebGL, not production sessions or physical-device GPU measurements.

- Solo and group sessions: observed live pixel changes, identical static-frame pixels with UI excluded, local preference persistence, camera control, day/rain/night, mobile reflow, reduced motion and session ending. No page or WebGL shader errors in the completed checks.
- Lifecycle: a hidden group-session tab stopped at render frame 9 and resumed afterwards. The renderer kept **37 geometries** before/after 90 manually advanced frames; the activity group retained **16 children**. Mobile pools stayed within their bounds. Camera drift restored the base view after disabling it.
- Appearance controls reflowed at 200% text; context loss switched to the poster, retry restored the renderer, and light mode removed the canvas and disabled motion controls.
- Pure activity tests sample one hour of scheduling, quiet gaps, weather/night filtering, conservative preference parsing, companion action coverage and resting-time balance. Further scene captures sample rare visitors and all companion states using a test-only intercepted module clock; no such clock hook is shipped in the application.
- All five visitor types were confirmed visible in the scene graph; ten companion state/pose captures and two sampled hours at gentle/lively completed without page or shader errors. The inspection capture uses a lower pixel ratio for software rendering.
- Twenty-nine focused tests across activity, environment, companion geometry/poses, session behaviour and realtime passed. The web production build passed.
- The flock's projected positions were checked inside the camera at desktop/mobile sizes in both session views. Existing browser regression checks also passed: retained shared canvas, time/weather/theme, context-loss retry, reduced motion, 200% reflow, protected-route restoration and group sound/recovery/checkout tools.
- `solo-night-motion.webm` is a short recording of the actual running Solo UI at normal animation time, with a synthetic session. The video does not use the intercepted test clock.

The existing shared Three.js chunk advisory remains. The new activity code adds approximately 14 KiB before gzip to that shared chunk; model file sizes are unchanged. Software rendering is evidence of rendering correctness, not a mobile frame-rate guarantee.

## Motion continuity refinement — 2026-11-02

This approved follow-up keeps the same activities and composition and removes discontinuities at their boundaries.

- `motion.ts` supplies quintic start/stop envelopes, time-based damping, shortest-arc angle damping, blink pulses, bounded frame deltas and an eased closed walking route. `motion.test.ts` checks endpoint velocity, wrap fades, damping at 30/60/120 update rates and progress preservation through repeated intensity changes.
- `forestActivity.ts` converts the current clock when changing between gentle/lively. An active visit keeps its age, and the Marten keeps its action and normalized progress. Quiet gaps change length without reselecting the current activity. Ambient particle, wind and camera time remain independent of this scheduling clock.
- `MartenCompanion.tsx` eases the walking route, damps the root quaternion along the shortest arc and advances gait phase by distance travelled. Sniffing, yawning and grooming enter/leave through soft weights. `MartenModel.tsx` blends attachment anchors with the body, places limbs between already-blended anchors/feet, and smooths blinks, ear/tail twitches and the jaw. Pausing a session companion preserves its current pose. Settled torso profiles and unchanged sleeping tails no longer rebuild their geometry every frame; scratch vectors/Eulers are reused. Shadow refresh is faster briefly during a pose transition or walk, with the existing lower cadence at rest.
- `ForestLife.tsx` fades visitors using per-group materials, smoothly changes particle population and weather/phase visibility, hides particle/current/cloud wrap endpoints, blends flying/perching wing speed with a continuous phase, softens bird preening/hops and makes pinecone impact positions continuous. A visitor made incompatible by weather fades out instead of disappearing immediately. Camera drift ramps down gradually and retains its offset through pause/resume; camera refitting applies the offset once after a viewport change.
- `LodgeCanvas.tsx`, `SceneEnvironment.tsx` and `SoloRest.tsx` smooth wind strength and lighting changes, retain frozen motion instead of resetting it, fade ripple loops and smooth the seated Wanderer's blinks. Initial wet material application is explicit. No layout, asset, dependency or session API changes are included.

Validation:

- **33 focused tests and the production build passed.** The existing dependency-annotation and shared Three.js chunk advisories remain.
- Completed browser continuity checks for Solo and group sessions: intensity switches preserve the active bird and Marten; per-frame walking translation/rotation stay bounded; camera stop is gradual; weather changes fade the visitor; still mode freezes camera/companion; mobile reflow and fixed activity pools remain intact. No page or WebGL shader errors were recorded in those checks.
- Existing shared-scene regression checks passed: one retained canvas, day/weather/theme changes, context-loss retry, reduced motion, 200% text reflow, protected destination restoration and group-session sound/recovery/checkout tools.
- Solo and group visibility checks confirmed frozen camera/render frames while hidden, a bounded first step on resume, and repeated desktop/mobile refitting without accumulated camera drift. Resize assertions wait for the renderer's actual resized viewport and effect commit.
- Before/after recordings and snapshots are in ignored `.openai/smoothing-qa/`. Both recordings use a synthetic Solo session started just before a walk and then disable camera drift. Their scene pixel ratio is reduced for software recording; they demonstrate transition behaviour, not physical-device frame-rate measurements. Browser continuity checks use a test-only clock override and direct CPU update stepping to avoid submitting hundreds of software GPU renders. Those controls are not shipped in the application.

## Session navigation refinement — 2026-11-02

Solo uses two compact controls at the top corners: a labelled back button and the shared pine/sun appearance icon. The latter combines theme, time, weather, activity, camera drift and light mode. Native fieldsets separate scene and movement settings. The forest-green surfaces, bark-coloured borders and pale text stay legible independently of the selected theme and backdrop.

`SoloScene.tsx` supplies the scene and controls to `SessionView.tsx` through a render callback, keeping both inside the existing session layout. Changing preferences retains the Canvas instance. `solo.css` contains the scoped appearance styles, safe-area offsets and scrollable panel sizing. The shared `ForestAppearance.tsx` closes on outside pointer interaction without leaving keyboard focus inside a hidden panel; Escape returns focus to the trigger.

Browser evidence is in ignored `.openai/session-nav-qa/`. Static layout checks cover 1440, 768, 699, 390 and 320 px widths, plus 844×390 landscape, both themes, 44 px targets, dismissal/focus, 200% text reflow and back navigation. Solo and Pact live checks confirm retained Canvas, continuing timer, theme/time/weather/activity/drift controls and light-mode fallback, with no page errors. Measured contrast is 11.08:1 for navigation text, 8.50:1 for secondary panel text and 4.22:1 for control borders against their surface.
