# Bộ hướng dẫn thực địa cho pilot riêng tư

Chỉ dùng sau khi [điều kiện mở pilot](private-beta-plan.md) và [release checklist](../09-release/release-checklist.md) đạt trên môi trường pilot được phê duyệt. Chủ pilot tự gửi lời mời; file này không chứa địa chỉ liên hệ hay link mời đang dùng.

## Lời mời mẫu

> Mình mời bạn thử Pyneath trong một pilot riêng tư khoảng 2 tuần cùng vài người quen. Bạn có thể bắt đầu một phiên tập trung riêng, để lại điểm tiếp tục cho lần sau và tham gia một Focus Pact trong Camp. Tham gia hoàn toàn tự nguyện; bạn có thể dừng hoặc yêu cầu xóa dữ liệu. Nếu muốn tìm hiểu, mình sẽ gửi thông tin dữ liệu/consent và đường vào pilot. Bạn không cần gửi nội dung công việc cho mình.

Sau khi người nhận đồng ý tìm hiểu, gửi **mẫu consent đã điền**, địa chỉ web pilot và kênh hỗ trợ riêng qua kênh họ chọn. Chỉ gửi link Camp cho đúng người nhận sau khi họ có tài khoản và hiểu Camp sẽ hiện tên hiển thị, trạng thái lời mời/Pact và presence tối thiểu. Nếu người nhận không mở được link, hỏi lỗi hiển thị và thời điểm xảy ra; không yêu cầu họ gửi token, cookie, intention hoặc Seed. Chủ Camp có thể tạo link mới nếu link cũ đã hết hạn/thu hồi.

## Nhiệm vụ quan sát

Đọc mục tiêu, để người tham gia tự chọn đường đi; không đọc tên nút hoặc chỉ thao tác. Ghi khi nào phải can thiệp và vì sao. Chỉ thử nhiệm vụ nghiên cứu với người đã chọn đồng ý nghiên cứu.

1. **Solo, người mới:** “Hãy dùng Pyneath để dành vài phút cho một việc của bạn, rồi khép phiên theo cách phù hợp.” Hoàn tất khi người đó tự đăng ký/đăng nhập, bắt đầu phiên, thấy trạng thái thời gian, checkout và biết bước tiếp theo. Không hỏi họ nói hoặc gửi nội dung intention.
2. **Camp/Pact, nhóm quen:** “Hãy hẹn một khoảng tập trung cùng nhau, phản hồi lời hẹn rồi mỗi người khép phiên.” Hoàn tất khi Camp được tạo, link mời được nhận và chấp nhận, Pact được tạo, người được mời phản hồi, người tạo bắt đầu bằng thao tác riêng, ít nhất hai người tham gia và checkout. Ghi rõ nếu link không tới hoặc người vào muộn không tham gia được.
3. **Open Seed, lần quay lại:** Sau khi người tham gia tự lưu điểm tiếp tục, mời họ quay lại vào ngày khác: “Hãy tiếp tục từ nơi bạn đã dừng.” Hoàn tất khi họ tìm được Seed hiện hành và bắt đầu bước tiếp theo mà không cần hướng dẫn trực tiếp. Không yêu cầu đọc hoặc chụp nội dung Seed.

Người quan sát chỉ ghi mã người tham gia do họ quản lý ngoài repo, giờ tương đối, bước bị kẹt, dấu hiệu không hiểu và số lần nhắc. Khi viết vào repo, chỉ dùng số tổng hợp hoặc mô tả đã ẩn danh, không dùng mã có thể nối lại với danh sách liên hệ.

## Hỏi ngắn sau phiên và cuối pilot

- “Bước tiếp theo có rõ không? Bạn đã phải đoán ở đâu?”
- “Lời mời/Pact có đến và dễ hiểu không? Nếu không, bạn đã thử gì?”
- “Điểm tiếp tục có giúp bạn quay lại không? Điều gì vẫn gây vướng?”
- “Presence và thông tin hiện cho Camp có khiến bạn thoải mái không?”
- “Bạn muốn dừng, tiếp tục hoặc xóa dữ liệu nào?”

Không ghi lời nói nguyên văn trong repo. Phỏng vấn cuối pilot dùng cùng câu hỏi, bổ sung lý do bỏ cuộc hoặc không quay lại. Không suy diễn từ người không phản hồi rằng họ hài lòng.

## Theo dõi và xử lý

- Ngày 1–3: chủ pilot xem health/readiness, lỗi API/database, websocket disconnect và log đã che dữ liệu riêng mỗi ngày; sau đó ít nhất mỗi tuần. Ghi khoảng thời gian và kết quả vào [pilot log](pilot-log.md). Sự cố được báo từ người dùng cần được xem ngay, không chờ kỳ rà log.
- **Chặn core:** không thể hoàn tất Solo, nhận lời Camp/Pact hoặc quay lại Seed; mất dữ liệu/quyền riêng tư; trạng thái phiên sai khiến thao tác không tin cậy. Dừng mời thêm, ghi bước tái hiện và phương án dự phòng; lập kế hoạch sửa riêng, kiểm chứng lại rồi mới tiếp tục.
- **Lỗi khó chịu:** luồng vẫn hoàn tất bằng một cách rõ và an toàn nhưng gây nhầm lẫn, chờ hoặc thao tác thừa. Ghi số người gặp và ảnh hưởng, ưu tiên sửa trong pilot nếu tái diễn.
- **Cải tiến sau pilot:** mong muốn mới hoặc chỉnh sửa không chặn hành trình; không mở rộng tính năng trong khi còn blocker.
- Tạm dừng ngay khi lộ dữ liệu riêng, sai quyền, realtime thiếu tin cậy, có cảm giác bị theo dõi/ép buộc hoặc cần nhắc trực tiếp liên tục. Chủ pilot quyết định liên hệ người bị ảnh hưởng qua kênh ngoài repo và ghi quyết định tiếp tục/dừng.
