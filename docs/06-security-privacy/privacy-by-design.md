# Privacy by Design — Focus & Gentle Retention

- **Status:** Baseline for private beta
- **Last updated:** 2026-08-27

## Principles

- Data minimization, purpose limitation và least privilege.
- Consent/opt-out có thể chứng minh và thay đổi ngay.
- Retention có thời hạn; user có export/delete.
- AI transparency, human control và no clinical inference.

## Data inventory

| Data | Purpose | Analytics | Retention |
|---|---|---|---|
| Profile/timezone | Account và local schedule | Pseudonymous ID only | Theo account |
| Task/next action | Core focus workflow | Không raw text | Theo account |
| Brain Dump/check-in | User-requested AI/core flow | Không | Theo retention policy riêng |
| Theme/audio local preference | Personalize Focus Studio | Không | Thiết bị user ở phase đầu |
| Reminder slots | User-selected re-entry time | Channel/status/timestamp only | Đến khi tắt/xóa account |
| Open Seed | Điểm vào cho lần sau | Event/status only | Đến dismiss/expiry/xóa account |
| Weekly facts/feedback | Reflection và product learning | Aggregate/verdict only | Theo account/pilot retention |

## Reminder and notification rules

- Default off; explicit opt-in, clear purpose và visible disable path.
- Nội dung reminder không chứa task title, Brain Dump, note, audio URL hoặc thông tin sức khỏe.
- Timezone dựa vào profile/user confirmation; delivery có audit metadata tối thiểu.
- Provider outbound là processor mới: phải ghi data sent, region, retention, security, deletion path và DPA review trước khi bật.

## YouTube and audio rules

- Embed chỉ tải sau user action; explain rằng provider có thể xử lý dữ liệu kỹ thuật theo chính sách của họ.
- Không gửi private content vào URL/embed.
- Không log URL video, listening history hoặc identifier từ player.

## Logging policy

- Không log auth token, raw Brain Dump, task title, reflection, audio URL hay notification copy.
- Dùng request ID/pseudonymous user ID; log access export/delete/admin và delivery failure code.
- Redaction tại logging boundary; incident review không được thêm raw content mặc định.

## Data rights

Export/delete bao gồm preferences server-side, reminder slots, focus seeds và weekly feedback. Local-only preferences được hướng dẫn xóa tại browser/device; chúng không thể xuất từ server.
