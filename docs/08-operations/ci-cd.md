# CI/CD

- **Status:** Baseline pipeline

## Pull request pipeline

1. Install với lockfile frozen.
2. Format check.
3. Lint.
4. Typecheck.
5. Unit/integration tests.
6. Build.
7. API/schema checks.
8. Secret/dependency scanning.
9. Preview environment nếu phù hợp.

## Main/staging pipeline

- Tất cả PR checks.
- Build immutable artifact.
- Apply staging migration có log.
- Deploy staging.
- Smoke E2E.

## Production pipeline

- Manual approval trong beta.
- Xác nhận backup và migration plan.
- Deploy artifact đã kiểm tra ở staging.
- Apply migration theo runbook.
- Smoke checks và metric watch.
- Rollback/forward-fix nếu vượt failure threshold.

## Rules

- Không deploy từ máy cá nhân.
- Không dùng `latest` tag cho artifact production.
- Environment secrets không xuất hiện trong logs.
- Prompt/model/config change phải có version và review như code.

