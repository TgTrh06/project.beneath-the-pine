# Technology Stack

- **Ngày:** 2026-09-11
- **Quyết định:** [ADR-0011](adr/0011-nestjs-drizzle-mobile-direction.md); [ADR-0012](adr/0012-modular-monolith-proposal.md) đã Accepted.

## Stack đích và mức cam kết

| Layer | Lựa chọn | Trạng thái |
| --- | --- | --- |
| Backend | NestJS + TypeScript | Người dùng đã chọn; migration chưa hoàn tất |
| Database | PostgreSQL | Giữ hướng dữ liệu quan hệ |
| Data access/migration | Drizzle ORM 0.45.2 + Drizzle Kit 0.31.10 | Đã cài, driver node-postgres; chưa có schema/migration |
| Web | React + Vite | Client đầu tiên, implementation hiện có |
| Mobile | Client chính về dài hạn | React Native + Expo đã chọn; hệ điều hành đầu tiên còn mở |
| Contracts | JSON API, Zod hiện có; OpenAPI đa ngôn ngữ được đề xuất | Chưa có pipeline OpenAPI đích |
| Topology | Core modular monolith; inference độc lập | Đã chốt; worker theo nhu cầu cụ thể |
| Identity | Cùng account và authorization cho mọi client | Browser session là baseline; native credential lifecycle chưa chọn |
| AI | Python inference pilot hiện có | Giữ độc lập, chưa nối vào backend |
| Hosting | Web có cấu hình Vercel; backend/mobile distribution chưa chọn | Không có quyền deploy từ tài liệu này |
| Redis/RabbitMQ | Không bắt buộc trong stack ban đầu | Chỉ đánh giá khi có use case được duyệt |

## Hiện trạng khác với đích

Repository chỉ còn Core NestJS tại `apps/api`; workspace, scripts và CI dùng Node/pnpm. Ba SQL cũ được giữ một bản trong [legacy-schema](legacy-schema/README.md) để review Drizzle baseline, không phải migration đang hoạt động.

`apps/api` đã có NestJS module composition, platform và Drizzle connection. Chưa có business logic, Drizzle schema/journal hoặc mobile. AI không thuộc phạm vi scaffold; xem [kế hoạch module](module-delivery-plan.md).

## Quy tắc lựa chọn

Version stable Drizzle và driver node-postgres đã được chọn cho scaffold. Không thêm ORM thứ hai, broker, cache, gateway hoặc package dùng chung để dự phòng. Thư viện frontend/mobile không được import persistence code. Chi tiết: [Repository Structure](repository-structure.md), [Drizzle](drizzle-data-access.md), [API Strategy](web-mobile-api-strategy.md).
