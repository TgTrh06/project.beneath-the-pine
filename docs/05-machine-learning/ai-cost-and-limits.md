# AI Cost and Limits

- **Status:** Template — cập nhật khi chọn provider/model

## Cost model cần theo dõi

- Input/output tokens theo capability.
- Cost trên AI call.
- Cost trên activated user/tháng.
- Retry và invalid-output rate.
- P50/P95 latency.
- Weekly batch cost.

## Routing proposal

- Extraction/classification: model nhỏ, structured output.
- Help Me Start: model nhỏ/trung bình; latency ưu tiên.
- Weekly Review: model mạnh hơn chỉ khi eval chứng minh lợi ích.
- Safety classification: kết hợp deterministic rules, moderation/safety model và policy layer.

## Limits MVP

- Giới hạn độ dài brain dump.
- Rate limit theo user/IP.
- Tối đa số lần “nhỏ hơn nữa” trong một phiên trước khi chuyển manual fallback.
- Weekly Review tạo tối đa một lần/tuần trừ retry nội bộ.
- Alert khi daily/project cost vượt budget.

## Quy tắc kinh tế

Không chọn model chỉ dựa trên benchmark chung. Chọn model rẻ nhất đạt evaluation threshold của capability cụ thể.

