# Product Requirements Document — Public Focus Companion

- **Status:** Draft for public-product implementation
- **Version:** 1.0
- **Delivery target:** Public alpha, followed by evidence-based paid validation
- **Last updated:** 2026-09-08

## 1. Product definition

> Beneath the Pine là focus companion bằng tiếng Việt giúp người đang quá tải biến một mớ suy nghĩ thành một bước nhỏ, bắt đầu trong một không gian bình tĩnh và quay lại đúng nơi đã dừng.

Sản phẩm phục vụ người Việt học tập hoặc làm việc trí óc, đặc biệt trong những lúc khó ưu tiên, khó bắt đầu hoặc khó quay lại sau gián đoạn. Đây là phân khúc hành vi; sản phẩm không chẩn đoán, điều trị hoặc đưa ra lời khuyên y khoa.

## 2. Product promise

Trong phiên đầu, người dùng có thể đi từ “tôi đang rối” đến một `start_event` trong vòng 10 phút. Khi quay lại, họ có một điểm vào đủ nhỏ để tiếp tục mà không phải đối diện ngay với backlog, streak hoặc lời nhắc mang tính phán xét.

## 3. Strategic outcomes

1. **Useful first session:** người dùng tạo hoặc xác nhận một next action và bắt đầu focus.
2. **Recoverable stuck state:** `Vẫn bị kẹt` dẫn tới một bước nhỏ hơn thay vì kết thúc flow.
3. **Low-cost return:** Open Seed và Return Ritual giúp tiếp tục sau gián đoạn.
4. **Personal belonging:** theme, audio và preset làm không gian focus quen thuộc nhưng không chặn core flow.
5. **Public-product evidence:** có thể tuyển người dùng ngoài phạm vi đồ án, quan sát activation/return và thu feedback có cấu trúc.
6. **Sustainable option:** Pine Plus chỉ được đưa vào validation sau khi một capability tạo giá trị lặp lại được chứng minh.

## 4. Product loops

### Core loop

`Capture/Brain Dump → user confirmation → one next action → Focus Room → done/still stuck`

### Gentle return loop

`Focus outcome → optional Open Seed → opted-in reminder → Return Ritual → next action`

### Reflection loop

`Verified activity facts → Weekly Letter → useful/not accurate feedback → optional experiment`

## 5. Tier model

Tier mô tả thứ tự phụ thuộc khi triển khai, không phải gói giá.

| Tier | Outcome | Capability groups | Exit gate |
|---|---|---|---|
| T0 — Foundation | Hệ thống có ranh giới, quyền riêng tư và khả năng phục hồi cơ bản | Product rules, app shell, contracts, identity/consent, privacy, accessibility, logging | Core flow có thể phát triển mà không tạo contract hoặc safety debt chưa biết |
| T1 — Core focus | Người dùng đi từ rối đến bắt đầu và kết thúc một phiên | Capture, Brain Dump, confirmation, next action, Help Me Start, Focus Room | Flow hoàn tất trên mobile/keyboard; lỗi AI/audio không chặn manual focus |
| T2 — Gentle return | Người dùng có điểm vào rõ khi quay lại | Open Seed, return eligibility, Return Ritual, in-app reminder preference | Tắt reminder tức thời; seed/return không lộ nội dung trong analytics |
| T3 — Personal space | Người dùng tạo một Focus Studio phù hợp với mình | Theme, ambient audio, YouTube opt-in, presets, local preferences | Tùy biến không làm tăng bước bắt buộc trước khi focus |
| T4 — Public product | Người lạ có thể hiểu, thử, phản hồi và quản lý dữ liệu | Landing/onboarding, demo path, Weekly Letter, feedback, data rights, release operations | Public alpha đạt readiness, analytics tối thiểu và support path |
| T5 — Sustainable product | Có thể kiểm chứng khả năng trả phí và mở rộng có kiểm soát | Entitlements, Pine Plus, billing adapter, sync, outbound reminder, advanced insight/ML | Paid hypothesis có demand, unit economics và privacy/provider review |

Chi tiết capability ID, dependency và delivery status nằm trong [Tiered Delivery Plan](tiered-delivery-plan.md).

## 6. Primary journeys

### PJ-01 — Start from a messy thought

Người dùng nhập Brain Dump hoặc task thủ công, xem kết quả được đề xuất, sửa/xác nhận một next action rồi bắt đầu Focus Room. Nếu inference không sẵn sàng, người dùng vẫn có thể tự nhập next action.

