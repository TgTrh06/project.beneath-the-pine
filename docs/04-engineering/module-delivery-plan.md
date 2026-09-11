# Kế hoạch module Core — manual first

- Ngày: 2026-09-11. Phạm vi scaffold đã được người dùng duyệt.
- Core: NestJS modular monolith, PostgreSQL + Drizzle; web trước, React Native + Expo sau.
- **Chưa có AI.** Không tạo module AI, inference client, quota, job, worker hoặc broker. Python pilot hiện có vẫn độc lập.
- Các API/use case dưới đây là thiết kế để review, chưa phải endpoint đã triển khai.

## Bộ khung đã có (S0)

`apps/api` đăng ký 12 module NestJS độc lập, mỗi module gồm file composition và README chi tiết. Chưa có business provider, controller hoặc schema. Platform có typed config, Drizzle/node-postgres connection, health, request ID, safe errors và guard từ chối truy cập cho đến khi có auth adapter.

Chỉ hai endpoint health hoạt động. Không có database thì liveness vẫn 200, readiness 503; readiness thành công chỉ xác nhận kết nối. Kiểm tra import phát hiện cycles và import xuyên boundary hiện tại. Nó không thay thế review quyền dữ liệu hoặc transaction.

## Danh mục và ownership

| Module | Trách nhiệm | Ưu tiên | Đặc tả chi tiết |
| --- | --- | --- | --- |
| identity | Đăng ký, đăng nhập, đăng xuất, trạng thái account và vòng đời credential. | P0 / S1 | [Use case, dữ liệu, API, acceptance](../../apps/api/src/modules/identity/README.md) |
| profile | Hồ sơ tối thiểu, tên hiển thị nếu có, timezone và thiết lập tài khoản có nhu cầu lưu server. | P0 / S1 | [Use case, dữ liệu, API, acceptance](../../apps/api/src/modules/profile/README.md) |
| consent | Ghi nhận và thu hồi các lựa chọn xử lý dữ liệu thực sự được sản phẩm sử dụng. | P0 / S1, S3 | [Use case, dữ liệu, API, acceptance](../../apps/api/src/modules/consent/README.md) |
| task | Hành động người dùng tự nhập/xác nhận và trạng thái ready/done/deferred/archived. | P0 / S2 | [Use case, dữ liệu, API, acceptance](../../apps/api/src/modules/task/README.md) |
| focus | Start, pause/resume, completion/cancellation và kết quả phiên focus; server state độc lập UI timer. | P0 / S3 | [Use case, dữ liệu, API, acceptance](../../apps/api/src/modules/focus/README.md) |
| capture | Nhập, đọc, sửa/xóa nội dung thủ công và người dùng tự chọn next-action. | P1 / S3 hoặc sau task core | [Use case, dữ liệu, API, acceptance](../../apps/api/src/modules/capture/README.md) |
| engagement | Một điểm vào cho lần quay lại, tính eligibility và lựa chọn in-app reminder. | P1 / S4 | [Use case, dữ liệu, API, acceptance](../../apps/api/src/modules/engagement/README.md) |
| reflection | Facts tổng hợp tuần và phản hồi người dùng theo template xác định. | P2 / S5 | [Use case, dữ liệu, API, acceptance](../../apps/api/src/modules/reflection/README.md) |
| habit | Habit tối giản và đánh dấu theo ngày local. | P2 / S5 | [Use case, dữ liệu, API, acceptance](../../apps/api/src/modules/habit/README.md) |
| analytics | Ghi nhận facts phục vụ đo activation, focus và return bằng payload hạn chế. | P1 / S3–S4 | [Use case, dữ liệu, API, acceptance](../../apps/api/src/modules/analytics/README.md) |
| privacy | Điều phối yêu cầu dữ liệu theo principal và tập module thực sự có dữ liệu. | P0 thiết kế; cùng mọi slice | [Use case, dữ liệu, API, acceptance](../../apps/api/src/modules/privacy/README.md) |
| access | Điều kiện tham gia sản phẩm, invitation và member state; tách khỏi login. | P2 / S6 nếu beta gate còn dùng | [Use case, dữ liệu, API, acceptance](../../apps/api/src/modules/access/README.md) |

## Phụ thuộc dự kiến

Hiện tại các module chỉ được AppModule đăng ký, chưa gọi lẫn nhau. Khi triển khai, chỉ export application contract thực sự có consumer; không tạo interface rỗng trước nhu cầu.

