# Roadmap — Tier 0–5 Public Product

- **Status:** Draft
- **Planning horizon:** Core validation → public alpha → paid validation
- **Last updated:** 2026-09-08

Roadmap này mô tả outcome và gate. Danh sách capability/dependency chi tiết nằm trong [Tiered Delivery Plan](../02-product/tiered-delivery-plan.md).

## Tier 0 — Foundation alignment

- Chốt public-product direction, PRD, capability IDs, diagrams, metrics, privacy và contracts.
- Hoàn thiện identity/consent boundary, shared error model, export/delete inventory và quality baseline.

**Gate:** không còn mâu thuẫn giữa product promise, tier order, UX, privacy, architecture và code status.

## Tier 1 — Reliable core focus

- Hoàn thiện manual capture/Brain Dump → confirmed next action → focus → done/still stuck.
- Chứng minh manual fallback, schema validation, event minimization, mobile và keyboard behavior.

**Gate:** người test hoàn thành focus flow không cần hướng dẫn; lỗi AI/analytics không chặn core flow.

## Tier 2 — Gentle return

- Open Seed, return eligibility, Return Ritual và in-app reminder opt-in.
- Instrument seed/reminder/return events cùng privacy/timezone/idempotency guardrails.

**Gate:** user tắt reminder tức thời; seed/return không lộ backlog hoặc private content trong analytics.

## Tier 3 — Personal focus space

- Theme/local preferences, ambient audio hoặc YouTube click-to-load.
- Validate focus presets như một capability tạo giá trị lặp lại.

**Gate:** personalization không thêm bước bắt buộc và không làm audio thành dependency của timer.

## Tier 4 — Public alpha

- Landing/onboarding, demo boundary, Weekly Letter, contextual feedback và public data-rights UX.
- Mời cohort nhỏ ngoài phạm vi đồ án; theo dõi activation, stuck-to-start, D3/D7, seed conversion và support burden.

**Gate:** người lạ hiểu và dùng core loop; release/support/privacy paths sẵn sàng; evidence quyết định mechanic nào được giữ.

## Tier 5 — Paid and provider validation

- Kiểm chứng Pine Plus proposition trước; sau đó mới triển khai entitlement và billing adapter.
- Cân nhắc sync, outbound reminders và advanced insight/ML theo usage, cost và privacy evidence.

**Gate:** recurring value, conversion, cancellation/support behavior, unit economics và provider review đủ rõ để mở thanh toán thật.

## Current recommended execution

1. Core-flow gap audit.
2. Complete Tier 1.
3. Deliver Open Seed as the first Tier 2 vertical slice.
4. Deliver Return Ritual, then in-app reminder.
5. Add local theme before audio/presets.
6. Prepare public alpha surface and evidence collection.
7. Run paid discovery before implementing billing.

## Parallel technical modernization track

The Java/distributed architecture is a learning and portfolio track; it does not reorder product tiers or justify unfinished user value. Deliver it in independently runnable gates:

1. Establish the Spring Boot foundation after removing the previous API.
2. Rebuild the task/focus vertical slice with contract compatibility and one data writer.
3. Add Redis for explicit rate-limit, idempotency, progress or lock use cases.
4. Add RabbitMQ with transactional outbox/inbox and extract asynchronous AI processing.
5. Extract Engagement only after the Java core, messaging recovery and observability gates pass.

At every gate, the implemented slice must remain runnable and have an artifact or feature rollback. The removed Node.js routes are available only through Git history, not as a live fallback. See [Target Microservices Architecture](../04-engineering/microservices-architecture.md).
