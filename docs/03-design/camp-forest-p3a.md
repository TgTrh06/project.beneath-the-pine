# Camp forest P3A — Shared footsteps

Accepted through `accept plan P3A`, 2026-11-03. Members can read a quiet record of shared presence in Memory → Cùng Camp. This phase adds a static journal based on existing shared memories; no 3D scene, shared decoration editor, animated celebration or new reward mechanism is added.

## Flow

Multiple authorized Camps use a labeled native select. A single Camp shows its name directly. The selected Camp's name leads a reused top-down forest preview, recorded-session count, three milestone rows and a four-entry-per-page history. Camp names wrap; the selector fits the available width. Selecting another Camp resets pagination. Archived Camps have a textual archived label and retain their memories.

| Recorded shared sessions | Milestone | Copy |
| --- | --- | --- |
| 1 | Mầm cây chung | Một lần cùng có mặt, một mầm cây ở lại. |
| 3 | Khoảng hoa chung | Những lần gặp nhau đã để lại một khoảng hoa. |
| 7 | Ánh đèn chung | Góc rừng chung có thêm một ánh đèn. |

Earned rows show original recorded dates. Unearned rows explain their thresholds without a countdown, progress bar or urgency. Every qualifying completed session contributes equally. There is no participant ranking, contribution breakdown, streak, claim action, currency or penalty for absence.

## States and accessibility

- No memberships: explain that there is no available Camp history, with a working link to Camps.
- No shared memories: empty forest preview and an explanation of the completed-session/two-participant rule.
- Loading: status text; previous Camp data is removed while access is rechecked.
- Either request fails: one inline retry action, with no stale names, counts or history.
- Membership disappears: omit that Camp and select an available Camp or show the empty state. Rejoining follows the existing full-history permission policy.
- Hidden tab, closed Camp tab or account change: discard displayed data and ignore obsolete responses. Resume/reopen reloads access and history.

Existing colors, typography, row separators and static SVG imagery are reused. Native select/buttons support keyboard and touch. Status and earned state are expressed in text, not just color or imagery. No new animation, Canvas, asset or focus trap is introduced. The personal journal and arrangement editor retain their existing behavior.

## Scope limits

The journal reflects durable shared-presence records already present, including history before P3A. It does not backfill missing legacy records, expose private work or guarantee realtime synchronization. Continuously visible pages may show already-delivered content until the next read; hiding and resuming clears and refreshes it. Retention and authorization details are in [ADR-0028](../04-engineering/adr/0028-camp-forest-projection.md).

See [implementation verification](../07-testing/camp-forest-p3a.md). P3A implementation approval does not authorize a runtime rollout.
