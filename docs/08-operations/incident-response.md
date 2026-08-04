# Incident Response

- **Status:** Baseline

## Severity

- **SEV-0:** Lộ/cross-user data, mất dữ liệu diện rộng, AI safety critical.
- **SEV-1:** Core workflow/auth down, delete/export sai, lỗi ảnh hưởng nhiều user.
- **SEV-2:** Degraded performance hoặc feature phụ lỗi.
- **SEV-3:** Lỗi nhỏ/cosmetic.

## Process

1. Detect và mở incident record.
2. Assign incident commander.
3. Contain: disable feature flag/key/provider nếu cần.
4. Preserve relevant logs không thu thêm dữ liệu không cần thiết.
5. Communicate theo cadence.
6. Recover và verify.
7. Post-incident review không đổ lỗi.
8. Theo dõi corrective actions.

## Incident record

- Timeline.
- Impact và affected data/users.
- Root/contributing causes.
- Containment/recovery.
- Notification/legal assessment.
- Corrective actions, owner, deadline.

## AI-specific containment

- Disable capability bằng feature flag.
- Pin về prompt/model release trước.
- Preserve prompt version, model và request metadata đã redacted.
- Bổ sung failure vào eval set trước khi bật lại.

