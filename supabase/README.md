# Local Supabase

Thư mục này giữ cấu hình Supabase local và database migrations đã version—ranh giới dữ liệu chung của Beneath the Pine.

## Khởi động local

1. Cài [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
2. Trong thư mục này, chạy `supabase start`.
3. Chép API URL, publishable key, service-role key và database URL được trả về vào các biến tương ứng trong `.env` gốc.
4. Treat the migrations in this directory as retained product-schema history. Do not edit applied files. New Java service migrations live under `services/core-service/src/main/resources/db/migration` and are applied by Flyway when the service starts against an explicitly selected database.

## Giữ ranh giới sạch

- Only server code may use privileged service credentials; never place them in browser code.
- Web client chỉ nhận publishable key.
- Thêm schema changes bằng migration mới; không sửa applied migration history.
- Local data chỉ dùng để phát triển. Không import production data hoặc commit secrets.

Xem [Data Model](../docs/04-engineering/data-model.md) và [Security & Privacy](../docs/06-security-privacy/README.md) để biết các ràng buộc rộng hơn.
