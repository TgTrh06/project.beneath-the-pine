# Beneath the Pine

> A gentle Vietnamese companion that turns overwhelm into one small action a person can begin now.

Beneath the Pine giúp người đang quá tải chọn một hành động nhỏ, bắt đầu focus và quay lại mà không bị phán xét. Sản phẩm không chẩn đoán hoặc thay thế chăm sóc chuyên môn.

## Định hướng phát triển

**Mobile là nền tảng sản phẩm chính; web được xây trước để hoàn thiện sản phẩm và API dùng chung.** Backend đích là **NestJS + TypeScript, PostgreSQL + Drizzle**. Mobile dùng React Native + Expo; hệ điều hành ra mắt đầu tiên và native authentication chưa được chọn.

Đã có bộ khung Core modular monolith tại `apps/api` để review 12 module. Giai đoạn này chưa có AI; inference độc lập là hướng tương lai và worker chỉ thêm khi có nhu cầu cụ thể. Xem [kế hoạch module](docs/04-engineering/module-delivery-plan.md).

| Bạn muốn làm gì | Đọc |
| --- | --- |
| Hiểu định hướng và phạm vi | [Product Direction](docs/00-foundation/product-direction.md), [MVP Scope](docs/00-foundation/mvp-scope.md) |
| So sánh monolith, worker và microservices | [Architecture Options](docs/04-engineering/architecture-options.md) |
| Review cấu trúc thư mục | [Repository Structure](docs/04-engineering/repository-structure.md) |
| Thiết kế API cho web/mobile | [Web/Mobile API Strategy](docs/04-engineering/web-mobile-api-strategy.md) |
| Làm việc với Drizzle và migration | [Drizzle Data Access](docs/04-engineering/drizzle-data-access.md) |
| Hiểu thứ tự triển khai | [Roadmap](docs/00-foundation/roadmap.md), [Tiered Delivery Plan](docs/02-product/tiered-delivery-plan.md) |
| Đọc toàn bộ tài liệu | [Documentation Map](docs/README.md) |

## Hiện trạng repository

| Path hiện có | Trạng thái |
| --- | --- |
| `apps/web` | React/Vite web; API adapter và local demo |
| `apps/api` | NestJS + Drizzle scaffold; health và platform, chưa có nghiệp vụ |
| `packages/contracts` | Zod schemas/browser API types hiện có |
| `services/inference-service` | Python/FastAPI pilot độc lập, chưa nối vào API |
| `supabase` | Lịch sử schema public và RLS |
| `docs`, `ml` | Tài liệu sản phẩm/kiến trúc và tài liệu nghiên cứu mô hình |

`apps/api` là Core backend duy nhất. SQL của backend cũ chỉ còn là tài liệu baseline tại `docs/04-engineering/legacy-schema`; chưa phải Drizzle migrations. `apps/mobile` chưa được tạo; web chưa chuyển sang API mới.

## Chạy web hiện tại

Dùng Node.js >=22.12 và pnpm 10.32.1 theo package metadata hiện có. `pnpm dev` chạy web tại localhost:5173 sau khi dependencies đã được cài. Không có `VITE_API_URL` thì web dùng local demo; demo không chứng minh backend hoạt động.

Chạy API bằng `pnpm dev:api` tại port 8081. Kiểm tra bằng `pnpm lint:api`, `pnpm test:api`, `pnpm build:api`. Chỉ `/health/live` và `/health/ready` hoạt động; chưa cấu hình DB thì readiness trả 503. Xem [API README](apps/api/README.md) để cấu hình local env riêng.

Để thử PostgreSQL local, bật Docker Desktop rồi chạy `pnpm db:local:up` trước API. Compose chỉ bind `127.0.0.1:5433`, giữ dữ liệu trong volume local và chưa tạo schema nghiệp vụ hay chạy migration.

## Quyết định và bước tiếp theo

[ADR-0011](docs/04-engineering/adr/0011-nestjs-drizzle-mobile-direction.md) ghi nhận hướng người dùng đã chọn. [ADR-0012](docs/04-engineering/adr/0012-modular-monolith-proposal.md) ghi nhận topology đã được chấp nhận.

Review [ownership, API dự kiến và các slice](docs/04-engineering/module-delivery-plan.md) trước khi triển khai nghiệp vụ. Database hiện hữu cần kiểm kê và baseline strategy riêng. Chưa có deployment hoặc migration được thực hiện trong scaffold này.
