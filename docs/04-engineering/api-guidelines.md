# API Guidelines

- **Ngày:** 2026-09-11
- **Đích:** REST JSON /api/v1 dùng chung web/mobile.
- **Trạng thái:** Baseline hiện có + yêu cầu đích; phần đề xuất chưa phải implementation.

## Contract và compatibility

UUID, ISO-8601 UTC, timezone IANA. Định nghĩa rõ required/nullable/default, enum, giới hạn và status. Response được map, không xuất thẳng Drizzle row. Schema TypeScript hiện có ở packages/contracts; OpenAPI đa ngôn ngữ là đề xuất cần một nguồn authoring và kiểm tra consistency.

Mobile cũ phải tiếp tục dùng API sau backend release. Không xóa/đổi nghĩa field hoặc giả định client chấp nhận enum mới. Breaking change cần kế hoạch version/compatibility và telemetry tối thiểu theo app version, không thu private payload.

## Baseline cần giữ hoặc thay đổi có kiểm soát

| Route | Hành vi baseline |
| --- | --- |
| GET /auth/session | anonymous/authenticated user và CSRF token |
| POST /auth/register, /auth/login | Tạo session browser; login 200, register 201 |
| POST /auth/logout | Hủy session, 204 |
| POST /next-actions | Tạo task + confirmation nguyên tử, 201 |
| GET /tasks | status tùy chọn; limit mặc định 50, 1–100; chưa có cursor |
| GET/PATCH /tasks/:taskId | Lấy/cập nhật tài nguyên owner |
| POST /tasks/:taskId/archive | Archive terminal, 200 |

Route nghiệp vụ dự kiến có prefix /api/v1. Bảng trên là contract baseline đã kiểm kê, chưa phải endpoint đang hoạt động hoặc bằng chứng Drizzle đã hoàn tất. [Task Module](task-module.md).

## Authentication và authorization

Browser baseline dùng BTP_SESSION HttpOnly, credentials include và X-XSRF-TOKEN cho mutation. Native transport chưa chọn; xem [API Strategy](web-mobile-api-strategy.md). Cùng account UUID và authorization; userId từ body không được cấp quyền. Biết UUID tài nguyên không cho phép đọc/sửa nó. Task của người khác trả 404; thiếu authentication trả 401.

## Lỗi, pagination và retry

Error envelope: code, message an toàn, requestId và details gồm field/code; không có raw input, SQL, stack hoặc credential. Client xử lý theo code, không phân tích message. 400 validation, 401 unauthenticated, 403 forbidden/CSRF, 404 not found, 409 conflict; 429/Retry-After và idempotency conflict sẽ được chốt khi triển khai tương ứng.

Cursor pagination với sort ổn định là thiết kế cho list mở rộng; chưa thay contract limit hiện có. GET retry có giới hạn; mutation không tự retry trước khi có durable idempotency. Cùng key + khác request cần conflict, replay cùng request trả cùng kết quả; scope/TTL cần được định nghĩa trong slice.

## Retention và focus tương lai

Các route engagement trong [Engagement API](../ai/contracts/engagement-api.md) là thiết kế capability. Focus lifecycle, idempotency, cursor và native auth phải được test trước mobile gate; chưa được coi là có chỉ vì xuất hiện trong docs.

Mỗi slice cần valid/invalid/unauthorized/other-owner/dependency-failure coverage, fixture client độc lập và PostgreSQL integration khi thay persistence.
