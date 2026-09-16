# Pine Assistance Output Contracts

Responses are validated at the API boundary before reaching a client. The model is never trusted to select a database action.

```ts
type AssistanceOutput = {
  capability: "assisted_start" | "stuck_recovery" | "open_seed_draft";
  version: string;
  needsHumanSupport: boolean;
  message?: string;
  activationStep?: string;
  openSeedDraft?: string;
  estimatedMinutes?: 3 | 5 | 10;
  fallback: "manual_step" | "take_break" | "stop_and_return";
};
```

Rules:

- Exactly one actionable suggestion; no task list, deadline, rank or claim of completion.
- Text is concise, Vietnamese, non-judgmental and free of medical inference.
- `needsHumanSupport` suppresses productivity coaching and returns a predefined boundary response.
- Schema failure, timeout, invalid duration or unsafe text returns a stable manual fallback, not model text.
