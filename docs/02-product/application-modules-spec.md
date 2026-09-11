# Application Modules — manual Core

- Cập nhật: 2026-09-11.
- Phạm vi hiện tại: module scaffold để review; chưa có nghiệp vụ hoàn chỉnh.
- Chưa có AI. Capture là nhập thủ công; reflection là facts và template xác định. Inference chỉ là định hướng độc lập về sau.

| Module | Capability sản phẩm | Dữ liệu dự kiến |
| --- | --- | --- |
| identity | Tài khoản và xác thực | accounts; session/credential records theo quyết định auth sau review |
| profile | Hồ sơ và timezone | profiles; trường preference chỉ khi được duyệt |
| consent | Lựa chọn xử lý dữ liệu | consent records theo purpose/version; baseline cần review |
| task | Task và next-action thủ công | tasks, next_actions; map core baseline trước khi tạo schema Drizzle |
| focus | Vòng đời phiên focus | focus_sessions và transition/timing fields sau review |
| capture | Capture thủ công | brain_dumps/checkins theo scope nội dung được duyệt; chưa có schema mới |
| engagement | Open Seed, Return và reminder preference | focus_seeds, engagement_preferences, reminder_slots |
| reflection | Tổng hợp tuần theo quy tắc | weekly summaries/feedback nếu cần persist; không mặc định dùng bảng AI cũ |
| habit | Habit và completion | habits, habit_completions |
| analytics | Sự kiện sản phẩm tối thiểu | product_events được allowlist; không sở hữu quota AI hoặc job |
| privacy | Export, xóa và retention | data_rights_requests/progress nếu cần; không sở hữu bảng nghiệp vụ module khác |
| access | Quyền tham gia beta | waitlist/invitations/membership theo scope beta; chưa có schema |

Identity, profile và consent được tách để không trộn xác thực, hồ sơ và lựa chọn xử lý dữ liệu. Privacy điều phối quyền dữ liệu, access chỉ xét quyền tham gia beta. Focus sở hữu phiên; task sở hữu action và trạng thái task. Engagement không gửi push/email trong phạm vi hiện tại.

Luồng đầu tiên: đăng nhập → tự nhập action → bắt đầu focus → ghi kết quả → quay lại nhẹ nhàng. Web dùng API chung trước; mobile React Native + Expo dùng các capability đã ổn định sau đó.

Chi tiết từng use case, ownership, phụ thuộc, API dự kiến, acceptance và quyết định còn mở nằm trong [kế hoạch triển khai module](../04-engineering/module-delivery-plan.md). Các thiết kế AI/retention cũ chỉ áp dụng khi scope tương ứng được duyệt.

Không triển khai outbound provider, scheduler, worker, broker, push, social, leaderboard, streak hoặc economy trong scaffold.
