# Privacy by Design

- **Status:** Baseline
- **Last updated:** 2026-08-04

## Principles

- Data minimization.
- Purpose limitation.
- Consent có thể chứng minh và rút lại.
- Retention có thời hạn.
- User access/export/delete.
- Security mặc định.
- AI transparency và human control.

## Data inventory baseline

| Data | Mục đích | AI processing | Analytics | Retention |
|---|---|---|---|---|
| Account/profile | Cung cấp dịch vụ | Không cần | ID giả danh | Theo account |
| Task/next action | Core workflow | Khi user yêu cầu | Không raw text | Theo account |
| Brain dump | Extraction | Có consent | Không | Cần chốt, ưu tiên ngắn |
| Energy/check-in | Reset/review | Có consent tương ứng | Chỉ aggregate | Cần chốt |
| AI output | Hiển thị/evaluation | N/A | Metadata only | Theo feature |
| Consent record | Chứng minh lựa chọn | Không | Không | Theo nghĩa vụ áp dụng |

## Third parties

Với mỗi processor/provider cần ghi:

- Dữ liệu được gửi.
- Purpose và legal basis.
- Region/chuyển dữ liệu.
- Retention và training policy.
- Security commitments.
- Cách xóa và xử lý sự cố.

## Logging policy

- Không log token auth, raw brain dump, reflection hoặc task title.
- Dùng request ID/user pseudonymous ID.
- Log access vào thao tác export/delete/admin.
- Redaction tại logging boundary.

