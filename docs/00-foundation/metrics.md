# Product Metrics

- **Status:** Draft
- **Version:** 0.1
- **Last updated:** 2026-08-04

## North-star metric

**Stuck-to-Start Rate:** tỷ lệ phiên người dùng chọn “Tôi bị kẹt” và bắt đầu một next action trong vòng 10 phút.

### Công thức

`Số stuck sessions có start_event trong 10 phút / Tổng stuck sessions hợp lệ`

## Activation

Người dùng được xem là activated khi trong 24 giờ đầu họ:

1. Hoàn thành một brain dump.
2. Xác nhận một next action.
3. Ghi nhận đã bắt đầu action đó.

## Core metrics

| Metric | Ý nghĩa | Ngưỡng pilot ban đầu |
|---|---|---|
| Time to first value | Từ mở app đến next action đầu tiên | Median < 3 phút |
| Stuck-to-Start Rate | Hiệu quả giúp bắt đầu | ≥ 50% |
| First-step completion | Hoàn thành bước AI đề xuất | ≥ 40% |
| Reset salvage rate | Reset dẫn đến ít nhất một start | ≥ 40% |
| Return rate | Quay lại sau 3+ ngày vắng mặt | Theo dõi baseline |
| Insight acceptance | Insight được xác nhận đúng/hữu ích | ≥ 60% |
| Week-2 retained | Có core action trong tuần thứ hai | ≥ 30% pilot |

Các ngưỡng trên là giả thuyết để ra quyết định, không phải benchmark ngành.

## Guardrail metrics

- Tỷ lệ AI output bị schema validation từ chối.
- Tỷ lệ insight không có evidence.
- Tỷ lệ người dùng sửa kết quả extraction.
- Safety flag false positive/false negative trên eval set.
- P95 latency cho AI action.
- Chi phí AI trên activated user.
- Tỷ lệ tắt notification và rút consent AI.
- Tỷ lệ xóa tài khoản sau tuần đầu.

## Events tối thiểu

- `brain_dump_created`
- `brain_dump_confirmed`
- `next_action_selected`
- `focus_started`
- `focus_completed`
- `stuck_declared`
- `reset_started`
- `reset_completed`
- `return_flow_started`
- `return_flow_completed`
- `insight_shown`
- `insight_feedback_submitted`
- `weekly_experiment_created`

Không gửi raw brain dump, task title hoặc reflection text vào analytics bên thứ ba.

