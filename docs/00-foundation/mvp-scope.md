# MVP Scope — Focus & Gentle Retention

- **Status:** Draft for implementation
- **Version:** 0.2
- **Last updated:** 2026-08-27

## Goal

Kiểm chứng Beneath the Pine giúp người dùng bắt đầu một hành động cụ thể trong 10 phút và quay lại sau gián đoạn mà không gặp áp lực hoặc backlog overload.

## Must have

- Account, timezone, consent AI, export và delete account.
- Brain Dump, user confirmation, one next action và Help Me Start.
- Focus Studio: timer, theme local và controls âm thanh tùy chọn.
- Open Seed được tạo/dismiss sau focus session.
- Reminder preference opt-in, tối đa hai khung giờ và in-app reminder.
- Return ritual sau 3 ngày không có core event.
- Weekly letter dựa trên facts tổng hợp cùng feedback hữu ích/chưa đúng.
- Event instrumentation và guardrails privacy cho toàn bộ retention loop.

## Should have

- Email reminder qua provider adapter sau khi có provider, credential và dữ liệu beta xác nhận nhu cầu.
- Pine/Pine Marten visual cue nhỏ trong Focus Room, Return và Weekly letter.
- Voice-to-text cho Brain Dump.

## Could have

- Preset soundscape không cần provider bên thứ ba.
- Đồng bộ preferences giữa thiết bị.
- Body-doubling/focus room nhiều người theo cơ chế opt-in riêng.

## Won't have in this MVP

- Streak, leaderboard, coins, shop, social feed hoặc gamification có tính phạt/thưởng.
- Calendar riêng, task management đầy đủ, goals hoặc knowledge base.
- Push notification, native mobile và offline sync.
- AI suy luận bệnh lý, mood hoặc đánh giá lâm sàng từ hành vi/nội dung.

## Private-beta exit criteria

- Core loop và retention loop chạy end-to-end trên staging.
- Preferences/reminders chỉ hoạt động sau opt-in; export/delete bao phủ dữ liệu mới.
- Không có P0/P1 mở; migration có RLS và rollback note.
- Có baseline cho D3/D7 return, seed conversion và reminder-to-start.
- Ít nhất 10 người hoàn tất 2 tuần pilot trước quyết định mở rộng provider hoặc native notification.
