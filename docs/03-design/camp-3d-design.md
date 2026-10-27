# Camp 3D — dưới cây tùng, quanh lửa trại

Revised concept explicitly approved on 2026-10-27. The reference is for people gathering together. The setting is outdoors under a large conifer, around a campfire. The scene covers the entire Camp viewport with task UI overlaid on it.

## Composition and interaction

- A giant ancient Pine to the left shelters the clearing. Its trunk is 29 scene units tall with a nominal 4.8-unit base diameter plus root flare (previously 10.4 tall / 1.36 diameter); Wanderers and the campfire keep their existing sizes. The trunk uses one continuous surface with longitudinal bark relief and colours, with no stacked cylinder joints. Curved buttress roots flow around the seat clearing. Its canopy continues beyond the upper viewport. Staggered conifers, a narrowing continuous trail and a stone-banked stream extend beyond the frame; small conifers fill visible gaps between the taller trees. There is no cabin, round dining table, platform edge or bordered scene card.
- Eight log seats surround the stone-ringed fire. Members are distributed across opposite seats before filling adjacent seats. Articulated Wanderers breathe and shift their heads subtly; Marten rests beside the roots. The fire, sparse embers and small branch groups animate. The cool forest contrasts with warm firelight. The lowered camera and a soft warm frontal light reveal the enlarged trunk; smaller background trees and stronger distant fog reinforce its scale.
- A fixed orthographic camera frames the gathering; narrow screens use a tighter horizontal span. The scene occupies 100% of the viewport, including the space formerly used by application navigation.
- The Camp name and back navigation sit at the upper left. Display controls and the app menu sit at the upper right. A compact bottom dock opens the Pact composer, member selection, Pact list and management.
- Tasks open in a right-side modal panel on desktop and a bottom sheet on mobile. Closing a panel returns to the full scene. The app menu retains navigation, theme selection and logout. No form is permanently laid over the clearing.
- `CampPanel` uses a native modal dialog for focus trapping, Escape and focus restoration. Destructive actions retain their separate confirmation dialog. Draft state remains in `CampView` when a panel unmounts. Mobile panels scroll internally and adapt to reduced viewport height.

## State and data boundaries

`CampView` retains API calls, membership permissions, private draft handling, retries, repeat-Pact recovery and existing management actions. `CampLodge` (internal component name retained) manages renderer availability, local graphics settings, the HTML roster and bottom controls. `LodgeCanvas` receives membership and selection, renders the scene and emits callbacks; it does not query business APIs or subscribe to session presence.

Avatars represent membership, not online status. The overlay and member panel say this explicitly. Appearance uses a deterministic palette index. No intention, Open Seed, private task text or activity measurement reaches the renderer or shared poster. Self-selection, stale IDs and selection while archived/busy are rejected. The roster and form update the same selection state.

Rendering is lazy. The selected time's static forest poster stays visible until the GLB is ready. Light mode never mounts WebGL and survives reload through `pyneath:camp-scene` (light, motion, time and simulated weather preferences). Old preferences receive compatible defaults. Save-Data defaults to light mode. Reduced-motion preferences and archived Camps suppress animation. Hidden tabs stop the render loop and automatic environment timer. Failure, a 20-second loading timeout or context loss returns to the poster. Retrying uses a fresh model URL so a cached rejected loader promise does not prevent recovery. Denied Camps render recovery controls without a scene or membership.

## Files and assets

- `apps/web/src/app/AppLayout.tsx`: immersive shell only for the Camp route.
- `apps/web/src/features/camps/CampView.tsx`: overlay identity and task-panel state around existing business UI.
- `apps/web/src/features/camps/scene/`: renderer, overlay controls, native panel, selection adapter, CSS and tests.
- `apps/web/scripts/build-camp-scene.mjs`: deterministic original forest model source.
- `apps/web/public/camp/pine-camp.glb`: approximately 2.06 MB, merged into 43 material batches with identical vertices deduplicated.
- `apps/web/public/camp/camp-poster-{dawn,day,dusk,night}.webp`: 57–78 KB each, rendered without member avatars or HTML; `camp-poster.webp` is the 72 KB dusk fallback.

The original cabin GLB and poster were removed. The forest uses locally authored geometry/materials with no external models or paid services. The existing Three.js/React Three Fiber dependencies are reused. The dynamic renderer chunk is approximately 0.988 MB / 0.268 MB gzip and triggers Vite's >500 KB advisory; it is lazy-loaded. Pixel ratio is capped at 1.5; shadows update when the model/membership changes or at most four times per second during an eight-second lighting transition. Ambient animation does not rebuild the static model.

## Validation

Browser checks use intercepted local API fixtures; names in screenshots are synthetic. No remote Camp/account data was changed.

