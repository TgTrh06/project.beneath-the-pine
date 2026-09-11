# Core API scaffold

NestJS modular monolith dùng PostgreSQL + Drizzle. Đây là bộ khung để review 12 module; chưa có business endpoints hoặc authentication. Chưa có AI/inference integration, worker hay mobile app.

## Chạy từ repository root

```sh
pnpm dev:api:scaffold
pnpm lint:api
pnpm test:api
pnpm build:api
```

Dependencies dùng workspace pnpm. Node >=22.12 và pnpm 10.32.1. Sau build có thể chạy `pnpm --filter @beneath-the-pine/api start`.

Default: http://127.0.0.1:8081. `GET /health/live` trả 200; `GET /health/ready` trả 503 nếu chưa cấu hình/kết nối DB. Khi DB reachable, readiness chỉ báo connectivity và stage scaffold, không khẳng định schema/nghiệp vụ đã sẵn sàng.

Có thể copy `.env.example` trong thư mục này thành `.env`. API chỉ tự nạp `apps/api/.env`, không nạp root env. Environment process có ưu tiên hơn file. Không cần DB để chạy liveness hoặc tests.

| Biến | Default / ý nghĩa |
| --- | --- |
| API_HOST | 127.0.0.1; chỉ local mặc định |
| API_PORT | 8081; tách khỏi draft cũ |
| API_WEB_ORIGIN | http://localhost:5173; một origin chính xác |
| API_LOG_LEVEL | info; silent/error/warn/info/debug |
| API_DATABASE_URL | Không có; PostgreSQL URL tùy chọn, server-only |
| API_DB_POOL_MAX | 5; giới hạn 1–20 |
| API_DB_TIMEOUT_MS | 3000; giới hạn 100–30000 ms |

Root `dev:api` và `db:init` vẫn trỏ legacy. Web chưa chuyển sang scaffold. Không chạy lệnh database cũ để thiết lập Drizzle mới.

## Cấu trúc và kiểm tra

- `src/modules/<name>`: Nest module và README nghiệp vụ cho 12 module.
- `src/platform`: config, database, HTTP, security và health.
- `drizzle.config.ts`: config tooling cho schema thuộc module, chưa có schema/migration.
- `scripts/check-boundaries.cjs`: kiểm tra import/cycle; domain/application không import Nest hoặc persistence.
- `test`: composition, config, HTTP/access, boundary và timeout driver.

Guard mặc định từ chối registered route chưa đánh dấu Public. Hiện chỉ health được công khai. Đây chưa phải xác thực; không nhận user ID tự khai báo làm credential. Route nghiệp vụ chưa tồn tại trả 404.

HTTP có request ID server tạo, no-store, Helmet, JSON limit 32 KiB, CORS origin cố định và error envelope không lộ exception. Chưa có rate limit, auth/session/CSRF implementation; phải bổ sung trong slice auth trước khi mở nghiệp vụ.

Tests dùng ứng dụng Nest thực và HTTP request, mock riêng nhánh database reachable. Driver timeout thử với TCP endpoint không trả PostgreSQL handshake. Chưa xác minh với PostgreSQL thật hoặc migration.

## Review và phát triển tiếp

Đọc [kế hoạch module](../../docs/04-engineering/module-delivery-plan.md) và README từng module. API paths trong đặc tả là dự kiến. Chỉ thêm domain/application/infrastructure/presentation khi có code thật; cross-module contract qua public API tối thiểu, không export schema/repository.

Drizzle ORM 0.45.2 và Kit 0.31.10 đã được pin. Chưa có database schema hoặc migration journal; không chạy generate/apply từ scaffold này trước baseline review. Không có migration script hoặc credential trong Kit config.
