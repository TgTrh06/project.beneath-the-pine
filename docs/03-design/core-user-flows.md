# Core User Flows

## Flow 1 — Brain Dump to Start

1. Người dùng mở Capture và nhập nội dung tự nhiên.
2. Nếu có AI consent, API trả về item và clarification có cấu trúc; nếu không, user tạo item thủ công.
3. Người dùng sửa/xóa/xác nhận trước khi task được lưu.
4. Hệ thống đề xuất một next action dưới 15 phút.
5. Người dùng xác nhận và bấm Start; hệ thống ghi `start_event`.

### Failure states

- AI timeout hoặc output invalid: giữ nguyên draft, retry hoặc chuyển manual capture.
- User bỏ qua đề xuất: không chặn flow; cho chọn/chỉnh bước thủ công.

## Flow 2 — Help Me Start

1. Từ Now, người dùng chọn “Vẫn bị kẹt”.
2. Người dùng có thể nêu lý do ngắn hoặc bỏ qua.
3. AI đề xuất một bước cụ thể ≤ 15 phút.
4. Người dùng bắt đầu, yêu cầu nhỏ hơn nữa hoặc chỉnh sửa.

## Flow 3 — Reset My Day

1. Người dùng chọn thời gian còn lại và năng lượng thấp/vừa/cao.
2. Hệ thống hiển thị số việc rất giới hạn để user giữ hoặc dời.
3. User xác nhận kế hoạch nhẹ và quay lại one next action.

## Flow 4 — Return

1. Khi không có core event trong ngưỡng đã chọn, app hiển thị welcome-back flow.
2. User chọn Start fresh hoặc tiếp tục một việc.
3. App đưa user tới Now, không hiển thị nợ task hay streak loss trước.
