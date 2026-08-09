# Product Direction — Web + Mobile Prototype

- **Status:** Approved direction
- **Last updated:** 2026-08-09
- **Scope:** Academic research prototype

## Product definition

> **Beneath the Pine là AI companion bằng tiếng Việt giúp người thường xuyên bị mắc kẹt chuyển trạng thái quá tải thành một hành động nhỏ có thể bắt đầu trong 10 phút.**

Đây không phải là một Personal Growth Operating System nhiều module. Prototype tập trung kiểm chứng một vấn đề duy nhất: người dùng có bắt đầu được hành động cụ thể nhanh hơn khi có một cấu trúc hỗ trợ bên ngoài hay không.

## Audience

Người Việt 20–30 tuổi đang học hoặc làm công việc trí óc, có ADHD đã được chẩn đoán hoặc tự nhận thấy khó khăn kéo dài về ưu tiên, khởi động, duy trì và quay lại với công việc.

Đây là phân khúc theo hành vi, không phải tiêu chí chẩn đoán. Sản phẩm không đưa ra chẩn đoán, điều trị hoặc tư vấn y khoa.

## Core loop

`Brain dump → Làm rõ → Chọn một next action → Chia nhỏ nếu bị kẹt → Start → Pause/Done/Still stuck → Reset/Return`

Một phiên thành công là khi người dùng chuyển từ cảm giác bị kẹt sang một `start event` cho hành động có thời lượng gợi ý 5–15 phút.

## What makes it distinct

- Chỉ ưu tiên một hành động phù hợp ở hiện tại, không làm người dùng đối diện cả backlog.
- Ngôn ngữ và flow không phán xét; luôn có đường reset và quay lại.
- AI đề xuất có cấu trúc, người dùng xác nhận mọi thay đổi.
- Cây thông và Pine Marten tạo cảm giác đồng hành, không phải cơ chế thưởng/phạt hay lý do chính để quay lại.

## Product boundaries

### In the research prototype

- Brain dump tiếng Việt.
- AI extraction và Help Me Start có người dùng duyệt.
- Một next action, focus session nhẹ, Reset My Day và Return flow.
- Managed authentication, consent AI, export/delete dữ liệu cơ bản.
- Web responsive và Android; dữ liệu online-only.

### Explicitly deferred

- Habits, goals, notes, calendar và project management đầy đủ.
- Streak, leaderboard, social feed, economy hoặc gamification sâu.
- Phân tích mood/journal tự động và chatbot AI tự do.
- Offline sync, iOS và desktop.

## Research hypotheses

- **H1:** Một next action duy nhất giảm thời gian từ stuck state đến start event.
- **H2:** Bước khởi động dưới 15 phút tăng khả năng bắt đầu task mơ hồ hoặc lớn.
- **H3:** Reset không phán xét hỗ trợ người dùng quay lại sau gián đoạn.
- **H4:** AI có người dùng duyệt hữu ích hơn AI tự động thay đổi kế hoạch.

## Success measure

Chỉ số chính là thời gian từ lúc người dùng gửi brain dump hoặc báo “vẫn bị kẹt” đến `start_event`. Prototype hướng đến việc giúp người dùng bắt đầu trong khoảng 10 phút.

Các event tối thiểu: `brain_dump_submitted`, `next_action_confirmed`, `start_event`, `focus_completed`, `still_stuck`, `reset_completed`, `return_flow_completed`. Analytics chỉ lưu ID, enum và duration cần thiết; không lưu raw brain dump hoặc journal.
