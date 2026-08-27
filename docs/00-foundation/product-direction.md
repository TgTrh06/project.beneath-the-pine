# Product Direction — Focus Companion & Gentle Return

- **Status:** Approved direction
- **Last updated:** 2026-08-27
- **Scope:** Private-beta research prototype

## Product definition

> **Beneath the Pine là focus companion bằng tiếng Việt giúp người đang quá tải bắt đầu một hành động nhỏ, tạo một điểm vào cho lần sau và quay lại mà không bị phán xét.**

Sản phẩm không tối ưu việc làm nhiều hơn. Sản phẩm giảm ma sát để bắt đầu, tiếp tục hoặc trở lại với một việc phù hợp ở hiện tại.

## Audience

Người Việt 20–30 tuổi học tập hoặc làm việc trí óc, thường gặp khó khăn với ưu tiên, khởi động, duy trì và quay lại với công việc. Đây là phân khúc hành vi; sản phẩm không chẩn đoán, điều trị hoặc đưa ra tư vấn y khoa.

## Product loop

`Brain Dump → làm rõ → chọn next action → Focus Studio → Open Seed → reminder đã chọn → Return ritual → Weekly letter → next action`

Một phiên có giá trị khi người dùng đi từ trạng thái bị kẹt đến `start_event` trong khoảng 10 phút. Một vòng lặp retention có giá trị khi người dùng có thể quay lại mà không phải nhớ mình đã dừng ở đâu hoặc đối mặt với backlog.

## What makes it distinct

- Luôn ưu tiên một hành động phù hợp ở hiện tại thay vì hiển thị toàn bộ backlog.
- Người dùng duyệt mọi gợi ý AI và có thể bỏ qua chúng.
- Mỗi phiên có thể để lại một **Open Seed**: điểm vào cực nhỏ cho lần sau.
- Reminder là opt-in, theo giờ và timezone người dùng chọn; không dùng ngôn ngữ gây tội lỗi.
- Return ritual chào đón việc quay lại, không hiển thị streak loss hay task quá hạn trước.
- Cây thông/Pine Marten tạo cảm giác đồng hành nhẹ, không là cơ chế thưởng phạt.

## Engagement principles

1. Ghi nhận sự quay lại và khởi động, không xếp hạng năng suất.
2. Không streak, leaderboard, virtual currency, phạt vắng mặt hoặc thông báo dồn dập.
3. Mỗi reminder phải do người dùng bật, dễ tắt và có mục đích rõ ràng.
4. Weekly letter chỉ nêu facts có thể kiểm chứng và cho phép phản hồi “hữu ích/chưa đúng”.
5. Âm thanh, màu sắc và animation chỉ hỗ trợ focus; không phải điều kiện để hoàn thành flow.

## Product boundaries

### In scope for private beta

- Brain Dump tiếng Việt, AI extraction và Help Me Start có user confirmation.
- Một next action, timer và Focus Studio tối giản.
- Open Seed, reminder opt-in, Return ritual và Weekly letter dựa trên facts tổng hợp.
- Managed authentication, consent AI, export/delete dữ liệu và analytics tối thiểu.
- Web responsive, online-only; Android web là target ưu tiên.

### Explicitly deferred

- Task/calendar/notes/project management đầy đủ.
- Social feed, leaderboard, streak, economy, shop hoặc “daily quests”.
- Chatbot AI tự do và phân tích mood/journal tự động.
- Push notification, iOS, desktop native và offline sync.
- Đồng bộ preferences giữa nhiều thiết bị trước khi có tín hiệu beta rõ ràng.

## Research hypotheses

- **H1:** Một next action dưới 15 phút giảm thời gian từ stuck state đến start event.
- **H2:** Open Seed tăng khả năng người dùng bắt đầu phiên kế tiếp.
- **H3:** Return ritual không phán xét tăng tỷ lệ quay lại sau gián đoạn.
- **H4:** Reminder opt-in theo ý định người dùng tăng start rate mà không làm tăng opt-out bất thường.
- **H5:** Weekly letter dựa trên evidence giúp người dùng thấy tiến bộ mà không tạo áp lực năng suất.

## Direction changes

Hướng này mở rộng prototype ban đầu bằng một retention loop có chủ đích. Đây không phải chuyển hướng thành productivity suite: mọi tính năng mới phải phục vụ việc bắt đầu, quay lại hoặc giảm ma sát cho vòng lặp trên.
