# Camp forest P3B — Shared memories in the Camp scene

Accepted through `accept plan dev stability + P3B`, 2026-11-03. The [bounded stability check](../07-testing/dev-stability-before-p3b.md) did not reproduce the earlier 503s; their cause remains unknown.

## Experience

The existing Camp scene displays a fixed patch of shared memories: seedling at one recorded shared session, flowers at three and a lantern at seven. It reuses P1 geometry and the P3A aggregate; there is no new reward rule, animation, editable shared arrangement, API or asset.

The primary Camp actions remain in the dock. A compact summary immediately below them shows the same earned state using the existing static SVG and text. It works in light mode, on WebGL failure and with motion disabled. Zero progress explains the two-participant completed-session rule. Loading and failure are distinct from zero progress; failure offers an inline retry. Archived Camps keep their shared patch and summary.

The patch sits to the right of the existing seating circle. It has no event handlers or extra light/shadow caster. Camera and member seating remain unchanged. Selection feedback participates in the bottom overlay's layout rather than overlapping the new summary; the overlay can scroll vertically when enlarged text or a short viewport needs more room.

## Data and access

`useCampForest` reads the existing `/me/memory/camps` response and selects only the current Camp ID. AppLayout already scopes the view to the authenticated account. Opening/changing Camp and visible-tab resumption fetch the aggregate; hiding clears it. An obsolete-request sequence and Camp-ID guard prevent late responses from crossing routes. No Camp progress is written to browser storage and no polling or realtime channel is added.

A temporary progress-load failure clears the patch/summary data but preserves the Pact composer and its private draft. If the Camp disappears from the authorized aggregate or the request denies access, CampView clears its detail projection and invokes its existing detail loader to recheck membership. A denied detail response returns the existing Camp recovery view. Server authorization remains authoritative.

Continuously visible pages do not learn about remote changes until a new read. Shared aggregate and Camp detail are independent snapshots. P3B does not change membership policy, archived behavior, durable history or cleanup rules from ADR-0028.

## Rendering and scope

`ForestGrowth` gains an optional origin and namespace, with its original personal origin/names as defaults. Only the non-Solo Lodge path receives Camp growth. At 1/3/7 the patch contains 3/9/14 meshes. There is no new Canvas, frame callback, texture, animation or external asset. Existing visibility, demand-frame and WebGL fallback lifecycle remain in control.

Changes are confined to Camp view/loading, Camp scene/summary/layout, the reusable growth props and focused tests/documentation. The personal arrangement and P2B reaction remain unchanged. This implementation approval does not authorize a P3B dev rollout.

See [P3B implementation verification](../07-testing/camp-forest-p3b.md) for geometry, interaction and viewport evidence.
