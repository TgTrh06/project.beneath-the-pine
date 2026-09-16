# Private Focus Pact Realtime Flow

```mermaid
sequenceDiagram
  actor A as Creator
  actor B as Invitee
  participant API as API
  participant DB as PostgreSQL
  participant RT as Realtime Gateway
  A->>API: Create private pact
  API->>DB: Persist pact and invitations
  B->>API: Accept invitation
  API->>DB: Persist acceptance idempotently
  A->>API: Start pact
  API->>DB: Atomically create active session with server timestamps
  API->>RT: Broadcast durable snapshot to authorized participants
  RT-->>A: active/endsAt snapshot
  RT-->>B: active/endsAt snapshot
  B->>RT: Reconnect and join authorized session
  RT->>API: Fetch durable snapshot
  API-->>RT: Current state/timestamps
  RT-->>B: Resynchronised snapshot
  A->>API: Check out
  B->>API: Check out
  API->>DB: Close participant states; derive milestone if criteria hold
```
