# Beneath the Pine

> Người bạn đồng hành tiếng Việt, dịu dàng đưa cảm giác quá tải về một hành động nhỏ có thể bắt đầu ngay.

Beneath the Pine dành cho những lúc một việc bỗng quá lớn để khởi đầu. Sản phẩm giúp người dùng dừng lại, gọi tên điều quan trọng và đi một bước bình tĩnh—không xem năng suất là thước đo giá trị của họ.

Đây là công cụ hỗ trợ, không chẩn đoán, điều trị hay thay thế chuyên gia sức khỏe.

## Bắt đầu từ đây

| Bạn muốn… | Hãy đọc… |
| --- | --- |
| Hiểu định hướng và ranh giới sản phẩm | [Product Direction](docs/00-foundation/product-direction.md) |
| Làm việc với ứng dụng | [Engineering](docs/04-engineering/README.md) |
| Thay đổi một luồng giao diện | [Design](docs/03-design/README.md) |
| Thay đổi hành vi AI | [AI Implementation Handbook](docs/ai/README.md) |
| Xem toàn bộ hồ sơ quyết định | [Documentation Map](docs/README.md) |

## Phát triển local

### Cần có

- Node.js 22.12 trở lên
- pnpm 10.32.1
- [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started) để chạy đầy đủ local stack

### Chạy workspace

1. Sao chép `.env.example` thành `.env`.
2. Tạo `CONTENT_ENCRYPTION_KEY` gồm 32 byte, mã hóa base64; chỉ đặt khóa này trong `.env`.
3. Trong `supabase/`, chạy `supabase start`; chép URL, publishable key, service-role key và database URL được trả về vào các biến tương ứng trong `.env` gốc.
4. Từ thư mục gốc repository, cài dependencies bằng `pnpm install`.
5. Mở web và API ở hai terminal riêng:

   ```sh
   pnpm dev
   pnpm dev:api
   ```

Web chạy tại `http://localhost:5173`; API dùng URL trong `.env` (mặc định là `http://localhost:3001/api/v1`).

> **Một lối đi local nhẹ nhàng.** Khi chưa cấu hình Supabase, web chủ động chạy ở local demo mode. Dữ liệu riêng tư chỉ nằm trong browser đó và không thay thế hành vi sản phẩm đã xác thực. Production luôn yêu cầu Supabase Auth và beta membership đang hoạt động.

### Lệnh hữu ích

| Lệnh | Mục đích |
| --- | --- |
| `pnpm lint` | Type-check các workspace package áp dụng |
| `pnpm test` | Chạy test suite của workspace |
| `pnpm build` | Tạo production build |
| `pnpm db:generate` | Tạo Drizzle artifacts cho API |
| `pnpm db:migrate` | Áp dụng database migrations đã version |
| `pnpm db:seed` | Seed dữ liệu phát triển local |

Chạy `pnpm lint`, `pnpm test` và `pnpm build` trước khi bàn giao thay đổi chạm vào web, API hoặc contracts.

## Bản đồ workspace

| Đường dẫn | Trách nhiệm |
| --- | --- |
| `apps/web` | Trải nghiệm React/Vite và beta-admin shell |
| `apps/api` | Fastify API, AI orchestration và data-lifecycle jobs |
| `packages/contracts` | Zod schemas và API types dùng chung |
| `supabase` | Cấu hình Supabase local và schema migrations đã version |
| `docs` | Quyết định về product, design, engineering, safety, testing, operations và release |
| `ml` | Tài liệu training AI tái lập được cùng safe public fixtures |

## Nguyên tắc làm việc

- Giữ dữ liệu người dùng riêng tư theo mặc định; không commit secret, dữ liệu cá nhân hay transcript nghiên cứu thật.
- Khi chi tiết triển khai xung đột với tài liệu product, design, privacy hoặc ADR, các tài liệu đó là nguồn quyết định.
- Mỗi thay đổi hành vi AI phải cập nhật prompt record, output contract, evaluation và safety policy cùng nhau.
- Luôn ưu tiên bước tiếp theo nhỏ nhất nhưng thực sự hữu ích—trong sản phẩm lẫn codebase.

## Trạng thái dự án

Repository đã có React/Vite web client, Fastify API, shared contracts và local Supabase migrations. Tài liệu product và implementation là tài liệu sống; [Documentation Map](docs/README.md) giải thích trạng thái và thẩm quyền của chúng.
