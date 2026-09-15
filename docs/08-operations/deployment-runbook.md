# Deployment Runbook

- **Ngày:** 2026-09-11
- **Trạng thái:** Release requirements; chưa có kế hoạch deploy NestJS/Drizzle được duyệt.

## Trước triển khai

Phải có commit/artifact, environment và owner rõ ràng; backend được build/test theo pipeline đã triển khai, không theo lệnh đích còn ở docs. Kiểm tra auth/CSRF hoặc native token lifecycle, ownership, contract compatibility và PostgreSQL integration.

Với dữ liệu: kiểm kê schema/journal hiện hữu; review SQL Drizzle, backup/restore, lock/backfill, compatibility và rollback/forward-fix. Không chạy SQL baseline lưu trữ trực tiếp lên database hiện hữu. Không dựa vào việc đổi framework để reset account/data.

## Thứ tự release sau khi được duyệt

1. Ghi nhận release và xác minh DB/app/client compatibility.
2. Apply migration backward-compatible bằng bước riêng nếu kế hoạch có yêu cầu.
3. Deploy API, kiểm tra liveness/readiness, auth và synthetic core workflow.
4. Deploy web sau khi API tương thích.
5. Mobile release theo SDK/store đã chọn; giữ API cho các phiên bản client đang được hỗ trợ.
6. Theo dõi lỗi, latency, auth failure và data consistency trong cửa sổ đã thống nhất.

Mobile release có thể chậm hoặc không được người dùng cập nhật ngay; không rollback API sang contract mà mobile đã phát hành không dùng được.

## Rollback

Rollback artifact chỉ khi schema và contract tương thích. Database mutation có thể không đảo ngược; ưu tiên forward-fix được review. Chuyển backend cũ → NestJS cần kiểm tra credential hash/UUID, dữ liệu và đăng nhập lại khi session không tương thích. Không chạy song song hai writer để làm “fallback”.

Khi có worker/service sau này, thêm xử lý job đang chờ, replay/idempotency, partial failure và data ownership cutover. Không cho phép xóa queue/job hoặc business data chỉ để rollback binary.

## Kết thúc

Ghi commit/artifact, thời gian, migration, smoke results, sự cố và follow-up. Chưa có production action nào được thực hiện qua lần cập nhật tài liệu này.
