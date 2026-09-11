# Open Seed, Return và reminder preference — EngagementModule

- **Trạng thái code:** Nest module được đăng ký; chưa có controller, use case, repository hoặc schema nghiệp vụ.
- **Thứ tự triển khai:** P1 / S4.
- **Phạm vi hiện tại:** Core thủ công, không AI.

## Trách nhiệm và dữ liệu

Một điểm vào cho lần quay lại, tính eligibility và lựa chọn in-app reminder.

**Dữ liệu sở hữu dự kiến:** focus_seeds, engagement_preferences, reminder_slots. Đây là inventory thiết kế, chưa là migration.

## Use case cần xây

- CreateOrReplaceSeed/OpenSeed/DismissSeed: lifecycle một open seed.
- GetReturnState/CompleteReturn: dùng facts focus và timezone.
- UpdateReminderPreferences: opt-in, tối đa hai slots, tắt tức thời.
- GetInAppReminderState: tính khi client mở; chưa có background delivery.

## API dự kiến

Các route dưới đây dùng prefix `/api/v1` khi được triển khai; chưa hoạt động trong scaffold.

- GET /me/engagement
- PATCH /me/engagement/preferences
- PUT /me/reminder-slots
- POST /focus-seeds
- POST /return-flow/complete

## Phụ thuộc và interface

Profile timezone, focus facts, task owned-reference khi seed liên kết task. Không đọc trực tiếp schema của họ.

**Public application interface dự kiến:** Return/seed state và facts tối thiểu cho reflection; không export nội dung private vào analytics. Chỉ tạo interface/provider code khi có use case hoặc consumer thực sự; hiện chưa có stub trả kết quả giả.

## Invariant và boundary

- Không streak/backlog pressure; tối đa một seed open/user.
- Opt-in reminder tách khỏi consent xử lý dữ liệu.
- Return sau ba ngày local không có core event theo policy hiện tại.
- Không có scheduler, worker, email/push provider trong scaffold.

## Acceptance criteria cho implementation

- [ ] Timezone/day boundary, thay đổi timezone và dismiss/replace được kiểm tra.
- [ ] Opt-out không còn reminder state; nhiều request không tạo nhiều open seed.
- [ ] Focus vẫn hoạt động khi engagement lỗi.

## Privacy và retention

Seed text là nội dung riêng; export/xóa cùng preference/slots; retention seed được chốt.

## Cần chốt trước slice

Exact slot policy, return completion idempotency và retention; outbound delivery chỉ ở scope khác.

Xem [Module delivery plan](../../../../../docs/04-engineering/module-delivery-plan.md) và [module catalog](../../../../../docs/02-product/application-modules-spec.md). Module `engagement` là boundary bên trong một API deployable, không phải microservice.
