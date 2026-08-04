# Product Requirements Document — MVP

- **Status:** Draft
- **Version:** 0.1
- **Owner:** Product
- **Target:** Private beta
- **Last updated:** 2026-08-04

## 1. Summary

Beneath the Pine MVP giúp người dùng đang quá tải chuyển brain dump thành một next action có thể bắt đầu, hỗ trợ reset khi ngày bị gián đoạn và tạo đường quay lại nhẹ nhàng sau thời gian không sử dụng.

## 2. Goals

- Giảm thời gian từ stuck state đến start event.
- Giảm số quyết định cần thiết để bắt đầu.
- Cho phép người dùng sửa/kiểm soát mọi kết quả AI.
- Kiểm chứng Reset và Return flow trong sử dụng thật.

## 3. Non-goals

- Thay thế task/calendar/notes platform đầy đủ.
- Điều trị hoặc chẩn đoán ADHD.
- Tự động lập toàn bộ lịch sống.
- Tối ưu doanh thu trước khi có retention signal.

## 4. Primary use cases

### UC-01 — Brain dump to action

1. Người dùng nhập nội dung tự nhiên.
2. Hệ thống gửi nội dung tới AI nếu đã consent.
3. AI trả về các item có cấu trúc và câu hỏi làm rõ cần thiết.
4. Người dùng sửa/xác nhận.
5. Hệ thống đề xuất một next action.
6. Người dùng bắt đầu, đổi hoặc yêu cầu bước nhỏ hơn.

### UC-02 — Help me start

1. Người dùng chọn một task và “Tôi bị kẹt”.
2. Hệ thống hỏi tối đa hai câu về outcome/ràng buộc nếu thiếu.
3. AI đề xuất bước cụ thể, có động từ, dự kiến ≤ 15 phút.
4. Người dùng bắt đầu timer hoặc chỉnh bước.

### UC-03 — Reset my day

1. Người dùng nhập thời gian/năng lượng còn lại.
2. Hệ thống hiển thị các cam kết chưa hoàn thành.
3. Người dùng giữ, dời hoặc bỏ; AI có thể đề xuất nhưng không tự quyết.
4. Hệ thống tạo một kế hoạch tối thiểu.

### UC-04 — Return after absence

1. Khi quay lại sau ≥ 3 ngày, hệ thống ưu tiên welcome-back flow.
2. Người dùng chọn tiếp tục, làm mới hôm nay hoặc xem backlog.
3. Không tự động dồn task quá hạn vào hôm nay.

### UC-05 — Weekly reflection

1. Hệ thống tổng hợp dữ kiện tuần.
2. AI tạo observation, hypothesis và một experiment.
3. Người dùng xác nhận/chỉnh sửa/bác bỏ.
4. Experiment được lưu cho tuần tiếp theo.

## 5. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Đăng ký/đăng nhập và quản lý phiên | Must |
| FR-02 | Consent AI có thể rút lại | Must |
| FR-03 | Tạo, sửa, archive task/next action | Must |
| FR-04 | Brain dump text và xác nhận extraction | Must |
| FR-05 | Help Me Start với structured output | Must |
| FR-06 | Focus session và start/completion events | Must |
| FR-07 | Reset My Day | Must |
| FR-08 | Return flow sau khoảng nghỉ | Must |
| FR-09 | Weekly review và insight feedback | Must |
| FR-10 | Export/delete account | Must |
| FR-11 | Voice input | Should |
| FR-12 | Growth visualization | Should |

## 6. Non-functional requirements

- Web responsive, ưu tiên mobile viewport.
- P95 API không-AI < 500 ms trong điều kiện beta.
- AI action có loading state, timeout và retry an toàn.
- Mọi AI output được schema validation trước khi lưu/hiển thị.
- Không gửi raw content vào product analytics.
- Keyboard navigation và focus state rõ ràng.
- Mọi thời gian lưu UTC, hiển thị theo user timezone.
- Người dùng có thể sử dụng chức năng task cơ bản khi tắt AI.

## 7. Analytics

Theo `00-foundation/metrics.md`; event payload chỉ chứa ID nội bộ, enum và duration cần thiết.

## 8. Dependencies

- Managed auth provider.
- PostgreSQL.
- AI provider hỗ trợ structured output.
- Email/reminder provider nếu reminder vào MVP.
- Error tracking và metrics.

## 9. Open questions

- Trigger Return flow sau 3 hay 7 ngày?
- Focus timer có cần chạy background ở phiên bản đầu?
- Có lưu raw brain dump sau extraction không; nếu có, mặc định bao lâu?
- Weekly Review có opt-in riêng ngoài AI consent không?
- Pine Marten xuất hiện ở tất cả flow hay chỉ trợ giúp?

## 10. Release criteria

Theo MVP exit criteria, AI evaluation threshold và release checklist trong `09-release/`.

