# Event and Command Catalog

- **Status:** Initial target contract catalog
- **Last updated:** 2026-09-09

The catalog names planned integration messages. It does not imply that RabbitMQ, publishers or consumers are implemented.

## Commands

| Message | Producer | Consumer | Minimum payload | Idempotency key |
| --- | --- | --- | --- | --- |
| `ai.generate-brain-dump.v1` | Core | AI Worker | job ID, content reference, prompt version | job ID |
| `ai.generate-next-step.v1` | Core | AI Worker | job ID, task/action reference, prompt version | job ID |
| `ai.generate-weekly-review.v1` | Engagement | AI Worker | job ID, evidence reference, prompt version | job ID |
| `engagement.evaluate-return.v1` | Scheduler/Core | Engagement | user ID, evaluation timestamp | user + evaluation window |
| `reminder.deliver.v1` | Engagement | Notification Worker | delivery ID, channel, template key | delivery ID |
| `account.purge-owned-data.v1` | Core | Each owning service | deletion request ID, user ID | request + service |

## Events

| Message | Producer | Consumers | Minimum payload |
| --- | --- | --- | --- |
| `focus.session-started.v1` | Core | Engagement, Analytics | session ID, user ID, timestamp |
| `focus.session-completed.v1` | Core | Engagement, Analytics | session ID, user ID, completion time, duration |
| `focus.seed-created.v1` | Engagement | Core projection/Analytics if approved | seed ID, user ID, status, timestamp |
| `user.consent-revoked.v1` | Core | AI, Engagement, Notification | user ID, consent category, timestamp |
| `user.reminder-disabled.v1` | Engagement | Notification | user ID, effective timestamp |
| `ai.job-completed.v1` | AI Worker | Core or Engagement requester | job ID, requester, result reference, model/prompt version |
| `ai.job-failed.v1` | AI Worker | Core or Engagement requester | job ID, recoverable flag, safe failure code |
| `reminder.delivered.v1` | Notification | Engagement | delivery ID, provider status, timestamp |
| `reminder.delivery-failed.v1` | Notification | Engagement/Operations | delivery ID, safe failure code, terminal flag |
| `account.deletion-requested.v1` | Core | Engagement, AI, Notification | deletion request ID, user ID, deadline |
| `account.service-data-purged.v1` | Owning service | Core deletion coordinator | deletion request ID, service, timestamp |

## Contract rules

- IDs are opaque UUIDs; timestamps are ISO-8601 UTC.
- Payloads contain the minimum fact needed by consumers.
- Schema validation happens before publishing and before handling.
- Producers own compatibility; consumers do not infer fields from message names.
- Analytics receives only approved metadata and never raw private content.
- Account deletion is a coordinated saga with observable completion; it is not a best-effort broadcast.
