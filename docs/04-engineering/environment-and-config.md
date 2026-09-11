# Environment and Configuration

- **Ngày:** 2026-09-11
- **Trạng thái:** Scaffold có cấu hình riêng; legacy root env chưa chuyển.

## Phân biệt hiện tại và đích

Root .env.example còn cấu hình backend cũ. Scaffold chỉ tự đọc `apps/api/.env`, theo [template API](../../apps/api/.env.example) và [hướng dẫn biến môi trường](../../apps/api/README.md). Process env ưu tiên hơn file; mặc định host 127.0.0.1, port 8081, web origin http://localhost:5173. API_DATABASE_URL tùy chọn: không có thì live 200, ready 503. Pool/timeout được kiểm tra kiểu và giới hạn; lỗi config chỉ nêu tên field.

| Nhóm cấu hình | Consumer | Boundary |
| --- | --- | --- |
| VITE_API_URL và cấu hình giao diện | Web bundle | Công khai; không có secret |
| API URL và app version mobile tương lai | Mobile app | Công khai; không có DB/provider credential hoặc OAuth client secret |
| Database connection/credential | Backend và migration tooling | Server-only, quyền tối thiểu, secret store khi deploy |
| Port, allowed web origin, request/body limits | API | Typed validation, lỗi không in giá trị nhạy cảm |
| Cookie/session settings hiện tại | Browser auth adapter | HTTPS, SameSite/CSRF và session store cần release review |
| Native auth client/issuer/redirect settings | Auth adapters tương lai | Chưa chọn; không tự thêm biến môi trường |
| Provider URL/token/model settings | AI boundary | Chỉ thêm khi duyệt slice tích hợp |

Drizzle config không được import vào web/mobile. Migration credential có thể cần quyền khác runtime credential; role và environment phải được chọn rõ trước apply.

## Môi trường

Local/test chỉ dùng dữ liệu tổng hợp. Test PostgreSQL tách khỏi database dev có dữ liệu. Staging và production không dùng chung DB, key hoặc provider secrets. Preview web không nhận server secrets.

Native emulator/device không mặc định truy cập được localhost của máy chạy API; cấu hình địa chỉ local/HTTPS và CORS browser cần hướng dẫn riêng khi chọn SDK. CORS không phải authentication và không cấp quyền cho native client.

## Giai đoạn triển khai sau

Version/driver và timeout/pool đã có trong scaffold. Session settings chỉ thêm cùng auth lifecycle; credential migration được chọn trong baseline plan. Không tự cấu hình Redis/RabbitMQ hoặc provider cho capability chưa triển khai. Xem [Drizzle](drizzle-data-access.md), [API strategy](web-mobile-api-strategy.md).
