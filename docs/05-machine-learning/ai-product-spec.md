# Pine Assistance — Product Specification

- **Status:** Future capability; not MVP

## Purpose

Pine Assistance reduces activation friction inside the Pine ritual. It appears only after a user asks for help and never replaces their decision.

## Capabilities

| Capability | Input | Valid output | User control |
| --- | --- | --- | --- |
| `assisted_start` | Private description of current work and optional duration | One concrete 3–10 minute activation step plus manual fallback | Edit, accept or dismiss |
| `stuck_recovery` | Current private step and selected stuck mode | One smaller/reversible step or short break | Edit, accept or dismiss |
| `open_seed_draft` | User-provided check-out context | One short private restart sentence | Edit, save or discard |

## Boundaries

- No free-form conversation, diagnosis, therapy, clinical advice, crisis counselling or productivity scoring.
- No model access to other Circle members' intention, seed, presence history or private profile.
- No automatic persistence, pact creation, notification or social message.
- Manual solo/Circle flows remain usable when AI is absent, rejected, slow or invalid.
