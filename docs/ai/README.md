# AI Implementation Handbook

- **Audience:** Coding AI và engineer triển khai
- **Status:** Approved working guide
- **Last updated:** 2026-08-27

## Purpose

Đây là entry point để triển khai Focus & Gentle Retention. Nó chuyển các quyết định đã chốt thành lát cắt nhỏ, nhưng không thay thế PRD, ADR hoặc privacy policy.

## Canonical sources

1. [`../00-foundation/product-direction.md`](../00-foundation/product-direction.md)
2. [`../02-product/prd.md`](../02-product/prd.md)
3. [`../04-engineering/adr/0006-gentle-retention-and-reminders.md`](../04-engineering/adr/0006-gentle-retention-and-reminders.md)
4. [`../04-engineering/data-model.md`](../04-engineering/data-model.md)
5. [`../06-security-privacy/privacy-by-design.md`](../06-security-privacy/privacy-by-design.md)

## Read order

1. [Project context](project-context.md)
2. [Implementation rules](implementation-rules.md)
3. [Retention overview](retention/README.md)
4. [UI/UX implementation guide](ui-ux/README.md) khi lát cắt có thay đổi giao diện.
5. Chỉ lát cắt hiện tại trong `retention/`.
6. Contract tương ứng trong `contracts/` và [acceptance matrix](retention/acceptance-matrix.md).

## Stop conditions

Dừng và hỏi người dùng khi requirement cần provider outbound, thay đổi consent, thêm dependency/provider, migration destructive, thay đổi retention, hoặc mâu thuẫn với canonical source. Không tự thêm streak, gamification, push notification hay data inference.
