# Capture thủ công — CaptureModule

- **Trạng thái code:** Nest module được đăng ký; chưa có controller, use case, repository hoặc schema nghiệp vụ.
- **Thứ tự triển khai:** P1 / S3 hoặc sau task core.
- **Phạm vi hiện tại:** Core thủ công, không AI.

## Trách nhiệm và dữ liệu

Nhập, đọc, sửa/xóa nội dung thủ công và người dùng tự chọn next-action.

**Dữ liệu sở hữu dự kiến:** brain_dumps/checkins theo scope nội dung được duyệt; chưa có schema mới. Đây là inventory thiết kế, chưa là migration.

## Use case cần xây

- CreateCapture/GetCapture/DeleteCapture: kiểm tra ownership, retention và bảo vệ nội dung.
- ConfirmManualActionFromCapture: người dùng tự viết action, kiểm tra source thuộc owner rồi gọi task.
- RecordCheckIn: chỉ khi chốt field/retention; không suy luận mood.

## API dự kiến

Các route dưới đây dùng prefix `/api/v1` khi được triển khai; chưa hoạt động trong scaffold.

- POST /captures
- GET /captures/:id
- DELETE /captures/:id
- POST /captures/:id/next-actions

## Phụ thuộc và interface

Consent kiểm tra purpose thực sự dùng; task nhận action thủ công. Không tạo phụ thuộc task → capture.

**Public application interface dự kiến:** Content export/delete phần capture; references an toàn cho task khi use case yêu cầu. Chỉ tạo interface/provider code khi có use case hoặc consumer thực sự; hiện chưa có stub trả kết quả giả.

## Invariant và boundary

- Không gọi model, parse tự động hay tạo suggestion.
- Không lưu raw content trước khi chốt encryption và retention.
- Không đưa nội dung vào logger, analytics hoặc error detail.

## Acceptance criteria cho implementation

- [ ] Owned capture mới được dùng làm nguồn action.
- [ ] Thu hồi purpose phù hợp chặn xử lý tiếp theo.
- [ ] Export/xóa bao phủ nội dung; không có request đến inference.

## Privacy và retention

Nội dung nhạy cảm cần encryption policy và expiry; keys chỉ server, plaintext không vào telemetry.

## Cần chốt trước slice

Schema capture khác tên route/bảng lịch sử; mapping không được suy ra tự động. S3 có thể làm focus trước capture persistence.

Xem [Module delivery plan](../../../../../docs/04-engineering/module-delivery-plan.md) và [module catalog](../../../../../docs/02-product/application-modules-spec.md). Module `capture` là boundary bên trong một API deployable, không phải microservice.
