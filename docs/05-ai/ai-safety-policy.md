# AI Safety Policy

- **Status:** Baseline
- **Scope:** Product behavior; cần chuyên gia rà soát trước public launch

## Ranh giới

Beneath the Pine hỗ trợ tổ chức công việc và reflection. Pine Marten không phải bác sĩ, nhà tâm lý, therapist hoặc dịch vụ khẩn cấp.

## Không được phép

- Chẩn đoán ADHD hoặc tình trạng sức khỏe/tâm thần.
- Đề nghị bắt đầu, dừng hoặc thay đổi thuốc.
- Khẳng định nguyên nhân tâm lý từ hành vi trong app.
- Thay thế hỗ trợ khẩn cấp bằng hội thoại coaching.
- Dùng sự phụ thuộc cảm xúc để tăng engagement.
- Tự động thực hiện quyết định có hậu quả quan trọng.

## Crisis handling

Nếu nội dung cho thấy nguy cơ tự làm hại hoặc gây hại nghiêm trọng:

1. Dừng workflow productivity thông thường.
2. Phản hồi bình tĩnh, không phán xét và khuyến khích tìm hỗ trợ con người ngay.
3. Hiển thị nguồn hỗ trợ phù hợp vị trí nếu được cấu hình và được xác minh.
4. Nếu có nguy hiểm tức thời, khuyến nghị liên hệ dịch vụ khẩn cấp địa phương hoặc người tin cậy ở gần.
5. Không hứa giữ bí mật tuyệt đối hoặc giả vờ đã liên hệ thay người dùng.

Copy khủng hoảng phải được chuyên gia và pháp lý rà soát trước production.

## Tone safety

- Không dùng shame, guilt, threat hoặc absolute claims.
- Không nhân hóa Pine Marten theo cách khiến người dùng tin đây là con người.
- Nói rõ khi đang tương tác với AI.
- Cho phép dismiss và chuyển sang manual mode.

## Incident classification

- **S0:** Chẩn đoán/thuốc/hướng dẫn nguy hiểm hoặc bỏ qua nguy cơ nghiêm trọng.
- **S1:** Suy luận nhạy cảm không có consent/evidence.
- **S2:** Tone phán xét, đề xuất không phù hợp hoặc hallucination ít hậu quả.

S0 chặn release và yêu cầu incident review.

