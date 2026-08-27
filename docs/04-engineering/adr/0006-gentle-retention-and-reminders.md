# ADR-0006 — Gentle Retention and Reminder Delivery

- **Status:** Accepted for planned implementation
- **Date:** 2026-08-27

## Context

Beneath the Pine cần hỗ trợ người dùng quay lại sau focus session hoặc gián đoạn mà không dùng streak, pressure notification hay lưu nội dung nhạy cảm trong analytics. Reminder outbound là external side effect, trong khi private beta chưa chọn provider hoặc credential.

## Decision

1. Retention loop gồm Open Seed, reminder opt-in, Return ritual và Weekly letter.
2. Open Seed và return eligibility là server-side user data; theme/audio URL là local-only ở phase đầu.
3. Reminder default off, tối đa hai slots, dùng timezone profile và có disable path tức thời.
4. Phase đầu chỉ triển khai in-app reminder. Outbound email dùng adapter interface và chỉ bật sau ADR/provider review riêng.
5. Job delivery phải idempotent theo slot/window, re-check preference trước gửi và chỉ log metadata tối thiểu.
6. Analytics/event payload không chứa task title, Brain Dump, note, audio URL hoặc notification copy.

## Alternatives considered

### Push notification ngay từ MVP

Không chọn: cần service worker, quyền hệ điều hành và delivery semantics phức tạp trước khi có bằng chứng retention.

### Streak và gamification tăng engagement

Không chọn: xung đột với nguyên tắc không phán xét và có thể tăng áp lực cho audience.

### Reminder email hard-code trực tiếp vào core API

Không chọn: khóa provider, khó test/rollback và làm external effect lẫn với domain logic.

## Consequences

- Cần migration/RLS cho preferences, slots, seeds và feedback; export/delete phải bao phủ chúng.
- In-app reminder không thể kéo user quay lại khi tab đóng; đây là giới hạn có chủ đích của beta.
- Email provider thêm sau sẽ cần configuration, privacy inventory, consent copy và security review riêng.

## Follow-up

- Chọn provider outbound dựa trên beta evidence và yêu cầu region/retention.
- Xác nhận local time/weekday semantics và DST tests trước job implementation.
- Review opt-out/delivery failure guardrails sau 2 tuần beta.
