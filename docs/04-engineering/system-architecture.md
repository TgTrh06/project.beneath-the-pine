# System Architecture

- **Ngày:** 2026-09-11
- **Trạng thái:** Thiết kế đích; Core modular monolith đã chốt, inference độc lập; worker theo nhu cầu.

## Ranh giới sản phẩm

Web responsive chạy trước; mobile là client chính về dài hạn. Hai client dùng API chung, account ID chung và cùng dữ liệu server. API không phụ thuộc component React, browser storage hay framework mobile.

NestJS xử lý HTTP, validation, authentication adapter và composition. Nghiệp vụ được tổ chức theo module. PostgreSQL là nguồn dữ liệu server; Drizzle là persistence implementation đích. Không đưa bảng DB hoặc credential vào contract client.

## Những gì đang có

Contract account, task/next-action và health cũ là đầu vào kiểm tra parity. Bản NestJS cũ dùng pg trực tiếp vẫn được giữ. Scaffold apps/api mới có 12 module, platform và Drizzle connection nhưng chưa có business logic/schema/migration. Chưa có AI trong scope hiện tại; Python inference chỉ là pilot độc lập. Xem [kế hoạch module](module-delivery-plan.md).

## Kiến trúc đã chốt

Một API deployable với module identity, task và các module sản phẩm được bổ sung theo slice. Task + next-action có cùng transaction. Module cộng tác qua application API rõ ràng; chưa cần gateway, broker hoặc distributed transaction.

Auth browser hiện có dùng session cookie và CSRF. Mobile auth phải được review trước implementation; các adapter cuối cùng quy về cùng principal, không có nghiệp vụ task riêng theo loại client. [API Strategy](web-mobile-api-strategy.md).

Khi có scope AI riêng về sau, provider cần timeout/manual fallback; nếu cần công việc bền vững qua restart thì thiết kế job/worker riêng. In-app reminder không đồng nghĩa push notification. Job có side effect phải có idempotency và kiểm tra consent tại thời điểm thực thi.

## Quyền và dữ liệu

Owner ID đến từ principal; repository lọc resource + owner, không tin userId trong input. Drizzle không tự enforce quyền. RLS trong schema Supabase public là baseline riêng, không bảo vệ core.*. Nội dung nhạy cảm và export/delete tuân thủ policy sản phẩm; capability chưa triển khai phải được ghi đúng trạng thái.

Một schema đích không phải quyền chạy migration. Baseline migration cũ → Drizzle phải được kiểm chứng trên database test. Không dual-write backend cũ và bản nháp NestJS vào dữ liệu thật trong migration.

## Tài liệu liên quan

[Phân tích lựa chọn](architecture-options.md), [sơ đồ](system-diagrams.md), [module](modular-backend-architecture.md), [Drizzle](drizzle-data-access.md), [cấu trúc repository](repository-structure.md).
