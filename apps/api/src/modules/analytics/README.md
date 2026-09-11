# Sự kiện sản phẩm tối thiểu — AnalyticsModule

- **Trạng thái code:** Nest module được đăng ký; chưa có controller, use case, repository hoặc schema nghiệp vụ.
- **Thứ tự triển khai:** P1 / S3–S4.
- **Phạm vi hiện tại:** Core thủ công, không AI.

## Trách nhiệm và dữ liệu

Ghi nhận facts phục vụ đo activation, focus và return bằng payload hạn chế.

**Dữ liệu sở hữu dự kiến:** product_events được allowlist; không sở hữu quota AI hoặc job. Đây là inventory thiết kế, chưa là migration.

## Use case cần xây

- RecordAllowedProductEvent: validate event name/version và allowed fields.
- ReadAggregateMetrics: chỉ khi có access policy nội bộ được duyệt.

## API dự kiến

Các route dưới đây dùng prefix `/api/v1` khi được triển khai; chưa hoạt động trong scaffold.

- Chưa chọn public ingestion route; ưu tiên ghi từ use case server đã xác nhận

## Phụ thuộc và interface

Module nghiệp vụ có thể gọi ingestion contract một chiều khi được triển khai; analytics không đọc ngược repository nghiệp vụ.

**Public application interface dự kiến:** Typed event input contract với allowlist; không export event storage. Chỉ tạo interface/provider code khi có use case hoặc consumer thực sự; hiện chưa có stub trả kết quả giả.

## Invariant và boundary

- Không nhận JSON tùy ý; không có task title, capture, note, email, token.
- Analytics failure không chặn core workflow.
- Không cần event bus/broker chỉ để ghi product event.

## Acceptance criteria cho implementation

- [ ] Payload có field ngoài allowlist bị từ chối hoặc loại bỏ theo policy rõ.
- [ ] Duplicate core event không tăng metric nhầm.
- [ ] Log/snapshot không có private text.

## Privacy và retention

Retention, pseudonymization và consent nếu cần được chốt theo purpose; deletion xử lý user-linked events.

## Cần chốt trước slice

Event catalog tối thiểu và client/server authority; chưa có dashboard public.

Xem [Module delivery plan](../../../../../docs/04-engineering/module-delivery-plan.md) và [module catalog](../../../../../docs/02-product/application-modules-spec.md). Module `analytics` là boundary bên trong một API deployable, không phải microservice.