| Consumer | Hợp đồng cần dùng |
| --- | --- |
| identity | Không phụ thuộc module nghiệp vụ khác. Platform/security nhận principal qua adapter identity khi triển khai. |
| profile | Dùng principal identity đã xác thực; không query bảng account để thay authentication. |
| consent | Chỉ dùng principal; capture/analytics hỏi purpose thực sự cần. Không tạo vòng gọi ngược. |
| task | Không phụ thuộc focus. Capture có thể điều phối kiểm tra nội dung của mình rồi gọi task application API. |
| focus | Dùng task owned-lookup/transition và profile timezone nếu cần phân ngày. Task không gọi ngược focus. |
| capture | Consent kiểm tra purpose thực sự dùng; task nhận action thủ công. Không tạo phụ thuộc task → capture. |
| engagement | Profile timezone, focus facts, task owned-reference khi seed liên kết task. Không đọc trực tiếp schema của họ. |
| reflection | Focus facts, profile timezone; engagement facts chỉ nếu summary cần. |
| habit | Profile timezone; không phụ thuộc task/focus internals. |
| analytics | Module nghiệp vụ có thể gọi ingestion contract một chiều khi được triển khai; analytics không đọc ngược repository nghiệp vụ. |
| privacy | Một chiều gọi identity khóa account và các module có dữ liệu; module khác không import privacy. |
| access | Identity principal/status; không gom product rules vào authorization guard chung. |

Privacy điều phối các owner một chiều. Analytics nhận event được allowlist; không truy vấn ngược bảng nghiệp vụ. Platform không import business module. Adapter identity được nối ở composition khi S1 triển khai; không thêm platform → identity import trái quy tắc.

## Thứ tự triển khai và cửa review

| Slice | Kết quả cần đạt | Điều kiện hoàn thành |
| --- | --- | --- |
| S0 — scaffold hiện tại | App boot, 12 module, platform, Drizzle config, tài liệu | Typecheck/build; composition, config, health, error/access và import tests |
| S1 — identity, profile, consent, privacy nền | Account/session browser, principal tin cậy, profile/timezone; purpose thật sự cần và export/delete dữ liệu S1 | Chốt auth/session store/CSRF, profile fields và retention; kiểm tra hai account, rotate/revoke, ownership và xóa |
| S2 — task thủ công | Nhập action, tạo task + confirmation, list/update/archive; nối web cho slice này | Review baseline Drizzle; transaction rollback, ownership, archive concurrency và retry; web dùng API thật |
| S3 — focus; capture tùy nhu cầu | Start/pause/resume/complete, phục hồi khi client mở lại; capture chỉ sau policy nội dung | Chốt active session và task transition; kiểm tra duplicate completion, recovery, timezone; capture có encryption/retention trước persistence |
| S4 — engagement, analytics tối thiểu | Một open seed, Return, opt-in reminder trong app, facts allowlist | Không cần background delivery; kiểm tra timezone, opt-out, duplicate event; core hoạt động khi telemetry lỗi |
| S5 — reflection, habit | Summary theo facts/template; habit tối giản nếu cần | Review giá trị sản phẩm trước làm; không sinh text bằng model; kiểm tra tuần local, facts rỗng, completion trùng |
| S6 — access có điều kiện | Beta membership/invitation nếu beta gate còn cần | Chốt quyền actor, expiry/replay/revoke; chưa có email provider |

Privacy là yêu cầu của từng slice có persistence, không đợi S6. Consent chỉ triển khai purpose được xác định, không dựng consent AI trước. Mỗi slice cập nhật contracts, export/delete/retention và tests liên quan cùng implementation.

Mobile có thể bắt đầu sau khi manual task/focus và authentication contract ổn định, không phải chờ toàn bộ S5/S6. Trước đó cần chọn hệ điều hành đầu tiên, native credential lifecycle và hành vi retry/background; chưa khởi tạo mobile hoặc offline sync trong S0.

## Drizzle và dữ liệu

Drizzle ORM 0.45.2, Kit 0.31.10, driver node-postgres. DatabaseService quản lý pool giới hạn và timeout. Chưa có schema, migration SQL/journal, baseline hay migration command. Kit config chỉ chỉ định schema glob và output; không chứa credential.

Trước persistence đầu tiên: kiểm kê SQL hiện hữu, map owner/table, chọn baseline trên database thử nghiệm, review SQL sinh ra, kiểm tra rollback/recovery và phê duyệt apply riêng. Không dùng scaffold làm writer thứ hai trên dữ liệu cũ.

## Phạm vi review và rủi ro

Review ownership, thứ tự slice, planned APIs, auth decisions và baseline. Không coi endpoint trong README là contract đã phát hành. Các giới hạn monolith vẫn có: shared process/release/failure domain; module folder không tự bảo đảm dễ tách service. Duy trì import checks, transaction ownership và measured workload trước khi chọn worker/service.

Scaffold dùng port 8081, script riêng và local env riêng; web/legacy chưa chuyển sang API mới. Không có deploy, migration hoặc thao tác dữ liệu không thể hoàn nguyên trong S0. Xem [hướng dẫn chạy](../../apps/api/README.md), [so sánh kiến trúc](architecture-options.md).
