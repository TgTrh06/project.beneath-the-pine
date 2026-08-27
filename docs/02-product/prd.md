# Product Requirements Document — Focus & Gentle Retention

- **Status:** Draft for implementation
- **Version:** 0.3
- **Target:** Private beta
- **Last updated:** 2026-08-27

## 1. Summary

Beneath the Pine giúp người dùng chuyển từ quá tải sang một next action có thể bắt đầu, rồi tạo đường quay lại cho lần sau. MVP mở rộng bằng Focus Studio, Open Seed, reminder opt-in, Return ritual và Weekly letter dựa trên evidence.

## 2. Goals

- Giảm thời gian từ stuck state đến start event.
- Giảm ma sát quay lại sau một focus session hoặc một khoảng nghỉ.
- Tạo cảm giác tiến bộ không dựa trên streak hay năng suất.
- Cho người dùng kiểm soát AI, reminder, audio và dữ liệu của họ.

## 3. Non-goals

- Không thay thế task/calendar/notes platform.
- Không chẩn đoán hay điều trị ADHD hoặc sức khỏe tâm thần.
- Không dùng leaderboard, economy, streak, social feed hay notification pressure.
- Không tự gửi reminder khi chưa có opt-in.

## 4. Primary use cases

### UC-01 — Focus with a personal space

Người dùng chọn next action, mở Focus Studio, chọn timer/theme/audio nếu muốn và hoàn thành hoặc dừng phiên. Timer và task luôn usable nếu audio/embed thất bại.

### UC-02 — Leave an Open Seed

Sau phiên focus, người dùng có thể lưu một điểm vào cực nhỏ cho lần sau: mở lại task, đặt khung giờ nhắc hoặc không lưu gì. Hệ thống không ép tạo seed.

### UC-03 — Return gently

Sau 3 ngày không có core event, app chào người dùng trở lại và cho chọn Start fresh, Open Seed hoặc check-in. Backlog và overdue count không xuất hiện trước lựa chọn này.

### UC-04 — Reflect on the week

Người dùng chủ động xem Weekly letter với facts tổng hợp, một observation có evidence và feedback hữu ích/chưa đúng. Không có suy luận mood hay nội dung thô.

## 5. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Auth, profile/timezone, consent, export/delete | Must |
| FR-02 | Brain Dump, confirmation, next action, Help Me Start | Must |
| FR-03 | Focus Studio với timer, full-screen mode, theme local và audio optional | Must |
| FR-04 | Create/open/dismiss một Open Seed | Must |
| FR-05 | Reminder preference opt-in, tối đa 2 slots, disable tức thời | Must |
| FR-06 | Return ritual sau 3 ngày không có core event | Must |
| FR-07 | Weekly letter facts + insight feedback | Must |
| FR-08 | Event instrumentation không có raw content | Must |
| FR-09 | Email reminder adapter | Should |
| FR-10 | Pine/Marten visual acknowledgment | Should |

## 6. Non-functional requirements

- Responsive từ 320px; keyboard navigation, visible focus và logical dialog focus.
- Theme dark có contrast/hierarchy riêng; tuân thủ `prefers-reduced-motion`.
- YouTube chỉ được embed sau thao tác user; URL được validate và không vào analytics.
- Reminder xử lý theo timezone; job delivery idempotent và không gửi nếu preference bị tắt.
- Mọi row user-owned có authorization/RLS; export/delete bao phủ dữ liệu engagement mới.
- AI output schema validation trước khi lưu/hiển thị; weekly facts không gửi raw content tới analytics.

## 7. Analytics

Theo `00-foundation/metrics.md`. Event payload chỉ có ID nội bộ, enum, timestamp/duration và channel. Analytics không nhận task title, Brain Dump, note, audio URL hoặc copy notification.

## 8. Dependencies and open decisions

- Auth, PostgreSQL, structured-output AI và observability giữ nguyên.
- Reminder outbound yêu cầu provider được duyệt riêng; bản đầu chỉ dùng in-app reminder.
- Trigger Return mặc định là 3 ngày, dùng timezone profile.
- Audio YouTube là tùy chọn UX, không là dependency cho core focus flow.

## 9. Release criteria

- Các use case trên có happy path, empty/error/opt-out states và test phù hợp.
- Không có reminder gửi không có opt-in.
- Có baseline D3/D7, seed conversion, return recovery và guardrail opt-out.
- Private beta đạt các điều kiện trong `00-foundation/mvp-scope.md`.
