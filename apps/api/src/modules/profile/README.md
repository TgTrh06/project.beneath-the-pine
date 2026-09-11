# Hồ sơ và timezone — ProfileModule

- **Trạng thái code:** Nest module được đăng ký; chưa có controller, use case, repository hoặc schema nghiệp vụ.
- **Thứ tự triển khai:** P0 / S1.
- **Phạm vi hiện tại:** Core thủ công, không AI.

## Trách nhiệm và dữ liệu

Hồ sơ tối thiểu, tên hiển thị nếu có, timezone và thiết lập tài khoản có nhu cầu lưu server.

**Dữ liệu sở hữu dự kiến:** profiles; trường preference chỉ khi được duyệt. Đây là inventory thiết kế, chưa là migration.

## Use case cần xây

- GetProfile/UpdateProfile: đọc và sửa hồ sơ của principal.
- GetUserTimezone: cung cấp timezone IANA cho focus, habit và engagement.

## API dự kiến

Các route dưới đây dùng prefix `/api/v1` khi được triển khai; chưa hoạt động trong scaffold.

- GET /me/profile
- PATCH /me/profile

## Phụ thuộc và interface

Dùng principal identity đã xác thực; không query bảng account để thay authentication.

**Public application interface dự kiến:** Timezone/profile read contract tối thiểu cho module khác; không export bảng hoặc repository. Chỉ tạo interface/provider code khi có use case hoặc consumer thực sự; hiện chưa có stub trả kết quả giả.

## Invariant và boundary

- Account ID không được sửa qua profile payload.
- Timezone phải hợp lệ; không âm thầm đoán timezone từ IP.
- Theme/audio local chưa trở thành trường đồng bộ server.

## Acceptance criteria cho implementation

- [ ] Không đọc/sửa profile người khác.
- [ ] Timezone sai trả validation error; đổi timezone không viết lại timestamp lịch sử.

## Privacy và retention

Export profile và xóa theo account lifecycle; tránh log tên/email.

## Cần chốt trước slice

Tập field profile đầu tiên và default timezone cần quyết định trong slice S1.

Xem [Module delivery plan](../../../../../docs/04-engineering/module-delivery-plan.md) và [module catalog](../../../../../docs/02-product/application-modules-spec.md). Module `profile` là boundary bên trong một API deployable, không phải microservice.
