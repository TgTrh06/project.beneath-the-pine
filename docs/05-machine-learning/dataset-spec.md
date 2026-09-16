# Pine Assistance Dataset Specification

- **Status:** Proposed; target dataset for Pine Assistance

## Coverage

| Capability | Example coverage |
| --- | --- |
| `assisted_start` | vague goal, low energy, setup friction, avoidance, limited time, study/work/personal context |
| `stuck_recovery` | task too large, perfection fear, interruption, uncertainty, distraction, stop/restart decision |
| `open_seed_draft` | clear restart point, unfinished sentence, next material/tool, user correction/rejection |
| safety/adversarial | crisis/medical cues, coercion, illegal requests, prompt injection, personal-data request |

## Required metadata

`scenario_id`, capability, difficulty, safety tags, provenance class, dataset version and review status. No user IDs, Circle IDs, real deadlines or copied source text.

## Existing artifact migration

`local-synthetic-v0` remains a local pipeline artifact. Its `brain_dump` rows are not production training material for Pine Assistance. Its `help_me_start` rows may be retained only after capability mapping, substantive Vietnamese rewrite and new review; no row transfers automatically.
