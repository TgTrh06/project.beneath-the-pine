# Mobile là chính, web được xây trước

- **Ngày:** 2026-09-11
- **Trạng thái:** Định hướng client đã chốt; API/auth chi tiết là đề xuất cho review.

## Thứ tự và mục tiêu

Web responsive là client đầu tiên của API sản phẩm. Hoàn thiện một luồng có dữ liệu thật ở backend để phát hiện sớm lỗi contract, quyền truy cập và trải nghiệm. Mobile sau đó dùng cùng nghiệp vụ server; không gọi web server để mượn logic và không triển khai lại nghiệp vụ backend trong app.

Không cần đợi web có toàn bộ T0–T5 mới bắt đầu mobile. Gate phù hợp là API core đã có account/ownership, task/next-action và focus lifecycle ổn định, error contract, kiểm tra tương thích và quyết định mobile auth. Phần focus backend hiện chưa hoàn tất; gate này là yêu cầu tương lai.

Web và mobile dùng cùng tài khoản và dữ liệu server. Demo trong localStorage không phải dữ liệu server; chuyển demo thành tài khoản không mặc nhiên đồng bộ hoặc import dữ liệu. Khi mobile đọc task đã tạo trên web, đó là truy cập chung backend, khác với offline sync hoặc đồng bộ mọi preference.

## Các quyết định đã có và còn mở

| Nội dung | Trạng thái |
| --- | --- |
| NestJS, PostgreSQL, Drizzle | Người dùng đã chọn |
| Mobile là sản phẩm chính; web triển khai trước | Người dùng đã chọn |
| React/Vite web | Giữ implementation hiện có |
| SDK mobile | React Native + Expo + TypeScript, đã chọn |
| Android hay iOS trước | Chưa chọn; Android web không đồng nghĩa Android native ra mắt trước |
| Vai trò lâu dài của web | Có thể tiếp tục client sản phẩm; landing/admin không mặc định thay thế nó |
| Push, background timer, offline mutation/sync | Cần scope và feasibility riêng; không mặc nhiên có ở mobile v1 |
| Auth provider/token lifecycle cho native | Chưa chọn; xem phân tích bên dưới |

## React Native + Expo

Mobile dùng TypeScript và UI native riêng trong apps/mobile khi bắt đầu triển khai. Có thể chia sẻ API contracts và logic thuần với web; không dùng chung DOM component, browser storage hoặc Drizzle schema. Workflow development build, SDK version và build/distribution sẽ được chốt trong kế hoạch mobile; chọn Expo không tự chọn dịch vụ cloud. Kiểm chứng sớm timer khi khóa màn hình, audio khi chuyển app, credential expiry và mất mạng sau mutation.

## API ít phụ thuộc client

Dùng REST JSON `/api/v1`; UUID, ISO-8601 UTC và timezone IANA cho lịch người dùng. Contract mô tả field required/nullable, enum, limits, status code, lỗi và retry. Response không lộ database table hay ORM type.

Giữ `packages/contracts` cho schema TypeScript hiện có; đề xuất OpenAPI là dạng contract đọc được từ nhiều ngôn ngữ. Khi triển khai phải chọn một nguồn authoring và kiểm tra sinh schema/fixture để tránh hai nguồn lệch nhau. Có thể chia sẻ Zod với React Native; không chia sẻ schema Drizzle hoặc UI DOM.

Mobile phát hành chậm hơn backend: thay đổi additive vẫn phải xét enum mới và client decoder; không xóa/đổi nghĩa field trong v1. Breaking change cần version mới hoặc compatibility window có người chịu trách nhiệm và tiêu chí kết thúc, không chỉ cập nhật web cùng ngày.

List lớn dùng cursor ổn định và limit giới hạn trong thiết kế mới. API task hiện có chỉ dùng limit 1–100, mặc định 50; không được tuyên bố cursor đã có. Tổng hợp bootstrap cho màn hình khi có nhu cầu latency, tránh mobile phải gọi nhiều endpoint tuần tự; chưa cần BFF riêng chỉ vì có hai client.

## Mạng chập chờn và trạng thái app

Ví dụ: POST next-action commit thành công nhưng mobile mất response. Client không biết thất bại hay đã tạo; tự retry chỉ an toàn khi server có idempotency bền vững. Đề xuất key theo người dùng + operation, payload fingerprint, thời hạn lưu và replay result; cùng key khác payload trả conflict. Chi tiết storage/status/TTL được review trong slice triển khai.

GET có thể retry có giới hạn/backoff. Mutation chưa có idempotency phải cho người dùng phục hồi và đối chiếu trạng thái, không retry ngầm. UI phân biệt pending/saved/failed. API không tin userId từ body và không coi device ID là credential.

Focus timer không dựa vào việc JavaScript timer tiếp tục chạy ở background. Thiết kế mobile cần xác định timestamp, pause/resume, process kill và khả năng đồng hồ thiết bị sai. Offline write cần queue, conflict policy, cancellation và quyền riêng tư trên thiết bị; không đưa vào scope chỉ để gọi sản phẩm “mobile-first”.

## Xác thực: cùng tài khoản, có thể khác cơ chế truyền credential

| Lựa chọn | Lợi ích | Chi phí/điều kiện |
| --- | --- | --- |
| Web dùng HttpOnly cookie + server session + CSRF | Tương thích frontend hiện tại; quản lý credential trong browser adapter | Shared session store cho nhiều instance, CORS/SameSite, HTTPS và release hardening |
| Native dùng OAuth/OIDC Authorization Code + PKCE | Chuẩn native với browser ngoài app, không nhúng client secret | Cần chọn identity provider/authorization server, redirect/deep link, logout/revocation và account mapping |
| Tự xây access/refresh token cho native | Kiểm soát toàn bộ first-party auth | Phải sở hữu refresh rotation/reuse detection, revocation, storage, recovery, rate limiting và vận hành; không chỉ thêm JWT |

RFC 8252 yêu cầu OAuth native dùng external user-agent và PKCE cho public client; đây là căn cứ đánh giá lựa chọn OAuth, không có nghĩa dự án đã chọn OAuth hoặc provider. [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252.html).

Đề xuất tách adapter browser/native nhưng quy về cùng account UUID và authorization use case. Chưa chọn cơ chế native cuối cùng. Native credential cần secure storage của nền tảng; không đóng gói secret backend trong app. Không bỏ CSRF ở browser chỉ vì native gửi bearer token, và không ép native mô phỏng cookie browser trước khi đánh giá lifecycle.

Trước mobile implementation cần quyết định account source, login/recovery/verification, per-device session, expiry, refresh/revocation, account deletion và compatibility của tài khoản đã tạo trên web. Contract browser đã kiểm kê là đầu vào review, không phải quyết định security cuối cho mobile.

## Gate web → mobile

- Core API chạy với PostgreSQL qua Drizzle; contract có fixture và test độc lập web.
- Hai account không đọc/sửa dữ liệu nhau; mobile không cần thêm quyền để dùng API.
- Một workflow web tạo dữ liệu và một HTTP client độc lập đọc được kết quả; không phụ thuộc localStorage hay browser globals.
- Có version policy, timeout/retry behavior, pagination plan và mutation recovery được kiểm tra.
- React Native + Expo đã chọn; hệ điều hành đầu tiên và auth lifecycle phải được duyệt trước mobile implementation.
- Mobile được triển khai một vertical slice trước; kiểm tra bàn phím, màn hình nhỏ, mạng mất/kết nối lại, app resume và credential expiry trên thiết bị.
