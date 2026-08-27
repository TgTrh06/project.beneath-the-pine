# Core User Flows — Focus & Gentle Retention

## Flow 1 — Brain Dump to Focus

1. User viết Brain Dump hoặc nhập action thủ công.
2. Nếu có AI consent, system trả structured candidates; user sửa/xóa/xác nhận.
3. User chọn one next action và bắt đầu Focus Studio.
4. User done, pause hoặc chọn still stuck.

**Failure:** giữ draft khi AI timeout/invalid; manual fallback luôn khả dụng.

## Flow 2 — Focus Studio

1. User chọn 5/10/15/25 phút hoặc duration gần nhất.
2. Focus Room hiển thị task và timer; user có thể chọn theme/audio.
3. Audio chỉ phát sau thao tác play. Nếu embed lỗi, vùng audio nêu lỗi và timer tiếp tục.
4. Kết thúc phiên, user chọn outcome; UI hỏi có muốn tạo Open Seed không.

**Accessibility:** timer có text state, controls có label, không dựa vào âm thanh/màu sắc; reduce motion giảm animation.

## Flow 3 — Open Seed

1. Sau focus, user chọn mở lại cùng task, chọn thời gian nhắc hoặc bỏ qua.
2. System xác nhận durable state ngay tại màn hình; user có thể dismiss trong Settings/Now.
3. Lần mở sau, seed là CTA chính nếu không có Return ritual.
4. Open seed dẫn tới Focus Studio hoặc user có thể chọn action khác.

**Empty/error:** không có seed hiển thị normal Now; lỗi lưu giữ selection và đưa retry gần field.

## Flow 4 — Reminder preference

1. User mở Settings và chủ động bật reminder.
2. Chọn tối đa hai slots và xác nhận timezone đang dùng.
3. App hiển thị reminder in-app khi phù hợp; outbound delivery chỉ hoạt động khi provider đã được duyệt.
4. User có thể tắt từng slot hoặc toàn bộ ngay lập tức.

**Guardrail:** không preselect opt-in, không copy khiến user thấy có lỗi khi bỏ lỡ, không chứa task title/content.

## Flow 5 — Return ritual

1. Bootstrap nhận diện không có core event 3 ngày theo timezone.
2. Trước Now, user thấy “Mừng bạn quay lại” và ba lựa chọn: Start fresh 5 phút, mở seed, chỉ check-in.
3. Khi user chọn, system mở flow tương ứng và đánh dấu return completed sau core action.

**Empty/error:** không có seed thì ẩn lựa chọn seed; API lỗi vẫn cho Capture/Now fallback, không chặn app.

## Flow 6 — Weekly letter

1. User mở Progress hoặc card trên Now khi facts đủ.
2. Letter nêu facts, one observation và experiment tùy chọn.
3. User phản hồi hữu ích/chưa đúng; feedback được xác nhận ngay trong component.

**Guardrail:** insight không được xuất hiện nếu facts không đủ, thiếu evidence hoặc có content-sensitive inference.
