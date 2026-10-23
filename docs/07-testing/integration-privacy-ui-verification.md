# Kiểm chứng tích hợp, quyền riêng tư và UI — 2026-10-23

## Môi trường và phạm vi

- Docker Desktop chạy PostgreSQL 17 trong container tạm `btp-step6-postgres`, cổng `127.0.0.1:5543`. Chỉ database tạm mới nhận migration hiện có; container local của người dùng ở cổng `5433` không bị migrate, reset hay sửa dữ liệu.
- API chạy `127.0.0.1:8081`, web chạy `127.0.0.1:5173`; `/health/live` và `/health/ready` trả `UP` khi browser walkthrough bắt đầu. Browser dùng ba tài khoản thử (chủ Circle, thành viên được mời, người ngoài) và một Circle/Pact do lượt này tạo.
- Các kiểm tra HTTP live tự tạo và dọn bản ghi của mình. Không dùng dữ liệu pilot hoặc production, không deploy.

## Kết quả

| Trạng thái | Phạm vi | Bằng chứng và giới hạn |
| --- | --- | --- |
| Đạt | Workspace | `pnpm lint`, `pnpm test`, `pnpm build` đều exit 0. Web 36/36 test; API mặc định 21 pass, 5 skip vì chưa đặt biến live, 0 fail. |
| Đạt | PostgreSQL/API live | API với `BTP_TEST_DATABASE_URL` trỏ database tạm: 23 pass, 3 HTTP-gated skip. Solo, Pact và Circle HTTP live chạy trên database/API tạm: 23 pass, 0 skip. Các ca bổ sung xác nhận export của chủ chứa intention/Seed của mình, export người khác không chứa chuỗi đó. |
| Đạt | Solo → Return | Nhập intention, chọn 5 phút, reload draft, bắt đầu, reload phiên đang chạy, checkout `progress` với Seed; Return hiển thị Seed. Dialog checkout đóng bằng Escape và trả focus về nút mở. |
| Đạt | Circle → Pact | Chủ tạo Circle và link mời; người được mời chỉ thấy tên Circle và người mời trước khi tham gia. Người ngoài bị từ chối khi mở Circle/Pact. Người được mời đổi phản hồi, chủ tạo Pact ngay nhưng phiên chỉ mở sau nút bắt đầu riêng; người được mời tham gia, cả hai checkout. Pact đã hoàn tất/hủy không còn nút bắt đầu hoặc tham gia. |
| Đạt | Quyền sau khi loại thành viên | Sau khi chủ loại thành viên, tài khoản đó vẫn đọc được Seed riêng; các link Circle, Pact và session cũ trả 404 và có nút quay về danh sách an toàn. API live cũng kiểm tra quyền đọc/ghi và projection nhóm không chứa Seed hoặc intention của người khác. |
| Đạt | Lỗi mạng và khôi phục | Ngắt API đúng lúc sửa Seed: UI báo không kết nối, giữ bản nháp; API khôi phục rồi bấm lưu lại thành công. Các trang Circle/Pact lỗi tải có retry và đường quay về danh sách. |
| Đạt | Màn hình hẹp và bàn phím | Return ở 320, 390, 768, 1280 px không tràn ngang; Pact và trang lỗi quyền ở 320 px cũng không tràn. Tab, Shift+Tab, Enter và Escape được thử trên dialog; Escape trả focus về nút mở. |
| Đạt | Xác nhận thao tác nguy hiểm | Browser mở dialog xác nhận xóa Seed, rời Circle, loại thành viên, hủy Pact, thu hồi link mời và xóa tài khoản. Dialog xóa tài khoản yêu cầu mật khẩu và khóa nút xóa khi trống. Không xóa tài khoản thử qua UI. |
| Đạt | Console, log API và `product_events` | Chuỗi đánh dấu riêng trong intention/Seed và token lời mời thử không xuất hiện trong 85 console entries hoặc log API thu được từ lượt chạy. Truy vấn 11 `product_events` trên DB tạm cho 0 metadata chứa chuỗi đánh dấu. Analytics nay lọc metadata theo event và có unit test. |
| Chưa kiểm chứng | Toàn bộ tổ hợp giao diện/trình duyệt | Chưa chạy ma trận nhiều browser, zoom 200%, screen reader hoặc mọi nhánh lỗi Settings/Memory. Kết quả màn hình chỉ áp dụng các trang/width đã nêu. |
| Chưa kiểm chứng | Log vận hành dài hạn và nhiều API instance | Đã đối chiếu đường log API và console của lượt kiểm thử, nhưng chưa thu thập log của một pilot dài hạn. Realtime broadcast vẫn dựa trên một API instance; xem [bằng chứng Step 5](realtime-recovery-verification.md). |

## Lỗi tái hiện được và cách đã xử lý

