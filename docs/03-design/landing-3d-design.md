# Forest landing — 2026-10-27

Approved scope: redesign the public landing as a full-page forest with a giant Pine, stream, footbridge and Marten, and restyle all landing controls in wood/forest colors. Existing Vietnamese content, registration/return destinations, anchor navigation and the preset interactive example remain functional.

## Composition

The hero places the introduction and primary action on the left, with a wide forest view and the giant Pine to the right. One fixed, decorative WebGL canvas sits behind ordinary HTML. Scrolling is native; there is no camera navigation or scroll capture. Reading sections use opaque woodland surfaces in light/dark UI themes, interspersed with views of the forest. The return section uses a real render of the existing solo scene instead of the former line drawing.

Landing has its own camera and local scene preferences (`pyneath:landing-scene`). It reuses the original locally generated `/solo/pine-solo.glb` geometry and shared environment/Marten/branches without rendering a session participant or camp gathering. The scene is mirrored for composition. A camera-distance fog offset and mirrored lantern position are opt-in environment parameters; defaults preserve Camp and Solo. No new dependencies or remote assets were added.

## Controls and accessibility

- Primary actions: honey wood `#e1b77b`, dark brown text `#302318`, a lighter upper edge and short lower shadow.
- Secondary controls: pine green `#294b39`, cream text `#f4ecd9`. Selected example buttons use moss green and a visible check mark.
- All forest styles are scoped under `.landing.landing-forest`, including public menu/header/footer controls. Auth and application pages keep their existing styling.
- Native links, selects, details and the existing modal mobile menu retain keyboard behavior. Focus rings use cream over forest surfaces and dark green over light reading surfaces.
- Scene settings offer time, simulated weather, light mode and motion. Automatic time uses the device clock; automatic weather cycles every 20 minutes, with no location lookup or real-weather claim.
- Reduced motion disables decorative motion. Hidden documents stop rendering. A saved light preference or Save-Data avoids mounting the canvas. Loading/model failure/context loss retains HTML controls and a phase-matched poster, with a retry action after failure.
- Eight WebP posters cover four times of day in desktop/portrait compositions; total 304,488 bytes. Static weather is represented by a non-animated tint/haze or sparse rain overlay.

## Validation

Local Edge/Playwright with synthetic API responses; no registration or remote writes:

- Checked widths 320, 390, 759, 844, 1024 and 1600, including 844x390 landscape, without horizontal overflow.
- Checked a 640x450 CSS viewport as the reflow equivalent of 1280x900 at 200%; this is not a claim about native browser zoom or physical-phone testing.
- Mobile menu opens/closes by keyboard, returns focus, and follows section anchors. Direct `#experience` focuses the section. The preset example can select and shrink a step; FAQ expands; registration navigation unmounts the scene. Signed-in CTA points to Return.
- Reviewed day/night, rain/fog, light/dark UI, static mobile and the wooden/selected button states. Reduced-motion canvas frames were identical; animated rain and the motion switch were exercised.
- Forced a model load failure, verified static fallback and a successful retry. No unexpected uncaught browser errors in the normal flow.
- Measured contrast: primary wood 8.16:1, secondary green 8.26:1, light reading muted text 5.42:1, dark reading muted text 8.65:1. These are specific opaque pairs, not a blanket accessibility certification.
- 17 focused existing tests passed (landing preview, route paths, scene environment and membership). Production build passed, retaining the known >500 KB lazy 3D chunk advisory.
- Shared Camp scene rendered successfully with four fixture members. Solo day/night, controls, reduced motion and static fallback checks passed after the shared environment extension.

Screenshots and local test harnesses are under `.openai/landing-qa/` and `.openai/landing-*.cjs`. Real-device GPU performance, Safari/iOS and screen-reader acceptance remain unmeasured. Nothing was deployed.

## Consolidated appearance controls — 2026-10-27

Approved follow-up: the landing has one theme selector, at the top of the forest atmosphere panel. `SiteHeader` and `SiteFooter` accept `showTheme` (default true), so landing can omit duplicate selectors from its header, mobile menu and footer while auth pages retain them. The trigger is a 48px pine-and-sun SVG with an accessible name and hover/focus caption. Opening adds a small tilt unless reduced motion is requested. The panel retains its full text heading and scrolls inside short viewports.

Focused Edge validation passed for theme persistence, system/light/dark choices, Enter/Space toggle, 320/390px portrait and 844px landscape, a single landing selector, and preserved auth header/footer/menu selectors. No runtime errors. Evidence: `.openai/landing-controls-check.cjs`, screenshots `controls-*.png`.

### Navbar placement

Approved follow-up moves the atmosphere trigger into the header's action slot, immediately before the gold entry CTA. Mobile keeps the icon to the right of the logo, with the entry CTA remaining in the menu. LandingScene retains one scene/settings state and supplies the controls to SiteHeader through a render callback. The dropdown is anchored beneath the icon, scrolls within the available viewport, closes on outside pointer interaction or Escape (restoring focus), and keeps the header visible while open. Scene status/retry now appears inside the panel.

Focused checks passed: desktop alignment to the left of the CTA; panel bounds at 1200, 390, 320 and 844px; keyboard controls; outside dismissal; header visibility while scrolling; and mobile menu interaction. No uncaught browser errors. Harness: `.openai/landing-navbar-check.cjs`; screenshots `navbar-*.png`.
