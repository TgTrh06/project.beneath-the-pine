# AI Product Specification

- **Status:** Draft
- **Version:** 0.2
- **Last updated:** 2026-08-09

## Vai trò AI

AI giảm công sức làm rõ và bắt đầu. AI không có thẩm quyền tự thay đổi cam kết của người dùng, không đóng vai chuyên gia y tế và không phải chatbot tự do.

## Capabilities trong MVP

### AIC-01 — Brain Dump Extraction

**Input:** raw text, locale, timezone context tối thiểu.  
**Output:** danh sách item, loại item, độ khẩn cấp do người dùng biểu đạt, câu hỏi làm rõ.  
**Không được:** tự gán chẩn đoán, tự đặt deadline không có cơ sở, tự tạo task trước xác nhận.

### AIC-02 — Help Me Start

**Input:** task, context tự nguyện, thời gian/năng lượng hiện tại.  
**Output:** một next action cụ thể ≤ 15 phút, rationale ngắn và lựa chọn “nhỏ hơn nữa”.  
**Không được:** moralize, gây áp lực hoặc giả định năng lực người dùng.

### Deferred capabilities

Reset My Day dùng rule-based flow trong prototype. Weekly reflection, journal analysis, mood inference và AI coach theo yêu cầu chỉ được xem xét sau khi Brain Dump Extraction và Help Me Start được kiểm chứng với người dùng.

## Product rules

- AI feature chỉ chạy khi consent tương ứng còn hiệu lực.
- Raw model output không hiển thị trước validation.
- Mỗi output có `schema_version`, `prompt_version`, `model`.
- Người dùng có thể sửa, bỏ qua và báo sai.
- Nếu AI lỗi, core manual flow vẫn dùng được.
- AI copy phải ngắn, cụ thể và không phán xét.

## Latency targets

- Extraction/Help Me Start: P95 mục tiêu ≤ 8 giây trong beta.
- Sau timeout: giữ input, cho retry hoặc manual fallback.

## Success signals

- Extraction edit rate giảm theo thời gian nhưng không vì người dùng bỏ xác nhận.
- Stuck-to-Start Rate đạt ngưỡng.
- Không có safety violation nghiêm trọng trên evaluation set.
