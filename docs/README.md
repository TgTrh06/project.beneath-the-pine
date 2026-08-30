# Beneath the Pine — Documentation Map

> Lối đi bình tĩnh qua các quyết định sản phẩm, chi tiết triển khai và những lan can an toàn giữ chúng nhất quán.

Đây là ký ức chung của dự án: vì sao Beneath the Pine tồn tại, điều sản phẩm hứa hẹn, cách nó được xây dựng và những nơi nó phải dừng lại. Ứng dụng đang được phát triển; tài liệu tiến hóa cùng sản phẩm.

## Chọn đường đọc

| Mục tiêu | Tuyến đọc |
| --- | --- |
| Hiểu ý định và ranh giới sản phẩm | [Foundation](00-foundation/README.md) → [Product](02-product/README.md) → [Design](03-design/README.md) |
| Triển khai thay đổi cho ứng dụng | [Engineering](04-engineering/README.md) → [AI handbook](ai/README.md), khi áp dụng → [Testing](07-testing/README.md) |
| Thay đổi output hoặc model AI | [Machine Learning](05-machine-learning/README.md) → [AI handbook](ai/README.md) → [Security & Privacy](06-security-privacy/README.md) |
| Chuẩn bị beta hoặc release | [Testing](07-testing/README.md) → [Operations](08-operations/README.md) → [Release](09-release/README.md) |
| Kiểm chứng giả định trước khi cam kết giải pháp | [Research](01-research/README.md) |

## Cách dùng bộ tài liệu

- Các thư mục đánh số là hồ sơ quyết định cho product, UX, engineering, ML, privacy, quality, operations và release.
- [ai/](ai/README.md) là handbook cho coding AI: nó chuyển quyết định thành các lát cắt nhỏ, không thay thế PRD, design decisions, privacy rules hoặc ADR.
- Nếu handbook mâu thuẫn với tài liệu đánh số, tài liệu đó—hoặc ADR liên quan—có hiệu lực. Hãy dừng và xin quyết định thay vì tự chọn.
- Đánh dấu quyết định quan trọng là `Draft`, `Review`, `Approved` hoặc `Superseded`. Thay đổi kiến trúc đáng kể cần ADR trong `04-engineering/adr/`.
- Không đặt thông tin nhận dạng, dữ liệu sức khỏe thật hay transcript nghiên cứu vào repository.

## Bản đồ

| Khu vực | Câu hỏi nó trả lời | Điểm bắt đầu |
| --- | --- | --- |
| 00 — Foundation | Sản phẩm vì sao tồn tại, dành cho ai, thành công là gì | [Foundation](00-foundation/README.md) |
| 01 — Research | Điều gì cần được kiểm chứng trước khi tin tưởng | [Research](01-research/README.md) |
| 02 — Product | Ta xây gì và nghiệm thu nó ra sao | [Product](02-product/README.md) |
| 03 — Design | Trải nghiệm giảm áp lực và hỗ trợ quay lại thế nào | [Design](03-design/README.md) |
| 04 — Engineering | Hệ thống hiện tại được cấu trúc và vận hành local ra sao | [Engineering](04-engineering/README.md) |
| 05 — Machine Learning | AI behavior, data, evaluation và safety được quản trị thế nào | [Machine Learning](05-machine-learning/README.md) |
| 06 — Security & Privacy | Data, consent và risk được bảo vệ ra sao | [Security & Privacy](06-security-privacy/README.md) |
| 07 — Testing | Niềm tin được xây trước release như thế nào | [Testing](07-testing/README.md) |
| 08 — Operations | Dịch vụ được deploy, quan sát và khôi phục ra sao | [Operations](08-operations/README.md) |
| 09 — Release | Beta/release readiness được quyết định thế nào | [Release](09-release/README.md) |

## Trước khi đổi code

1. [Product Direction — Focus Companion & Gentle Return](00-foundation/product-direction.md)
2. [PRD](02-product/prd.md)
3. [Technology Stack](04-engineering/technology-stack.md)
4. [System Architecture](04-engineering/system-architecture.md)
5. [AI Safety Policy](05-machine-learning/ai-safety-policy.md), nếu thay đổi chạm đến AI
6. [Test Strategy](07-testing/test-strategy.md)

Với lát cắt retention, đọc thêm [AI Implementation Handbook](ai/README.md) và contracts liên kết. Với thay đổi user-facing, đọc phần Design trước khi mở component.

## Từ vựng trạng thái

- **Draft** — đang xây; chưa là cam kết triển khai.
- **Review** — đủ nội dung để phản biện; đang chờ xác nhận.
- **Approved** — cơ sở hiện hành để triển khai.
- **Superseded** — đã được thay thế và phải trỏ tới tài liệu mới.

Tài liệu nên như một khoảng trống dưới tán cây: đủ định hướng để đi tiếp tự tin, không nhiều nghi thức đến mức bước kế tiếp biến mất.
