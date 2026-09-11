# PostgreSQL, Drizzle và quản lý migration

- **Trạng thái:** Scaffold có Drizzle connection/config; schema, repository nghiệp vụ và migration bên dưới còn là thiết kế.
- **Ngày:** 2026-09-11
- **Quyền sở hữu:** Backend giữ toàn bộ credential và truy cập PostgreSQL.

## Vai trò

Drizzle ORM phục vụ schema TypeScript, query và transaction. Drizzle Kit phục vụ workflow schema/migration; đây là công cụ phát triển, không phải thành phần chạy trên client. Tài liệu chính thức phân biệt các thao tác generate, migrate, pull và push; dự án sẽ dùng SQL migration được review thay vì coi thay đổi schema TypeScript là thay đổi database đã áp dụng. [Drizzle ORM](https://orm.drizzle.team/docs/overview), [Drizzle Kit](https://orm.drizzle.team/docs/kit-overview).

Scaffold chọn Drizzle ORM 0.45.2, Kit 0.31.10 và node-postgres. `pg` phía dưới Drizzle là driver kết nối; repository nghiệp vụ sẽ dùng Drizzle. Config hiện chưa có schema hoặc migration credential; không chạy generate/apply trước baseline review. Xem [API README](../../apps/api/README.md).

## Nguồn sự thật và ranh giới

| Thành phần | Mục đích | Không được hiểu thành |
| --- | --- | --- |
| Schema TypeScript theo module | Mô hình persistence đích, kiểu query | API contract hoặc database đã migrate |
| SQL migration và metadata đã commit | Lịch sử biến đổi được review | Lệnh được phép chạy trên production |
| Schema thực tế + migration journal | Trạng thái database được chọn | Luôn giống file trong repository |
| API/Zod/OpenAPI contracts | Public payload, compatibility | Row database xuất thẳng cho client |

Đề xuất đặt schema trong infrastructure của module, tập hợp chúng bằng `apps/api/drizzle.config.ts`, lưu migration chung trong `apps/api/drizzle/`. Monolith có một owner triển khai/migration. Module sở hữu bảng và truy cập của mình; nếu tách service sau này phải tách quyền ghi và lịch sử migration, không tiếp tục dùng package database chung.

## Truy cập dữ liệu

- Repository nhận user ID từ principal đã xác thực; mọi read/update/delete tài nguyên riêng đều lọc resource ID và owner ID.
- Drizzle không tự thêm authorization hoặc bật RLS. RLS public cũ không bảo vệ `core.*`.
- Map row sang response được định nghĩa rõ; không trả password hash, internal flags hoặc trường audit nội bộ.
- Query có parameter binding; không ghép input user vào raw SQL, tên cột hoặc sort expression. Sort/filter dùng allowlist.
- Use case xác định transaction. Tạo task + confirmed next-action cùng transaction; repository dùng cùng transaction handle, không mở transaction rời.
- Archive terminal cần update có điều kiện hoặc row lock được review để tránh lost update. Tách service sẽ làm thay đổi guarantee này.
- Idempotency cho retry mobile cần unique constraint và durable record có owner, request fingerprint, response/result reference và retention; không chỉ cache trong RAM.
- Connection pool, timeout và shutdown phải có cấu hình và test. Không gọi provider AI trong transaction database dài.

## Ba trường hợp database khi chuyển từ backend cũ

| Trường hợp | Xử lý cần duyệt trước khi chạy |
| --- | --- |
| Database local mới và rỗng | Tạo baseline từ schema đã review; chạy migration trên database test riêng trước |
| Database đã có core.accounts/tasks/next_actions và migration cũ history | Kiểm kê version/checksum, constraint, index, enum, timezone và dữ liệu; dựng bản sao để kiểm tra tương đương; thiết kế baseline journal Drizzle không replay CREATE TABLE |
| Chỉ có schema public Supabase lịch sử hoặc có cả hai | Xác định owner và nguồn dữ liệu; không gộp public/core chỉ vì tên bảng giống nhau; mapping và migration dữ liệu là kế hoạch riêng |

Không đoán trạng thái database từ file. Không dùng `push` vào database hiện hữu, không sửa migration đã áp dụng, không tạo journal “đã chạy” nếu chưa có quy trình baseline được kiểm chứng. Không chạy migration lúc Nest khởi động. Script `db:init` bản nháp hiện tại chưa phải workflow Drizzle được duyệt.

## Workflow đích

1. Sửa schema của module theo scope được duyệt.
2. Generate migration, đọc SQL và đánh giá lock, backfill, default, constraint và ảnh hưởng credential/ownership.
3. Kiểm tra trên database test rỗng và bản sao schema trước đổi; chỉ dùng dữ liệu tổng hợp.
4. Review code, SQL, compatibility và rollback/forward-fix cùng nhau.
5. Apply bằng bước riêng, có environment và quyền rõ ràng. Chạy trên production vẫn cần ủy quyền riêng.
6. Kiểm tra journal, schema và hành vi API sau apply.

Migration không tự cung cấp rollback an toàn. Với thay đổi dữ liệu không đảo ngược được, ưu tiên expand/contract, backup đã kiểm tra restore và forward-fix. Trong lần chuyển framework, nếu giữ nguyên schema thì rollback artifact có thể khả thi nhưng session phải được đăng nhập lại; phải kiểm tra tương thích hash, ID và payload trước khi khẳng định.

## Kiểm chứng bắt buộc khi triển khai

Test repository với PostgreSQL thật: constraints, transaction rollback, ownership hai người dùng, email unique/normalized, concurrent update/archive và connection failure. Thêm migration test cho database mới và baseline database migration cũ giả lập. Test Drizzle schema không thay thế test API contract. Không thay lịch sử Supabase hoặc dữ liệu thật trong giai đoạn tài liệu.
