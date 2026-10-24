# Kịch bản demo cổng core — Solo và Camp/Pact

Kịch bản này đã được chạy ngày 2026-10-24 với PostgreSQL tạm, migration 0002, API/web local và ba tài khoản thử. A dùng tab IAB mới; B/C dùng tab Chrome mới và đăng xuất giữa hai tài khoản. Giữ kịch bản để lặp lại trước pilot; không lưu email, token, intention hoặc Seed thử nghiệm trong repo.

## Chuẩn bị

1. Tạo PostgreSQL tạm riêng; áp dụng 0000 → 0001 → 0002. Với lượt nâng cấp, chèn dữ liệu Circle cũ trước 0002 và ghi số hàng, ID, FK, quyền và event trước/sau. Không dùng hoặc migrate DB local/pilot đang có.
2. Khởi động API, xác nhận `/health/live` và `/health/ready` thành công; khởi động web mới. Mở hai profile/browser context độc lập, thêm profile thứ ba cho người ngoài.
3. Ghi phiên bản commit, thời điểm, cổng, tài khoản thử ẩn danh và log đã che dữ liệu. Không ghi intention, Seed, email, token hoặc cookie vào repo.

## Demo A — Solo → checkout → Seed → quay lại

| Bước | Hành động | Kỳ vọng |
| --- | --- | --- |
| A1 | Đăng nhập tài khoản A; nhập intention và chọn 5 phút; reload trước khi start. | Draft còn trong cùng tab; chưa có phiên trên server. |
| A2 | Bấm bắt đầu, làm mất response rồi tải lại. | Chỉ một session; trạng thái và timer khôi phục từ `serverNow`/`endsAt`. |
| A3 | Ngắt API/network ngắn, quan sát timer và thử đồng bộ. | UI báo chưa đồng bộ; không tự kết luận phiên đã hoàn tất. |
| A4 | Checkout `progress`, nhập Seed, gây lỗi lưu rồi thử lại. | Draft không mất, không ghi outcome/Seed trùng; Return hiển thị Seed sau khi server xác nhận. |
| A5 | Reload, mở lại từ Seed; đăng nhập B kiểm tra Return và export. | A thấy Seed đúng; B không thấy intention/Seed của A. |

## Demo B — Camp → Pact → late join → checkout

| Bước | Hành động | Kỳ vọng |
| --- | --- | --- |
| B1 | A tạo Camp và link mời; B xem preview rồi chấp nhận; C mở Camp/Pact. | Preview chỉ có tên Camp/người mời; C bị từ chối. |
| B2 | A tạo Pact ngay và Pact theo giờ, chọn B. B đổi declined → accepted ở Pact còn scheduled. | A xuất hiện một lần và accepted; `sessionId` vẫn null sau tạo; B đổi được trước start. |
| B3 | A bấm start riêng; A checkout trước khi B join. | Pact vẫn active đến `endsAt` cho B accepted và còn quyền. UI giải thích đang chờ người vào muộn. |
| B4 | B join trước hạn, hai phiên xem participant/presence; B checkout. | Hai phía thấy trạng thái nhất quán; Pact completed sau checkout cuối; không còn nút start/join. |
| B5 | Tạo Pact khác theo giờ và hủy; thử start/join sau hủy. | Trạng thái cancelled; hành động terminal bị ẩn/chặn. |
| B6 | Trong Pact khác, ngắt realtime B rồi reconnect; A loại B khỏi Camp; B thử đọc/join/checkout/presence. | Snapshot mới từ server; B mất quyền ngay; không còn sự kiện room riêng gửi cho B. |
| B7 | Kiểm tra HTTP projection, `presence.updated`, console, API logs và `product_events` bằng marker riêng. | Không có intention, Seed hoặc token của tài khoản khác trong nhóm/presence/log. |

## Ghi kết quả tại cổng

| Hành trình | Trạng thái hiện tại | Bằng chứng cần đính kèm |
| --- | --- | --- |
| Solo A1–A5 | Đạt phần browser đã chạy | Draft và timer khôi phục sau reload; lỗi API lúc checkout giữ outcome/Seed; thử lại lưu thành công, Return và “Tiếp tục từ đây” đúng. B không thấy Seed A. Mất response **start** chưa mô phỏng trong browser; API live kiểm tra request key không tạo trùng. |
| Camp/Pact B1–B5 | Đạt | Preview/accept, phản hồi declined → accepted, tạo ngay/theo lịch, start riêng, late join sau A checkout, checkout cuối, hủy có xác nhận, trạng thái terminal và quyền C đều quan sát được. |
| Realtime/quyền B6–B7 | Đạt trong một API instance | Hai browser cùng thấy 04:50, presence nghỉ đồng bộ; reload B còn 04:34. Khi API dừng, UI báo mất kết nối và chỉ báo đồng bộ lại sau khi API trở lại. A loại B trong lúc phiên chạy: B thấy màn mất quyền. DOM B không chứa marker riêng; `product_events.metadata` 0/15 marker; console A/C không có marker. Payload `presence.updated` được xác nhận bởi suite API, chưa packet-capture trực tiếp từ hai browser. |
| Migration nâng cấp/sạch | Đạt trên DB tạm | Clean migration hoàn tất, health live/ready `UP`. Fixture schema Circle cũ có Camp, membership, invite, Pact, session, participant, milestone và event; ID/liên kết/FK/quyền sau 0002 giữ đúng. Không chạy trên database local hay pilot. |

**Kết luận cổng local:** hai hành trình demo không còn blocker đã biết trên một API instance. Lỗi nút join sau checkout được phát hiện và chạy lại sau sửa. Giới hạn còn lại: chưa ép mất response start trong browser, chưa thử nhiều API instance/browser engine khác và chưa có bằng chứng người dùng pilot. Deploy và migration trên dữ liệu thật vẫn chờ kế hoạch riêng.
