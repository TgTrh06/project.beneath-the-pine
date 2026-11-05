# Camp forest P3B — Implementation verification

Date: 2026-11-03. Authorized through `accept plan dev stability + P3B`. Implementation and isolated local verification are complete; P3B dev rollout is not part of this authorization.

Subsequent delivery: [P3B local dev rollout](camp-forest-p3b-dev-rollout.md) was completed under the separate `accept plan rollout P3B dev` approval, including real API/database smoke tests and cleanup verification.

## Scope

Camp now presents the existing P3A shared milestones in its existing 3D scene and in a static summary below the action dock. At one, three and seven shared sessions, it shows a seedling, flowers and a lantern. There are no new reward rules, API contracts, migrations, dependencies or assets.

Changed implementation files:

- `apps/web/src/features/memory/useCampForest.ts`: current-Camp loading, visibility refresh, stale-response rejection and access recheck.
- `apps/web/src/features/memory/CampForestSummary.tsx`: static progress, empty/loading/error states and retry.
- `apps/web/src/features/memory/ForestGrowth.tsx`: optional origin and namespace, preserving personal defaults.
- `apps/web/src/features/camps/CampView.tsx`: data wiring and existing Camp-detail access recovery.
- `apps/web/src/features/camps/scene/CampLodge.tsx`, `LodgeCanvas.tsx`, `lodge.css`: shared patch, summary and scrollable bottom overlay.
- `apps/web/src/features/memory/CampForestSummary.test.tsx`: four focused tests for milestones, stale display, archived progress and personal defaults.

Earlier P1/P2A/P2B/P3A working-tree changes were preserved. No commit, push or production action was performed.

## Automated checks

- `pnpm --filter @pyneath/web test`: **22 files, 93 tests passed**, including personal arrangement/reaction tests and four new P3B tests.
- `pnpm --filter @pyneath/web build`: **passed**, including TypeScript compilation. Vite reported dependency annotation warnings and the existing large 3D chunk warning; no dependency or bundling configuration was changed.
- Browser verification used headless Edge and the real React/Three application on temporary Vite port 5174. Camp, auth and memory HTTP responses were synthetic fixtures, with sockets closed. This verifies frontend behavior, not backend authorization or a deployed integration.
- The separate [stability check](dev-stability-before-p3b.md) used real API/database requests. It did not reproduce the previous 503s; their root cause remains unknown.

## Browser and interaction evidence

The following scenarios passed with no uncaught page errors in the completed runs:

| Area | Observed result |
| --- | --- |
| Milestones | 0/1/3/7 display the expected empty/seedling/flowers/lantern state. |
| Scene continuity | Changing progress keeps the same Three scene; selecting members preserves patch geometry identities. |
| Access | Missing authorized Camp and aggregate HTTP 401/403/404 clear shared UI and invoke existing access recovery. |
| Visibility and errors | Hiding removes progress; a failed resume keeps it absent; inline retry restores it. |
| Drafts | A failed progress load and retry preserve selected members and the 10-minute composer duration. |
| Route/account isolation | Delayed replies from an old Camp or logged-out account cannot overwrite the new view. |
| Archive | An archived one-member Camp retains its earned patch and removes the compose action. |
| WebGL fallback | Context loss keeps the static summary usable; retry recreates the 14-mesh patch. |
| Reduced motion | Shared progress remains visible; the existing demand renderer stops advancing frames while idle. |
| Navigation | Leaving Camp removes its shared UI; personal default origin/names remain covered by unit tests. |
| Core actions | Member selection, composer, Pact board, management and keyboard activation remain usable. |

Viewport checks covered static scenes at **320, 390, 768 and 1440 CSS pixels**, both themes, eight members and **200% root text size**. This is text-enlargement coverage, not a claim of native browser zoom testing. No horizontal document overflow was observed. A separate 320×480 check with 200% text exercised all four dock actions and the summary using vertical scrolling. At enlarged text sizes the bottom overlay occupies more of the scenery; all of its content need not be visible simultaneously.

3D screenshots covered eight members on desktop and 390px mobile, the three-session stage, reduced motion, and an archived one-member Camp. Visual review moved the patch forward to `[3.4, 0.12, 1.5]`, so its flowers are visible in front of the rightmost seat and the earned lantern remains inside the mobile view. Member positions and camera remain unchanged.

The summary's measured text/background pair is `#ece8d7` on `#1c3028`, **11.37:1**, in both themes. Retry/focus color `#ffe0a5` on that background is **10.95:1**. Retry retains a minimum 44px target.

## Rendering bounds

Observed on the eight-member scene with motion disabled:

| Shared count | Patch meshes | Renderer geometries | Draw calls |
| --- | ---: | ---: | ---: |
| 0 | 0 | 309 | 381 |
| 1 | 3 | 312 | 384 |
| 3 | 9 | 318 | 390 |
| 7 | 14 | 323 | 395 |
| 0 again | 0 | 309 | 381 |
| 7 again | 14 | 323 | 395 |

The scene UUID remained unchanged through these transitions. Frame counters stayed constant during settled idle samples, including reduced-motion mode. No extra Canvas, frame callback, light, shadow caster, texture or asset is introduced. These are bounded software-rendered local observations, not physical-device GPU benchmarks or long-duration leak tests.

## Evidence and limitations

Ignored local scripts: `.openai/p3b-ui.cjs`, `p3b-ui-extra.cjs`, `p3b-ui-access.cjs`. Results and screenshots: `.openai/p3b-validation/ui-results.json`, `ui-extra-results.json`, `ui-access-results.json`, `rendering.json` and `camp-*.png`. These are local evidence, not committed CI artifacts.

Early harness attempts used an incorrect close-button label and incomplete Pact/invite list responses. Those fixtures were corrected before the passing runs; they did not require application fixes. An older `failure.png` can remain in the ignored evidence directory and is not a final-run result.

Continuously visible Camps refresh on the next entry/resume/retry, with no polling or realtime aggregate subscription. Camp detail and the shared aggregate are separate snapshots. Backend membership enforcement remains the P3A contract. Solo/Session paths receive no shared patch; a full repeat of the prior P2B checkout journey was not performed in this frontend-only slice.

The temporary API session ended between chat turns. The final browser checks used only mocked HTTP and temporary Vite. Disposable container `pyneath-p3b-test` and the final Vite process are removed/stopped after verification; no persistent dev database was migrated or seeded by P3B.

See [design and lifecycle](../03-design/camp-forest-p3b.md). A separate, explicitly approved P3B dev rollout remains the next delivery step.
