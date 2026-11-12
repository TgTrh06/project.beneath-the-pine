# MVP Scope — Web Validation

- **Status:** Approved internship MVP revision — 2026-11-13 (Asia/Saigon).

## Goal

Chứng minh một người có thể bắt đầu và quay lại với việc dở dang qua solo flow; và một Camp riêng có tự hẹn thêm focus pact sau phiên đầu hay không.

Mốc báo cáo thực tập yêu cầu bản web chạy local có **AI Assistance gọi mô hình thật**. Pilot đánh giá hành vi người dùng và bản đồ án hoàn thiện là các mốc riêng; kết quả demo không thay thế bằng chứng pilot.

## Included

- Account, profile tối thiểu và timezone.
- Solo intent → activation step → 5/10/25/50-minute session → check-out.
- Một Open Seed hiện hành cho mỗi người dùng.
- Camp riêng, invite/link, member lifecycle.
- Focus Pact ngay hoặc theo giờ; accept/decline/cancel/expire.
- Realtime presence và server-authoritative timer.
- Camp milestone tối giản sau pact hoàn tất.
- Privacy/data-rights baseline, event logging và pilot feedback.
- AI Assistance qua Beeknoee, model `bee/gpt-6-luna` cho demo local; OpenRouter/DeepSeek là phương án thay thế. Ba chức năng: bước bắt đầu, hỗ trợ khi mắc kẹt, bản nháp Open Seed. Người dùng chủ động yêu cầu, sửa/dùng/bỏ; AI không tự lưu hoặc thay đổi phiên.
- Người dùng có thể xem và chọn gửi ngữ cảnh phiên/Seed của chính mình. Mỗi gợi ý dùng tối đa một lượt gọi, có quota, giới hạn token, timeout và fallback giữ nguyên nội dung.

## Not included

Mobile native, public rooms, stranger matching, voice/video, DM, task board, habit, reminders outbound, ranking, streak, shop và payment. Huấn luyện/fine-tune mô hình riêng và AI tự thực hiện thao tác thay người dùng không thuộc mốc báo cáo thực tập.

## Internship MVP exit evidence

- Build/tests đạt; hai luồng Solo/Seed và Camp/Pact có bằng chứng chạy local với database tạm.
- Cả ba chức năng AI có đầu ra từ model thật, qua kiểm tra schema và dùng được trong giao diện. Mock hoặc luôn fallback không đủ để nghiệm thu AI.
- Người dùng sửa/dùng/bỏ được gợi ý; preview ngữ cảnh không gọi model, dữ liệu người khác không được gửi. Lỗi/quota/timeout không làm mất bản nháp hoặc tự thay đổi trạng thái Focus/Seed.
- Ghi rõ model, ngày kiểm chứng, số lượt gọi, usage/chi phí khi provider cung cấp và giới hạn chất lượng. Gợi ý chưa tối ưu có thể tiếp tục cải thiện; không tuyên bố đã chứng minh hiệu quả với người dùng thật.
- Xem [ADR-0032](../04-engineering/adr/0032-beeknoee-local-trial.md), [biên bản Luna](../07-testing/beeknoee-trial-readiness.md) và [kế hoạch chất lượng](../05-machine-learning/assistance-quality-v1.md). Bộ eval 60 case chưa chạy inference; không tính là bằng chứng nghiệm thu chất lượng mới.

## Product pilot exit evidence (separate from internship demo)

- User có thể hoàn thành solo return flow khi API/realtime lỗi có fallback phù hợp.
- Camp 2–8 người tạo, chấp nhận và hoàn tất pact với timer nhất quán sau reconnect.
- Pilot có bằng chứng về invitation, attendance, Open Seed resume và repeat pact.
