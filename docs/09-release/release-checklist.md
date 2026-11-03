# Release Checklist

- [ ] Product slice matches approved PRD and scope.
- [ ] Authorization, private-text handling, data rights and recovery tests pass.
- [ ] Realtime join/reconnect/terminal-race checks pass when relevant.
- [ ] Accessibility smoke tests pass.
- [ ] Migration/backup/forward-fix plan is reviewed if persistence changes.
- [ ] Support owner, redacted logging and incident path are ready.
- [ ] No public room, voice/video, ranking or unapproved provider is accidentally exposed.
- [ ] If Pyneath Assistance ships: dataset/model/prompt revision, safety evaluation, consent and manual fallback are reviewed.

## Cổng mở pilot riêng tư

- [ ] Có bằng chứng hiện tại cho Solo → checkout → Seed → quay lại; Camp → mời → Pact → nhận lời → bắt đầu riêng → tham gia → checkout; quyền sau khi rời/bị loại và reconnect.
- [ ] Kiểm chứng bằng bàn phím, screen reader thực tế, zoom browser 200% và các browser mục tiêu đã đạt; mọi ngoại lệ có phạm vi, phương án hỗ trợ và phê duyệt riêng.
- [ ] Kế hoạch chọn host web/API/PostgreSQL, backup/restore, nguồn log và quyền vận hành được duyệt riêng; chỉ một API/realtime instance cho pilot.
- [ ] Revision/image, CI, migration review, backup và restore thử đã đạt trước migration pilot; deploy được phê duyệt riêng.
- [ ] Trên môi trường pilot, `/health/live` và `/health/ready` đạt; auth, quyền riêng tư, Solo, Camp/Pact và Socket.IO smoke đạt qua HTTPS/origin công khai; log không chứa private text hay token.
- [ ] Mẫu consent đã điền ngày, kênh hỗ trợ và ngày xóa dự kiến; nơi lưu danh sách liên hệ/bản đồng ý nằm ngoài repo; backup đáp ứng hạn xóa dữ liệu định danh và phản hồi thô trong 30 ngày sau pilot.
- [ ] Chủ pilot chấp nhận kết quả kiểm tra và mở quyền truy cập **trước** khi tự gửi lời mời. Nếu bất kỳ mục nào lỗi hoặc chưa kiểm chứng, giữ pilot đóng và ghi điểm dừng trong [pilot log](../07-testing/pilot-log.md).
