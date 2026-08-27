# Implementation Rules for Coding AI

## Delivery discipline

- Làm đúng một lát cắt theo thứ tự; không mở rộng scope trong khi code.
- Trước write/migration/provider/config: nêu scope, files, validation, assumptions, risk và chờ approval.
- Reuse module/domain/repository/controller pattern gần nhất; không thêm framework hoặc dependency nếu không có requirement đã duyệt.

## UI rules

- Primary action rõ ràng; trạng thái default/loading/error/empty/disabled/success phải được xử lý.
- Keyboard/focus, 320px mobile, contrast và `prefers-reduced-motion` là acceptance criteria.
- YouTube chỉ load/play sau thao tác user; lỗi player không ảnh hưởng timer.

## Data and security rules

- Không log task title, raw content, note, audio URL hay notification copy.
- Event chỉ gồm ID/enum/timestamp/duration/channel.
- Migration additive, RLS owner-only, export/delete cập nhật cùng thay đổi persistence.
- Job reminder idempotent và re-check opt-in trước delivery.

## Required checks

Chạy focused tests trước, rồi `pnpm test`, `pnpm lint`, `pnpm build` khi scope chạm web/API/contracts. Không báo check pass nếu chưa chạy.
