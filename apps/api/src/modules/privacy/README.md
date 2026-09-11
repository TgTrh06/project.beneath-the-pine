# Export, xóa và retention — PrivacyModule

- **Trạng thái code:** Nest module được đăng ký; chưa có controller, use case, repository hoặc schema nghiệp vụ.
- **Thứ tự triển khai:** P0 thiết kế; cùng mọi slice.
- **Phạm vi hiện tại:** Core thủ công, không AI.

## Trách nhiệm và dữ liệu

Điều phối yêu cầu dữ liệu theo principal và tập module thực sự có dữ liệu.

**Dữ liệu sở hữu dự kiến:** data_rights_requests/progress nếu cần; không sở hữu bảng nghiệp vụ module khác. Đây là inventory thiết kế, chưa là migration.

## Use case cần xây

- RequestExport: xác thực lại nếu policy yêu cầu, tập hợp dữ liệu từng owner.
- RequestAccountDeletion: khóa truy cập, xóa dữ liệu theo thứ tự dependency và báo trạng thái.
- ApplyRetention: operation có kiểm soát; chưa chọn scheduler/worker.

## API dự kiến

Các route dưới đây dùng prefix `/api/v1` khi được triển khai; chưa hoạt động trong scaffold.

- POST /me/data-export
- DELETE /me/account
- GET /me/data-requests/:id

## Phụ thuộc và interface

Một chiều gọi identity khóa account và các module có dữ liệu; module khác không import privacy.

**Public application interface dự kiến:** Data rights status contract cho client; contributor contract được định nghĩa khi có owner implementation đầu tiên. Chỉ tạo interface/provider code khi có use case hoặc consumer thực sự; hiện chưa có stub trả kết quả giả.

## Invariant và boundary

- Không đánh dấu hoàn tất khi một owner thất bại.
- Không export credentials, internal secrets hoặc dữ liệu người khác.
- Không dùng mọi repository trong một global query; owner module cung cấp interface.
- Không tự tạo background job nếu chưa thiết kế durability.

## Acceptance criteria cho implementation

- [ ] Export đúng owner; deletion failure hiện rõ và retry an toàn.
- [ ] Không giữ orphan row; mọi module mới phải bổ sung coverage.
- [ ] Link tải/export expiry và authentication kiểm tra nếu được thêm.

## Privacy và retention

Request metadata cũng có retention; output phải hết hạn và được kiểm soát quyền truy cập.

## Cần chốt trước slice

Synchronous giới hạn hay job durable, retention obligations, re-auth và thứ tự deletion cụ thể.

Xem [Module delivery plan](../../../../../docs/04-engineering/module-delivery-plan.md) và [module catalog](../../../../../docs/02-product/application-modules-spec.md). Module `privacy` là boundary bên trong một API deployable, không phải microservice.
