# Export và xóa tài khoản — PrivacyModule

Privacy điều phối đồng bộ hai endpoint đã có, với principal do Identity xác thực:

- `GET /api/v1/me/data-export`: lấy dữ liệu qua port của Profile, Preferences, Seed, Camp, Pact, Focus và Memory. Không export credential hoặc nội dung Camp đã mất quyền truy cập.
- `DELETE /api/v1/me/account`: kiểm tra lại mật khẩu; chuyển quyền hoặc xóa Camp, sau đó xóa account trong cùng transaction. Phát thông báo thu hồi sau commit; controller đăng xuất và xóa cookie theo hành vi hiện có.

`application/privacy.service.ts` chứa điều phối thuần TypeScript. `application/privacy.ports.ts` tổng hợp các interface của module sở hữu dữ liệu. `presentation/privacy.controller.ts` xử lý HTTP và cookie; `privacy.module.ts` nối dependency bằng NestJS factory.

Privacy không sở hữu bảng, không truy vấn SQL và không thêm job retention. Camp sở hữu chuyển quyền/xóa Camp, Identity sở hữu xóa account, và các foreign key hiện có giữ quy tắc cascade. Export giữ nguyên các trường lưu trữ và thứ tự truy vấn hiện có, không tạo snapshot transaction mới.

Kiểm thử PostgreSQL xác nhận dữ liệu export theo quyền, từ chối mật khẩu sai, rollback chuyển quyền/xóa Camp và cascade khi xóa account thất bại, cùng sự kiện chỉ xuất hiện sau commit. Xem [bản đồ ownership](../../../../../docs/04-engineering/module-ownership.md) và [báo cáo kiểm chứng](../../../../../docs/07-testing/architecture-refactor-verification.md).
