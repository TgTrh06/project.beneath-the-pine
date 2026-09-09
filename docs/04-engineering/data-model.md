# Data Model — Focus & Gentle Retention

- **Status:** Conceptual, aligned with planned implementation
- **Version:** 0.2
- **Last updated:** 2026-08-27

## Architecture status

Existing product schema history is retained under `supabase/migrations`. New Java service migrations live under `services/core-service/src/main/resources/db/migration`. The Java foundation currently creates only its service schema; the target ownership below is conceptual and does not authorize a production migration.

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

## Future commercial entities — Tier 5 only

These entities document a boundary for paid validation and are not approved for migration yet.

### plans and capabilities

- `plans`: stable plan key and lifecycle state; price/provider configuration stays outside product copy.
- `capabilities`: stable capability key used by Web/API contracts.
- `plan_capabilities`: mapping plus optional policy such as quota; core/data-rights capabilities cannot be removed by plan state.

### subscriptions and billing_events

- `subscriptions`: `user_id`, provider/customer/subscription references, normalized state, current period end and timestamps.
- `billing_events`: provider event ID, type, received/processed timestamps and processing result for replay safety.
- Card/payment details and provider payload bodies are not stored in the application database by default.

Entitlement is derived from verified subscription state plus capability policy. Checkout return URLs are never proof of payment. Migration, provider, retention, tax/invoice and deletion decisions require a separate ADR before implementation.

## Target service ownership

| Service | Durable ownership | Projection examples |
| --- | --- | --- |
| Core | profiles, consent, tasks, next actions, focus sessions, habits, captures, check-ins, data-rights requests | None from Engagement required for core focus |
| Engagement | preferences, reminder slots, Focus Seeds, return state, weekly letters and feedback | Minimal focus-activity projection from core events |
| AI | AI jobs, attempts, validated result references and safe failure state | Consent/quota authorization snapshot tied to the job |
| Notification | Delivery attempts and provider response metadata | Current opt-in confirmation, never a permanent consent copy |

The transition may use isolated PostgreSQL schemas and roles in one Supabase instance. Each service remains the only writer for its schema; cross-service foreign keys, direct joins and repository access are prohibited.

## Integration records

Each service that publishes messages owns an `outbox_messages` table in the same database transaction as its business change. Each durable consumer owns an `inbox_messages` or equivalent deduplication record. These are implementation patterns, not shared business tables.

Redis stores only expiring or reconstructable state and is excluded from export as a source of truth. RabbitMQ messages contain minimum metadata or content references; queues and DLQs are not archives for private user content.

Account deletion becomes a coordinated saga. Core owns the request and completion status; each service publishes a service-data-purged acknowledgement. The user-facing deletion state cannot be marked complete until every required owner has acknowledged or an operator handles a visible failure.
