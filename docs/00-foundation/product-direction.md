# Product Direction — Public Focus Companion

- **Status:** Approved direction
- **Last updated:** 2026-09-11
- **Scope:** Independent public product; current delivery moves from private validation to public alpha

## Product definition

> **Beneath the Pine là focus companion bằng tiếng Việt giúp người đang quá tải bắt đầu một hành động nhỏ, tạo một điểm vào cho lần sau và quay lại mà không bị phán xét.**

Sản phẩm giảm ma sát để bắt đầu, tiếp tục hoặc trở lại với một việc phù hợp ở hiện tại. Việc phát triển ra cộng đồng mở rộng khả năng tiếp cận và học hỏi từ người dùng thật; lời hứa cốt lõi vẫn giữ nguyên.

## Platform direction

Mobile là nền tảng sản phẩm chính về lâu dài. Web React/Vite được xây trước để hoàn thiện vòng lặp sản phẩm và kiểm chứng API NestJS + PostgreSQL/Drizzle dùng chung. Nghiệp vụ và dữ liệu server không phụ thuộc UI web. Không cần hoàn thành toàn bộ web T0–T5 trước mobile; chuyển sang mobile sau gate API core và quyết định hệ điều hành đầu tiên và native auth.

React Native + Expo đã được chọn; Android/iOS đầu tiên, push và offline sync còn cần quyết định riêng. Responsive web là yêu cầu của client đầu tiên, không thay thế kế hoạch mobile. Xem [Web/Mobile API Strategy](../04-engineering/web-mobile-api-strategy.md).

## Audience

Nhóm đầu tiên là người Việt 20–30 tuổi học tập hoặc làm việc trí óc, thường gặp khó khăn với ưu tiên, khởi động, duy trì và quay lại với công việc. Đây là phân khúc hành vi; sản phẩm không chẩn đoán, điều trị hoặc đưa ra tư vấn y khoa.

## Product loop

`Brain Dump → làm rõ → chọn next action → Focus Studio → Open Seed → reminder đã chọn → Return Ritual → Weekly Letter → next action`

Một phiên có giá trị khi người dùng đi từ trạng thái bị kẹt đến `start_event` trong khoảng 10 phút. Một vòng lặp return có giá trị khi họ quay lại mà không phải nhớ mình đã dừng ở đâu hoặc đối mặt ngay với backlog.

## What makes it distinct

- Luôn ưu tiên một hành động phù hợp ở hiện tại thay vì hiển thị toàn bộ backlog.
- Người dùng duyệt mọi gợi ý AI và có thể bỏ qua hoặc tự nhập.
- Mỗi phiên có thể để lại một **Open Seed**: điểm vào cực nhỏ cho lần sau.
- Reminder là opt-in, theo giờ và timezone người dùng chọn; không dùng ngôn ngữ gây tội lỗi.
- Return Ritual chào đón việc quay lại, không hiển thị streak loss hay task quá hạn trước.
- Focus Studio tạo cảm giác sở hữu qua theme/audio/preset nhưng không thêm bước bắt buộc.
- Cây thông/Pine Marten tạo cảm giác đồng hành nhẹ, không là cơ chế thưởng phạt.

## Engagement principles

1. Ghi nhận sự quay lại và khởi động, không xếp hạng năng suất.
2. Không streak, leaderboard, virtual currency, phạt vắng mặt hoặc thông báo dồn dập.
3. Mỗi reminder phải do người dùng bật, dễ tắt và có mục đích rõ ràng.
4. Weekly Letter chỉ nêu facts có thể kiểm chứng và cho phép phản hồi “hữu ích/chưa đúng”.
5. Âm thanh, màu sắc và animation chỉ hỗ trợ focus; không phải điều kiện để hoàn thành flow.
6. Monetization không khóa core focus, data rights hoặc dữ liệu người dùng đã tạo.

## Product boundaries

### In scope through public alpha

- Brain Dump tiếng Việt, AI extraction và Help Me Start có user confirmation/manual fallback.
- Một next action, Focus Room và Focus Studio tối giản.
- Open Seed, in-app reminder opt-in, Return Ritual và Weekly Letter dựa trên facts tổng hợp.
- Account authentication, consent AI, export/delete dữ liệu và analytics tối thiểu.
- Public landing/onboarding, đường demo rõ ràng và feedback trong ngữ cảnh.
- Web responsive trước; mobile app là đích sản phẩm chính, nền tảng phát hành đầu tiên chưa chốt.

### Candidates after public evidence

- Pine Plus với entitlement rõ theo capability.
- Focus presets, thư viện theme/audio mở rộng và preference sync.
- Outbound reminder qua provider adapter.
- Advanced insight/ML dựa trên verified data, evaluation và feedback.

### Explicitly deferred

- Task/calendar/notes/project management đầy đủ.
- Social feed, leaderboard, streak, economy, shop hoặc daily quests.
- Chatbot AI tự do và phân tích mood/journal tự động.
- Push notification và offline sync chờ scope riêng; desktop native chưa ưu tiên. Mobile app thuộc roadmap sau gate API core, không nằm trong danh sách loại bỏ dài hạn.
- Hardware sizing, database scale topology và multi-region planning trước khi có nhu cầu thực.

## Research and product hypotheses

- **H1:** Một next action dưới 15 phút giảm thời gian từ stuck state đến start event.
- **H2:** Open Seed tăng khả năng người dùng bắt đầu phiên kế tiếp.
- **H3:** Return Ritual không phán xét tăng tỷ lệ quay lại sau gián đoạn.
- **H4:** Reminder opt-in theo ý định người dùng tăng start rate mà không làm tăng opt-out bất thường.
- **H5:** Weekly Letter dựa trên evidence giúp người dùng thấy tiến bộ mà không tạo áp lực năng suất.
- **H6:** Personal focus presets tạo giá trị lặp lại đủ rõ để kiểm chứng Pine Plus.
- **H7:** Người dùng ngoài cohort đồ án có thể hiểu lời hứa và hoàn thành phiên đầu mà không cần facilitator.

## Direction changes

Project chuyển từ prototype phục vụ đồ án thành một independent public product. Private beta tiếp tục là gate kiểm chứng, không còn là đích cuối. Thứ tự phát triển nằm trong [Tiered Delivery Plan](../02-product/tiered-delivery-plan.md); chi tiết yêu cầu nằm trong [PRD](../02-product/prd.md).
