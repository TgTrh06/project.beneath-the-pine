# P3C — Camp reflow and accessibility

Accepted through `accept plan P3C`, 2026-11-03 (Asia/Saigon). Implementation and isolated UI verification are complete. This approval does not include rolling P3C onto the existing dev runtime.

Subsequent delivery: [P3C local dev rollout](camp-layout-p3c-dev-rollout.md) was completed under the separate `accept plan rollout P3C dev` authorization. The implementation-stage isolation and handoff notes below describe the state before that rollout.

## Delivery location

The current uncommitted P1–P3B working tree was copied onto branch `codex/p3c-camp-reflow` in `.openai/p3c-worktree`. The primary repository's source files were fingerprinted before work and verified unchanged afterward. Existing dependencies are shared through local junctions; no dependency was installed or changed. The candidate was served on temporary port 5174 with synthetic API fixtures, without accessing or modifying the dev database.

Only four application files differ from that copied baseline:

- `apps/web/src/app/AppLayout.tsx`: a normal-flow Camp navigation row containing the existing back and Menu actions.
- `apps/web/src/features/camps/CampView.tsx`: pass identity and feedback into the Camp content layout.
- `apps/web/src/features/camps/scene/CampLodge.tsx`: group identity and display controls above the existing dock and progress, retaining the same scene component.
- `apps/web/src/features/camps/scene/lodge.css`: content-driven layout, one page scroll area, wrapping controls, readable text backing and Camp-scoped fixed scenery.

Documentation adds this report and its testing-index entry. No API, contract, migration, asset, Canvas implementation, reward rule or personal-arrangement change is included. No commit or push was made. Earlier P1–P3B changes in the worktree are inherited baseline, not new P3C scope.

## Behavior and design decisions

The old absolute-positioned title, settings and bottom controls could overlap when text grew. Camp now uses a flex layout: navigation, identity/display controls, inline feedback, then actions and shared progress. Available vertical space keeps the dock near the bottom; larger text and long names extend the page and can be scrolled. Display settings expand in flow, so the panel does not cover following content or a focused control. No JavaScript size observer or breakpoint state was added.

The existing scene stays fixed behind the content with the same camera and Canvas. Pointer events pass through the empty overlay area to the scene; content and native modal panels explicitly remain interactive. The shared `.camp-lodge`/`.lodge-stage` defaults used by Solo are preserved, with the new layout scoped to `.camp-detail--forest`.

Text can now move across different parts of the scenery while scrolling. Identity, caption and status use a quiet dark backing to preserve contrast. Existing typefaces, colors and control shapes are retained. On short viewports only the decorative gathering caption is hidden; the Camp description, including archived status, remains readable.

## Validation

- `pnpm test` in the isolated web package: **22 files, 93 tests passed**.
- `pnpm build`: **passed**, including TypeScript. Existing dependency-annotation and large-3D-chunk warnings remain; no bundling configuration was changed.
- Browser checks ran in headless Edge with real React/Three rendering and synthetic HTTP fixtures. Completed runs had **no uncaught page errors**.
- `git diff --check` was applied to the candidate's changed files. A baseline/candidate manifest identifies only the P3C delta for a subsequent rollout.

### Reflow matrix

At widths **320, 390, 768 and 1440 CSS pixels**, both light/dark themes and **100%/200% root text size**, tests used an eight-member Camp and a long name. Assertions checked navigation/title separation, title/settings separation from the bottom content, document and shell horizontal overflow, and operable settings/Menu/keyboard composer. Screenshots captured both the top and scrolled progress region.

Additional checks passed:

- **320×480 at 200% text**: all four Camp actions, display controls, Menu, dialog focus restoration and the scheduled-Pact datetime input remained reachable. Hit testing verified focused controls were not covered. The reduced viewport simulates a constrained viewing area; it is not a physical on-screen-keyboard test.
- One-member archived Camp: status stays visible, settings and shared progress remain accessible, and the compose action is absent.
- Milestones 0/1/3/7, loading, request failure and retry: content reflows without overlap.
- A rename confirmation stays between the header/settings and bottom actions. Denied-access recovery flows below navigation and its return action remains accessible.
- Eight-member 3D scene: resizing through **320, 390, 699, 701, 768 and 1440px** at 200% text retained scene UUID, patch geometry identities and exactly one Canvas. Selected member and ten-minute duration survived resizing the open composer.
- Reduced-motion scene: settled frame counters remained unchanged during the idle sample.
- Solo retained its original absolute stage/section positioning, zero padding and pointer behavior. Return did not inherit Camp navigation.

Root-text enlargement and viewport reflow were tested. Native browser chrome zoom was not exercised in the headless harness; no equivalent claim is made for pinch zoom, mobile hardware or browser zoom shortcuts.

### Contrast and visual review

The text backing is `rgba(16,37,31,.9)`. Compositing it over pure white provides a conservative brightest-background bound. Observed foreground colors produce these minimum contrast ratios:

| Text | Minimum ratio |
| --- | ---: |
| Camp metadata | 7.07:1 |
| Camp name | 10.36:1 |
| Camp description | 8.43:1 |
| Gathering caption | 9.63:1 |
| Scene status | 8.41:1 |

The shared summary retains its P3B opaque background and 11.37:1 text contrast. Existing 44px minimum targets and visible focus treatment are preserved. Screenshots confirmed the normal-size mobile scene remains prominent, while enlarged long titles can occupy more than one screen without clipping essential text. Scrolling is an intentional trade-off at these sizes.

## Evidence and review corrections

Evidence is retained in the **primary repository's** ignored `.openai/p3c-validation/`: `ui-results.json`, `extra-results.json`, `short-results.json`, `contrast-pairs.json`, `contrast-results.json`, `layout-*.png`, `summary-*.png`, `3d-mobile.png`, `short-composer-focus.png`, `short-archived*.png`, `recovery.png` and `solo-regression.png`. Local scripts are `.openai/p3c-ui.cjs`, `p3c-extra.cjs` and `p3c-short.cjs`.

Early verification corrected a fixture selector for nested display-control labels. It also found and fixed pointer-event inheritance in the roster dialog and missing flex growth that placed the dock too high. Review scoped the scene-layout overrides to Camp to preserve Solo. Final affected checks passed after these corrections. Earlier failure screenshots are diagnostic history, not final results.

## Handoff

The isolated worktree and candidate build are retained for review. Temporary validation Vite is stopped after checks. The primary repository's P3B source remains unchanged; copying the candidate back would update a running Vite instance through HMR and belongs to a separately approved rollout.

For the next rollout, use the baseline/candidate hashes in `.openai/p3c-validation/handoff.json` to detect conflicting edits before copying the four source files and two documentation files. Reconcile any changed baseline explicitly; do not reset or replace the wider uncommitted working tree. The isolated worktree can be used for further review without deploying P3C.
