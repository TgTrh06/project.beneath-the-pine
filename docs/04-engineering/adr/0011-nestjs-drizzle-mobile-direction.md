# ADR-0011 — NestJS, Drizzle và React Native + Expo

- **Trạng thái:** Accepted.
- **Ngày:** 2026-09-11.
- **Topology:** [ADR-0012](0012-modular-monolith-proposal.md), Accepted.

## Quyết định

1. Backend dùng NestJS + TypeScript, PostgreSQL, Drizzle ORM và Drizzle Kit.
2. Core là modular monolith; inference độc lập; worker theo nhu cầu cụ thể.
3. Mobile là nền tảng sản phẩm chính về dài hạn, dùng React Native + Expo + TypeScript.
4. React/Vite web được xây trước để hoàn thiện API core dùng chung. Không cần hoàn thành toàn bộ T0–T5 web trước mobile.
5. Contract dùng chung độc lập với UI và database schema. Không đưa Drizzle hoặc backend credential vào client.
6. Viết lại tài liệu trước khi tiếp tục code; giữ dữ liệu và lịch sử SQL cần thiết cho baseline review.

## Lý do lựa chọn

NestJS đáp ứng hướng phát triển backend của người dùng; Drizzle được chọn để truy cập PostgreSQL và quản lý schema/migration có review. React Native + Expo tận dụng React/TypeScript hiện có và cung cấp hướng phát triển Android/iOS. Chia sẻ contract và logic thuần khi có ích; giao diện native vẫn được thiết kế riêng.

## Quyết định còn mở

Android hay iOS ra mắt đầu tiên, native authentication và account lifecycle, push, offline sync, provider/hosting và worker use case. Chọn Expo không tự động chọn EAS, push provider hoặc cơ chế auth.

## Trạng thái và hệ quả

`apps/api` hiện là Core duy nhất và dùng Drizzle/node-postgres ở tầng platform; business schema và mobile chưa triển khai. Xem trạng thái tại [Repository Structure](../repository-structure.md).

Browser session/CSRF là contract baseline cần review; mobile auth quy về cùng account UUID và quyền tài nguyên. Không thay tài khoản hoặc reset dữ liệu chỉ vì đổi implementation.

## Validation và rollback

Kiểm tra API parity, PostgreSQL/Drizzle, constraint, transaction, ownership và migration baseline trước cutover. Mobile kiểm tra app resume, mạng mất, credential expiry và dữ liệu chung với web. Rollback artifact phải tương thích schema/contract; dữ liệu không được coi là tự đảo ngược theo Git.
