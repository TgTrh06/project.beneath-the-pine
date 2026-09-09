# Gentle Return Flow — Sequence Diagrams

- **Related capabilities:** `T2-SEED-01`, `T2-RETURN-01`, `T2-RETURN-02`, `T2-REMINDER-01`, `T2-EVENTS-01`, `T4-REFLECT-01`

## 1. Complete focus and leave an Open Seed

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Focus Room
    participant API as Engagement API
    participant DB as Database
    participant E as Product Events

    W-->>U: Show completed state and optional seed action
    alt User saves a seed
        U->>W: Enter or confirm prompt
        W->>API: PUT current Open Seed
        API->>API: Authorize, validate 280 characters, sanitize
        API->>DB: In one transaction dismiss old open seed and create new seed
        API->>E: Record open_seed_created without prompt
        API-->>W: Current open seed
        W-->>U: Confirm saved state in the page
    else User skips
        U->>W: Skip for now
        W-->>U: Return to Now without penalty
    end
```

## 2. Bootstrap and Return Ritual

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Web App
    participant API as Bootstrap API
    participant DB as Database
    participant E as Product Events

    U->>W: Open application
    W->>API: GET current-user bootstrap
    API->>DB: Read profile timezone, open seed and last core event
    API->>API: Derive return eligibility in user timezone
    API-->>W: Now state, open seed and return eligibility
    alt Return eligible
        W-->>U: Show Welcome back with three choices
        W->>E: Record return_flow_started without absence duration
        alt Open Seed
            U->>W: Open saved seed
            W->>API: Mark seed opened
            API->>DB: Transition open to opened idempotently
            API->>E: Record open_seed_opened
            API-->>W: Action-ready state
        else Start fresh
            U->>W: Start fresh
            W-->>U: Open Capture
        else Check in
            U->>W: Check in
            W-->>U: Open minimal check-in
        end
        W->>E: Record return_flow_completed with selected path enum
    else Not eligible
        W-->>U: Show normal Now state
    end

    opt Bootstrap fails
        API--xW: Recoverable error
        W-->>U: Preserve local shell and offer Now or Capture retry
    end
```

## 3. Configure and disable an in-app reminder

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Settings
    participant API as Engagement API
    participant DB as Database
    participant E as Product Events

    U->>W: Enable reminders and select timezone-aware slots
    W->>API: PUT preferences and up to two slots
    API->>API: Verify identity, timezone and slot limit
    API->>DB: Save preference and slots atomically
    API->>E: Record reminder_preference_enabled without local time detail
    API-->>W: Durable enabled state
    W-->>U: Show enabled state and timezone

    U->>W: Disable reminders
    W->>API: PUT reminders_enabled false
    API->>DB: Disable preference immediately
    API->>E: Record reminder_preference_disabled
    API-->>W: Durable disabled state
    W-->>U: Confirm disabled state
```

## 4. Evaluate an in-app reminder

```mermaid
sequenceDiagram
    autonumber
    participant Scheduler as In-app evaluator
    participant DB as Database
    participant W as Web App
    participant E as Product Events
    actor U as User

    Scheduler->>DB: Read enabled slots, timezone and delivery window
    Scheduler->>Scheduler: Build slot-window idempotency key
    Scheduler->>DB: Re-check enabled state and prior delivery
    alt Eligible and not delivered
        Scheduler->>DB: Record minimal delivery metadata
        Scheduler-->>W: Expose reminder in bootstrap state
        W->>E: Record reminder_shown
        W-->>U: Show quiet re-entry invitation
        opt User opens reminder
            U->>W: Open
            W->>E: Record reminder_opened
            W-->>U: Show Open Seed or Capture
        end
    else Disabled, outside window or duplicate
        Scheduler-->>Scheduler: No delivery
    end
```

## 5. Weekly Letter with evidence

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant W as Review
    participant API as Reflection API
    participant DB as Database
    participant AI as Insight generator
    participant E as Product Events

    U->>W: Open Weekly Letter
    W->>API: GET current weekly letter
    API->>DB: Query aggregate verified facts
    alt Insufficient facts
        API-->>W: Not enough evidence state
        W-->>U: Explain availability without promising a date
    else Sufficient facts
        API->>AI: Generate observation from bounded facts
        AI-->>API: Observation, evidence references, optional experiment
        API->>API: Validate schema, evidence and safety
        API->>DB: Persist review without copying raw content into analytics
        API->>E: Record weekly_letter_shown
        API-->>W: Facts, observation, evidence and experiment
        W-->>U: Render letter and feedback controls
        U->>W: Mark useful or not accurate
        W->>API: POST feedback verdict
        API->>DB: Persist verdict idempotently
        API->>E: Record weekly_letter_feedback_submitted with verdict enum
        API-->>W: Feedback accepted
    end
```
