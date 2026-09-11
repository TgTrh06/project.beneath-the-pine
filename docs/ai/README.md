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
3. [Tiered Delivery Plan](../02-product/tiered-delivery-plan.md)
4. [System Diagrams](../04-engineering/system-diagrams.md)
5. [Sequence Diagrams](../04-engineering/sequences/README.md)
6. [ADR-0006 — Gentle Retention and Reminder Delivery](../04-engineering/adr/0006-gentle-retention-and-reminders.md)
7. [Data Model](../04-engineering/data-model.md)
8. [Privacy by Design](../06-security-privacy/privacy-by-design.md)

## Thứ tự đọc

1. Xác định capability ID và tier trong [Tiered Delivery Plan](../02-product/tiered-delivery-plan.md).
2. Đọc quan hệ của capability trong [System Diagrams](../04-engineering/system-diagrams.md).
3. Đọc sequence của flow tương ứng trong [Sequence Diagrams](../04-engineering/sequences/README.md).
4. Đọc [Project context](project-context.md) và [Implementation rules](implementation-rules.md).
5. Với retention, đọc [Retention delivery overview](retention/README.md) và chỉ slice đang thực hiện.
6. Với giao diện, đọc [UI/UX implementation guide](ui-ux/README.md).
7. Chốt [contracts](contracts/) và acceptance criteria trước khi sửa code.

## Traceability rule

Mỗi thay đổi nên ghi capability ID, requirement ID, sequence áp dụng, contract thay đổi và evidence kiểm thử. Nếu code mới làm thay đổi dependency hoặc flow đã duyệt, cập nhật diagram/sequence cùng lát cắt thay vì để tài liệu mô tả kiến trúc cũ.

## Dừng để xin quyết định

Dừng và hỏi trước khi thêm outbound provider, thay đổi consent, đưa vào dependency/provider, thực hiện destructive migration, đổi retention hoặc xử lý mâu thuẫn với canonical source. Không tự thêm streak, gamification, push notification hoặc inferred personal data.

Mặc định an toàn là khiêm tốn: giữ nguyên focus flow, để tính năng tùy chọn thực sự tùy chọn, và để người dùng rời đi với một bước tiếp theo nhỏ hơn.
