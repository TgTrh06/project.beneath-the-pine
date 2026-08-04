# AI Product Specification

- **Status:** Draft
- **Version:** 0.1
- **Last updated:** 2026-08-04

## Vai trò AI

AI giảm công sức làm rõ và bắt đầu. AI không có thẩm quyền tự thay đổi cam kết của người dùng và không đóng vai chuyên gia y tế.

## Capabilities trong MVP

### AIC-01 — Brain Dump Extraction

**Input:** raw text, locale, timezone context tối thiểu.  
**Output:** danh sách item, loại item, độ khẩn cấp do người dùng biểu đạt, câu hỏi làm rõ.  
**Không được:** tự gán chẩn đoán, tự đặt deadline không có cơ sở, tự tạo task trước xác nhận.

### AIC-02 — Help Me Start

**Input:** task, context tự nguyện, thời gian/năng lượng hiện tại.  
**Output:** một next action cụ thể ≤ 15 phút, rationale ngắn và lựa chọn “nhỏ hơn nữa”.  
**Không được:** moralize, gây áp lực hoặc giả định năng lực người dùng.

### AIC-03 — Reset My Day

**Input:** cam kết còn lại, available time, energy.  
**Output:** đề xuất keep/defer/drop và một next action.  
**Không được:** tự cập nhật task; mọi thay đổi cần confirmation.

### AIC-04 — Weekly Reflection

**Input:** deterministic facts và feedback trước đó; raw journal chỉ khi có consent riêng.  
**Output:** observation, evidence, hypothesis, confidence, experiment.  
**Không được:** trình bày hypothesis như fact hoặc đưa chẩn đoán tâm lý.

## Product rules

- AI feature chỉ chạy khi consent tương ứng còn hiệu lực.
- Raw model output không hiển thị trước validation.
- Mỗi output có `schema_version`, `prompt_version`, `model`.
- Người dùng có thể sửa, bỏ qua và báo sai.
- Nếu AI lỗi, core manual flow vẫn dùng được.
- AI copy phải ngắn, cụ thể và không phán xét.

## Latency targets

- Extraction/Help Me Start: P95 mục tiêu ≤ 8 giây trong beta.
- Weekly Review: asynchronous; hoàn thành trước thời điểm hiển thị dự kiến.
- Sau timeout: giữ input, cho retry hoặc manual fallback.

## Success signals

- Extraction edit rate giảm theo thời gian nhưng không vì người dùng bỏ xác nhận.
- Stuck-to-Start Rate đạt ngưỡng.
- ≥ 60% insight được đánh dấu accurate/useful trong pilot.
- Không có safety violation nghiêm trọng trên evaluation set.

