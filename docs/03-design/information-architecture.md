# Information Architecture — Focus & Gentle Return

- **Status:** Approved for private beta
- **Version:** 0.3
- **Last updated:** 2026-08-27

## Primary navigation

1. **Now** — one next action, Open Seed, return entry và recovery action.
2. **Capture** — Brain Dump, clarification và confirmation.
3. **Progress** — Weekly letter và lịch sử mốc bắt đầu/quay lại tối giản.
4. **Settings** — account, consent, data rights, theme/audio và reminder controls.

Focus Room là modal/full-screen task state, không phải destination navigation độc lập.

## Screen responsibilities

### Now

- Ưu tiên thứ tự: Return ritual (nếu có) → Open Seed → one next action → Capture.
- Hiển thị một primary CTA tại một thời điểm.
- Không có backlog, overdue count hoặc streak loss ở trạng thái mở đầu.

### Focus Room

- Task hiện tại, timer, pause/done/still stuck và exit rõ ràng.
- Theme/audio là secondary controls; audio player không che timer/action.
- Trạng thái loading/blocked/error của embed không làm hỏng focus session.

### Capture

- Composer Brain Dump và user confirmation; giữ draft khi AI lỗi.

### Progress

- Weekly letter chỉ khi có đủ facts; feedback nằm cạnh observation.
- Không có điểm, level, so sánh user hay chuỗi ngày.

### Settings

- Theme/audio local preference.
- Reminder opt-in, slots, timezone, trạng thái delivery gần nhất và disable controls.
- Consent, export/delete data, support resources.

## Responsive behavior

- Mobile ưu tiên Now/Focus actions; 3–4 destination chính có thể chuyển sang bottom navigation sau khi implementation review.
- Focus Room giữ task/timer trong viewport đầu; advanced audio controls được progressive disclosure.
- Dialog và return ritual trap focus đúng cách, có escape/close khi an toàn.

## URL proposal

```text
/now
/capture
/progress
/settings
/settings/space
/settings/reminders
/settings/privacy
/settings/data
```
