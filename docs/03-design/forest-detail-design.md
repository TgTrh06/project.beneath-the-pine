# Forest detail revision — 2026-10-29

The shared Pyneath forest now uses richer stylized geometry and spatial colour variation. The existing cameras and interaction layout remain the reference for where detail is visible.

## Delivered

- Low-relief terrain with woodland colour variation and level corridors around the trail and stream. Camp clearing blends radially into the forest floor.
- Trail cross sections with a worn centre, irregular width, moss-coloured shoulders, small gravel and grass along the edges. Winding routes and bridge endpoints remain connected.
- Continuous Pine bark with additional relief, colour grain, knots and secondary roots. Conifer crowns use overlapping irregular needle masses instead of simple concentric cones. Bushes use clustered faceted volumes.
- Blade geometry for grass, scattered needles, small debris and subtle stone colour variation. Spatial detail noise does not consume the scene layout random seed.
- Bridge plank grain and lantern frame supports. Lathed flame silhouettes and embers, plus subtle animated stream ripples in clear conditions.
- Shared `MartenModel` for awake and sleeping poses: neck bib, muzzle, ear interiors, paws, claws, whiskers, eye highlights, layered tail and breathing. Return's companion image is a transparent render of the same component.
- Garment seams/buttons, cuffs and soles for Camp characters; matching coat detail in Solo. Solo's seated pose and shared sleeping Marten remain next to the roots.
- Refreshed phase posters for Camp, Solo, Return and landing, including landing overcast variants and mobile variants. Camp fallback posters contain no members.

## Implementation

`build-camp-scene.mjs` generates geometry deterministically and merges it into material batches. Geometry UV attributes are omitted because these assets use vertex colours, not bitmap textures. Detail is kept local to the shared forest; no external asset or dependency was added.

Final GLB sizes are approximately 6.67 MiB Camp, 6.31 MiB Solo and 2.93 MiB landing. Camp and Solo increased in size to carry terrain and foliage detail. Lazy loading, optional static mode and existing reduced-motion/visibility handling remain available. Physical GPU performance is not established by software rendering.

## Validation

- 16 focused tests passed: environment settings and shared renovation behaviour.
- Web build passed; the existing shared Three.js chunk-size advisory remains.
- Rendered four phases for each scene, overcast landing variants, desktop and mobile compositions; no uncaught page errors during export.
- Existing browser checks passed for Return at 1600/1280/390 with 200% text reflow, Solo at 1600/390/320/844 with day/night and reduced-motion stillness, and landing at 1600/1024/759/390/320/844 with night/rain and static fallback. Shared Camp renderer also passed.
- Images inspected at the Camp overview, Solo roots/Marten close-up and upward landing viewpoint. Browser checks use synthetic API fixtures, not production data.

This remains stylized 3D with geometric surface detail. Fine photographic fur, scanned bark textures and production-device frame-rate measurements are outside the delivered evidence.
