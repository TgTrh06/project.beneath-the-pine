# Data Rights and Retention

- **Status:** Draft

## User-facing capabilities

- Xem thông tin tài khoản và consent.
- Export dữ liệu ở định dạng máy đọc được.
- Sửa thông tin không chính xác.
- Rút consent.
- Xóa dữ liệu theo loại hoặc xóa account.

## Deletion workflow

1. Re-authenticate.
2. Hiển thị phạm vi và hậu quả.
3. Ghi nhận request ID, không log content.
4. Xóa/ẩn hoạt động ngay theo thiết kế.
5. Xóa khỏi primary systems và processors.
6. Xử lý backups theo retention schedule.
7. Thông báo hoàn thành hoặc ngoại lệ pháp lý.

## Retention table cần chốt trước beta

| Data class | Active retention | Post-delete/backups | Owner |
|---|---|---|---|
| Raw brain dump | TBD; ưu tiên ngắn | TBD | Product/Privacy |
| Tasks/actions | Theo account | TBD | Product |
| AI output | Theo feature/history | TBD | AI/Product |
| Logs | 30–90 ngày đề xuất | Theo log platform | Security |
| Consent records | Theo nghĩa vụ áp dụng | TBD | Privacy |
| Research recordings | Theo consent | Xóa đúng hạn | Research |

