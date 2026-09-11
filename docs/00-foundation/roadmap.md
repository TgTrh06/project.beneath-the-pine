# Roadmap — Tier 0–5 Public Product

- **Status:** Draft
- **Planning horizon:** Core validation → public alpha → paid validation
- **Last updated:** 2026-09-11

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

## Thứ tự thực hiện theo nền tảng

| Giai đoạn | Kết quả | Gate |
| --- | --- | --- |
| D0 — Tài liệu | NestJS/Drizzle/mobile direction, phân tích topology, API và cấu trúc repository | Topology và Expo đã chốt; hoàn thiện tài liệu cho kế hoạch code |
| D1 — API foundation | Kế hoạch code riêng, tổ chức module, Drizzle baseline, account/ownership và task parity | PostgreSQL integration, security/contract tests, migration/rollback review |
| D2 — Web core + API | Web dùng API thật cho một core loop, focus lifecycle và manual fallback | API độc lập browser, version/error contract, mutation recovery; Expo đã chốt; native auth và hệ điều hành đầu tiên được duyệt |
| D3 — Mobile core | Một core loop trên nền tảng mobile đã chọn, cùng account và dữ liệu API | Thiết bị thật/emulator: auth expiry, app resume, mất mạng, read/write ownership |
| D4 — Product expansion | T2–T4 được ưu tiên theo feedback mobile, giữ web tương thích | Retention, privacy, support và platform release readiness |
| D5 — Paid validation | T5 khi có bằng chứng giá trị lặp lại | Provider/payment review riêng |

Không đợi toàn bộ web public alpha hoặc paid features mới bắt đầu mobile. Product tiers phía trên vẫn giữ dependency nghiệp vụ; D0–D5 mô tả thứ tự delivery của client/backend, không tạo pricing tiers.

## Topology và hạ tầng theo nhu cầu

Core modular monolith và inference độc lập đã được chốt. Worker chỉ được thêm khi cần job bền vững hoặc resource isolation. Redis, RabbitMQ và tách Engagement không còn là milestone bắt buộc. Đánh giá bằng workload, owner, failure model và chi phí, theo [Architecture Options](../04-engineering/architecture-options.md).

Hiện trạng backend cũ và bản nháp NestJS được giữ trong khi review tài liệu. Giai đoạn này không chuyển thư mục, thay dependency hoặc database. Mỗi bước implementation sau cần kế hoạch và xác nhận riêng theo delivery contract.
