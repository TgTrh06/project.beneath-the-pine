# Retention Implementation Overview

Retention là lời mời quay lại nhẹ nhàng, không phải một hệ thống gây áp lực. Hãy triển khai theo thứ tự để data/safety foundation có trước trải nghiệm phụ thuộc vào chúng.

## Đường giao hàng

1. [Slice 01 — Data and contracts](slice-01-data-and-contracts.md)
2. [Slice 02 — Backend and bootstrap](slice-02-backend.md)
3. [Slice 03 — Front-end flows](slice-03-frontend.md)
4. [Slice 04 — Jobs and observability](slice-04-jobs-and-observability.md)
5. [Acceptance matrix](acceptance-matrix.md)

## Invariant xuyên lát cắt

`Focus completion → optional Open Seed → opted-in reminder → gentle Return → evidence-based Weekly letter`

Không lát cắt nào được để lộ task title trong analytics/notifications, tạo reminder không có opt-in, hoặc chặn core focus flow vì một cơ chế retention tùy chọn thất bại.

Trước khi bắt đầu, quay lại [AI Implementation Handbook](../README.md) để xem source-of-truth và stop conditions.
