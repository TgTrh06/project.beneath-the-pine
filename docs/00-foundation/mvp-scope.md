# MVP Scope

- **Status:** Draft
- **Target:** Private beta
- **Version:** 0.1
- **Last updated:** 2026-08-04

## Mục tiêu MVP

Kiểm chứng rằng Beneath the Pine có thể giúp người dùng đang bị kẹt chọn và bắt đầu một hành động cụ thể trong vòng 10 phút, đồng thời quay lại sau khi mất nhịp.

## Vòng lặp duy nhất

`Brain dump → AI làm rõ → Chọn next action → Chia nhỏ nếu bị kẹt → Bắt đầu → Reset/Return`

## Must have

### Account và onboarding nhẹ

- Đăng ký/đăng nhập qua managed authentication.
- Consent riêng cho xử lý AI.
- Chọn cách xưng hô và timezone.
- Onboarding không vượt quá 3 phút.

### Brain Dump

- Nhập text tự nhiên.
- AI trích xuất các item và câu hỏi làm rõ tối thiểu.
- Người dùng xác nhận/sửa trước khi tạo task.

### Now

- Hiển thị một next action chính.
- Cho phép bắt đầu timer nhẹ 5/10/15/25 phút.
- Đánh dấu done, pause hoặc “vẫn bị kẹt”.

### Help Me Start

- Chia task thành bước khởi động cụ thể dưới 10–15 phút.
- Cho phép người dùng chỉnh sửa hoặc yêu cầu bước nhỏ hơn.

### Reset My Day

- Nhập thời gian và năng lượng còn lại.
- Chọn việc giữ, dời hoặc bỏ.
- Tạo kế hoạch tối thiểu cho phần còn lại của ngày.

### Return flow

- Phát hiện người dùng quay lại sau khoảng nghỉ.
- Không hiển thị backlog quá hạn trước khi hỏi ý định hiện tại.
- Cung cấp “Start fresh from today”.

### An toàn và dữ liệu

- AI disclosure rõ ràng.
- Export và delete account ở mức cơ bản.
- Safety response cho nội dung khủng hoảng.
- Log lỗi AI không chứa raw content nếu không cần thiết.

## Should have

- Voice-to-text cho brain dump.
- Reminder do người dùng chủ động bật.
- Pine tree/Pine Marten ở mức nhận diện và động viên nhẹ.

## Could have

- Habits, growth ring và weekly reflection.
- Google Calendar read-only, body-doubling/focus room và đồng bộ Todoist/Notion.
- AI coach theo yêu cầu có quota.

## Won't have trong MVP

- Calendar riêng đầy đủ.
- Notes/knowledge base, habits và goals đầy đủ.
- Project management cho đội nhóm.
- Chatbot mở vô hạn.
- Shop, economy, pinecones hoặc leaderboard.
- Social feed.
- Chẩn đoán, đánh giá lâm sàng hoặc điều trị ADHD.
- Phân tích tâm trạng/journal tự động, kể cả khi có consent, trong prototype đầu.
- Offline sync, iOS và desktop.

## Exit criteria cho private beta

- Bốn flow lõi chạy end-to-end trên staging.
- Không có lỗi P0/P1 mở.
- AI evaluation đạt ngưỡng được định nghĩa trong `05-ai/ai-evaluation.md`.
- Có export/delete và consent revocation.
- Có monitoring lỗi, latency và chi phí AI.
- Ít nhất 10 người hoàn thành hai tuần pilot.
