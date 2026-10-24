# C01 — Baseline trước đổi Camp (2026-10-24)

Đây là ảnh chụp **trước** thay đổi hợp đồng Circle → Camp. Các file chuẩn bị pilot đang có trong worktree được giữ nguyên. Kết quả browser/API từ những lượt trước được ghi là bằng chứng lịch sử, không thay cho nghiệm thu C02–C04 sau migration.

## Kiểm tra workspace hiện tại

| Lệnh | Kết quả | Giới hạn |
| --- | --- | --- |
| `pnpm lint` | Đạt, exit 0; boundary check 62 file TypeScript. | Không kiểm tra browser. |
| `pnpm test` | Đạt, exit 0; web 36/36, API 21 pass/0 fail/5 skip. | Năm ca PostgreSQL/HTTP live không chạy khi thiếu biến môi trường. |
| `pnpm build` | Đạt, exit 0; contracts, API và web production build. | Không xác nhận Docker image hoặc deploy. |

## Đối chiếu luồng

| Luồng | Đã xong theo code và bằng chứng hiện có | Chưa xong / cần nghiệm thu C02–C04 | Lỗi tái hiện được và task |
| --- | --- | --- | --- |
| Solo | Form ý định/thời lượng, start idempotent, timer theo mốc server, checkout và khôi phục draft cùng tab; API live và browser trước đây đã kiểm tra. | Chạy lại trên browser thật sau đổi Camp: response start bị mất, reload, mất mạng, checkout retry. | Chưa có blocker mới ở baseline; C02 sẽ ghi bước tái hiện nếu phát hiện. |
| Checkout | Bốn outcome trung tính, thao tác lặp không ghi đè outcome/Seed; API và browser trước đây đạt. | Nghiệm thu lỗi mạng khi đang nhập, hết giờ trong dialog, trạng thái sau refresh. | Chưa có blocker mới ở baseline; C02/C03. |
| Open Seed | Một Seed hiện hành mỗi tài khoản, giữ/thay/xóa và Return hiển thị; API live và browser trước đây đạt. | Xác nhận lưu lỗi giữ bản nháp, mở lại Seed ở lần truy cập sau và không lộ sang Camp. | Chưa có blocker mới ở baseline; C02/C04. |
| Circle → Camp | Circle hiện có tạo nhóm, mời/nhận, quản lý thành viên và phân quyền; API live và browser trước đây đạt. | Đổi hợp đồng, schema, route và nhãn sang Camp; migration giữ dữ liệu; chạy lại hai tài khoản và một người ngoài. | **Thay đổi hợp đồng có chủ đích / cao:** client và link Circle cũ sẽ ngừng dùng; C03 ghi release note và kiểm tra sau migration. |
| Pact | Tạo lịch/ngay không tự start, phản hồi, join, checkout, hủy/hết hạn; API live và browser trước đây đạt. | Chạy lại trạng thái nút, người vào muộn sau creator checkout, hai tài khoản đồng thời. | **API/domain / chặn C03:** creator start rồi checkout trước invitee đã nhận lời join → Pact `completed`, invitee không vào được trước `endsAt`. Tái hiện trong `integration-privacy-ui-verification.md`; C03 sửa theo quy tắc giữ mở cho người đủ quyền đến hạn. |
| Realtime và quyền riêng tư | Snapshot server, reconnect/revocation, presence tối thiểu và race database có test; một số browser trước đây đạt. | Hai phiên độc lập cùng xem; mất kết nối rồi hồi phục; so timer/trạng thái; kiểm tra lại quyền sau loại thành viên và payload/log. | Chưa có blocker mới ở baseline; C04 ghi nếu phát hiện. |

## Cổng tiếp theo

1. Chạy các suite live trên PostgreSQL **tạm riêng**, không migrate/reset database local đang dùng.
2. Thực hiện migration Camp trên database tạm có dữ liệu Circle cũ và trên database sạch; đối chiếu số bản ghi, ID, FK, quyền và event.
3. Chạy C02–C04 sau đổi tên với hai phiên đăng nhập độc lập và tài khoản ngoài nhóm. C05 chỉ sửa lỗi chặn tái hiện từ các lượt này.

## Kết quả sau đổi Camp — 2026-10-24

Toàn bộ lượt live/browser dưới đây dùng container PostgreSQL tạm `btp-core-closeout-20261024` tại `127.0.0.1:5544`, API `127.0.0.1:8081` và web `127.0.0.1:5173`. Không migrate/reset database local đang dùng. Browser A là tab IAB mới; B/C dùng tab Chrome mới, đăng xuất giữa hai tài khoản.

