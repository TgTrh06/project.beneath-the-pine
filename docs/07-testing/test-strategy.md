# Test Strategy

- **Status:** Baseline
- **Target:** MVP private beta

## Test layers

### Unit

- Domain rules, state transitions, date/timezone logic.
- AI output validators và evidence checks.
- Consent feature gating.

### Integration

- API + database.
- Auth/ownership.
- Migrations.
- AI provider adapter với recorded/synthetic fixtures.
- Export/delete workflow.

### End-to-end

- Onboarding/consent.
- Brain Dump → confirm → start.
- Help Me Start.
- Reset My Day.
- Return flow.
- Weekly Review feedback.

### Non-functional

- Accessibility: automated + keyboard/screen reader smoke test.
- Performance: key API và AI latency.
- Security: dependency, secrets, authz và basic abuse cases.
- Privacy: log inspection và analytics payload tests.
- AI evaluation: schema, quality, safety, regression.

## Test data

- Synthetic by default.
- Không copy production database.
- Vietnamese, mixed-language và timezone edge cases.
- Clock control cho daily/weekly logic.

## CI gates

- Lint/typecheck/unit/integration/build.
- API contract validation.
- Migration check.
- Secret/dependency scan.
- AI offline eval cho prompt changes.

## Release gates

- 0 open P0/P1.
- Critical E2E pass trên staging.
- AI thresholds pass.
- Export/delete smoke test.
- Backup/restore gần nhất pass.
- Monitoring và rollback sẵn sàng.

