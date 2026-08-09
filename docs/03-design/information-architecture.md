# Information Architecture

- **Status:** Approved for research prototype
- **Version:** 0.2
- **Last updated:** 2026-08-09

## Primary navigation

1. **Now** — một next action, focus state và Recovery actions.
2. **Capture** — Brain Dump, AI clarification và user confirmation.
3. **Settings** — account, AI consent, data rights, language/timezone and support resources.

Không có Review, Growth, Habits, Goals, Notes hoặc Calendar ở navigation của prototype.

## Screen responsibilities

### Now

- One next action với thời lượng gợi ý 5–15 phút.
- Start, Done, Pause và “Vẫn bị kẹt”.
- Entry point tới Reset My Day và Return flow.
- Không hiển thị backlog, overdue count hoặc streak loss khi mở màn hình.

### Capture

- Composer brain dump tiếng Việt.
- Disclosure rằng AI chỉ đề xuất và cần user confirmation.
- Extracted items, clarification tối thiểu và một next-action suggestion.
- Manual fallback khi AI không khả dụng hoặc không có consent.

### Settings

- Consent AI và rút consent.
- Export/delete data.
- Profile, timezone, language, notification controls khi tính năng này được bật.
- Crisis/support resources; không có tính năng chẩn đoán.

## URL proposal

```text
/now
/capture
/capture/:id/confirm
/settings
/settings/privacy
/settings/data
```
