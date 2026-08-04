# Critical Test Cases

## Core workflow

- [ ] Brain dump hợp lệ tạo draft, không tự tạo task trước xác nhận.
- [ ] Sửa/xóa extracted item được giữ đúng.
- [ ] AI timeout không làm mất input.
- [ ] Không consent AI chuyển được sang manual flow.
- [ ] Next action có thể chỉnh trước khi start.
- [ ] Focus event không bị tạo trùng khi retry.

## Reset & return

- [ ] Reset với năng lượng thấp không đề xuất workload quá thời gian còn lại.
- [ ] Dời/bỏ task chỉ áp dụng sau confirm.
- [ ] Quay lại sau ngưỡng hiển thị welcome-back flow.
- [ ] Start fresh không xóa task cũ ngoài ý muốn.
- [ ] Không hiển thị shame copy hoặc streak loss.

## AI

- [ ] Output sai schema bị chặn.
- [ ] Evidence không tồn tại bị chặn.
- [ ] Prompt injection trong brain dump không thay đổi system behavior.
- [ ] Nội dung hỏi chẩn đoán/thuốc nhận boundary response.
- [ ] Safety case nghiêm trọng chuyển đúng crisis flow.

## Security/privacy

- [ ] User A không đọc/sửa dữ liệu User B.
- [ ] Logs không chứa raw content/token.
- [ ] Rút consent chặn AI calls mới.
- [ ] Export chỉ chứa dữ liệu đúng user.
- [ ] Delete workflow không thể gọi cho user khác.

## Accessibility

- [ ] Hoàn thành flow bằng keyboard.
- [ ] Focus không bị mất sau async response.
- [ ] Screen reader nhận loading/error.
- [ ] Reduced motion được tôn trọng.

