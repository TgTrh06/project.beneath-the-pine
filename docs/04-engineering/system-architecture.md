# System Architecture — Focus & Gentle Retention

- **Status:** Approved for private beta
- **Last updated:** 2026-08-27

```text
React/Vite web
  ├─ Now, Capture, Focus Studio, Settings, Progress
  └─ local-only theme/audio preference
        │ authenticated REST
Fastify API
  ├─ identity / capture / task / engagement / reflection modules
  ├─ bootstrap derives return state
  └─ analytics and reminder-job adapter boundary
        │
PostgreSQL + Drizzle + Supabase RLS
```

## Engagement boundary

Engagement owns server-side preferences, reminder slots, Open Seeds and feedback. It reads focus/events to derive return eligibility and weekly facts, but does not own task content. The web owns local theme/audio URL. A future outbound provider sits behind an adapter and is not enabled in private beta.

## Data flow safeguards

Authorization occurs before module use cases; RLS protects all user rows. Raw content remains encrypted/excluded from analytics. The reminder job re-checks opt-in and uses slot/window idempotency. Full contracts and slices: [`../ai/retention/`](../ai/retention/README.md).
