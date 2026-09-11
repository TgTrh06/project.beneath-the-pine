# Task Module — NestJS + Drizzle

- **Trạng thái:** Contract/nghiệp vụ cần giữ và thiết kế persistence đích; chưa hoàn tất triển khai Drizzle.
- **Owner:** Task module trong Core modular monolith.

## Phạm vi

Task là hành động riêng của người dùng, kéo dài 1–10 phút. Next-action là snapshot xác nhận ban đầu, được tạo cùng task. Hai bản ghi cùng một transaction và owner module.

Focus lifecycle cộng tác qua application interface; AI chỉ đề xuất, người dùng xác nhận. Không tạo service riêng cho task hoặc next-action.

## Cấu trúc đích

```text
apps/api/src/modules/task/
  task.module.ts
  presentation/       # controller, validation và response mapping
  application/        # use cases, repository port
  domain/             # invariant và state transition
  infrastructure/     # Drizzle schema và repository
```

HTTP adapter → use case → domain; Drizzle repository triển khai port. Domain không import Nest HTTP hoặc Drizzle. Thư mục đích chưa được tạo bởi lần cập nhật tài liệu.

## Nghiệp vụ

- Title trim rồi dài 2–280 ký tự; minutes nguyên 1–10.
- Task mới ready; PATCH cho ready/done/deferred.
- Archive dùng operation riêng; archived là trạng thái terminal.
- userId lấy từ principal; query theo cả task ID và owner ID.
- Task của người khác trả not found.
- Confirmation giữ title/minutes/thời điểm lúc tạo, không tự cập nhật theo task.

## API baseline

| Method/route dưới /api/v1 | Input | Response |
| --- | --- | --- |
| POST /next-actions | title, minutes, sourceBrainDumpId tùy chọn/null | 201: task và nextAction |
| GET /tasks | status tùy chọn; limit mặc định 50, 1–100 | 200: tasks[] |
| GET /tasks/:taskId | UUID | 200: task |
| PATCH /tasks/:taskId | Ít nhất một title/minutes/status khác null | 200: task đã cập nhật |
| POST /tasks/:taskId/archive | UUID | 200: task archived |

Task response: id, userId, title, minutes, status, sourceBrainDumpId nullable, createdAt, updatedAt. Confirmation response: taskId, title, minutes, confirmedAt. Timestamp JSON dùng ISO-8601 UTC.

Browser baseline dùng session cookie và CSRF; React Native + Expo auth adapter cần quyết định riêng, cùng account/ownership. Cursor và mutation idempotency chưa có trong baseline; triển khai phải có compatibility plan.

## Persistence đích

Drizzle map core.tasks và core.next_actions, giữ FK/unique/check constraints đã kiểm kê. core.tasks.user_id liên kết core.accounts; next_actions.task_id unique và cascade khi task bị xóa. source_brain_dump_id hiện không có FK trong core baseline.

Transaction tạo task và confirmation cùng commit/rollback. Update/archive dùng conditional update hoặc row lock để bảo vệ terminal state khi đồng thời. Không gọi AI trong transaction. Xem [Drizzle Data Access](drizzle-data-access.md).

## Lỗi và kiểm chứng

401 UNAUTHENTICATED; 403 khi bị từ chối/CSRF; 400 VALIDATION_FAILED hoặc INVALID_TASK; 404 TASK_NOT_FOUND; 409 TASK_ARCHIVED. Error envelope có code/message/requestId/details, không có raw input hoặc SQL.

Test domain invariant, HTTP contract, hai account ownership, invalid input, transaction rollback, concurrent archive/update và DB failure. Drizzle integration phải chạy PostgreSQL thật. Không đưa lệnh tooling chưa triển khai vào tài liệu như thể đã dùng được.
