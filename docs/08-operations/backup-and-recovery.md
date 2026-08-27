# Backup and Recovery

- **Status:** Template — điền theo provider

## Targets cần chốt

- **RPO:** `[mức dữ liệu tối đa có thể mất]`
- **RTO:** `[thời gian tối đa để phục hồi]`

## Baseline

- Managed automated backups.
- Point-in-time recovery nếu provider hỗ trợ.
- Mã hóa backup.
- Quyền restore giới hạn.
- Restore test định kỳ trên môi trường cô lập.

## Restore exercise

1. Chọn restore point.
2. Restore sang database tạm cô lập.
3. Verify schema/migrations.
4. Kiểm tra record counts và core workflow synthetic.
5. Xóa môi trường tạm an toàn.
6. Ghi kết quả, thời gian và vấn đề.

## Privacy

- Backup retention phải khớp thông báo privacy.
- Quy trình delete phải giải thích cách dữ liệu rời backup theo chu kỳ.
- Không tải backup production về máy cá nhân.

