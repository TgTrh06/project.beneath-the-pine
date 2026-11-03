# Shared forest page posters

Locally rendered from `ReturnCanvas.tsx` using the existing Solo forest GLB. No user data, text, UI or external imagery is embedded.

- Places: return, auth, camps, pacts, pact, invite, memory, settings and session.
- Phases: dawn, day, dusk and night.
- Desktop: 1600 × 1000; mobile: 600 × 680.
- 72 WebP assets total 4,185,948 bytes. A page loads only its matching phase/viewport poster. Shared forest geometry is cached and reused between places.

Camera settings live in `forestPlaces.ts`. Render with clear weather and motion disabled, hide every DOM overlay, capture the canvas and encode at WebP quality 86. Mobile uses the same close Pine framing across places to leave a readable lower document area. Static rainy/cloudy/foggy conditions use the existing tint layer. A shared preference under `pyneath:return-scene` controls time, weather, light mode and movement throughout these pages.

Landing, immersive Camp and Solo retain their specialized scene and poster families. This set covers public authentication, standard signed-in pages and group-session panels.
