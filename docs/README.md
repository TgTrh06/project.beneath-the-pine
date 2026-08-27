# Beneath the Pine — Project Documentation

Tài liệu này là điểm bắt đầu cho toàn bộ quá trình phân tích, thiết kế, phát triển, kiểm thử và triển khai Beneath the Pine.

## Product thesis

> Beneath the Pine là AI companion giúp người gặp khó khăn về chức năng điều hành chuyển từ trạng thái quá tải sang bắt đầu được một hành động nhỏ, đồng thời giúp họ quay lại nhẹ nhàng khi mất nhịp.

Sản phẩm hỗ trợ tổ chức và thực hiện công việc hằng ngày. Sản phẩm không chẩn đoán, điều trị hoặc thay thế chuyên gia y tế.

## Cách sử dụng tài liệu

- Mọi tài liệu đều là tài liệu sống và được cập nhật cùng sản phẩm.
- Mỗi quyết định quan trọng phải phân biệt rõ: `Đã chốt`, `Giả định`, `Cần kiểm chứng` hoặc `Đã loại bỏ`.
- Thay đổi kiến trúc quan trọng phải có ADR trong `04-engineering/adr/`.
- Thay đổi hành vi AI phải cập nhật prompt, evaluation và safety policy cùng lúc.
- Không đưa thông tin nhận dạng hoặc dữ liệu sức khỏe thật của người tham gia nghiên cứu vào repository.

## Chỉ mục

| Thư mục | Nội dung | Trạng thái ban đầu |
|---|---|---|
| [00-foundation](00-foundation/README.md) | Tầm nhìn, vấn đề, đối tượng, nguyên tắc, MVP, roadmap, metrics | Đã có bản v0.1 |
| [01-research](01-research/README.md) | Kế hoạch nghiên cứu, phỏng vấn, consent, giả định | Sẵn sàng triển khai |
| [02-product](02-product/README.md) | PRD, user stories, backlog và acceptance criteria | Đã có bản v0.1 |
| [03-design](03-design/README.md) | Kiến trúc thông tin, user flow, nguyên tắc UX | Đã có khung |
| [04-engineering](04-engineering/README.md) | Kiến trúc, dữ liệu, API, môi trường, ADR | Đã có định hướng |
| [05-ai](05-ai/README.md) | Phạm vi AI, output contract, prompt, evaluation, safety | Đã có định hướng |
| [06-security-privacy](06-security-privacy/README.md) | Privacy-by-design, consent, threat model | Đã có baseline |
| [07-testing](07-testing/README.md) | Chiến lược test, test case, beta plan | Đã có baseline |
| [08-operations](08-operations/README.md) | Hạ tầng, CI/CD, deploy, quan sát, backup | Đã có khung |
| [09-release](09-release/README.md) | Release checklist, changelog, support | Đã có khung |

## Tài liệu cần đọc trước khi bắt đầu code

1. [Product Direction — Web + Mobile Prototype](00-foundation/product-direction.md)
2. [Product Vision](00-foundation/product-vision.md)
3. [Problem Statement](00-foundation/problem-statement.md)
4. [Personas & Jobs-to-be-Done](00-foundation/personas-and-jobs.md)
5. [MVP Scope](00-foundation/mvp-scope.md)
6. [PRD](02-product/prd.md)
7. [Technology Stack](04-engineering/technology-stack.md)
8. [System Architecture](04-engineering/system-architecture.md)
9. [AI Product Spec](05-ai/ai-product-spec.md)
10. [AI Safety Policy](05-ai/ai-safety-policy.md)
11. [Test Strategy](07-testing/test-strategy.md)

## Quy ước trạng thái

- **Draft:** đang xây dựng, chưa dùng làm cam kết.
- **Review:** đã đủ nội dung, đang chờ phản biện.
- **Approved:** được dùng làm cơ sở triển khai.
- **Superseded:** đã được thay thế; phải trỏ tới tài liệu mới.

## Việc tiếp theo

- Thực hiện 8–12 cuộc phỏng vấn theo `01-research/`.
- Kiểm chứng ba giả định rủi ro cao trong `assumptions-and-risks.md`.
- Vẽ wireframe cho bốn flow lõi.
- Chốt stack bằng ADR trước khi scaffold mã nguồn.
