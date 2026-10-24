# Pilot log — bản tổng hợp không chứa dữ liệu cá nhân

**Trạng thái:** Chưa mở pilot. Mọi số liệu người dùng thật dưới đây để trống cho đến khi cổng triển khai và [release checklist](../09-release/release-checklist.md) đạt. Không đưa email, tên, account ID, link/token mời, intention, Seed, phản hồi nguyên văn hoặc bản consent vào file này.

## Cổng mở và thời gian

| Mục | Trạng thái / bằng chứng |
| --- | --- |
| CI và kiểm chứng local | Chưa ghi lượt Step 7; xem `pilot-preflight-verification.md` khi có kết quả. |
| Screen reader thật, zoom 200%, nhiều engine | Chưa xác nhận cho Step 7. |
| Host, DB, backup/restore, nguồn log, owner và phê duyệt deploy | Chưa chọn; cần kế hoạch riêng. |
| Consent đã điền và nơi lưu ngoài repo | Chưa; không gửi lời mời. |
| Health, auth/privacy/realtime smoke trên môi trường pilot | Chưa; không gửi lời mời. |
| Ngày bắt đầu, kết thúc và ngày xóa chậm nhất | Chưa ấn định; ngày xóa = ngày kết thúc thực tế + 30 ngày. |

## Số tổng hợp

| Chỉ số | Số | Ghi chú đã ẩn danh |
| --- | ---: | --- |
| Được mời | — | Chỉ tính lời mời đã gửi sau khi mở pilot. |
| Đã đồng ý tham gia / đồng ý nghiên cứu | — / — | Hai lựa chọn riêng. |
| Đã bắt đầu / hoàn tất Solo không cần hướng dẫn | — / — | Ghi số lần nhắc ở hàng dưới. |
| Camp có link mời đã gửi / đã chấp nhận | — / — | Ghi riêng trường hợp link không tới hoặc không dùng được. |
| Pact tạo / nhận lời / bắt đầu riêng / có ≥2 người checkout | — / — / — / — | Không dùng việc tạo Pact thay bằng bằng chứng tham gia. |
| Có Seed / quay lại từ Seed vào ngày khác | — / — | Chỉ đếm khi có bằng chứng quan sát hoặc tự báo cáo. |
| Lần người quan sát phải nhắc trực tiếp | — | Nếu có, ghi nhiệm vụ và lý do không nhận diện cá nhân. |

## Quan sát và lỗi

| Mã | Hành trình và bước tái hiện | Quan sát / ảnh hưởng | Mức độ | Phương án dự phòng, owner, trạng thái | Bằng chứng đã ẩn danh |
| --- | --- | --- | --- | --- | --- |
| — | Chưa có dữ liệu pilot. | — | — | — | — |

Mức độ: **chặn core** / **lỗi khó chịu** / **cải tiến sau pilot**. Không ghi “đã sửa” nếu chưa chạy lại chính hành trình lỗi. Với blocker, chủ pilot dừng mời thêm, duyệt phương án dự phòng và yêu cầu kế hoạch sửa được phê duyệt trước thay đổi code.

## Nhịp rà vận hành

| Ngày/khung giờ | Health, DB, websocket, lỗi và log riêng tư | Phát hiện / hành động | Người rà |
| --- | --- | --- | --- |
| — | Chưa có nguồn log pilot. | Môi trường chưa chọn; chưa thể rà dài hạn. | — |

Rà hằng ngày trong 3 ngày đầu, ít nhất hằng tuần sau đó và ngay khi có báo sự cố. Chỉ ghi số lượng, xu hướng và mã lỗi đã che thông tin riêng. Không sao chép log thô vào repo.

## Báo cáo kết thúc

- **Cỡ mẫu và thời gian thực tế:** Chưa có.
- **Bằng chứng Solo tự hoàn tất, Camp/Pact hoàn tất, quay lại từ Seed:** Chưa có.
- **Thất bại và phản ví dụ:** Chưa có.
- **Blocker đã sửa/kiểm chứng hoặc phương án dự phòng được chủ pilot chấp nhận:** Chưa có.
- **Phần chưa kiểm chứng và giới hạn dữ liệu:** Pilot chưa bắt đầu.
- **Quyết định tiếp tục / sửa thêm / dừng, người quyết định và ngày:** Chưa có.
