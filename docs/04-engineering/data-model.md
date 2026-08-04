# Data Model

- **Status:** Conceptual
- **Version:** 0.1

## Entities

### users

- `id` UUID
- `auth_subject` unique
- `timezone`
- `locale`
- `created_at`, `updated_at`, `deleted_at`

### consent_records

- `id`, `user_id`
- `purpose` enum
- `policy_version`
- `granted` boolean
- `recorded_at`, `withdrawn_at`

### tasks

- `id`, `user_id`
- `title`, `notes_encrypted?`
- `status` enum: inbox/ready/active/done/archived
- `estimated_minutes`
- `scheduled_for`, `completed_at`
- `source_brain_dump_id`
- timestamps

### next_actions

- `id`, `task_id`, `user_id`
- `text`
- `estimated_minutes`
- `source` enum: user/ai
- `prompt_version`
- `accepted_at`, `completed_at`

### brain_dumps

- `id`, `user_id`
- `raw_content`
- `retention_expires_at`
- `processing_status`
- timestamps

### focus_sessions

- `id`, `user_id`, `next_action_id`
- `planned_minutes`
- `started_at`, `ended_at`
- `outcome` enum

### daily_resets

- `id`, `user_id`, `local_date`
- `energy_level`, `available_minutes`
- `plan_snapshot` JSONB
- timestamps

### checkins

- `id`, `user_id`
- `energy_level`, `friction_tag`
- `optional_note`
- `created_at`

### weekly_reviews

- `id`, `user_id`, `week_start`
- `facts` JSONB
- `status`
- `generated_at`, `viewed_at`, `completed_at`

### ai_insights

- `id`, `weekly_review_id`, `user_id`
- `observation`, `evidence` JSONB
- `hypothesis`, `suggested_experiment`
- `confidence`
- `model`, `prompt_version`
- timestamps

### insight_feedback

- `id`, `insight_id`, `user_id`
- `verdict` enum: accurate/inaccurate/unsure
- `edited_text`
- `created_at`

### weekly_experiments

- `id`, `user_id`, `week_start`
- `statement`, `success_signal`
- `status`, `result`
- timestamps

## Data rules

- Mọi user-owned row có `user_id` và authorization check.
- Hard delete theo data deletion workflow; soft delete chỉ là trạng thái tạm.
- Raw content có retention riêng và không mặc định giữ vô hạn.
- AI output không thay thế source facts.
- Analytics event store không chứa content columns.
- Index theo `user_id + date/status` cho các query chính.

## Cần quyết định

- Có mã hóa field-level cho raw content/check-in note không.
- Retention mặc định của brain dump sau extraction.
- Có cần event sourcing cho product metrics hay dùng analytics riêng.
- Cách xử lý timezone khi tuần bắt đầu khác nhau.

