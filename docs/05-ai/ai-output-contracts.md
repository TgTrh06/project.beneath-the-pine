# AI Output Contracts

- **Status:** Draft
- **Format:** JSON, validated server-side

## Brain Dump Extraction v1

```json
{
  "schema_version": "brain_dump.v1",
  "items": [
    {
      "source_excerpt": "string",
      "kind": "task|reminder|thought|unclear",
      "title": "string",
      "explicit_due_at": null,
      "needs_clarification": false,
      "clarifying_question": null
    }
  ],
  "safety_flags": []
}
```

## Help Me Start v1

```json
{
  "schema_version": "help_start.v1",
  "next_action": {
    "text": "Mở file báo cáo và viết ba tiêu đề chính",
    "estimated_minutes": 5,
    "done_when": "Ba tiêu đề đã xuất hiện trong file"
  },
  "reason": "Bước này tạo điểm bắt đầu cụ thể mà chưa cần viết hoàn chỉnh.",
  "missing_context": [],
  "safety_flags": []
}
```

## Weekly Insight v1

```json
{
  "schema_version": "weekly_insight.v1",
  "observation": "string",
  "evidence": [
    {
      "metric": "string",
      "value": "string",
      "period": "string"
    }
  ],
  "hypothesis": "string",
  "confidence": "low|medium|high",
  "suggested_experiment": {
    "statement": "string",
    "success_signal": "string"
  },
  "safety_flags": []
}
```

## Validation rules

- Không field tự do ngoài schema khi `additionalProperties: false` được áp dụng.
- Giới hạn độ dài mọi string.
- `estimated_minutes` nằm trong range cho phép.
- Evidence phải map tới facts đã cung cấp.
- Safety flags được xử lý trước khi hiển thị.
- Không lưu output nếu schema hoặc evidence validation thất bại.

