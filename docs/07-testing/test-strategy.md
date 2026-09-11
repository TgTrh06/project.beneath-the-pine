# Test Strategy — Web trước, mobile là đích chính

- **Ngày:** 2026-09-11
- **Trạng thái:** Yêu cầu kiểm chứng đích; kiểm tra hiện có được phân biệt bên dưới.

## Hiện trạng

Web dùng Vitest và TypeScript checks. Draft NestJS cũ dùng Node test runner, Supertest và repository ports; PostgreSQL tests của draft phụ thuộc TEST_DATABASE_URL. Scaffold mới dùng Node test runner/Supertest để kiểm tra composition 12 module, config, health, errors, fail-closed access, import boundaries và driver timeout. Native tests và OpenAPI generation chưa có. [CI status](../08-operations/ci-cd.md).

Chạy `pnpm lint:api`, `pnpm test:api`, `pnpm build:api` cho scaffold. Nhánh readiness thành công dùng injected database; timeout driver dùng local TCP endpoint không trả handshake. Đây chưa là kiểm chứng PostgreSQL schema/transaction thực tế; chưa có migration hoặc business tests.

## Kiểm tra khi viết backend đích

| Ranh giới | Evidence cần có |
| --- | --- |
| Domain/use case | Title/minutes/status invariant, archive terminal, validation độc lập HTTP |
| HTTP contract | Valid/invalid/malformed payload, safe errors, output fixture, version/nullable/enum |
| Browser auth | Register/login/logout, BCrypt limit, session rotation/expiry, CSRF, safe cookie/CORS |
| Native auth | Sau khi chọn: PKCE/redirect nếu OAuth, secure storage, expiry/revocation/recovery, account mapping |
| Ownership | Hai account: không đọc/list/update/archive tài nguyên nhau; không tin owner từ body |
| Drizzle/PostgreSQL | SQL constraints, atomic task/confirmation, rollback, concurrent archive/update, pool failure |
| Migration | Database mới và baseline migration cũ giả lập; schema equivalence, journal, no destructive replay |
| Retry/idempotency | Timeout sau commit, duplicate request, cùng key khác payload, retention/replay |
| Client independence | Web tạo dữ liệu, HTTP client độc lập đọc qua cùng account; không phụ thuộc browser storage |
| AI/jobs nếu triển khai | Timeout, fallback, consent re-check, duplicate/restart/cancellation và result race |

Không dùng database mock thay bằng chứng PostgreSQL; mock vẫn hữu ích cho use case. Tests integration bắt buộc trong CI không được silently skip.

## Web và mobile

Web: loading/empty/error/auth state, keyboard, 320px, safe demo/account boundary, core workflow khi AI/audio lỗi.

Mobile: khi triển khai React Native + Expo, test thiết bị/emulator cho login expiry, app resume/process kill, keyboard, mạng chập chờn và dữ liệu cùng account trên web. Timer phục hồi theo state/timestamp được thiết kế, không giả định background JS luôn chạy. Offline sync/push cần acceptance riêng khi scope được duyệt.

## Capability và release

Retention acceptance nằm ở [matrix](../ai/retention/acceptance-matrix.md); capability thiết kế chưa phải test đã có. Sử dụng dữ liệu tổng hợp; không in token, title, email hoặc provider payload vào log/snapshot. Test RLS theo schema thực sự dùng, tách khỏi API authorization.

API core gate cho mobile nằm trong [Web/Mobile Strategy](../04-engineering/web-mobile-api-strategy.md). Trước public release còn cần consent/export/delete, recovery, quan sát lỗi và compatibility với client đã phát hành; test pass cục bộ không tự cấp quyền deploy.
