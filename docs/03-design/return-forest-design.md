# Return: a quiet place beneath the Pine

The signed-in Return screen prepares a private focus session. Its primary action remains “Bắt đầu phiên”. The visual direction is quiet, with varied composition and restrained ambient motion. The tree and Marten connect this preparation screen to the existing forest; opaque form surfaces keep input independent of scene lighting.

## Scope

- Shared signed-in header/sidebar: forest palette, wood action controls, navigation icons, appearance popover with keyboard Escape and outside-click dismissal.
- Return only: independent 3D viewpoint using the existing Solo model, a static render of Marten next to the greeting, intention/duration form, expandable sound/preset options, compact help and a supporting appointments panel.
- Standard application reminders now appear within the content area. Camp and Solo retain their existing immersive placement. Reminder failures identify the feature affected.
- The interiors of other signed-in pages retain their existing structure. No API, account, storage ownership or session lifecycle changes.

## Scene and responsive behavior

`ReturnScene` stores optional preferences under `pyneath:return-scene`. Time defaults to device time and weather to clear. Motion stops in hidden tabs. Reduced motion and save-data/light mode use local posters; WebGL failure offers a retry. The renderer shares the Solo GLB and existing environment, rain and Marten components. It is lazy-loaded and adds no dependency or new GLB.

Desktop reserves the right side for the Pine and supporting appointments. Below 901 px appointments follow the form. Below 760 px the forest becomes a 680 px-high opening behind the greeting and fades to a stable background under the form. The existing mobile menu breakpoint is preserved. Light mode uses warm paper surfaces; dark mode uses opaque forest green surfaces.

## Validation, 2026-10-28

- Existing focused unit suites: 24 tests passed (private drafts, route paths, environment and renovation behavior).
- Playwright with synthetic API responses: widths 320, 390, 759, 900, 1024, 1280 and 1600; light/dark; no horizontal overflow. Checked appearance controls, Escape/focus restoration and mobile menu navigation.
- Exercised form validation, duration/sound, reload persistence, a failed start followed by retry and successful session navigation; seed edit/save/continue/delete cancellation and confirmation; loading/error/retry; existing session; timezone setup and appointment list.
- Live WebGL: day/night, rain, context-loss fallback and retry, motion controls, theme switching and reduced-motion fallback. No uncaught page errors in the browser suite.
- Measured contrast: dark secondary text 7.59:1, light secondary text 5.91:1, wood CTA text 8.16:1. Input boundaries exceed 3:1 in both themes.

Browser checks use fixtures, not a production account. Software WebGL checks composition and behavior; physical-device GPU performance has not been measured. The shared Three.js chunk retains the existing build-size advisory.
