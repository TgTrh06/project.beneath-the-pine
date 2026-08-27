# Assumptions and Risks

- **Status:** Active
- **Last updated:** 2026-08-04

## Giả định rủi ro cao

| ID | Giả định | Cách kiểm chứng | Điều kiện thất bại |
|---|---|---|---|
| A01 | Người dùng cần giúp bắt đầu hơn là một task manager mới | Interviews + Wizard-of-Oz | Đa số chỉ cần capture/reminder |
| A02 | Một next action làm giảm quá tải | A/B prototype 1 vs 3 actions | Một action gây thiếu kiểm soát |
| A03 | Người dùng tin AI nếu thấy evidence và có thể sửa | Concept + usability test | Lo ngại riêng tư/tin cậy vẫn chặn sử dụng |
| A04 | Reset day là nhu cầu thường xuyên | Diary/interview | Tình huống hiếm hoặc được giải quyết tốt bằng calendar |
| A05 | Flow quay lại không phán xét cải thiện retention | Beta cohort | Không có khác biệt hành vi |

## Rủi ro sản phẩm

- Phạm vi lại mở rộng thành “life OS”.
- App vẫn yêu cầu quá nhiều bảo trì.
- Pine/gamification lấn át giá trị thật.
- Người dùng thích demo nhưng không dùng trong tình huống bị kẹt thật.

## Rủi ro AI

- Chia task sai ngữ cảnh hoặc quá hiển nhiên.
- Đề xuất mang giọng phán xét.
- Suy luận tâm trạng/chẩn đoán không được phép.
- Hallucination hoặc evidence không tồn tại.
- Latency làm mất thời điểm hành động.

## Rủi ro pháp lý và dữ liệu

- Thu thập dữ liệu nhạy cảm vượt quá nhu cầu.
- Consent không đủ cụ thể cho xử lý bởi bên thứ ba.
- Log/analytics vô tình chứa raw user content.
- Không đáp ứng được export/delete.

## Risk owner và review

Mỗi risk khi đưa vào backlog phải có owner, mức `Likelihood`, `Impact`, mitigation và ngày review tiếp theo.

