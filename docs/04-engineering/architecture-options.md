# Phân tích kiến trúc backend cho web và mobile

- **Ngày:** 2026-09-11
- **Trạng thái:** Phân tích hỗ trợ quyết định Accepted tại ADR-0012; implementation theo kế hoạch riêng.
- **Đã chốt:** NestJS + Drizzle Core modular monolith, inference độc lập, worker theo nhu cầu; React Native + Expo mobile, web trước.
- **Chưa chốt:** hệ điều hành ra mắt đầu tiên, mô hình xác thực đa client và hạ tầng triển khai.

## 1. Bài toán thực tế

Beneath the Pine cần hoàn thiện vòng lặp nhập ý nghĩ → xác nhận một hành động → focus → quay lại. Cùng một tài khoản và dữ liệu phải dùng được từ web và mobile khi mobile được xây. Web là client sản phẩm đầu tiên và môi trường kiểm chứng API, không phải nơi giữ nghiệp vụ mà mobile phải viết lại.

Giả định làm việc là một người phát triển chính, nghiệp vụ còn thay đổi, chưa có số liệu tải production hay nhu cầu triển khai độc lập từ nhiều nhóm. Đây là giả định để đánh giá chi phí, không phải bằng chứng rằng hệ thống sẽ mãi nhỏ. Nếu nhóm, tải hoặc yêu cầu cô lập thay đổi, phải đánh giá lại.

Nhiều client không đồng nghĩa nhiều backend. React web và mobile native đều có thể gọi một API NestJS. Ngược lại, một client cũng có thể gọi một hệ thống microservices thông qua một API công khai. Monorepo là cách lưu mã nguồn; monolith/microservices là cách chia đơn vị chạy, dữ liệu và triển khai.

## 2. Ba phương án

| Phương án | Đơn vị chạy | Quyền sở hữu dữ liệu | Cách thay đổi |
| --- | --- | --- | --- |
| A. Modular monolith | Một API NestJS; inference Python hiện có vẫn là pilot độc lập | Một database ứng dụng, module có owner bảng rõ ràng | Một artifact backend; gọi module trong process |
| B. API và worker riêng | API như A, thêm process xử lý công việc bền vững khi có nhu cầu | Ban đầu worker có thể thuộc cùng ứng dụng và cùng lịch sử migration | Có thể scale process riêng; chưa mặc nhiên độc lập schema/release |
| C. Microservices theo nghiệp vụ | Nhiều service có vòng đời triển khai riêng | Mỗi service sở hữu dữ liệu và migration của mình | Giao tiếp bằng API/event có version; tương thích giữa các bản phát hành |

Worker chạy riêng nhưng cùng database, cùng code release và cùng domain owner là tách tài nguyên thực thi, chưa phải một microservice độc lập. Python inference pilot không bắt buộc toàn bộ sản phẩm chuyển sang microservices.

## 3. Lợi và hại theo tiêu chí

| Tiêu chí | A. Modular monolith | B. API + worker | C. Microservices |
| --- | --- | --- | --- |
| Phát triển một mình | Ít cấu hình local; sửa một luồng trong một codebase | Thêm lifecycle job, retry và quan sát worker | Mỗi thay đổi có thể chạm contract, nhiều deploy/test; chủ sở hữu vẫn chỉ một người |
| Thay đổi ranh giới nghiệp vụ | Đổi lời gọi và transaction tương đối trực tiếp | Cần giữ tương thích job đang chờ | Di chuyển dữ liệu và contract đã có consumer khó hơn |
| Transaction | Task + next-action có thể commit nguyên tử trong PostgreSQL | Business change + job cần atomic enqueue/outbox nếu phải bền vững | Nhiều database thường cần eventual consistency, bù trừ và reconciliation |
| Mở rộng | Có thể scale nhiều bản API sau khi giải quyết session/state; scale cả artifact | Scale concurrency AI/reminder riêng với HTTP | Scale theo service, hữu ích khi tải lệch đáng kể |
| Cô lập lỗi | Lỗi process hoặc CPU blocking có thể ảnh hưởng toàn API | Worker quá tải ít ảnh hưởng HTTP hơn nếu giới hạn DB/pool/tài nguyên | Cô lập tốt khi timeout, backpressure và dependency chain được thiết kế đúng |
| Triển khai | Một pipeline/backend rollback; lỗi một module có thể chặn cả release | Hai runtime cần tương thích job/schema | Release riêng có ích với nhiều owner, nhưng phải quản lý version lệch nhau |
| Kiểm thử/debug | Dễ chạy một use case với DB test; stack trace thường liên tục | Cần test restart, duplicate, lease/claim, job failure | Cần contract test, trace liên service, network failure và trạng thái một phần |
| Chi phí vận hành | Ít runtime/secret/dashboard; database vẫn phải vận hành nghiêm túc | Thêm worker, cơ chế job và cảnh báo backlog | Thêm mạng, danh tính service, pipeline, log/trace, backup và on-call |
| Bảo mật | Một entry point; lỗi quyền truy cập có thể tác động rộng nếu module lỏng | Worker cần quyền tối thiểu, re-check consent và xóa dữ liệu | Tăng số boundary/credential; service isolation có ích nhưng không thay thế authorization |
| Học tập | Tập trung Nest modules, DI, SQL, transaction, test, API design | Học xử lý bất đồng bộ và failure recovery khi có ví dụ cụ thể | Học distributed systems sâu; dễ dành phần lớn thời gian cho hạ tầng trước sản phẩm |

Các đặc điểm chung về triển khai độc lập, scale theo service và chi phí phối hợp dữ liệu/mạng được đối chiếu với [Microsoft Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/guide/architecture-styles/microservices). Đánh giá mức phù hợp với Beneath the Pine trong bảng là phân tích của dự án, không phải kết quả benchmark.

