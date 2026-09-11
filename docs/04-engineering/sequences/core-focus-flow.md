# Core Focus Flow — Sequence Diagrams

- **Related capabilities:** `T1-CAPTURE-01`, `T1-AI-01`, `T1-ACTION-01`, `T1-FOCUS-01`, `T1-STUCK-01`, `T1-EVENTS-01`

## 1. Brain Dump with manual recovery

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Web Capture
    participant API as Capture API
    participant Auth as Identity boundary
    participant AI as Growth Assistant
    participant DB as Database
    participant E as Product Events

    U->>W: Enter Brain Dump and submit
    W->>API: POST brain dump with consent context
    API->>Auth: Verify identity and beta/public access
    Auth-->>API: User identity
    API->>API: Validate input, consent and AI quota
    API->>AI: Request structured next-action suggestion
    alt Valid structured output
        AI-->>API: Suggested action and evidence
        API->>DB: Store encrypted source and pending suggestion
        API->>E: Record brain_dump_submitted without text
        API-->>W: Pending suggestion for confirmation
        W-->>U: Show edit, accept and reject controls
        U->>W: Edit or confirm one next action
        W->>API: Confirm next action
        API->>DB: Persist user-confirmed action
        API->>E: Record next_action_confirmed without title
        API-->>W: Confirmed action
    else AI unavailable, quota exhausted or schema invalid
        AI--xAPI: Recoverable failure
        API-->>W: Stable recovery code and preserved input
        W-->>U: Offer manual next-action field
        U->>W: Enter and confirm an action
        W->>API: Create manual action
        API->>DB: Persist confirmed manual action
        API-->>W: Confirmed action
    end
```

The API does not log Brain Dump or action text. A failed suggestion never removes the user's input or blocks manual progression.

## 2. Focus session lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Focus Room
    participant API as Task API
    participant DB as Database
    participant E as Product Events

    U->>W: Start confirmed next action
    W->>API: POST focus session
    API->>API: Authorize task ownership and validate state
    API->>DB: Create active focus session
    API->>E: Record start_event with IDs and timestamp
    API-->>W: Session ID and server start time
    W->>W: Run accessible local timer
    U->>W: Pause or resume
    W->>W: Update timer state
    Note over W,API: Persist pause detail only if product requirements need cross-device recovery
    alt User marks done
        U->>W: Select Done
        W->>API: Finish session with completed outcome
        API->>DB: Atomically close session and update action state
        API->>E: Record focus_completed without task text
        API-->>W: Completed outcome and optional Open Seed prompt
    else User exits
        U->>W: Exit Focus Room
        W-->>U: Confirm only if session state would be lost
        W->>API: Finish or abandon using explicit outcome
        API->>DB: Close session idempotently
        API-->>W: Durable outcome
    end
```

Client time drives display; server timestamps and state transitions provide durable session truth. Repeated finish requests return the same terminal result.

## 3. Still-stuck recovery

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Focus Room
    participant API as Task and Capture API
    participant AI as Growth Assistant
    participant DB as Database
    participant E as Product Events

    U->>W: Select Still stuck
    W->>API: Request smaller step for current action
    API->>API: Verify ownership, consent and quota
    API->>E: Record still_stuck without action text
    API->>AI: Request one smaller physical step
    alt Suggestion passes schema and safety validation
        AI-->>API: Smaller-step suggestion and evidence
        API-->>W: Editable suggestion
        W-->>U: Show accept, edit and skip
        U->>W: Confirm edited smaller step
        W->>API: Replace or add next action
        API->>DB: Persist user-confirmed action
        API-->>W: Confirmed smaller step
        W-->>U: Return to ready-to-start state
    else Suggestion fails
        AI--xAPI: Unavailable or invalid output
        API-->>W: Manual recovery response
        W-->>U: Ask for the smallest visible action in plain text
        U->>W: Enter manual step
        W->>API: Confirm manual step
        API->>DB: Persist user-confirmed action
        API-->>W: Confirmed smaller step
    end
```
