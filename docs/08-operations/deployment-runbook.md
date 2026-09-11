# Deployment Runbook

- **Status:** Baseline; production release remains manually approved
- **Last updated:** 2026-09-09

## Pre-deploy

- [ ] Scope, owner and target environment are explicit.
- [ ] `pnpm lint`, `pnpm test`, `pnpm build` and `services/mvnw verify` pass for the release commit.
- [ ] Staging smoke checks pass for changed flows.
- [ ] Every database migration has been reviewed and ordered for backward compatibility.
- [ ] Backup/PITR health is confirmed before a production data change.
- [ ] AI evaluation passes when a prompt, model or output contract changes.
- [ ] Rollback or forward-fix path is written down.
- [ ] Logs and provider dashboards are available during the release.

## Deploy order

1. Record the commit, release owner and start time.
2. Apply backward-compatible database migrations as a controlled step when present.
3. Deploy the Java Core Service through the separately approved provider and verify `/actuator/health/readiness`.
4. Deploy the Vercel web build after compatible API behavior is available.
5. Enable any feature flag gradually.
6. Run smoke checks with synthetic or designated tester data.

Do not run a migration merely because an application process starts. Do not deploy from an unrecorded local build.

## Additional gates while rebuilding Java business slices

1. Deploy the Java service without public routing and verify health/readiness.
2. Apply only backward-compatible, service-owned migrations.
3. Run contract, session/CSRF, ownership and synthetic workflow checks against Java.
4. Confirm exactly one writer for every migrated entity.
5. Expose routing for the approved slice only.
6. Observe errors, latency, traces and data consistency through the agreed window.
7. Roll back the Java artifact or disable the incomplete route if the slice fails; the removed Node.js API is not a live fallback.

## Additional gates for Redis and RabbitMQ

- Prove the core path's Redis/broker degradation behavior before enabling dependency use.
- Verify RabbitMQ publisher confirms, queue bindings, retry limits and DLQ alerts.
- Start consumers with controlled concurrency and graceful shutdown.
- Drain or preserve durable jobs before rolling a consumer version back.
- Do not replay a DLQ until the cause is fixed and the replay is recorded.

## Post-deploy checks

- Authentication and member authorization.
- Manual next-action creation and focus-session lifecycle.
- Synthetic Brain Dump extraction and Help Me Start fallback.
- Consent revocation blocking AI use.
- Purge job configuration when lifecycle behavior changed.
- Error rate, latency, database pressure and AI-provider failures.

## Rollback triggers

- Authentication or the core focus loop is unavailable.
- Cross-user access, privacy exposure or a security invariant fails.
- Error rate or latency exceeds the release threshold.
- A critical AI safety regression appears.
- A migration corrupts, loses or makes user data inaccessible.

Roll back application artifacts when compatible. Prefer a reviewed forward migration over reversing a destructive schema change. Disable an optional provider or feature flag before taking the core focus path offline.

## Release record

Record the version/commit, timestamps, owner, migration IDs, feature flags, smoke results, observed metrics and any incident or follow-up link.
