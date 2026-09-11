# Tổng hợp tuần theo quy tắc — ReflectionModule

- **Trạng thái code:** Nest module được đăng ký; chưa có controller, use case, repository hoặc schema nghiệp vụ.
- **Thứ tự triển khai:** P2 / S5.
- **Phạm vi hiện tại:** Core thủ công, không AI.

## Trách nhiệm và dữ liệu

Facts tổng hợp tuần và phản hồi người dùng theo template xác định.

**Dữ liệu sở hữu dự kiến:** weekly summaries/feedback nếu cần persist; không mặc định dùng bảng AI cũ. Đây là inventory thiết kế, chưa là migration.

## Use case cần xây

- GetWeeklySummary: tổng hợp số phiên/kết quả theo timezone và cửa sổ dữ liệu.
- RecordSummaryFeedback: hữu ích/chưa đúng, liên kết summary/version.

## API dự kiến

Các route dưới đây dùng prefix `/api/v1` khi được triển khai; chưa hoạt động trong scaffold.

- GET /weekly-letter
- POST /weekly-letter/:id/feedback

## Phụ thuộc và interface

Focus facts, profile timezone; engagement facts chỉ nếu summary cần.

**Public application interface dự kiến:** Summary DTO cho client; privacy export/delete interface; không export read query xuyên bảng. Chỉ tạo interface/provider code khi có use case hoặc consumer thực sự; hiện chưa có stub trả kết quả giả.

## Invariant và boundary

- Không có AI, text generation, mood inference hoặc đánh giá sức khỏe.
- Không đủ facts thì trả trạng thái chưa đủ dữ liệu; không bịa observation.
- Template/version và nguồn facts cần truy vết; tránh double count.

## Acceptance criteria cho implementation

- [ ] Tuần/local timezone, dữ liệu rỗng và duplicate completion.
- [ ] Summary xác định với cùng facts; không gọi provider.
- [ ] Feedback chỉ cho summary owner.

## Privacy và retention

Chỉ giữ facts cần thiết; feedback/export/delete có retention cụ thể.

## Cần chốt trước slice

Ngưỡng đủ dữ liệu, template tiếng Việt, persist hay compute-on-read và feedback semantics.

Xem [Module delivery plan](../../../../../docs/04-engineering/module-delivery-plan.md) và [module catalog](../../../../../docs/02-product/application-modules-spec.md). Module `reflection` là boundary bên trong một API deployable, không phải microservice.
