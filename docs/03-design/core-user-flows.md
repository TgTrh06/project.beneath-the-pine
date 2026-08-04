# Core User Flows

## Flow 1 — Brain Dump to Start

1. Mở `Capture`.
2. Nhập nội dung tự nhiên.
3. Submit → loading có thể hủy.
4. Xem extracted items.
5. Sửa/xóa/xác nhận.
6. Chọn hoặc nhận đề xuất next action.
7. Mở `Now` và bắt đầu.

### Failure states

- AI timeout: lưu draft, cho retry hoặc xử lý thủ công.
- Output invalid: không hiển thị raw model output; fallback sang manual capture.
- Không consent AI: cho tạo item thủ công.

## Flow 2 — Help Me Start

1. Từ `Now`, chọn “Tôi bị kẹt”.
2. Chọn lý do tùy chọn: quá lớn, không rõ, thiếu năng lượng, sợ sai, khác.
3. AI đề xuất một bước ≤ 15 phút.
4. Người dùng: bắt đầu / nhỏ hơn nữa / chỉnh sửa / đổi việc.
5. Ghi nhận `focus_started`.

## Flow 3 — Reset My Day

1. Chọn “Reset hôm nay”.
2. Chọn năng lượng thấp/vừa/cao và thời gian còn lại.
3. Xem tối đa các cam kết liên quan hôm nay.
4. Giữ/dời/bỏ; AI đề xuất nhưng không tự đổi.
5. Xác nhận một kế hoạch tối thiểu.
6. Bắt đầu next action đầu tiên.

## Flow 4 — Return

1. Hệ thống phát hiện không có core event ≥ 3 ngày.
2. Chào mừng trung tính: “Mình bắt đầu lại từ hôm nay nhé.”
3. Lựa chọn: Start fresh / Continue one task / Review backlog.
4. Không hiển thị streak loss hoặc tổng số overdue ở bước đầu.
5. Chuyển tới `Now`.

## Flow 5 — Weekly Review

1. Hiển thị facts trước AI interpretation.
2. Hiển thị từng insight với evidence.
3. Người dùng chọn đúng/sai/chưa chắc và có thể sửa.
4. Chọn hoặc viết một weekly experiment.
5. Hoàn thành growth ring.

