# Focus Studio

- **Status:** Design specification
- **Last updated:** 2026-08-27

## User goal

Đi vào một phiên tập trung với ít lựa chọn, cảm giác riêng tư và khả năng rời/điều chỉnh bất cứ lúc nào.

## Hierarchy

1. Task hiện tại và timer.
2. Start/pause/done/still stuck.
3. Theme, sound và exit.

## Visual direction

Giữ nền ấm, xanh thông và typography có sẵn. Theme `Rừng sáng`, `Chạng vạng`, `Đêm yên` dùng token độc lập, tương phản đầy đủ. Pine/Marten chỉ là một accent tĩnh hoặc motion ngắn có thể giảm; không dùng confetti, badge hay progress bar năng suất.

## Audio

- Preset hoặc YouTube URL do user dán.
- Validate URL trước khi tạo iframe; player chỉ được khởi tạo và phát sau user action.
- Có loading, unavailable, blocked và mute states.
- Không gửi URL, title video hoặc listening history tới API/analytics.

## Accessibility and responsive rules

- Native buttons, labels, focus indicator rõ, keyboard access cho mọi control.
- Timer/state có text; âm thanh không là thông báo bắt buộc.
- Mobile đặt timer và primary action trong viewport đầu; audio controls có thể thu gọn.
- `prefers-reduced-motion` tắt decorative animation.

## Layout and state specification

### Wide layout

Giữ task và timer trong cột đọc chính; controls Start/Pause/Done nằm liền sau timer. Theme/audio ở vùng secondary dưới controls; exit có text trong header. Không chia đôi màn hình trừ khi controls vẫn nằm trong reading order tự nhiên.

### Mobile layout

Trong viewport đầu: exit, task, timer và primary action. Audio/theme thu gọn dưới secondary controls; không che timer bằng player nổi. Tối thiểu 44px cho tap target thực tế.

### States

- **Ready:** Start là primary; duration có label rõ.
- **Running/paused:** state có text, timer cập nhật không chỉ bằng animation/màu.
- **Completed:** Done được xác nhận, sau đó mới mời tạo Open Seed hoặc quay lại Now.
- **Audio loading/blocked/unavailable:** inline alert có retry/close; timer và task controls không disabled.
- **Session save failure:** giữ outcome user chọn và cho retry, không kết luận task chưa/đã xong trái ý user.
