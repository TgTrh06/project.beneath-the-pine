# Release Checklist

## Product

- [ ] Scope khớp PRD và release notes.
- [ ] Feature flags/config được ghi lại.
- [ ] Copy/disclosure đúng version.

## Quality

- [ ] CI và staging E2E pass.
- [ ] Không có P0/P1 mở.
- [ ] Accessibility smoke test pass.
- [ ] AI eval/safety pass nếu liên quan.

## Security/privacy

- [ ] Authorization regression tests pass.
- [ ] Log/analytics payload được kiểm tra.
- [ ] Consent/export/delete hoạt động.
- [ ] Dependency/security scan reviewed.

## Operations

- [ ] Migration và rollback/forward-fix plan.
- [ ] Backup healthy.
- [ ] Dashboard/alerts hoạt động.
- [ ] On-call/release owner sẵn sàng.
- [ ] Deployment runbook hoàn tất.

## Post-release

- [ ] Smoke checks pass.
- [ ] Theo dõi metrics trong cửa sổ release.
- [ ] Release notes công bố.
- [ ] Issues/follow-up có owner.

