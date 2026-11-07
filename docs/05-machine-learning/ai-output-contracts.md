# Pyneath Assistance Output Contracts

Responses are validated at the API boundary before reaching a client. The model is never trusted to select a database action.

```ts
type AssistanceOutput = {
  capability: "assisted_start" | "open_seed_draft" | "stuck_recovery";
  version: string;
  needsHumanSupport: boolean;
  message?: string;
  activationStep?: string;
  openSeedDraft?: string;
  estimatedMinutes?: 3 | 5 | 10;
  recoveryAction?: "smaller_step" | "different_approach" | "take_break";
  recoveryStep?: string;
  breakMinutes?: 2;
  fallback: "manual_step" | "take_break" | "stop_and_return";
};

type AssistanceResponse = {
  status: "suggestion" | "fallback" | "boundary";
  output: AssistanceOutput;
  suggestionId?: string; // UUID, only when status is suggestion
};
```

Rules:

- Recovery request: `currentStep` (1–280 trimmed characters), `stuckMode` (`too_large`, `unclear_next_step`, `distracted`, `low_energy`). Step suggestions contain `recoveryAction` + `recoveryStep`, with `fallback=manual_step`. Break suggestions contain `recoveryAction=take_break`, `breakMinutes=2`, `fallback=take_break`, and no step text. No duration, Seed or activation fields are accepted on recovery outputs.
- Authenticated `GET /api/v1/me/assistance/config` exposes only `enabled`, `capabilities` and `processing` (`disabled`, `self_hosted`, `external`). Local advertises all three tasks; OpenAI advertises the two original tasks. No inference address/token is returned.

- Exactly one actionable suggestion; no task list, deadline, rank or claim of completion.
- Text is concise, Vietnamese, non-judgmental and free of medical inference.
- `needsHumanSupport` suppresses productivity coaching and returns a predefined boundary response.
- Schema failure, timeout, invalid duration or unsafe text returns a stable manual fallback, not model text.
- The demo uses version `1`. `assisted_start` suggestions contain `activationStep` and `estimatedMinutes`; `open_seed_draft` suggestions contain `openSeedDraft`. Fallback and boundary responses contain only a predefined `message`. The API rejects any extra request fields.
