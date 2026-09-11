# Modular Backend Architecture

- **Ngày:** 2026-09-11
- **Trạng thái:** Accepted theo ADR-0012; đã có scaffold 12 module, chưa có business logic.

## Ranh giới module

| Module/capability | Owner | Trạng thái |
| --- | --- | --- |
| identity | Account, credential policy, account lifecycle | Scaffold; auth còn mở |
| profile, consent | Hai module riêng cho profile/timezone và purpose permission | Scaffold |
| task, focus | Hai module riêng cho action và phiên focus | Scaffold; task có baseline cũ để review |
| capture | Capture và xác nhận action thủ công | Scaffold; chưa có AI |
| engagement | Seed, return, reminder preference trong app | Scaffold |
| reflection, habit | Facts/template tuần và habit tối giản | Scaffold; triển khai sau core |
| analytics | Event tối thiểu được allowlist | Scaffold; không quota/job |
| privacy, access | Quyền dữ liệu và quyền tham gia beta, hai owner riêng | Scaffold |

Chi tiết từng module và thứ tự triển khai: [Module Delivery Plan](module-delivery-plan.md). Chưa có nghiệp vụ, schema hoặc provider trong các business module. Platform và import checks đã có; không tạo bốn lớp thư mục rỗng.

Module chia theo nghiệp vụ và lý do thay đổi, không chia một service cho mỗi entity. Task và confirmation được tạo cùng transaction. Focus có thể cộng tác với task qua application API; không cần network hop để bắt đầu focus.

## Tổ chức và dependency

Dùng module NestJS làm composition boundary. Presentation xác thực shape HTTP và map response; use case điều phối authorization/domain; domain giữ invariant; infrastructure dùng Drizzle và provider adapters. Domain/application không import Nest HTTP hoặc Drizzle table. Chỉ tạo repository port khi nó giúp giữ boundary và test use case.

Module chỉ export application contract cần dùng. Không import repository/schema của module khác; không mở quyền query chéo qua một global database package. Cross-module atomic use case cần owner và transaction context rõ ràng; read projection cần được thiết kế, không dùng join xuyên domain ngầm.

## Giới hạn của monolith

Một artifact và process tạo shared failure/release domain. Boundary chỉ là convention nếu không có review và import checks. Scale cả API có thể kém hiệu quả cho workload lệch. Tách service sau không tự động dễ chỉ vì đã có folder module.

Xem [phân tích đầy đủ](architecture-options.md) và [cây thư mục](repository-structure.md). Topology đã chốt; Redis/RabbitMQ không còn là bước bắt buộc.