- Camp covers the viewport with no sidebar/header or permanently visible form.
- Member selection works with keyboard; Escape closes the panel and restores focus. Selected people and duration survive closing and reopening the form. A simulated Pact 409 preserves the draft and sends the expected participant and duration payload.
- Management confirmation opens separately; Escape returns first to management, then the scene. Pact list and app menu remain accessible. Night-theme panel visually inspected.
- Light mode persists without mounting a canvas. Blocked model loading falls back; recovery via retry keeps the selection. Reduced motion yields identical canvas screenshots across frames.
- Archived Camp retains all eight member labels with selection and new Pact creation disabled. Access denial shows a recovery destination without the scene. One-member Camp cannot submit a Pact without an invitee.
- Desktop and mobile screenshots reviewed. Checks cover 320×740, 390×844, 844×390, 800×1000 and 1280×900, plus 1600×1000 scene captures. No outer page overflow; panels fit the viewport. A focused mobile date field remains reachable after viewport reduction to 390×440.
- Web suite: 48/48 tests passed after the revision, including static fallback/overlay and membership-selection boundaries.

Targets of 30 FPS on a midrange phone and 50–60 FPS on desktop remain physical-device targets, not measured claims. Headless software WebGL is suitable for functional/visual verification, not battery or thermal certification. Safari/iOS, real mobile keyboards, screen readers and live-backend end-to-end acceptance remain release checks. Vite's chunk advisory and the pre-existing duplicate app-shell key warning remain documented; the normal scene path produced no new uncaught runtime error. Forced model failure intentionally exercises the error boundary.

No API/schema/migration/deployment change. To revert, remove the immersive Camp branch and scene integration while preserving unrelated in-progress edits. No data rollback is required.

## Giant Pine refinement — 2026-10-27

Explicitly approved visual-only change. Main trunk width increased approximately 3.5× and height approximately 2.8×; crown extends beyond the screen. Asset/poster regenerated. Inspected 1/8-member scenes on desktop and narrow mobile, checked roster access and page overflow, and rebuilt the web app. No dependencies, business state or API behavior changed.

## Continuous trunk and forest depth — 2026-10-27

Explicitly approved follow-up: replace the three offset trunk cylinders and interrupted bark strips with one tapered, gently bending mesh, continuous relief and vertex colours. Circumference seam normals are averaged. Roots use curved tapered tubes. The trail and stream are sampled continuous ribbons extending to roughly 89 units behind the clearing, beyond the viewport and fog. Stream reflections are static, sparse strokes; there is no additional animation or motion preference to manage. Four staggered forest layers and smaller visible conifers add depth; fog now fades from 22 to 68 camera units. Camp camera, member sizes and overlay interactions are unchanged.

Model and member-free poster regenerated. Browser fixture checks passed for 0/1/8 members with no uncaught page errors; reviewed 1/8-member desktop (1600×1000) and mobile (390×844, 320×740) captures, including roster access and page fit. Vertex deduplication reduces the expanded scene from approximately 5.26 MB to 1.96 MB while preserving material boundaries and normals. Physical-device frame rates remain unmeasured.

## Footbridge across the stream — 2026-10-27

Approved addition at the near stream bend: a 3.1-unit timber footbridge, 17 gently arched planks, two supporting beams, low open handrails and bank-supported posts. The approach ends at the near landing; a separate departure trail starts at the opposite landing and continues into the forest beyond the frame. No dirt ribbon crosses the water underneath the bridge. Nearby bank stones and tree canopies are cleared from the landings and the camera's view of the far exit. The mobile crop continues to prioritize the gathering; the bridge is a peripheral landscape detail, not an interactive control.

Regenerated the model and member-free poster. Desktop and narrow mobile fixture checks for 1/8 members pass with roster access, no overflow at 390 px and no uncaught page errors. The web production build passes with the existing lazy renderer chunk advisory. No runtime component, API, dependency or membership behavior changed.

## Time and simulated weather — 2026-10-27

Approved environment system, controlled from Hiển thị. Time choices are device clock (default), dawn, day, dusk and night. Local artistic phase boundaries are 05:00/07:00/17:00/19:00, not geographic sunrise times. Weather choices are clear (default), cloudy, light rain, fog and automatic. Automatic weather follows a repeatable clear/cloudy/rain/cloudy/fog/clear cycle with 20-minute slots. A 30-second timer checks automatic choices while the page is visible. No location, external weather API, sound or backend state is used.

Sun/moon direction, colours, hemisphere light, fog, lanterns and fire intensity transition together over eight seconds. Rain fades in/out with the lighting. Its 220 line segments avoid the clearing and Pine footprint; 14 expanding rings mark the stream surface. Exposed earth/bridge/rock materials darken and become less rough during rain, using cloned materials so cached assets are not modified. Reduced motion, motion-off and archived states snap to the selected environment and hide animated rain/ripples. Hidden tabs freeze motion and resynchronize automatic time when visible again. The static mode represents weather with a tint or fog veil rather than particles.

Validation: 11 focused tests passed for settings compatibility/validation, local time boundaries, automatic weather slots, membership boundaries and static UI. Browser fixtures exercised all 16 explicit time/weather combinations with 1 and 8 members, preference persistence, reduced-motion stillness, 320/390 px controls and roster access, light-mode persistence, live rain, hidden-tab pause/resume and environment controls after forced model failure. Final desktop and narrow-mobile visuals reviewed. Production build passed; physical-device FPS and Safari/iOS remain unmeasured.
