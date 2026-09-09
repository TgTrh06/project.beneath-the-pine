# MVP Scope — Core Validation and Public Alpha

- **Status:** Draft for implementation
- **Version:** 1.0
- **Last updated:** 2026-09-08

## Goal

Kiểm chứng Beneath the Pine giúp người dùng bắt đầu một hành động cụ thể trong 10 phút, quay lại sau gián đoạn mà không gặp áp lực và có thể được sử dụng bởi người ngoài phạm vi đồ án.

## Must have before public alpha

- Account/timezone/consent khi dùng server-side private data; đường demo mô tả rõ dữ liệu local.
- Brain Dump hoặc manual capture, user confirmation, one next action và Help Me Start.
- Focus Room: timer, done/still stuck, mobile và keyboard behavior.
- Open Seed được tạo/open/replace/dismiss sau focus session.
- Return Ritual và in-app reminder preference opt-in, tối đa hai khung giờ.
- Weekly Letter dựa trên facts tổng hợp cùng feedback hữu ích/chưa đúng.
- Public landing/onboarding, contextual feedback, export/delete và support path.
- Event instrumentation và guardrails privacy cho core/return loop.

## Should have

- Theme local và một số lựa chọn âm thanh có failure fallback.
- Pine/Pine Marten visual cue nhỏ trong Focus Room, Return và Weekly Letter.
- Focus preset prototype để kiểm chứng repeat value.

## Could have after evidence

- Pine Plus proposition test, entitlement design và hosted checkout prototype.
- Đồng bộ preferences/presets giữa thiết bị.
- Email reminder qua provider adapter.
- Voice-to-text cho Brain Dump.

## Won't have in this MVP

- Streak, leaderboard, coins, shop, social feed hoặc gamification có tính phạt/thưởng.
- Calendar riêng, task management đầy đủ, goals hoặc knowledge base.
- Push notification, native mobile và offline sync.
- AI suy luận bệnh lý, mood hoặc đánh giá lâm sàng từ hành vi/nội dung.
- Hardware sizing, database capacity topology hoặc multi-region deployment.

## Validation gates

### Private validation gate

- Core loop và return loop chạy end-to-end trong test environment.
- Preferences/reminders chỉ hoạt động sau opt-in; export/delete bao phủ dữ liệu mới.
- Không có P0/P1 mở; migration có RLS và rollback note.
- Có baseline cho D3/D7 return, seed conversion và reminder-to-start.

### Public alpha gate

- Người mới đến Capture và bắt đầu focus mà không cần facilitator.
- Privacy, demo/account boundary, feedback và support path rõ ràng.
- Cohort ngoài phạm vi đồ án tạo đủ evidence để quyết định retention và personalization tiếp theo.

### Paid validation gate

- Có một capability dùng lặp lại và proposition Pine Plus được kiểm chứng định tính/định lượng.
- Entitlement, billing failure/cancel/restore, provider, refund và unit economics được duyệt riêng trước khi thu tiền thật.
