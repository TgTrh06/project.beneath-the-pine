# Landing forest posters

Original local renders of Pyneath's procedural forest. No third-party images, textures or models. Rendered from `LandingCanvas.tsx`, using `/landing/pine-landing.glb` authored by `node apps/web/scripts/build-camp-scene.mjs --landing`. The landing variant contains the ancient Pine and an irregular ring of tall surrounding trees, with no bridge, paths, stream, lantern, Marten or small ground decorations. Camp and Solo models are generated separately with their own viewpoints.

`forest-{dawn,day,dusk,night}.webp`: 1600x1000.
`forest-{dawn,day,dusk,night}-mobile.webp`: 600x1000.

`forest-{dawn,day,dusk,night}-overcast{,-mobile}.webp`: matching desktop/portrait sizes, with no sun. These are used for cloudy/rain/fog static states; CSS adds the rain/fog treatment.

Sixteen posters, 943,354 bytes total; landing GLB: 3,073,856 bytes. Images contain only the decorative scene, no UI or account data. The public landing uses responsive picture sources, phase- and weather-matched fallbacks and a CSS overlay for static weather. The perspective camera is 1.8 units above the ground and looks almost vertically upward into a canopy (64-degree vertical FOV on desktop, 66 on portrait). The 42-unit landing Pine tapers from the bottom edge toward its crown. Eleven surrounding trees enter from the frame edges, leaving irregular sky openings. Closed foliage masses can be viewed from underneath; soft upward fill keeps the undersides readable. No ground is visible in the intended composition. Portrait viewports have their own camera position.

Local regeneration harness: `.openai/landing-visual.cjs` (development server on port 5173; installed Edge, Playwright and Sharp). Design and validation notes: `docs/03-design/landing-3d-design.md`.

The sky is generated locally by `LandingSky.tsx`: a blue gradient dome, procedural drifting clouds with soft shaded edges, and a small solar disc/halo behind the tree geometry. Sun direction is shared with the landing light through `canopySky.ts`. Night and non-clear weather hide the solar disc. Clouds stop with reduced motion, the motion switch or an inactive page; light mode mounts only a poster. No new dependencies or downloaded textures.
