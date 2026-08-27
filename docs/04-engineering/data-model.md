# Data Model — Focus & Gentle Retention

- **Status:** Conceptual, aligned with planned implementation
- **Version:** 0.2
- **Last updated:** 2026-08-27

## Existing core entities

`profiles`, `consents`, `tasks`, `next_actions`, `focus_sessions`, `brain_dumps`, `checkins`, `weekly_reviews`, `experiments`, `product_events` và `ai_usage` giữ nhiệm vụ như schema hiện tại. Nội dung Brain Dump/check-in nhạy cảm dùng field encryption khi được lưu.

## Planned engagement entities

### engagement_preferences

- `user_id` PK/FK
- `theme` enum: forest_light/twilight/night
- `audio_preference` JSONB local-safe metadata; URL riêng không cần sync ở phase đầu
- `reminders_enabled`, `timezone`
- `created_at`, `updated_at`

### reminder_slots

- `id`, `user_id`, `local_time`, `days_of_week`
- `channel` enum: in_app/email
- `enabled`, `last_delivered_at`, timestamps

Tối đa hai active slots/user được enforce ở application layer và test; outbound email chỉ sau provider decision.

### focus_seeds

- `id`, `user_id`, `task_id?`
- `prompt` tối đa 280 ký tự do user xác nhận
- `remind_at?`, `status` enum: open/opened/dismissed/expired
- `created_at`, `opened_at`, `dismissed_at`

Mỗi user tối đa một seed `open`; task title không được sao chép sang analytics/notification.

### weekly_letter_feedback

- `id`, `weekly_review_id`, `user_id`
- `verdict` enum: useful/not_accurate
- `created_at`

## Data rules

- Mọi row user-owned có `user_id`, RLS policy owner-only và authorization tại API.
- Reminder delivery lưu metadata tối thiểu (channel, status, timestamp), không lưu body message ở analytics.
- `focus_seeds`, preferences và feedback phải xuất hiện trong export và bị xóa qua account deletion.
- Return eligibility được suy ra từ last core event; không cần lưu “days absent”.
- Local-only theme/audio preference không vào database cho đến khi sync được duyệt.

## Query/index expectations

- Index `focus_sessions(user_id, started_at)` và `product_events(user_id, occurred_at)` phục vụ return/metrics.
- Index active `focus_seeds(user_id, status)` và active `reminder_slots(user_id, enabled)`.
- Job delivery query theo `enabled + local_time + timezone`, có idempotency key theo slot/window.
