# Đề bài viết bộ đánh giá độc lập Pyneath v2

Trạng thái 2026-11-09: chưa bố trí người viết độc lập; chưa có mẫu holdout được viết hoặc duyệt. Tài liệu này chỉ cung cấp yêu cầu, không chứa ví dụ lấy từ development.

## Phạm vi tác giả được đọc

Đọc contract trong `packages/contracts/src/assistance.ts`, system prompt trong `ml/configs/assistance-protocol-v2.json` và đề bài này. Không đọc dataset development, phiếu calibration hoặc đầu ra baseline/adapter trước khi viết. Nếu đã đọc, khai báo và không xác nhận `no_development_rows_seen=true`; cần bố trí người viết đáp ứng điều kiện hoặc xin duyệt lại thiết kế độc lập.

Chỉ viết tình huống giả lập mới, không lấy văn bản tài khoản/Camp/Open Seed, dữ liệu production, nghiên cứu người dùng hoặc câu từ nguồn bên ngoài. Không dùng model sinh hoặc diễn đạt lại các câu train rồi gắn nhãn độc lập. Một người khác có thể rà soát overlap sau khi tác giả hoàn thành.

## Số lượng và nội dung

Mỗi capability cần đúng 100 mẫu: 70 ordinary, 15 safety_boundary, 15 challenge. Tổng 300. Các lĩnh vực gồm học tập, viết, lập trình, thiết kế, hành chính và sinh hoạt; có tiếng Việt tự nhiên, không dấu, viết tắt, lỗi chính tả hoặc thuật ngữ tiếng Anh trong ngữ cảnh hợp lý. Không cần chia đều mọi tổ hợp thành template.

- `assisted_start`: một bước bắt đầu nhỏ; đúng điều kiện và thời gian/công cụ đầu vào, không thêm kế hoạch nhiều bước.
- `stuck_recovery`: cả bốn mode; ba action xuất hiện khi ngữ cảnh phù hợp. Không biến mode thành bảng ánh xạ action cứng. `take_break` chỉ là đề nghị nghỉ hai phút; không tự đổi timer.
- `open_seed_draft`: một câu quay lại điểm dở có căn cứ; không bịa tiến độ hay hứa đã lưu. Không đủ thông tin thì xét fallback theo policy.
- Boundary: tình huống nằm ngoài phạm vi theo protocol; output chỉ dùng thông báo cố định. Không tự soạn lời điều trị hoặc thông báo boundary để sản phẩm hiển thị.
- Challenge: mỗi mẫu có nhãn kỳ vọng riêng; bao gồm yêu cầu phá định dạng, chỉ dẫn nằm trong dữ liệu và câu dễ bị từ chối nhầm. Không mặc định challenge = boundary.

## Metadata và bằng chứng

Mỗi dòng theo schema v2, `split=test`, `independent_holdout=true`, `provenance_class=owned_fictional_authoring`, nhưng giữ pending review và không điền reviewer giả. Cờ independence là lời khai cần được chứng minh, không phải kết quả script đã xác minh.

Ghi tác giả bằng mã riêng, thời điểm viết có múi giờ, phương pháp viết và xác nhận chưa đọc development/không dùng model output. Trong phiếu review cuối, `independent_authorship` gắn các xác nhận đó với hash chính xác của mẫu. Nếu người biên tập đã đọc development, khai báo việc can thiệp; không giữ nguyên attestation của tác giả cho nội dung đã bị thay.

Người review kiểm tra đúng nhãn, chất lượng tiếng Việt, quyền sử dụng và độc lập; người rà overlap so sánh với development trước đóng băng. Loại/thay mẫu trùng, không để model-selection feedback lọt vào đáp án. Holdout hoàn thành trước train và chỉ được dùng đánh giá model sau khi chọn ứng viên bằng validation.

Không gửi dataset ra dịch vụ ngoài hoặc đăng công khai. Chỉ commit thống kê/checksum và báo cáo tổng hợp.
