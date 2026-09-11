# Microservices — điều kiện áp dụng

- **Ngày:** 2026-09-11
- **Trạng thái:** Phương án có điều kiện, thay cho tài liệu target bắt buộc cũ.
- **Quyết định:** ADR-0012 đã Accepted và thay thế ADR-0009. Core giữ modular monolith; tài liệu này mô tả điều kiện đánh giá lại trong tương lai.

Bản so sánh chính nằm ở [Architecture Options](architecture-options.md). Mobile và web có thể dùng cùng modular monolith; số client không quyết định số service.

## Lợi ích cần có bằng chứng

Tách service khi một capability cần owner/release riêng, scale riêng có lợi ích đã đo, hoặc cần cô lập dữ liệu/quyền/lỗi mà process chung không đáp ứng. AI worker có thể là bước tách execution trước, không bắt buộc Engagement, Notification và Gateway xuất hiện cùng lúc.

## Chi phí bắt buộc giải quyết

Mỗi service phải có API/event compatibility, danh tính service, quyền dữ liệu tối thiểu, timeout/retry/backpressure, log/trace, deployment/rollback và backup/restore. Dữ liệu mỗi service có một writer; cross-service operation không được giả định là một PostgreSQL transaction.

Cùng repository vẫn có thể là microservices; ngược lại nhiều container dùng chung bảng và phải deploy cùng lúc có thể chỉ là distributed monolith với chi phí mạng bổ sung.

## Gate tách một service

1. Xác định capability và owner, dữ liệu nó sở hữu và dữ liệu chỉ đọc qua API/projection.
2. Chứng minh vấn đề bằng measurement hoặc yêu cầu isolation cụ thể.
3. So sánh với tối ưu query, pool, module và worker riêng.
4. Thiết kế contract version, migration/backfill, cutover một writer, kiểm tra consistency.
5. Xác định failure state, recovery, reconciliation và rollback khi đã có job/message.
6. Review tác động tới web và mobile đã phát hành; public API giữ ổn định khi internal topology thay đổi.

Không quy định trước thứ tự Redis → RabbitMQ → AI → Engagement. Broker/cache được chọn theo job/delivery requirement; thiết kế tham khảo ở [Event-Driven Architecture](event-driven-architecture.md) chưa phải hạ tầng được triển khai.
