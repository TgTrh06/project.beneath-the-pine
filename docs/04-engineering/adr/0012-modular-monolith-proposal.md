# ADR-0012 — Modular monolith ở Core, inference độc lập và worker theo nhu cầu

- **Trạng thái:** Accepted — người dùng đã quyết định ngày 2026-09-11.
- **Thay thế:** Lộ trình tách service bắt buộc của ADR-0009.
- **Liên quan:** [ADR-0011](0011-nestjs-drizzle-mobile-direction.md).
- Giữ tên file hiện tại để các liên kết lịch sử tiếp tục hoạt động.

## Quyết định

Core dùng NestJS modular monolith với PostgreSQL/Drizzle: một đơn vị triển khai backend, module sở hữu nghiệp vụ và bảng của mình. Web và React Native + Expo mobile dùng API chung. Inference giữ độc lập, không gộp model execution vào Core.

Worker chỉ được thêm khi có nhu cầu cụ thể như công việc phải tồn tại qua restart, chạy theo lịch bền vững hoặc cần cô lập tài nguyên. Chưa chọn broker/cache. Worker cùng code và data ownership không mặc nhiên là microservice độc lập.

## Lý do và phương án khác

Ưu tiên hoàn thiện web/API rồi mobile với một người phát triển chính. Modular monolith giảm đầu mối triển khai và giữ transaction task/next-action đơn giản, trong khi vẫn tổ chức được module rõ ràng.

Microservices từ đầu tăng chi phí giao tiếp, contract, consistency và vận hành khi ranh giới còn thay đổi. Worker từ đầu chưa có scope công việc cụ thể. Phân tích lợi/hại và điều kiện xem lại nằm ở [Architecture Options](../architecture-options.md).

## Hệ quả

Một backend release/failure domain; scale cả API có thể tốn tài nguyên khi tải lệch. Cần kiểm soát module imports, quyền sở hữu bảng và transaction. Tách service tương lai vẫn cần migration dữ liệu và contract; không chỉ đổi lời gọi thành HTTP.

Inference độc lập có timeout/fallback khi tích hợp. Lỗi inference không được chặn thao tác task thủ công hoặc core focus.

## Security, validation và rollback

Authorization theo principal tại use case/repository, credential server-only, Drizzle schema không xuất sang client. Test domain, API contract, PostgreSQL transaction/ownership và import boundary khi triển khai. Worker sau này phải có test restart, duplicate, consent re-check và retry giới hạn.

Mỗi bước triển khai cần schema compatibility, một writer và rollback/forward-fix rõ ràng. Việc chốt kiến trúc không cấp quyền deploy, migrate dữ liệu hoặc thêm worker chưa có use case.

## Trạng thái thực hiện

Quyết định đã được chốt; code, cấu trúc thư mục và tooling đích chưa hoàn tất. Kế hoạch triển khai sau phải xử lý bản nháp hiện có, Drizzle baseline và API parity.
