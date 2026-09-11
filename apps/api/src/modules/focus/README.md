# Vòng đời phiên focus — FocusModule

- **Trạng thái code:** Nest module được đăng ký; chưa có controller, use case, repository hoặc schema nghiệp vụ.
- **Thứ tự triển khai:** P0 / S3.
- **Phạm vi hiện tại:** Core thủ công, không AI.

## Trách nhiệm và dữ liệu

Start, pause/resume, completion/cancellation và kết quả phiên focus; server state độc lập UI timer.

**Dữ liệu sở hữu dự kiến:** focus_sessions và transition/timing fields sau review. Đây là inventory thiết kế, chưa là migration.

## Use case cần xây

- StartFocus: kiểm tra owned task, ghi start timestamp.
- PauseFocus/ResumeFocus: transition idempotent theo state được chốt.
- CompleteFocus: ghi done/still-stuck và cung cấp facts tối thiểu.
- GetActiveFocus/GetFocusHistory: phục hồi phiên khi web/mobile mở lại.

## API dự kiến

Các route dưới đây dùng prefix `/api/v1` khi được triển khai; chưa hoạt động trong scaffold.

- POST /focus-sessions
- GET /focus-sessions/active
- POST /focus-sessions/:id/pause
- POST /focus-sessions/:id/resume
- POST /focus-sessions/:id/complete

## Phụ thuộc và interface

Dùng task owned-lookup/transition và profile timezone nếu cần phân ngày. Task không gọi ngược focus.

**Public application interface dự kiến:** Focus activity facts theo owner, timestamp, outcome; không kèm task title/note. Chỉ tạo interface/provider code khi có use case hoặc consumer thực sự; hiện chưa có stub trả kết quả giả.

## Invariant và boundary

- Thời gian server và state là nguồn dữ liệu; không phụ thuộc setInterval tiếp tục chạy khi app background.
- Completion không tự sinh AI suggestion.
- Quy tắc completion → task done phải được chốt; không cập nhật xuyên bảng ngầm.
- Không gắn audio/player state vào transaction focus.

## Acceptance criteria cho implementation

- [ ] Start với task người khác bị từ chối.
- [ ] Resume/process restart không reset nhầm thời gian; duplicate complete không tăng facts hai lần.
- [ ] Query lỗi và mất response được xử lý có recovery rõ ràng.

## Privacy và retention

Export lịch sử phiên và xóa theo account; retention rõ, event metadata tối thiểu.

## Cần chốt trước slice

Một hay nhiều phiên active/account, semantics pause, still-stuck và transaction liên task/focus.

Xem [Module delivery plan](../../../../../docs/04-engineering/module-delivery-plan.md) và [module catalog](../../../../../docs/02-product/application-modules-spec.md). Module `focus` là boundary bên trong một API deployable, không phải microservice.
