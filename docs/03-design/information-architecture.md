# Information Architecture

- **Status:** Draft
- **Version:** 0.1

## Primary navigation

1. **Now** — một next action và trạng thái hiện tại.
2. **Capture** — brain dump và inbox chưa làm rõ.
3. **Review** — end-of-session, weekly review và experiments.
4. **Growth** — vòng sinh trưởng và insight lịch sử; có thể ẩn trong MVP sớm.
5. **Settings** — profile, consent, data, notification, accessibility.

## Now screen

- Current next action.
- Start button và ước lượng thời gian.
- “Tôi bị kẹt”.
- “Kế hoạch hôm nay đã vỡ”.
- Secondary queue được thu gọn.

## Capture

- Brain dump composer.
- Pending clarifications.
- Extracted items chờ xác nhận.
- Archive/raw input theo retention policy.

## Review

- Session check-in.
- Weekly facts.
- AI observation/hypothesis/evidence.
- Insight feedback.
- Current weekly experiment.

## Settings

- AI disclosure và consent.
- Export/delete.
- Notification controls.
- Timezone/language.
- Crisis/support resources.

## URL proposal

```text
/now
/capture
/capture/:id/review
/review
/review/:week
/growth
/settings
/settings/privacy
/settings/data
```