| Loại / mức ảnh hưởng | Bước tái hiện trên code trước sửa | Kết quả trước sửa → hiện tại |
| --- | --- | --- |
| Giao diện / trung bình | Mở link Circle hoặc Pact khi không còn quyền; request trả 404. | Chỉ có nút thử lại, người dùng kẹt ở trang detail → có nút về danh sách. |
| Giao diện / trung bình | Thành viên nhận lời mời trước khi thiết lập múi giờ, checkout Pact với Seed rồi trở về Return. | Form múi giờ che Seed vừa lưu → Seed riêng được hiển thị trong bước xác nhận múi giờ. |
| Giao diện / thấp | Trong Circle, bấm tạo link mời khi form Pact cũng hiển thị. | Nút Pact ghi “Đang tạo cuộc hẹn…” dù chỉ đang tạo lời mời → nhãn đó chỉ hiện khi chính thao tác tạo Pact đang chạy. |
| Giao diện / thấp | Hai request danh sách Pact chồng nhau; request cũ lỗi sau request mới. | Lỗi cũ có thể ghi đè trạng thái mới → chỉ request mới nhất được cập nhật lỗi. Lỗi profile/thao tác có nút tải lại danh sách. |
| Dữ liệu / cao | Gọi nội bộ `AnalyticsService.record` với metadata chứa trường intention, Seed hoặc note. | Object tùy ý có thể vào `product_events` → chỉ các trường hợp lệ theo tên event được ghi. Test mới kiểm tra đường ghi. |

## Điểm dừng vận hành

Nếu readiness không `UP`, không tiếp tục walkthrough account/Circle/Pact; kiểm tra URL database và migration trên **DB tạm**. Nếu lỗi lưu xuất hiện, giữ nội dung trong form và thử lại sau khi API sẵn sàng. Không dùng kết quả live trên database tạm để suy ra rằng migration hoặc deploy pilot đã được phê duyệt.

## Bổ sung: bàn phím, accessibility, zoom và browser — 2026-10-23

Lượt này dùng PostgreSQL 17 tạm `btp-a11y-postgres` trên `127.0.0.1:5543`, API/web local và hai tài khoản mới. Migration hiện có chỉ chạy trên DB tạm; container tạm và hai tab thử nghiệm đã được dọn sau lượt chạy. Database local cổng `5433` không được đụng tới.

| Trạng thái | Kiểm tra | Bằng chứng / giới hạn |
| --- | --- | --- |
| Đạt | Solo chỉ bằng bàn phím | Từ trang giới thiệu dùng Tab/Enter đến đăng ký; nhập bằng phím, xác nhận múi giờ, nhập intention, chọn 5 phút, bắt đầu, checkout `progress`, lưu Seed, rồi “Tiếp tục từ đây”. Escape đóng checkout và đưa focus về nút mở. |
| Đạt | Circle/Pact bằng bàn phím | Tạo Circle, tạo link mời, đăng ký tài khoản thứ hai, nhận lời Circle, tạo Pact, nhận lời, bắt đầu riêng, tham gia, hai người checkout và kiểm tra Pact terminal. Các hành động trong app dùng Tab/Shift+Tab, Space, Enter và Escape; việc chuyển link giữa hai tài khoản dùng điều hướng trực tiếp đến URL thử. |
| Đạt, giới hạn | Cây accessibility | Cây của trang Pact terminal có heading cấp 1, tên các nút, danh sách participant và trạng thái. Dialog checkout có tên và focus quay về nút mở. Đây là kiểm tra cấu trúc, không xác nhận lời đọc của screen reader thật. |
| Đạt, giới hạn | Reflow viewport | Ở 640 và 320 CSS px, trang Pact terminal có `scrollWidth` bằng `innerWidth` và giữ heading/các nút. Đây chỉ là phép thay thế để kiểm tra bố cục hẹp; không được tính là zoom browser 200%. |
| Chưa kiểm chứng | Screen reader thật | Môi trường điều khiển không cung cấp phiên Narrator/NVDA hoặc đầu ra giọng đọc để đánh giá thứ tự đọc và thông báo động. |
| Chưa kiểm chứng | Zoom browser 200% | Phím zoom trong in-app browser và Chrome không thay đổi `devicePixelRatio` hoặc `innerWidth`; không có điều khiển zoom khả dụng. |
| Chưa kiểm chứng | Nhiều browser/engine | Chrome mở được trang test nhưng phiên điều khiển không nhập đủ thông tin đăng nhập nên không hoàn tất hành trình. Chrome và in-app browser đều thuộc họ Chromium; chưa có bằng chứng Firefox/WebKit. |
| Đạt, giới hạn | Log local | Hai console test có 3 bản ghi mỗi bên, không chứa chuỗi đánh dấu riêng; 8 `product_events` trong DB tạm, 0 metadata chứa chuỗi đó. API không phát log request thành công chứa nội dung riêng trong lượt quan sát. |
| Chưa kiểm chứng | Log pilot dài hạn | Không có nguồn log pilot hoặc khoảng quan sát dài hạn trong môi trường này. Cần quyền đọc nguồn log pilot đã được chấp thuận để kiểm tra theo thời gian. |

**Tình huống cần chốt quy tắc sản phẩm:** Nếu người tạo bắt đầu Pact rồi checkout trước khi người đã nhận lời tham gia, API thấy không còn participant đang hoạt động và khép Pact; người kia mở lại sẽ thấy “Đã khép lại” và không thể tham gia. Tái hiện trên Pact 5 phút của lượt này; ảnh hưởng **trung bình** tới người vào muộn. Code hiện tại tính hoàn tất theo participant đã vào phiên, còn tài liệu state machine chưa nêu rõ thời gian chờ người đã nhận lời. Không sửa hành vi trong lượt kiểm chứng này.
