# Return forest assets

These are local renders of the existing Pyneath scene assets, with no external imagery or new model dependency.

- `forest-{dawn,day,dusk,night}.webp`: 1600 × 1000 renders of `ReturnCanvas` using `/solo/pine-solo.glb`, the shared scene environment and Marten.
- `forest-{phase}-mobile.webp`: 600 × 680 renders using the narrow Return camera.
- `marten.webp`: transparent 264 × 216 render of the shared `Marten` component from `LodgeCanvas.tsx`, used alongside the welcome text. It does not load another WebGL canvas.

Posters are rendered with motion off and clear weather. Capture only the canvas with the application shell hidden. The static mode applies a weather tint; it does not animate rainfall. The eight posters and Marten image total 500 KiB. Use the same camera and lighting as `ReturnCanvas` when refreshing them.

The scene reuses the Solo GLB without modifying it. Loading failure, WebGL context loss, reduced motion and the light-mode preference retain a usable static background.