### PJ-02 — Recover while stuck

Trong hoặc trước phiên focus, người dùng chọn `Vẫn bị kẹt`. Hệ thống đề xuất một bước nhỏ hơn có evidence từ task hiện tại, cho phép chỉnh sửa, rồi quay lại hành động chính.

### PJ-03 — Leave and reopen a seed

Sau phiên, người dùng tùy chọn lưu một Open Seed tối đa 280 ký tự. Phiên sau hiển thị seed trước backlog và cho mở, bỏ qua hoặc xóa.

### PJ-04 — Return after interruption

Khi đủ điều kiện return, người dùng thấy lời chào ngắn và chọn bắt đầu mới, mở seed hoặc check-in. Lỗi bootstrap không khóa Now/Capture.

### PJ-05 — Create a personal focus space

Người dùng tùy chọn theme, audio hoặc preset. Audio chỉ tải sau thao tác rõ ràng; lỗi player không ảnh hưởng timer hay task controls.

### PJ-06 — Understand the week

Người dùng chủ động mở Weekly Letter gồm facts, observation, evidence và một experiment tùy chọn; họ có thể đánh dấu hữu ích hoặc chưa đúng.

### PJ-07 — Evaluate Pine Plus

Người dùng nhìn thấy quyền lợi trả phí tại thời điểm capability liên quan có giá trị. Checkout, entitlement và downgrade không được làm mất dữ liệu người dùng; capability core vẫn hoạt động.

## 7. Functional requirements

| ID | Requirement | Tier | Entitlement | Delivery status |
|---|---|---:|---|---|
| FR-001 | App shell, routing, error boundary và responsive navigation | T0 | Core | Implemented |
| FR-002 | Managed identity, profile/timezone, consent và beta/public access policy | T0 | Core | Partial |
| FR-003 | Stable API/output contracts, authorization và safe error responses | T0 | Core | Partial |
| FR-004 | Export/delete bao phủ toàn bộ dữ liệu user-owned | T0 | Core | Partial |
| FR-101 | Manual capture tạo một task/next action có thể bắt đầu | T1 | Free | Partial |
| FR-102 | Brain Dump tiếng Việt tạo structured suggestion có user confirmation | T1 | Free quota | Partial |
| FR-103 | Help Me Start tạo bước nhỏ hơn có thể sửa hoặc bỏ qua | T1 | Free quota | Partial |
| FR-104 | Focus Room hỗ trợ start, pause/resume, done và still stuck | T1 | Free | Partial |
| FR-105 | Core flow dùng được khi AI, audio hoặc analytics lỗi | T1 | Free | Designed |
| FR-201 | Tạo, mở, thay thế, dismiss một Open Seed | T2 | Free | Designed |
| FR-202 | Bootstrap suy ra return eligibility từ core events và timezone | T2 | Free | Designed |
| FR-203 | Return Ritual cung cấp start fresh/open seed/check-in | T2 | Free | Designed |
| FR-204 | In-app reminder mặc định tắt, tối đa hai slot và disable tức thời | T2 | Free | Designed |
| FR-301 | Theme thay đổi Focus Studio và được lưu local | T3 | Free + Plus library | Designed |
| FR-302 | Ambient audio/YouTube chỉ khởi tạo sau user action | T3 | Free + Plus library | Designed |
| FR-303 | Người dùng lưu và tái sử dụng focus preset | T3 | Pine Plus hypothesis | Planned |
| FR-401 | Public landing/onboarding giải thích giá trị, privacy và demo path | T4 | Public | Planned |
| FR-402 | Weekly Letter chỉ hiển thị khi đủ verified facts | T4 | Free | Designed |
| FR-403 | In-product feedback có ngữ cảnh và không chứa private content mặc định | T4 | Public | Planned |
| FR-404 | Product events đo activation/return với payload tối thiểu | T4 | Internal | Partial |
| FR-501 | Entitlement service quyết định capability access độc lập với UI | T5 | Internal | Future |
| FR-502 | Billing adapter xử lý checkout, webhook idempotent và subscription state | T5 | Pine Plus | Future |
| FR-503 | Cross-device preference/preset sync | T5 | Pine Plus hypothesis | Future |
| FR-504 | Outbound reminder adapter chỉ hoạt động sau opt-in/provider review | T5 | Undecided | Future |
| FR-505 | Advanced insight/ML dùng verified data và có explanation/feedback | T5 | Pine Plus hypothesis | Future |

