# 04 — Engineering

Core modular monolith NestJS + Drizzle và React Native + Expo mobile theo [ADR-0011](adr/0011-nestjs-drizzle-mobile-direction.md). Đã có scaffold `apps/api` với 12 module và platform; chưa có business logic, schema/migration hoặc AI. Backend cũ vẫn được giữ. Inference độc lập là hướng tương lai.

| Nhu cầu | Tài liệu |
| --- | --- |
| Review bộ khung và thứ tự 12 module | [Module Delivery Plan](module-delivery-plan.md), [Chạy API](../../apps/api/README.md) |
| Phân tích lợi/hại và chọn topology | [Architecture Options](architecture-options.md) |
| Review cây thư mục và chiều phụ thuộc | [Repository Structure](repository-structure.md) |
| Chuyển từ web đầu tiên sang mobile | [Web/Mobile API Strategy](web-mobile-api-strategy.md) |
| Xem stack đã chốt và quyết định còn mở | [Technology Stack](technology-stack.md) |
| Hiểu hệ thống và sơ đồ | [System Architecture](system-architecture.md), [System Diagrams](system-diagrams.md) |
| Thiết kế module | [Modular Backend Architecture](modular-backend-architecture.md) |
| Cân nhắc tách service hoặc worker | [Microservices Conditions](microservices-architecture.md), [Event-Driven Architecture](event-driven-architecture.md) |
| Thiết kế API | [API Guidelines](api-guidelines.md) |
| Drizzle, transaction và baseline | [Drizzle Data Access](drizzle-data-access.md), [Data Model](data-model.md) |
| Tra cứu schema hiện có | [Data Dictionary](data-dictionary.md) — SQL inventory và mapping domain/API đích |
| Nghiệp vụ task cần giữ | [Task Module](task-module.md) |
| Cấu hình và kiểm tra | [Environment](environment-and-config.md), [Test Strategy](../07-testing/test-strategy.md) |
| AI pilot | [Local Inference](local-inference-architecture.md), [AI Handbook](../ai/README.md) |
| Quyết định | [ADR Index](adr/README.md) |

Tài liệu sequence/retention/commercial mô tả capability hoặc topology tương lai khi có nhãn thiết kế, không cho phép cài hạ tầng hay triển khai module. Mọi thay đổi code tiếp theo cần kế hoạch được duyệt, parity/security tests và chiến lược migration/rollback tương xứng.
