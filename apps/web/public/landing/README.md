# Landing forest posters

Original local renders of Pyneath's procedural forest. No third-party images, textures or models. Rendered from `LandingCanvas.tsx`, using the existing `/solo/pine-solo.glb` authored by `scripts/build-camp-scene.mjs --solo` and the procedural Marten.

`forest-{dawn,day,dusk,night}.webp`: 1600x1000.
`forest-{dawn,day,dusk,night}-mobile.webp`: 600x1000.

Eight files, 304,488 bytes total. Images contain only the decorative scene, no UI or account data. The public landing uses responsive picture sources, phase-matched fallbacks and a CSS overlay for static weather. The shared model is reused rather than copied.

Local regeneration harness: `.openai/landing-visual.cjs` (development server on port 5173; installed Edge, Playwright and Sharp). Design and validation notes: `docs/03-design/landing-3d-design.md`.
