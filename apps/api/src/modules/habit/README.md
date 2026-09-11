# Habit và completion — HabitModule

- **Trạng thái code:** Nest module được đăng ký; chưa có controller, use case, repository hoặc schema nghiệp vụ.
- **Thứ tự triển khai:** P2 / S5.
- **Phạm vi hiện tại:** Core thủ công, không AI.

## Trách nhiệm và dữ liệu

Habit tối giản và đánh dấu theo ngày local.

**Dữ liệu sở hữu dự kiến:** habits, habit_completions. Đây là inventory thiết kế, chưa là migration.

## Use case cần xây

- CreateHabit/ListHabits/ArchiveHabit: quản lý số habit được phép.
- CompleteHabit/UndoCompletion: thao tác theo local date có idempotency.

## API dự kiến

Các route dưới đây dùng prefix `/api/v1` khi được triển khai; chưa hoạt động trong scaffold.

- GET /habits
- POST /habits
- POST /habits/:id/completions
- DELETE /habits/:id/completions/:date

## Phụ thuộc và interface

Profile timezone; không phụ thuộc task/focus internals.

**Public application interface dự kiến:** Habit facts nếu reflection cần sau này, theo hợp đồng riêng. Chỉ tạo interface/provider code khi có use case hoặc consumer thực sự; hiện chưa có stub trả kết quả giả.

## Invariant và boundary

- Giữ giới hạn ba habit theo hướng sản phẩm hiện có; cần xác định active/archive.
- Không streak, thưởng/phạt hoặc task management mở rộng.
- Một completion cho owner/habit/local date.

## Acceptance criteria cho implementation

- [ ] Giới hạn habit dưới concurrency, completion trùng, timezone và undo.
- [ ] Không đánh dấu habit người khác.

## Privacy và retention

Tên habit là nội dung riêng; export/delete cả habit và completions.

## Cần chốt trước slice

Cách tính ngày sau khi đổi timezone và quy tắc archived habit.

Xem [Module delivery plan](../../../../../docs/04-engineering/module-delivery-plan.md) và [module catalog](../../../../../docs/02-product/application-modules-spec.md). Module `habit` là boundary bên trong một API deployable, không phải microservice.
