# Retained Supabase Schema History

Thư mục này giữ cấu hình Supabase local và database migrations đã version như lịch sử dữ liệu của Beneath the Pine. Supabase Auth không phải identity provider đã chọn cho Core hiện tại. Các policy dùng `auth.uid()` chỉ là đầu vào lịch sử và không bảo vệ schema do `apps/api` sở hữu.

## Khởi động local

1. Cài [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started).
2. Trong thư mục này, chạy `supabase start`.
3. Dùng credential do Supabase CLI trả về chỉ cho việc kiểm tra lịch sử schema này; không đưa chúng vào web hoặc `apps/api/.env` mặc định.
4. Xem migration trong thư mục này là lịch sử sản phẩm và không sửa file đã áp dụng. Schema Drizzle mới sẽ thuộc từng module trong `apps/api` sau khi baseline được duyệt.

## Giữ ranh giới sạch

- Only server code may use privileged service credentials; never place them in browser code.
- Web client chỉ nhận publishable key.
- Thêm schema changes bằng migration mới; không sửa applied migration history.
- Local data chỉ dùng để phát triển. Không import production data hoặc commit secrets.

Xem [Data Model](../docs/04-engineering/data-model.md) và [Security & Privacy](../docs/06-security-privacy/README.md) để biết các ràng buộc rộng hơn.
