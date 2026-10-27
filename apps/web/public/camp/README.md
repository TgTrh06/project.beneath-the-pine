# Forest Camp assets

Original assets authored for Pyneath. The reference informed the feeling of people sitting together; the implemented setting is outdoors under a large tree, around a campfire.

- `pine-camp.glb`: approximately 2.06 MB. Ground, giant ancient Pine with a continuous 29-unit trunk, nominal 4.8-unit base diameter plus root flare, curved buttress roots, layered forest, receding trail crossing a small arched timber footbridge, stream, stones, grass, shrubs, mushrooms, log seats, firewood, lanterns and personal objects. Geometry merged into 43 material batches with identical vertices deduplicated while retaining normals and vertex colours. No external textures or model licenses.
- `camp-poster-{dawn,day,dusk,night}.webp`: 57–78 KB each, empty-clearing renders for the four times of day. `camp-poster.webp` is the 72 KB dusk emergency fallback. No HTML overlay, member names or avatars are baked into these shared assets.
- Source: `../../scripts/build-camp-scene.mjs`. Run `node apps/web/scripts/build-camp-scene.mjs` from the repository root with the approved web dependencies and Node 22+.

Wanderers, Marten, flames, embers and moving branch groups are code-authored meshes in `src/features/camps/scene/LodgeCanvas.tsx`. Membership controls the avatars; no online presence or private task data is inferred.

To regenerate posters, render an empty Camp with reduced motion, clear weather and each explicit time choice, with the default desktop camera. Hide all HTML overlays and the `.camp-lodge::after` scrim before capturing the canvas region; an element screenshot can still include overlapping DOM. Export WebP at 1600×1000 and copy the dusk variant to `camp-poster.webp`. Visually verify every image contains only the scene. The forest's time and weather are independent of the app theme; task panels follow semantic theme colours.

`SceneEnvironment.tsx` supplies light/fog transitions, rain and water ripples. `environment.ts` defines local time phases and simulated weather. Rain uses 220 line segments and 14 ripples, no downloaded textures, weather service or location access. Light mode uses the selected time poster with static cloudy/rain/fog treatment.
