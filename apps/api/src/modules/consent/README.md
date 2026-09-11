# Lựa chọn xử lý dữ liệu — ConsentModule

- **Trạng thái code:** Nest module được đăng ký; chưa có controller, use case, repository hoặc schema nghiệp vụ.
- **Thứ tự triển khai:** P0 / S1, S3.
- **Phạm vi hiện tại:** Core thủ công, không AI.

## Trách nhiệm và dữ liệu

Ghi nhận và thu hồi các lựa chọn xử lý dữ liệu thực sự được sản phẩm sử dụng.

**Dữ liệu sở hữu dự kiến:** consent records theo purpose/version; baseline cần review. Đây là inventory thiết kế, chưa là migration.

## Use case cần xây

- GetConsentState: đọc purpose/version và lựa chọn hiện tại.
- RecordConsent/WithdrawConsent: ghi thời điểm, phiên bản policy và quyết định người dùng.
- CheckPurposePermission: cung cấp quyết định cho module xử lý dữ liệu.

## API dự kiến

Các route dưới đây dùng prefix `/api/v1` khi được triển khai; chưa hoạt động trong scaffold.

- GET /me/consents
- PUT /me/consents/:purpose (thiết kế, HTTP methods được mở trong slice tương ứng)

## Phụ thuộc và interface

Chỉ dùng principal; capture/analytics hỏi purpose thực sự cần. Không tạo vòng gọi ngược.

**Public application interface dự kiến:** Purpose permission contract có kết quả rõ ràng; không để client tự quyết permission server. Chỉ tạo interface/provider code khi có use case hoặc consumer thực sự; hiện chưa có stub trả kết quả giả.

## Invariant và boundary

- Chưa tạo purpose hoặc flow consent AI vì chưa có AI.
- Consent xử lý nội dung khác reminder opt-in; opt-in reminder thuộc engagement.
- Không coi xác nhận terms là mọi xử lý đều được đồng ý.

## Acceptance criteria cho implementation

- [ ] Thu hồi có hiệu lực trước xử lý tiếp theo.
- [ ] Policy version/purpose không hợp lệ bị từ chối; không tự bật lựa chọn khác.

## Privacy và retention

Retention chứng cứ consent cần policy riêng; export/xóa theo policy được duyệt, không giữ vô hạn mặc định.

## Cần chốt trước slice

Danh sách purpose và retention; nghiên cứu/analytics phải là lựa chọn riêng nếu được triển khai.

Xem [Module delivery plan](../../../../../docs/04-engineering/module-delivery-plan.md) và [module catalog](../../../../../docs/02-product/application-modules-spec.md). Module `consent` là boundary bên trong một API deployable, không phải microservice.