## 8. Experience requirements

- Responsive từ 320px, keyboard navigation đầy đủ, visible focus và logical dialog focus.
- Một primary action rõ trên mỗi trạng thái; tùy chọn theme/audio nằm sau task controls.
- Trạng thái loading, empty, recoverable error và authorization failure giữ đường quay lại core flow.
- Dark theme có hierarchy riêng; motion tuân thủ `prefers-reduced-motion`.
- Copy không dùng streak loss, overdue pressure, shame hoặc clinical claim.
- Paywall không xuất hiện giữa một focus session đang chạy hoặc chặn dữ liệu do người dùng đã tạo.

## 9. Data, AI and privacy requirements

- Mọi AI output được validate bằng schema trước khi hiển thị hoặc lưu; user xác nhận trước khi trở thành action.
- Analytics không nhận task title, Brain Dump, note, audio URL, notification copy hoặc dữ liệu sức khỏe suy luận.
- Nội dung nhạy cảm được mã hóa theo policy và có thời hạn retention cụ thể.
- Reminder mặc định tắt, dùng timezone do người dùng xác nhận và re-check preference trước delivery.
- YouTube/embed không tải trước user action và không nhận private content từ ứng dụng.
- Billing data do provider xử lý trong tương lai; hệ thống chỉ lưu provider reference và subscription state tối thiểu.

## 10. Metrics

### Core

- Activation trong 24 giờ.
- Stuck-to-Start trong 10 phút.
- Focus start/completion và still-stuck recovery.

### Return

- D3/D7 return.
- Seed-to-start trong 24 giờ.
- Return Ritual → core event cùng ngày.
- Reminder opt-out và reminder-to-start.

### Public product

- Landing → first capture.
- First capture → first focus.
- Contextual feedback completion.
- Weekly Letter usefulness/not-accurate rate.

### Paid validation

- Paywall view → checkout start → active entitlement.
- Trial/first payment → second billing period retention.
- Capability usage before and after upgrade.
- Refund/cancel reason và support burden.

Các ngưỡng định lượng là hypothesis trong [Product Metrics](../00-foundation/metrics.md), không phải mục tiêu áp lực hiển thị cho người dùng.

## 11. Release gates

### Core alpha gate

- PJ-01 và PJ-02 hoàn tất trên mobile và keyboard mà không cần hướng dẫn.
- Manual fallback hoạt động khi AI unavailable.
- Không có P0/P1 trong focus, consent, authorization hoặc private-content handling.

### Return alpha gate

- Seed lifecycle, return state và reminder disable có contract/integration/UI coverage phù hợp.
- Không có reminder khi chưa opt-in; không có raw content trong event/log.

### Public alpha gate

- Người mới hiểu lời hứa sản phẩm và bắt đầu flow từ landing/onboarding.
- Export/delete, privacy copy, feedback và support path sẵn sàng.
- Có baseline activation, D3/D7 và guardrail metrics.

### Paid experiment gate

- Có cohort quay lại sử dụng capability dự kiến đưa vào Plus.
- Entitlement/billing design có failure, cancellation, restore và webhook replay behavior.
- Giá, provider, tax/invoice, refund và unit economics được duyệt riêng trước khi thu tiền thật.

## 12. Explicitly deferred

- Hardware sizing, database capacity planning, replication, partitioning và multi-region deployment.
- Full task/calendar/project suite, collaboration, social feed, leaderboard, streak hoặc reward economy.
- Push/native notification, iOS/desktop native và offline sync.
- Tự động suy luận mood, diagnosis hoặc health condition.
- Cam kết “AI không giới hạn”, lifetime access hoặc một payment provider cụ thể trước paid validation.

## 13. Source of truth

- Capability order: [Tiered Delivery Plan](tiered-delivery-plan.md)
- UX: [Design documentation](../03-design/README.md)
- System relationships and sequences: [System Diagrams](../04-engineering/system-diagrams.md)
- Data rules: [Data Model](../04-engineering/data-model.md)
- AI behavior: [Machine Learning](../05-machine-learning/README.md)
- Privacy: [Privacy by Design](../06-security-privacy/privacy-by-design.md)
- Acceptance detail for coding AI: [AI Implementation Handbook](../ai/README.md)
