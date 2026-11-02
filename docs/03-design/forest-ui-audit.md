# Pyneath forest UI alignment — 2026-10-29

The interface is quiet and scene-led: one working region, a visible forest, short copy and details opened when needed. The existing giant Pine and Marten identity carries between destinations. Scene motion remains separate from stable form and reading surfaces.

## Page audit and delivery

| Page / flow | Change | Evidence |
| --- | --- | --- |
| Landing | Existing upward canopy remains the established public introduction | Existing specialized renderer retained |
| Login / register | Sparse forest header, appearance control, compact opaque form, shared Marten artwork; no repeated footer theme control | Desktop and 320/390 mobile, password toggle, confirmation focus, retained input after error, success, protected destination restoration |
| Account initialization | Forest poster and a brief status instead of a bare old auth container | Shares authentication shell and scene lifecycle |
| Return | Existing preparation layout retained, appointments now expand on demand | Scene reuse and static poster decode verified |
| Camp list | Forest clearing, compact Camp tiles, short intro, collapsed help; create form in a modal | Empty list, create/cancel/reopen preserving name, successful navigation to Camp |
| Camp immersive | Specialized group scene preserved; task dialogs share forest surface and wood controls | Shared renderer and existing dialog behavior retained; stylesheet alignment inspected |
| Appointment list | Stream/bridge viewpoint, upcoming first, short rows, additional information on demand | Category switching and detail navigation |
| Appointment detail | Compact actions, expandable participants and timing instructions; current status/errors remain visible | Participant disclosure and invitation actions render |
| Invite | Short title with forest backdrop, clear accept/decline and visible privacy context | Ready and unavailable states, original invite tests |
| Memory | Four records at a time with previous/next, separate personal/Camp categories | Nine-record fixture, last page, category switch and empty Camp memory |
| Settings | Profile, experience/privacy, data and account groups; one native details group open at once; fields stay mounted | Draft survives closing, profile save, delete confirmation cancellation |
| Group session | Forest viewpoint, compact timer panel, participant disclosure; sound/recovery tools in persistent dialogs | Desktop/mobile tools, Escape, checkout modal |
| Solo and session ending | Existing close scene retained; modal/button surfaces align with the shared palette | Day/night at 1600/390/320/844, sound/recovery/checkout, static fallback, reduced-motion stillness |

## Shared implementation

- `ReturnScene` is the shared forest host, parameterized by `ForestPlace`. `forestPlaces.ts` supplies camera and companion choices. The standard application layout retains a single Canvas instance through navigation; only camera settings and scene props update.
- Backgrounds reuse the existing Solo model; no new GLB, library or external service is introduced. A page loads only its own poster. Hidden-tab, save-data/light mode, reduced-motion, context-loss fallback and retry behavior are retained.
- `forest-pages.css` aligns page surfaces, form sizing, primary/secondary controls, dialogs, disclosure affordances, light/dark themes and mobile composition. Theme and atmosphere controls are in the header. Dialogs inherit semantic tokens from their own forest context.
- Important errors, current session state, appointment timing, privacy context and irreversible account actions remain accessible. Disclosures reduce initial text without removing actions. No account deletion or other real-data action was performed during validation.

## Validation

- Web production build and 21 existing focused tests passed: authentication/CSRF, invite handling, route resolution and shared session/pact behavior.
- Browser fixtures exercised seven standard routes at widths 1600, 900, 390 and 320 with light/dark surfaces and no horizontal overflow. Auth was exercised separately at 1600/390/320. Screenshots: `.openai/forest-pages-qa/`.
- Additional browser checks passed: 200% text reflow, appearance bounds and Escape on mobile; one retained live Canvas through app navigation; night/rain/theme switching; context-loss retry; reduced-motion static fallback; protected destination restoration; group-session tools and checkout at 1440/390. No uncaught page errors in these suites.
- Scene poster export: all nine places and four phases, desktop/mobile, no runtime errors. Poster total is approximately 4 MiB across all places; users fetch only the current matching assets.
- Measured shared palette pairs retained from Return: secondary dark text 7.59:1, secondary light text 5.91:1, wood CTA text 8.16:1; control boundaries above 3:1. The opaque content surfaces preserve these pairs over scene imagery.

Browser checks use synthetic responses and software WebGL. Physical-device GPU performance and live production authentication have not been measured. The existing shared Three.js chunk-size advisory remains. No deployment is included.

## Composition and interaction refinement — 2026-11-02

The approved follow-up keeps the existing forest assets and makes the working interface more compact. Desktop navigation is a short, bounded region rather than a full-height wall; account actions open from the header. Below 760px, four destinations and Menu form a persistent bottom navigation. Its measured height reserves space even at 200% text, with safe-area padding and extra scroll clearance. On short, narrow viewports it hides while an input has focus.

Return now has one heading, a smaller companion greeting, and a single working column. Intention, duration and Start precede help and sound options. The appointment area is one expandable summary with its real count. Seed editing, timezone setup, active-session recovery and request behavior remain intact.

Authentication remains centered below its header. The password visibility control sits inside the input and controls both password fields during registration. Landing retains the upward Pine, sky, weather and interactive example; repeated explanatory copy is consolidated into a shorter introduction, three concise steps and a Solo/Camp section. The decorative preview arrow has a bounded, non-interactive area so it cannot intercept tablet controls.

Changed implementation files:

- `apps/web/src/app/AppLayout.tsx`
- `apps/web/src/app/app-forest.css`
- `apps/web/src/app/forest-pages.css`
- `apps/web/src/features/return/ReturnView.tsx`
- `apps/web/src/features/return/return.css`
- `apps/web/src/features/auth/AuthView.tsx`
- `apps/web/src/features/landing/LandingPage.tsx`
- `apps/web/src/features/landing/landing-forest.css`

Focused evidence:

- Browser checks at 1600, 1100, 900, 760, 759, 390 and 320px, plus 844×390: no horizontal overflow; menu Escape restores focus; final content clears the mobile navigation at 200% text. The default Return start button fits above the bottom navigation at 390×844 and 320×740.
- Authentication centering, confirmation mismatch, password visibility, recoverable errors and success passed on desktop/mobile, including short viewport and 200% reflow.
- Return fixtures passed pending/error/retry with the same idempotency key, successful session navigation, active-session recovery, seed edit/cancel/continue, appointment navigation, timezone setup and menu logout. A shortened touch viewport keeps the focused textarea visible.
- Landing anchors, interactive example, expandable answers and registration CTA passed at 1600/900/390/320px, including 200% reflow. Shared-page fixtures and live scene retention/context-loss/reduced-motion checks passed without uncaught page errors.
- Twenty focused existing tests passed across auth, route resolution, session/request behavior and the landing example. Production build passed; existing dependency annotation and shared Three.js chunk advisories remain.
- Measured palette pairs: wood CTA text 8.16:1, navigation text 8.50:1, active navigation text 8.55:1, selected duration text 7.27:1, secondary control boundaries 3.19:1 (light) and 3.21:1 (dark).

Screenshots and browser checks are in ignored `.openai/ui-refinement-qa/`, `.openai/auth-center-qa/` and `.openai/forest-pages-qa/`. Tests use synthetic accounts/data; mobile keyboard behavior is checked with reduced viewport dimensions, not a physical handset. No new dependency, model asset, backend change or deployment is included.
