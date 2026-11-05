# Personal forest P2A — Arrange a quiet corner

Accepted through `accept plan P2A`, 2026-11-03. This extends the gentle P1 forest without pressure, currency, streaks or extra steps in starting/ending focus.

## Flow

Memory → Chặng riêng retains the earned journal and adds **Sắp xếp góc rừng** below it. The section shows the saved arrangement in a static top-down preview. **Sắp xếp** opens three native radio choices: Bên gốc thông (P1 positions), Gần nhau, Vòng cung nhỏ. Native checkboxes show or hide earned seedling, flowers and lantern independently. Unearned controls are disabled with their 1/3/7-session explanation. Journal dates always remain visible; saved visibility is labeled separately as Đang cất or Đang hiện trong rừng.

The primary action is **Lưu góc rừng**. **Hủy** discards the draft and restores focus to Sắp xếp. **Về mặc định** changes only the preview until saved. Pending requests disable editing/actions; failed saves keep the draft for retry. Conflicts explain that another client changed the arrangement and offer **Tải bản đã lưu**, explicitly replacing the draft. Failed reload retains it. Cancel remains available after failure.

Newly earned items automatically appear in the selected layout because preferences store only hidden earned items. Hiding an item never revokes it. A newly opened browser reads saved state from the account. Account changes discard provider state; no personal customization is put in localStorage. Other visible clients read new state on resumption; no real-time synchronization promise is made.

## Visual and accessibility choices

Use existing forest paper/green/chestnut tokens, type scale and working-surface spacing. The preview serves as the immediate result of editing; no new card or modal is introduced. Controls wrap into a single column on narrow widths, labels offer 44px targets, and native radio/checkbox keyboard behavior is retained. Save is the only primary button. The preview is available in light mode, reduced motion and WebGL failure, and its accessible name reports visible item count. Labels and status text explain states without relying on color or icons.

Ground-plane anchors are shared between static and 3D output. The top-down preview intentionally differs in projection from the orthographic scene. All 3D positions remain in the existing small patch beside the trunk; mobile users also see the saved SVG in the return summary where the main form can cover the scene. No new movement or light is introduced.

See [verification](../07-testing/personal-forest-p2a.md), [ADR-0027](../04-engineering/adr/0027-personal-forest-arrangement.md) and the separately authorized [completed dev rollout](../07-testing/personal-forest-p2a-dev-rollout.md).
