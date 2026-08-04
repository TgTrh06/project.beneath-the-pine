# API Guidelines

- **Style:** REST JSON cho MVP
- **Base path:** `/api/v1`

## Resource groups

```text
/auth/session
/me
/me/consents
/me/export
/me/delete
/brain-dumps
/brain-dumps/:id/extract
/tasks
/tasks/:id/next-actions
/focus-sessions
/daily-resets
/weekly-reviews
/weekly-reviews/:id/feedback
/weekly-experiments
```

## Conventions

- IDs là UUID, không lộ sequential count.
- ISO 8601 UTC cho timestamps.
- Pagination cursor-based cho lịch sử.
- Idempotency key cho create action dễ bị retry.
- Error response có `code`, `message`, `request_id`; không trả stack trace.
- Validate input/output tại boundary.
- Ownership check cho mọi resource.

## Error example

```json
{
  "error": {
    "code": "AI_CONSENT_REQUIRED",
    "message": "Tính năng này cần sự đồng ý xử lý bởi AI.",
    "request_id": "req_..."
  }
}
```

## AI endpoints

- Timeout rõ ràng và trả trạng thái retryable.
- Không stream raw chain-of-thought.
- Lưu `prompt_version`, model và usage server-side.
- Output được validate trước response.

OpenAPI chi tiết sẽ được tạo tại `openapi.yaml` khi user flow và stack được chốt.

