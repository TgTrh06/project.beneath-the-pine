# Deployment Runbook

- **Status:** Template

## Pre-deploy

- [ ] Release scope và owner rõ ràng.
- [ ] CI green.
- [ ] Staging smoke/E2E pass.
- [ ] Database migration reviewed.
- [ ] Backup/PITR healthy.
- [ ] AI eval pass nếu prompt/model thay đổi.
- [ ] Rollback hoặc forward-fix plan.
- [ ] Monitoring dashboard mở sẵn.

## Deploy

1. Ghi release version/commit.
2. Chạy migration theo thứ tự tương thích ngược.
3. Deploy server rồi client theo kế hoạch.
4. Bật feature flag theo từng bước nếu cần.
5. Chạy smoke tests.

## Post-deploy checks

- Auth/login.
- Tạo manual task.
- Brain dump synthetic → extraction.
- Help Me Start.
- Consent revoke blocks AI.
- Error rate, latency, DB và AI cost.

## Rollback triggers

- Auth/core loop không hoạt động.
- Error rate vượt ngưỡng đã định.
- Cross-user/privacy/security issue.
- AI critical safety regression.
- Migration gây mất hoặc sai dữ liệu.

## Record

- Version, thời gian, người deploy.
- Migration IDs.
- Feature flags.
- Kết quả smoke test.
- Incident/link follow-up nếu có.

