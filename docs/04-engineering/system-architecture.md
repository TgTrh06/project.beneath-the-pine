# System Architecture

- **Status:** Proposed
- **Version:** 0.1
- **Last updated:** 2026-08-04

## Mục tiêu kiến trúc

- Tối ưu cho tốc độ học trong private beta.
- Tách deterministic product logic khỏi generative AI logic.
- Privacy-by-design và khả năng xóa dữ liệu.
- Mọi AI workflow có schema validation, timeout và fallback.
- Tránh distributed complexity trước khi có nhu cầu thực.

## Proposed stack

| Layer | Đề xuất |
|---|---|
| Web | React + TypeScript + Vite |
| UI | Tailwind CSS + accessible primitives |
| Server state | TanStack Query |
| Local UI state | Zustand khi thực sự cần |
| API | Node.js + TypeScript + Express/Fastify |
| Database | PostgreSQL |
| ORM/query | Chốt bằng ADR; ưu tiên migrations rõ ràng |
| Auth | Managed provider |
| AI | Provider abstraction + structured output |
| Jobs | Scheduler/cron ở MVP; queue khi có nhu cầu |
| Observability | Structured logs + error tracking + metrics |

## Logical components

```text
Web Client
  ├─ Auth/UI
  ├─ Core workflows
  └─ Product analytics (no raw content)
        │
API Application
  ├─ Auth/authorization
  ├─ Task & workflow service
  ├─ Consent & data rights service
  ├─ Review/aggregation service
  └─ AI orchestration service
        ├─ Prompt registry
        ├─ Schema validator
        ├─ Safety layer
        └─ Provider adapter
        │
PostgreSQL + Scheduled jobs + Observability
```

## AI request lifecycle

1. Kiểm tra authentication, ownership và consent.
2. Lấy tối thiểu dữ liệu cần thiết.
3. Redact dữ liệu không cần gửi.
4. Gọi provider với prompt version và schema.
5. Validate output; retry có giới hạn nếu lỗi schema.
6. Safety filter/policy check.
7. Lưu output, model, prompt version, latency, token usage.
8. Hiển thị cùng disclosure và khả năng feedback.

## Background jobs MVP

- Tạo weekly facts deterministic.
- Tạo weekly review khi người dùng opt-in.
- Xóa dữ liệu đến hạn retention.
- Xử lý export/delete.

Jobs phải idempotent. Cron là đủ ở beta; chuyển sang queue khi cần retry/concurrency/visibility tốt hơn.

## Boundary rules

- Client không gọi AI provider trực tiếp.
- AI không ghi task hoặc thay đổi lịch nếu chưa có user confirmation.
- Analytics không nhận raw text.
- Secrets chỉ tồn tại ở server/secret manager.
- Thời gian lưu UTC; timezone ở user profile.

## Open decisions

- Monorepo hay separate repositories.
- Fastify vs Express.
- ORM/query builder.
- Auth provider.
- Hosting và region dữ liệu.
- AI provider/model routing.

