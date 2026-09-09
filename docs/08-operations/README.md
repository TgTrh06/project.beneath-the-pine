# 08 — Operations

This section defines how the web and Java foundation—and the approved Redis/RabbitMQ target—are built, deployed, observed and recovered.

## Documents

- [Infrastructure Plan](infrastructure-plan.md)
- [CI/CD](ci-cd.md)
- [Deployment Runbook](deployment-runbook.md)
- [Observability](observability.md)
- [Backup and Recovery](backup-and-recovery.md)
- [Incident Response](incident-response.md)

The current repository configures Vercel for the web client and retains Supabase for PostgreSQL and identity. The Java backend has no selected production provider or active deployment. Redis and RabbitMQ are approved target categories but are not implemented. Provider selection, credentials and production rollout require separate review and authorization.
