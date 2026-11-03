# AnalyticsModule — sự kiện sản phẩm tối thiểu

Module ghi `product_events` từ các use case server đã xác nhận. Pyneath Assistance demo có endpoint chỉ nhận enum tương tác từ client đã đăng nhập; không có endpoint nhận metadata tùy ý hoặc dashboard đọc metric. Lỗi ghi tương tác analytics không làm hỏng thao tác core; đặt chỗ quota AI phải ghi thành công trước khi gọi provider.

`AnalyticsService.record` loại mọi metadata không thuộc allowlist theo **tên sự kiện** trước khi ghi:

| Sự kiện | Metadata được giữ |
| --- | --- |
| `solo_session_started`, `pact_created` | `durationMinutes` nếu là 5, 10, 25 hoặc 50 |
| `session_checked_out` | `outcome` nếu là `completed`, `progress`, `stuck` hoặc `stopped` |
| `assistance_*` | `capability` nếu là `assisted_start` hoặc `open_seed_draft` |
| Các sự kiện còn lại | `{}` |

Không ghi intention, Open Seed, ghi chú, email hay token trong metadata. `accountId`, `subjectId`, tên sự kiện và thời điểm là các cột riêng phục vụ liên kết và xóa dữ liệu theo tài khoản. Việc đọc metric tổng hợp, retention và consent ngoài phạm vi module hiện tại.

Kiểm chứng: `apps/api/test/analytics-privacy.test.ts` truyền metadata có chuỗi riêng và xác nhận chỉ trường hợp lệ được ghi; [bằng chứng tích hợp Step 6](../../../../../docs/07-testing/integration-privacy-ui-verification.md) kiểm tra database tạm sau hành trình browser.
