# Pyneath Assistance — Product Specification

- **Status:** Three-capability local-provider implementation behind disabled-by-default flags. OpenAI preview supports the original two capabilities. No v2 model has passed release gates.

## Purpose

Pyneath Assistance reduces activation friction inside the Pyneath ritual. It appears only after a user asks for help and never replaces their decision.

## Capabilities

| Capability | Input | Valid output | User control |
| --- | --- | --- | --- |
| `assisted_start` | Private description of current work and optional duration | One concrete 3–10 minute activation step plus manual fallback | Edit, accept or dismiss |
| `stuck_recovery` | Current private step and selected stuck mode | One smaller/reversible step or short break | Edit, accept or dismiss |
| `open_seed_draft` | User-provided check-out context | One short private restart sentence | Edit, save or discard |

The local provider implements contracts for all three capabilities; `stuck_recovery` accepts the current step and one of four stuck modes, then offers an editable step or an explicitly accepted two-minute break. Its UI appears only when runtime configuration advertises support. The start suggestion's 3/5/10-minute estimate describes the suggested action; it does not change the selected Focus duration of 5/10/25/50 minutes. Training, human review and actual-model evaluation remain outstanding; see [local AI runbook](local-ai-runbook.md).

## Boundaries

- No free-form conversation, diagnosis, therapy, clinical advice, crisis counselling or productivity scoring.
- No model access to other Circle members' intention, seed, presence history or private profile.
- No automatic persistence, pact creation, notification or social message.
- Manual solo/Circle flows remain usable when AI is absent, rejected, slow or invalid.
