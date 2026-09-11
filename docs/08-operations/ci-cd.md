# CI/CD

- **Ngày:** 2026-09-11
- **Trạng thái:** Kiểm kê hiện tại; pipeline đích cần kế hoạch implementation.

## Workflow hiện có

.github/workflows/ci.yml còn các job và cấu hình backend cũ chưa đồng bộ với stack đích. Web job chạy pnpm install/lint/test/build; do workspace chứa draft NestJS, root scripts có thể chạy thêm package draft. Chưa có PostgreSQL service cùng TEST_DATABASE_URL cho draft Nest tests trong workflow.

Scaffold đã cập nhật package/lockfile và được workspace apps/* nhận diện. Root recursive lint/test/build bao gồm package API mới; workflow chưa được sửa hoặc xác minh trên CI. Không khẳng định CI đã chạy Drizzle migration, native app hoặc API contract generation.

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
