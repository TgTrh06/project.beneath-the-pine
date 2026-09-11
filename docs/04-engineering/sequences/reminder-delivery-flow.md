# Reminder Delivery Flow

- **Status:** Conditional future design; not an approved infrastructure sequence

Gateway, Redis, RabbitMQ and separate workers below are illustrative participants from the earlier distributed design. They are not dependencies required to build the shared NestJS/Drizzle API. Review [Architecture Options](../architecture-options.md) before implementing this flow.

```mermaid
sequenceDiagram
    participant S as Engagement Scheduler
    participant R as Redis
    participant E as Engagement DB
    participant Q as RabbitMQ
    participant N as Notification Worker
    participant P as Delivery Provider
    participant NDB as Notification DB

    S->>R: Acquire expiring scheduler lock
    S->>E: Find eligible opted-in slots
    S->>E: Create delivery intent and outbox command
    S->>Q: reminder.deliver.v1
    Q->>N: Deliver command
    N->>NDB: Deduplicate message and delivery ID
    N->>E: Confirm preference remains enabled
    alt disabled or revoked
        N->>NDB: Mark cancelled
        N-->>Q: Acknowledge
    else still allowed
        N->>P: Send approved template
        P-->>N: Provider result
        N->>NDB: Record minimal delivery metadata
        N->>Q: reminder.delivered.v1
        N-->>Q: Acknowledge
    end
```

Preference is checked again at delivery time. A queued message never overrides opt-out. Transient provider failures use bounded retry; permanent or exhausted failures enter a DLQ without message body or private user content.