| Hạng mục | Trạng thái | Bằng chứng và giới hạn |
| --- | --- | --- |
| Workspace lint/test/build | Đạt | `pnpm lint` đạt, boundary check 62 file; `pnpm test` với DB tạm và API live: web 37/37, API 47 pass/0 fail/0 skip; `pnpm build` đạt. |
| Migration sạch | Đạt | `pnpm --filter @beneath-the-pine/api db:migrate` hoàn tất trên DB tạm mới; có 5 bảng Camp; `/health/live` và `/health/ready` đều `UP`. |
| Migration Circle → Camp có dữ liệu | Đạt trong fixture | Test tạo schema cũ, chèn 1 Circle, membership, invite, Pact, session, participant, milestone và event rồi áp dụng 0002. ID và liên kết giữ nguyên; 5 FK được kiểm tra; chủ nhóm vẫn đọc Camp/Pact/session; event đổi thành `camp_created`. Chưa chạy trên dữ liệu pilot/thật. |
| C02 Solo browser | Đạt phần đã chạy | Draft ý định và 5 phút sống qua reload; start tạo một session, reload khôi phục cùng ID/timer; ngắt API lúc checkout giữ outcome và Seed, thử lại thành công; reload Return vẫn thấy Seed, “Tiếp tục từ đây” điền lại ý định. Mất response của **start** chưa ép bằng browser, đã được API idempotency suite kiểm tra. |
| C03 Camp/Pact browser | Đạt | A tạo Camp/link, B thấy preview giới hạn rồi tham gia; Pact ngay tạo ở `scheduled` chưa có session, B đổi declined → accepted, A start riêng; A checkout trước, B vẫn join trước `endsAt`, checkout cuối chuyển Pact thành `completed`. Pact theo lịch không có nút start sớm, hủy qua dialog xác nhận và không còn nút hành động. C bị từ chối ở Camp/Pact. |
| C04 realtime/browser | Đạt trong một API instance | A/B cùng ở một session: timer hiển thị cùng mốc 04:50; B báo nghỉ, cả hai thấy presence; B reload vẫn thấy 04:34 và trạng thái nghỉ. Dừng API: B thấy mất kết nối, lỗi đồng bộ và nút thử lại; API lên lại mới báo “Đã đồng bộ”. A loại B: B thấy màn mất quyền và không còn phiên; reload trước đó trả lỗi truy cập. |
| C04 privacy/log | Đạt trong phạm vi thử | DOM của B không chứa marker intention/Seed của A; B Return không có Seed của A. C không mở được Camp/Pact. `product_events.metadata`: 0/15 hàng chứa marker riêng; console A/C: 0 bản ghi marker. API suite kiểm tra projection, quyền và hợp đồng `presence.updated`; chưa có quan sát dài hạn log pilot hoặc broadcast nhiều API instance. |

### Lỗi tái hiện và sửa C05

| Nhóm / ảnh hưởng | Bước tái hiện và kết quả trước sửa | Sau sửa / bằng chứng |
| --- | --- | --- |
| API/domain · chặn người vào muộn | B nhận lời; A start rồi checkout trước B join; Pact cũ khép ngay, B không vào được dù chưa tới `endsAt`. | C03 giữ Pact `active` khi còn người accepted/còn quyền/chưa join. API live join–checkout và browser A checkout → B join → B checkout đều đạt. |
| Giao diện · trung bình | A checkout, B chưa join nên Pact còn `active`; A mở lại chi tiết và danh sách vẫn có “Tham gia phiên”; bấm nhận 409. | C05 trang chi tiết kiểm tra snapshot phiên của chính người xem; danh sách dẫn vào chi tiết thay vì cho join thiếu trạng thái. Browser chạy lại: A không còn nút, B vẫn có nút join. Regression `pactActions(..., canJoin=false)` đạt. Không đổi API/schema cho lỗi này. |
| Kiểm thử/tích hợp · trung bình | `dist-test` còn JS Circle cũ khiến `pnpm test` đếm thêm suite không còn trong source. | Script test dọn output compile cũ; full live 47/0/0. |
| Tương thích hợp đồng · cao, có chủ đích | Client gọi `/circles`, `/circle-invites` hoặc link `#circle/:id` sau phát hành. | Hợp đồng cũ bị bỏ theo quyết định sản phẩm. ADR, API contract và runbook ghi bước rollout/rollback; chưa phát hành nên không có người dùng thật bị ảnh hưởng. |

**Giới hạn cổng:** browser chưa ép mất response ngay lúc start; chưa kiểm chứng nhiều API instance, browser engine khác hoặc dữ liệu pilot. Các điều này không chặn hai kịch bản demo cốt lõi trên môi trường tạm một API instance. Triển khai/migration trên dữ liệu thật vẫn cần kế hoạch và phê duyệt riêng.
