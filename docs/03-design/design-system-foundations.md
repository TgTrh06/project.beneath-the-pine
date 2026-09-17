# Design System Foundations

- Use warm white with forest-green primary actions and chestnut secondary details. Vermilion is no longer part of the approved brand palette.
- Every timer state has text and accessible controls; color/audio/animation never carries state alone.
- Support keyboard navigation, visible focus, 320px web layout and reduced motion.
- Reserve visual density for Return Card and active session; Circle/forest surfaces remain calm and secondary.
- Build responsive components with mobile information hierarchy so future native UI can share semantic states, not CSS.

## Light and night themes

Semantic tokens live in `apps/web/src/shared/styles/renovation.css`. Light uses #FAFAF7 paper, #304B38 forest for primary actions, and #875438 chestnut for secondary details. Night uses #202521 charcoal-moss paper, #A6B99A sage for primary actions, #D29A70 chestnut for secondary details, and #F1F0E9 text. `--wash` separates larger areas with a near-neutral tint; `--surface-warm` is reserved for Open Seed and small warm moments. Foreground-on-accent is separate from surface color. Theme follows the device by default with browser-local light/dark overrides applied before React renders. No backend profile preference is implied.

Public header, footer and landing content share a centered `min(1360px, 90vw)` canvas; reading copy stays around 680px. The signed-in Wanderer workspace uses a full-width, 68px sticky navbar above a 224px left navigation rail and a flexible main area. Main content is capped at 1120px with 32–48px desktop gutters, while reading-focused elements retain their narrower measures. The rail remains visible from 1024px upward; below that, its destinations move into the existing menu dialog. Tablet gutters are 24px and mobile gutters are 16px. The app footer aligns with the main area. These are Pine's responsive layout targets, not asserted YouTube CSS measurements.

Use spacing and surface tone before borders. Keep hairlines for inputs, meaningful list/table separation, visible focus, and the top rail of the interactive example where Marten rests its paws. Controls use about 6px corners, cards 8px, dialogs 10px; avoid hard offset shadows. SVN-Engine is for prominent display headings, while navigation and smaller headings use Be Vietnam Pro. Touch controls are at least 44px. Motion uses small 160–320ms translations/scales with reduced-motion equivalents. Focus sessions remain still; timers never reset when reconnecting. Marten retains its own chestnut illustration colors in both themes.

See [delivery contract](ui-renovation-delivery.md) for state/API boundaries and validation evidence.
