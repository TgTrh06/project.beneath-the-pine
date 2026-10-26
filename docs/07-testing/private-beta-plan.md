# Private Pilot Plan

## Mục tiêu và quy mô

- Pilot riêng tư trong 2 tuần với 8–15 người thuộc 3–5 Camp. Chỉ kéo dài tối đa 4 tuần nếu chưa đủ cơ hội quan sát việc quay lại; ghi lý do và ngày kết thúc mới trước khi gia hạn.
- Quan sát Solo tự hoàn tất từ bắt đầu đến checkout, nhóm tạo–chấp nhận–hoàn tất Pact và một lần quay lại từ Open Seed. Ghi nhận người dùng không hiểu bước tiếp theo, không nhận được link mời hoặc không quay lại từ Seed.
- Đánh giá cảm nhận về quyền riêng tư, sự hiện diện của người khác và khả năng quay lại. Không suy ra hiệu quả y tế hoặc năng suất từ đồng hồ.
- Chủ pilot tự liên hệ người tham gia, nhận consent và hỗ trợ. Danh sách liên hệ, bản đồng ý và phản hồi nguyên văn nằm ngoài repo trong nơi lưu trữ được chủ pilot kiểm soát.

## Điều kiện trước lời mời đầu tiên

1. Hoàn tất các mục còn mở trong [critical test cases](critical-test-cases.md): hành trình bằng bàn phím, screen reader thực tế, zoom browser 200%, các browser mục tiêu và quyền riêng tư. Kiểm tra lại Solo, Camp/Pact, reconnect và quyền sau khi rời/bị loại. Bất kỳ mục nào chưa kiểm chứng đều chặn mở pilot cho đến khi có bằng chứng hoặc kế hoạch ngoại lệ được phê duyệt riêng.
2. Chọn web host, một API/realtime instance, PostgreSQL, chính sách backup/restore, nguồn log và người có quyền vận hành trong **kế hoạch triển khai riêng**. Phê duyệt riêng trước mọi thay đổi remote, migration hay deploy. Dùng [deployment runbook](../08-operations/deployment-runbook.md) để kiểm tra CI, image, migration review, backup, TLS/cookie, health và smoke trên môi trường pilot.
3. Điền kênh liên hệ hỗ trợ và ngày kết thúc dự kiến vào [consent](../01-research/research-consent-template.md). Chính sách backup và nơi lưu consent/phản hồi phải hỗ trợ xóa dữ liệu định danh và phản hồi thô chậm nhất 30 ngày sau pilot, hoặc sớm hơn khi người tham gia yêu cầu. Không mời nếu chưa thể thực hiện cam kết này.
4. Chủ pilot xác nhận [release checklist](../09-release/release-checklist.md), đường báo sự cố và log đã che dữ liệu riêng. Giữ quyền truy cập pilot đóng cho đến khi các kiểm tra trên môi trường đích đạt.

## Thực hiện

- Dùng [field kit](pilot-field-kit.md) để gửi lời mời, giao nhiệm vụ quan sát không chỉ từng thao tác, hỏi ngắn sau phiên và phỏng vấn cuối pilot. Gửi link Camp bằng kênh do người tham gia chọn; khi link hết hạn/thu hồi, chủ Camp tạo link mới sau khi xác nhận đúng người nhận.
- Ghi số được mời/đồng ý/bắt đầu/hoàn tất, số lần phải nhắc trực tiếp, nơi bị kẹt và mã lỗi trong [pilot log](pilot-log.md). Chỉ ghi tổng hợp hoặc mô tả đã ẩn danh vào repo; không ghi intention, Seed, email, token, account ID, nội dung chat hay trích dẫn nguyên văn.
- Chỉ dùng event tối thiểu khi người tham gia đã đồng ý. Đối chiếu event, báo lỗi đã che dữ liệu riêng và lời kể của người dùng; không dùng event như bằng chứng duy nhất cho việc hiểu luồng. Không xuất hoặc sao chép dữ liệu thô vào repo.
- Rà health, lỗi API, database, websocket và log đã che dữ liệu riêng hằng ngày trong 3 ngày đầu, sau đó ít nhất mỗi tuần. Ghi cả kết quả không có lỗi và giới hạn quan sát; kiểm tra sâu hơn khi có báo cáo lỗi.
- Phân loại lỗi thành **chặn core**, **lỗi khó chịu** hoặc **cải tiến sau pilot**. Với lỗi chặn core, dừng mở rộng nhóm thử, ghi phương án dự phòng và lập kế hoạch sửa cụ thể để phê duyệt trước khi đổi code; kiểm chứng lại hành trình trước khi tiếp tục.

## Tạm dừng và kết thúc

- Tạm dừng ngay nếu lộ nội dung riêng, sai quyền, trạng thái realtime không đáng tin, người dùng cảm thấy bị theo dõi/ép buộc, hoặc hành trình chỉ hoàn tất nhờ người nghiên cứu liên tục nhắc. Chủ pilot ghi phạm vi ảnh hưởng, thông báo người liên quan qua kênh đã thỏa thuận và xử lý theo [support playbook](../09-release/support-playbook.md).
- Chỉ kết luận đạt khi có bằng chứng một người mới tự hoàn tất Solo, một nhóm tạo–chấp nhận–hoàn tất Pact, ít nhất một người quay lại từ Seed và mọi lỗi chặn core đã sửa/kiểm chứng hoặc có phương án dự phòng được chủ pilot chấp nhận.
- Báo cáo cuối ghi cỡ mẫu thực tế, ca thất bại, phản ví dụ, mục chưa kiểm chứng và quyết định **tiếp tục / sửa thêm / dừng**. Không mở tính năng mới khi còn lỗi chặn core.
