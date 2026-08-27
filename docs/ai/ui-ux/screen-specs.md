# Screen Specs

## Now

Priority: Return ritual → Open Seed → one next action → Capture. Default primary CTA is `Bắt đầu ngay`; when seed is open it becomes `Mở lại bước này`. Empty state explains there is no action and offers Capture. Recoverable fetch failure preserves local UI and offers retry.

## Focus Room

Header has exit with text; body has task then timer; actions are Start/Pause/Đã xong with `Vẫn bị kẹt` secondary. Theme/audio sit after task controls. Running state announces status text; audio loading/blocked/unavailable is inline and never disables timer.

## Open Seed

After completion, primary choice is `Lưu một điểm vào lần sau`; alternatives are skip or dismiss existing seed. Confirm saved state in the card, not only a toast. One open seed only; replacement explains what changes.

## Reminder settings

Initial state is disabled. Label timezone and use a normal checkbox/switch with text. Show at most two slots. Save error stays near slots and keeps selections. Disable is direct and confirms durable state.

## Return ritual

Dialog/page heading: `Mừng bạn quay lại.` Actions: Start fresh, open seed if present, check-in. Do not show overdue count, absence duration, streak or backlog. API failure exposes normal Now/Capture fallback.

## Weekly letter

Show only with sufficient facts. Order: facts → observation → evidence → optional experiment → feedback. Feedback has `Hữu ích`/`Chưa đúng`, selected state and success/error text. Insufficient facts explains when a letter may become available without promising a date.
