# Infrastructure Plan

- **Ngày:** 2026-09-11
- **Trạng thái:** Thiết kế để review; chưa chọn provider hay deploy.

## Baseline

Web có cấu hình Vercel. Dockerfile và CI cũ còn được giữ. Draft NestJS chưa có image/CI/migration Drizzle hoàn chỉnh. Python inference pilot độc lập. Không có app mobile, push provider, Redis hoặc RabbitMQ đang được triển khai bởi thay đổi tài liệu.

## Kiến trúc đã chốt, hosting chưa chọn

Một NestJS API artifact và PostgreSQL, web dùng API qua HTTPS. Mobile sau đó dùng cùng endpoint công khai; không cần gateway/BFF riêng chỉ vì có mobile. Drizzle migration là bước quản trị riêng, không chạy tự động lúc API boot.

Browser session hiện ở process memory trong baseline. Trước chạy nhiều API instance phải chọn store/lifecycle và kiểm tra expiry/revocation/failure. Native auth chưa chọn, không có lý do mặc định thêm Redis cho nó.

## Mở rộng theo bằng chứng

Đo API latency, error rate, CPU/event-loop, DB pool và query trước khi scale. Công việc dài/bền vững có thể cần worker và durable job state. Broker/cache/provider chỉ được chọn cùng use case và failure model; không theo lịch cố định Redis → RabbitMQ → microservices.

Tách domain service yêu cầu owner, dữ liệu, migration, contract/version và recovery riêng. [Architecture Options](../04-engineering/architecture-options.md).

## Quyết định trước release

Hosting/region, secret management, PostgreSQL backup/restore, TLS, session/native auth, logging/alerts và trách nhiệm vận hành. Với mobile cần distribution, API compatibility window, redirect/deep link và chính sách phiên bản. Các mục này là release gates, không phải implementation hiện có.
