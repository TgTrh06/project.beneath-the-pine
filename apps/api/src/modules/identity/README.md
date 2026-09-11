# Tài khoản và xác thực — IdentityModule

- **Trạng thái code:** Nest module được đăng ký; chưa có controller, use case, repository hoặc schema nghiệp vụ.
- **Thứ tự triển khai:** P0 / S1.
- **Phạm vi hiện tại:** Core thủ công, không AI.

## Trách nhiệm và dữ liệu

Đăng ký, đăng nhập, đăng xuất, trạng thái account và vòng đời credential.

**Dữ liệu sở hữu dự kiến:** accounts; session/credential records theo quyết định auth sau review. Đây là inventory thiết kế, chưa là migration.

## Use case cần xây

- RegisterAccount: chuẩn hóa email, kiểm tra mật khẩu, tạo account và xử lý trùng email.
- AuthenticateAccount/GetSession/Logout: giữ tương thích browser contract; chưa chọn native credential adapter.
- DisableAccountAccess: chặn truy cập trước khi privacy điều phối xóa dữ liệu.

## API dự kiến

Các route dưới đây dùng prefix `/api/v1` khi được triển khai; chưa hoạt động trong scaffold.

- GET /auth/session
- POST /auth/register
- POST /auth/login
- POST /auth/logout

## Phụ thuộc và interface

Không phụ thuộc module nghiệp vụ khác. Platform/security nhận principal qua adapter identity khi triển khai.

**Public application interface dự kiến:** Principal/account-status contract; không export credential repository, hash hoặc session internals. Chỉ tạo interface/provider code khi có use case hoặc consumer thực sự; hiện chưa có stub trả kết quả giả.

## Invariant và boundary

- Account UUID là định danh dùng chung web/mobile; không tin userId hoặc deviceId làm credential.
- Password hash không được trả trong DTO hoặc log; giới hạn byte của BCrypt phải được kiểm tra.
- Browser session rotation/CSRF và native auth lifecycle phải được review trước khi mở endpoint.

## Acceptance criteria cho implementation

- [ ] Hai tài khoản có quyền riêng; duplicate email được xử lý an toàn.
- [ ] Login sai không lộ account tồn tại; rotate/revoke/expiry và CSRF được kiểm tra.
- [ ] Không tạo user từ header tự khai báo.

## Privacy và retention

Giữ credential ngoài export; account metadata và chính sách giữ/xóa thuộc identity. Privacy yêu cầu khóa account trước khi xóa.

## Cần chốt trước slice

Account recovery/verification, auth native và session store; bộ khung chưa chốt các lựa chọn này.

Xem [Module delivery plan](../../../../../docs/04-engineering/module-delivery-plan.md) và [module catalog](../../../../../docs/02-product/application-modules-spec.md). Module `identity` là boundary bên trong một API deployable, không phải microservice.
