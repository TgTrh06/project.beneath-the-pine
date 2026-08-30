# AI Implementation Handbook

> Hướng dẫn delivery để thay đổi sản phẩm mà không vô tình đổi lời hứa của nó.

- **Đối tượng:** Coding AI và implementation engineers
- **Trạng thái:** Approved working guide
- **Cập nhật:** 2026-08-30

## Mục đích

Dùng handbook này khi thay đổi chạm đến Focus & Gentle Retention. Nó chuyển các quyết định đã duyệt thành lát cắt nhỏ, có thể kiểm chứng; không có thẩm quyền cao hơn hồ sơ product, design, privacy hay architecture.

## Canonical sources

1. [Product Direction](../00-foundation/product-direction.md)
2. [PRD](../02-product/prd.md)
3. [ADR-0006 — Gentle Retention and Reminder Delivery](../04-engineering/adr/0006-gentle-retention-and-reminders.md)
4. [Data Model](../04-engineering/data-model.md)
5. [Privacy by Design](../06-security-privacy/privacy-by-design.md)

## Thứ tự đọc

1. [Project context](project-context.md)
2. [Implementation rules](implementation-rules.md)
3. [Retention delivery overview](retention/README.md)
4. [UI/UX implementation guide](ui-ux/README.md), khi lát cắt thay đổi giao diện
5. Chỉ lát cắt đang thực hiện trong `retention/`
6. [Contracts](contracts/) tương ứng và [acceptance matrix](retention/acceptance-matrix.md)

## Dừng để xin quyết định

Dừng và hỏi trước khi thêm outbound provider, thay đổi consent, đưa vào dependency/provider, thực hiện destructive migration, đổi retention hoặc xử lý mâu thuẫn với canonical source. Không tự thêm streak, gamification, push notification hoặc inferred personal data.

Mặc định an toàn là khiêm tốn: giữ nguyên focus flow, để tính năng tùy chọn thực sự tùy chọn, và để người dùng rời đi với một bước tiếp theo nhỏ hơn.
