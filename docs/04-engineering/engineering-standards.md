# Engineering Standards

## Required checks

- Format, lint, typecheck, unit test, integration test, build.
- Dependency/security scanning theo CI.
- Migration được review và có rollback/forward-fix plan.

## Code principles

- Domain logic không phụ thuộc trực tiếp AI SDK.
- Provider integrations nằm sau interface/adapter.
- Input validation tại API boundary.
- Explicit error types; không nuốt lỗi.
- Structured logging với request ID.
- Không log raw brain dump, reflection hoặc token auth.
- Feature flag cho workflow AI mới.

## Review checklist

- Scope đúng PRD/acceptance criteria.
- Authorization/ownership.
- Privacy và retention.
- Error/loading/timeout behavior.
- Test regression.
- Docs/API/ADR được cập nhật.