## 4. Áp dụng vào ba luồng

### Tạo task và next-action

Người dùng bấm xác nhận, mất mạng sau khi server đã commit, rồi bấm lại từ mobile. Hai vấn đề khác nhau cần xử lý: transaction bảo đảm task và confirmation cùng tồn tại; idempotency bảo đảm retry không tạo hai cặp.

Ở A, một use case và transaction Drizzle giải quyết cặp dữ liệu; cơ chế idempotency bền vững là phần bổ sung cần thiết trước khi tự retry mutation. Ở C, nếu tách task và next-action thành hai service, thao tác đơn giản trở thành phối hợp hai lần ghi. Không có nhu cầu triển khai độc lập được chứng minh cho hai phần này, nên đề xuất giữ chúng cùng module và transaction.

### Gợi ý AI từ Brain Dump

Ở A, API có thể gọi provider bất đồng bộ với timeout và manual fallback; thời gian chờ HTTP không tự động đồng nghĩa phải có worker. Tuy nhiên công việc chạy lâu, cần tiếp tục sau khi app đóng, hoặc cần retry qua restart là lý do đánh giá B.

Ở B, API nhận yêu cầu và trả job ID; worker claim job, kiểm tra consent còn hiệu lực, gọi provider và ghi trạng thái. Cần trạng thái pending/running/succeeded/failed/cancelled, timeout, retry giới hạn và ngăn kết quả trễ ghi đè yêu cầu mới. Không dùng fire-and-forget trong process API cho công việc đã hứa sẽ hoàn tất.

Chỉ cân nhắc AI thành service độc lập khi cần quản lý tải/GPU, quyền truy cập hoặc release riêng và đủ khả năng vận hành. Inference Python hiện có là một provider boundary có thể giữ lại trong cả A, B hoặc C.

### Reminder và quay lại

In-app reminder ban đầu có thể được suy ra khi client mở ứng dụng; không cần thêm broker để hiển thị một trạng thái. Gửi thông báo khi app đóng là một capability khác, cần lịch chạy, permission, provider, timezone và delivery policy.

Worker riêng hữu ích khi phải gửi bền vững theo lịch. Worker phải kiểm tra opt-in tại thời điểm gửi, tránh duplicate theo user/slot/window và xử lý hủy đăng ký khi job đã được tạo. Microservice Notification chỉ có giá trị khi có owner, phạm vi dữ liệu hoặc workload riêng đủ rõ. Không tách Engagement chỉ vì đã đặt tên module.

## 5. Khuyến nghị và những chi phí phải chấp nhận

**Đã chọn A: Core modular monolith NestJS + Drizzle, inference độc lập và worker khi có nhu cầu cụ thể.** Người dùng đã chấp nhận lựa chọn này; phân tích các phương án khác được giữ làm căn cứ đánh giá lại trong tương lai.

Chi phí của lựa chọn này phải được ghi nhận: một deploy ảnh hưởng toàn backend; bottleneck riêng có thể buộc scale cả API; module boundary chỉ có ích nếu được tuân thủ; việc tách service về sau vẫn cần migration dữ liệu và đổi transaction, không miễn phí.

Để hạn chế nợ kiến trúc, module chỉ export use case/port cần dùng; không cho module khác import repository hoặc schema của mình tùy tiện. Giao dịch liên module phải có use case điều phối và owner rõ ràng. Không tạo event bus, generic repository hoặc abstraction cho mọi class chỉ để chuẩn bị cho tương lai.

## 6. Khi nào đổi quyết định

| Dấu hiệu cần đo hoặc chứng minh | Bước tiếp theo | Điều chưa đủ để tách service |
| --- | --- | --- |
| Job cần tồn tại qua API restart hoặc vượt thời gian tương tác hợp lý | Thiết kế job persistence + worker; đo độ dài hàng đợi, thời gian chờ, tỷ lệ retry | Chỉ có một lời gọi AI |
| Worker khiến API chậm do CPU/pool contention | Tách tài nguyên/process; đặt giới hạn concurrency và đo lại | Chỉ tăng số user dự kiến |
| Một nhóm có owner, cadence và nhu cầu rollback riêng | Đánh giá service boundary theo nghiệp vụ | Chỉ muốn thư mục đẹp hơn |
| Workload có chi phí scale riêng lớn và đã có profile | So sánh chi phí API chung với service riêng | “Microservices scale tốt hơn” nói chung |
| Cần cô lập quyền/dữ liệu hoặc failure domain cụ thể | Threat model, dữ liệu và SLO của service ứng viên | Có cả web lẫn mobile |

Trước khi tách, phải có contract version, owner dữ liệu, cơ chế lỗi/timeout/idempotency, observability, cách backfill/cutover và rollback. Không dùng ngưỡng số user tùy ý. Thu thập p95 latency, lỗi, pool saturation, job backlog và thời gian phục hồi trên workload thực tế để đưa ra ngưỡng phù hợp.

## 7. Câu hỏi còn mở

React Native + Expo đã được chọn. Hệ điều hành mobile nào sẽ ra mắt đầu tiên? Những hành vi nào cần hoạt động khi mất mạng hoặc app ở background? Web sẽ tiếp tục là sản phẩm đầy đủ hay còn đóng vai trò landing/admin? Có nhu cầu chạy AI local trong sản phẩm hay chỉ trong nghiên cứu?

Những câu hỏi này không ngăn việc thiết kế API độc lập client, nhưng phải được giải quyết trước khi cam kết native auth, push, background execution hay sync. Xem [kế hoạch client và API](web-mobile-api-strategy.md), [cấu trúc repository đề xuất](repository-structure.md) và [ADR topology đã chốt](adr/0012-modular-monolith-proposal.md).
