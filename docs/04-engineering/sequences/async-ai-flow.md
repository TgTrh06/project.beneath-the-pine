# Asynchronous AI Flow

- **Status:** Approved target; implementation not started

```mermaid
sequenceDiagram
    actor U as User
    participant W as Web
    participant G as Gateway
    participant C as Core Service
    participant DB as Core DB
    participant Q as RabbitMQ
    participant A as AI Worker
    participant M as Model Provider
    participant R as Redis

    U->>W: Request Help Me Start
    W->>G: POST /tasks/{id}/ai-jobs
    G->>C: Forward identity and correlation context
    C->>C: Check ownership, consent and quota
    C->>DB: Create job reference and outbox command atomically
    C-->>G: 202 Accepted and jobId
    G-->>W: jobId
    C->>Q: ai.generate-next-step.v1
    Q->>A: Deliver command
    A->>A: Deduplicate messageId
    A->>M: Generate structured result
    M-->>A: Provider output
    A->>A: Validate schema and safety
    A->>DB: Persist result reference/status
    A->>R: Cache expiring progress
    A->>Q: ai.job-completed.v1
    A-->>Q: Acknowledge
    W->>G: GET /ai-jobs/{jobId}
    G->>A: Read authorized job status
    A-->>G: Completed result
    G-->>W: Safe suggested step
```

If RabbitMQ is unavailable, the outbox retains the command. If the provider is unavailable, the worker applies bounded retry and then records a safe failure or deterministic fallback. Redis loss cannot erase job state.
