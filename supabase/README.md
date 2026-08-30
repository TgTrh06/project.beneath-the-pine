# Local Supabase

Thư mục này giữ cấu hình Supabase local và database migrations đã version—ranh giới dữ liệu chung của Beneath the Pine.

## Khởi động local

1. Cài [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
2. Trong thư mục này, chạy `supabase start`.
3. Chép API URL, publishable key, service-role key và database URL được trả về vào các biến tương ứng trong `.env` gốc.
4. Quay về repository root và chạy `pnpm db:migrate` để áp dụng application migrations đã version.

## Giữ ranh giới sạch

- API chỉ dùng service credentials ở server; không bao giờ đưa chúng vào browser code.
- Web client chỉ nhận publishable key.
- Thêm schema changes bằng migration mới; không sửa applied migration history.
- Local data chỉ dùng để phát triển. Không import production data hoặc commit secrets.

Xem [Data Model](../docs/04-engineering/data-model.md) và [Security & Privacy](../docs/06-security-privacy/README.md) để biết các ràng buộc rộng hơn.
