# Task và next-action thủ công — TaskModule

- **Trạng thái code:** Nest module được đăng ký; chưa có controller, use case, repository hoặc schema nghiệp vụ.
- **Thứ tự triển khai:** P0 / S2.
- **Phạm vi hiện tại:** Core thủ công, không AI.

## Trách nhiệm và dữ liệu

Hành động người dùng tự nhập/xác nhận và trạng thái ready/done/deferred/archived.

**Dữ liệu sở hữu dự kiến:** tasks, next_actions; map core baseline trước khi tạo schema Drizzle. Đây là inventory thiết kế, chưa là migration.

## Use case cần xây

- CreateConfirmedAction: tạo task và confirmation trong cùng transaction.
- ListTasks/GetTask: truy vấn theo owner, filter và giới hạn.
- UpdateTask/ArchiveTask: kiểm tra transition và concurrent writes.

## API dự kiến

Các route dưới đây dùng prefix `/api/v1` khi được triển khai; chưa hoạt động trong scaffold.

- POST /next-actions
- GET /tasks
- GET /tasks/:taskId
- PATCH /tasks/:taskId
- POST /tasks/:taskId/archive

## Phụ thuộc và interface

Không phụ thuộc focus. Capture có thể điều phối kiểm tra nội dung của mình rồi gọi task application API.

**Public application interface dự kiến:** Owned task lookup và task transition application contract; không export Drizzle schema. Chỉ tạo interface/provider code khi có use case hoặc consumer thực sự; hiện chưa có stub trả kết quả giả.

## Invariant và boundary

- Title trim 2–280, minutes nguyên 1–10; archived terminal.
- Confirmation là snapshot; không tự thay đổi theo task.
- Owner lấy từ principal; tạo confirmation không gọi inference.
- sourceBrainDumpId chỉ được dùng khi đã có cách kiểm tra ownership capture.

## Acceptance criteria cho implementation

- [ ] Transaction rollback khi confirmation thất bại.
- [ ] Không read/update/archive task của người khác.
- [ ] Concurrent archive/update không phục hồi task đã archive; retry không tạo trùng khi idempotency được triển khai.

## Privacy và retention

Export task/confirmation; xóa theo owner. task title không đi vào analytics.

## Cần chốt trước slice

Baseline SQL → Drizzle, source capture validation và durable idempotency được review trong S2.

Xem [Module delivery plan](../../../../../docs/04-engineering/module-delivery-plan.md) và [module catalog](../../../../../docs/02-product/application-modules-spec.md). Module `task` là boundary bên trong một API deployable, không phải microservice.
