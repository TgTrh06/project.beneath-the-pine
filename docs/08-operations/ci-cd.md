# CI/CD

- **Ngày:** 2026-09-11
- **Trạng thái:** Node/pnpm workspace verification hiện tại; pipeline database/deploy còn mở.

## Workflow hiện có

.github/workflows/ci.yml có một job Node/pnpm chạy frozen install, lint, test và build toàn workspace, gồm web và API. Job của backend legacy đã được gỡ. Chưa có PostgreSQL service hoặc migration test trong workflow.

Root recursive lint/test/build bao gồm API. Workflow đã được cập nhật nhưng chưa được thực thi trên GitHub trong lần dọn local này. Không khẳng định CI đã chạy Drizzle migration, native app hoặc API contract generation.

## Pipeline đích đề xuất

- Type-check/lint, test và build web/API.
- PostgreSQL test tách biệt: Drizzle schema/migration, task transaction, ownership, auth và dependency failure.
- Migration baseline test cho database mới và database giả lập migration cũ hiện hữu.
- Contract fixture/OpenAPI consistency; compatibility với client cũ khi public mobile đã phát hành.
- Image build và smoke health khi Dockerfile NestJS được triển khai.
- Mobile build/test chỉ khi triển khai React Native + Expo; không mặc định thêm vào pnpm nếu không phải JS.

Test DB phải bị đánh dấu disposable và không nhận credential dev/staging/production. Không cho integration suite âm thầm skip trong job bắt buộc. CI không deploy/migrate production nếu chưa có quy trình và ủy quyền riêng.

## Gate tài liệu

Scaffold được kiểm tra local bằng lint/test/build riêng và smoke process health; tài liệu kiểm tra link/path và trạng thái thiết kế/hiện có. Tests không chứng minh baseline/schema Drizzle đã chạy trên PostgreSQL thật.
