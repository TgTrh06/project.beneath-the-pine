# Product Metrics — Focus & Gentle Retention

- **Status:** Draft
- **Version:** 0.2
- **Last updated:** 2026-08-27

## North-star metric

**Stuck-to-Start Rate:** tỷ lệ stuck session có `start_event` trong 10 phút.

`stuck sessions with start_event ≤ 10 minutes / valid stuck sessions`

## Activation

Activated user trong 24 giờ đầu hoàn thành: Brain Dump hoặc manual capture, xác nhận next action và bắt đầu focus session.

## Retention metrics

| Metric | Definition | Pilot signal |
|---|---|---|
| D3 return | Có core event 3 ngày sau activation | Theo dõi baseline |
| D7 return | Có core event 7 ngày sau activation | Theo dõi baseline |
| Seed conversion | Open Seed được mở và dẫn tới start trong 24h | ≥ 25% là giả thuyết ban đầu |
| Reminder-to-start | Reminder opened dẫn tới start trong 10 phút | Theo dõi theo channel |
| Return recovery | Return ritual hoàn thành dẫn tới core event cùng ngày | ≥ 40% là giả thuyết ban đầu |
| Weekly letter usefulness | Feedback “hữu ích” / total feedback | ≥ 60% khi có đủ mẫu |

Các ngưỡng là giả thuyết để học, không phải mục tiêu áp lực cho người dùng.

## Guardrails

- Reminder opt-out, disable rate và delivery failure rate.
- Tỷ lệ user dismiss/skip return ritual; không diễn giải dismiss là failure cá nhân.
- Tỷ lệ insight “chưa đúng” và insight thiếu evidence.
- P95 latency, AI cost, schema validation failure và error rate.
- Zero raw content trong product analytics hoặc notification payload.

## Event taxonomy

Core events: `brain_dump_submitted`, `next_action_confirmed`, `start_event`, `focus_completed`, `still_stuck`, `reset_completed`.

Retention events: `open_seed_created`, `open_seed_opened`, `open_seed_dismissed`, `reminder_preference_enabled`, `reminder_preference_disabled`, `reminder_shown`, `reminder_opened`, `return_flow_started`, `return_flow_completed`, `weekly_letter_shown`, `weekly_letter_feedback_submitted`.

Payload chỉ gồm pseudonymous ID, event name, timestamp, enum, duration và channel. Không có task title, Brain Dump, note, URL audio hoặc nội dung notification.
