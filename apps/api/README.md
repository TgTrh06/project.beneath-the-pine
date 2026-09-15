# Core API

NestJS modular monolith dùng PostgreSQL + Drizzle. Identity đã có xác thực cookie/CSRF và RBAC Wanderer/Pine Keeper; các module nghiệp vụ khác còn là bộ khung. Xem [hướng dẫn migration và seed](src/modules/identity/README.md). Chưa có AI/inference integration, worker hay mobile app.

## Chạy từ repository root

```sh
pnpm dev:api
pnpm lint:api
pnpm test:api
pnpm build:api
```

Dependencies dùng workspace pnpm. Node >=22.12 và pnpm 10.32.1. Sau build có thể chạy `pnpm --filter @beneath-the-pine/api start`.

## PostgreSQL local bằng Docker

Docker Desktop cần chạy. Từ repository root:

```sh
pnpm db:local:up
pnpm dev:api
```

Compose chạy PostgreSQL 17 trên `127.0.0.1:5433`, dùng database `btp_review` và volume `beneath-the-pine-postgres-local`. File `apps/api/.env` local đã trỏ API tới database này và bị Git bỏ qua. Kiểm tra `GET http://127.0.0.1:8081/health/ready`; kết nối thành công trả 200.

```sh
pnpm db:local:logs
pnpm db:local:down
```

`db:local:down` dừng và bỏ container/network, giữ volume. Chỉ xóa volume bằng thao tác riêng khi thực sự muốn mất dữ liệu local.

Default: http://127.0.0.1:8081. `GET /health/live` trả 200; `GET /health/ready` trả 503 nếu chưa cấu hình/kết nối DB. Khi DB reachable, readiness chỉ báo connectivity và stage scaffold, không khẳng định schema/nghiệp vụ đã sẵn sàng.

Có thể copy `.env.example` trong thư mục này thành `.env`. API chỉ tự nạp `apps/api/.env`, không nạp root env. Environment process có ưu tiên hơn file. Không cần DB để chạy liveness hoặc tests.

| Biến | Default / ý nghĩa |
| --- | --- |
| API_HOST | 127.0.0.1; chỉ local mặc định |
| API_PORT | 8081 |
| API_WEB_ORIGIN | http://127.0.0.1:5173; một origin chính xác |
| API_LOG_LEVEL | info; silent/error/warn/info/debug |
| API_DATABASE_URL | Không có mặc định; local Docker dùng `127.0.0.1:5433/btp_review` |
| API_DB_POOL_MAX | 5; giới hạn 1–20 |
| API_DB_TIMEOUT_MS | 3000; giới hạn 100–30000 ms |

Web đã dùng Identity API. Các lệnh migration/seed là thao tác tường minh, xem Identity README; SQL lịch sử chỉ là tài liệu tham khảo.

## Cấu trúc và kiểm tra

- `src/modules/<name>`: Nest module và README nghiệp vụ cho 12 module.
- `src/platform`: config, database, HTTP, security và health.
- `drizzle.config.ts`: config tooling cho schema thuộc module; Identity có baseline migration và journal.
- `scripts/check-boundaries.cjs`: kiểm tra import/cycle; domain/application không import Nest hoặc persistence.
- `test`: composition, config, HTTP/access, boundary và timeout driver.

Guard Identity yêu cầu phiên cookie hợp lệ trên route riêng tư, kiểm tra CSRF cho mutation và role cho API quản trị. Health và các bước khởi tạo/đăng nhập/đăng ký là Public; controller auth vẫn kiểm tra CSRF và giới hạn tần suất. Route nghiệp vụ chưa tồn tại trả 404.

HTTP có request ID server tạo, no-store, Helmet, JSON limit 32 KiB, CORS origin cố định và error envelope không lộ exception. Identity có rate limit theo IP trong một API process, cookie session trong PostgreSQL và CSRF.

Tests dùng ứng dụng Nest thực và HTTP request, mock riêng nhánh database reachable. Driver timeout thử với TCP endpoint không trả PostgreSQL handshake. Chưa xác minh với PostgreSQL thật hoặc migration.

## Review và phát triển tiếp

Đọc [kế hoạch module](../../docs/04-engineering/module-delivery-plan.md) và README từng module. API paths trong đặc tả là dự kiến. Chỉ thêm domain/application/infrastructure/presentation khi có code thật; cross-module contract qua public API tối thiểu, không export schema/repository.

Drizzle ORM 0.45.2 và Kit 0.31.10 đã được pin. Identity có schema và migration journal. Chỉ chạy migration/seed sau khi kiểm tra và duyệt database đích; Kit config không chứa credential.
