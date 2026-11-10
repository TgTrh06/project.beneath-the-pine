# Pyneath Assistance Dataset Specification

- **Status:** Data completion workflow approved 2026-11-09; human review pending.
- **V2 implementation:** Original 1,500 development candidates retained. Separate review workspace contains 1,510 candidates (10 added recovery boundary/challenge cases); 80 rows edited for a 90-row calibration batch. Zero human approvals; independent 300-case holdout still requires an author. See [v2 dataset card](../../ml/dataset-card.pyneath-assistance-vi-v2.md), [review workflow](dataset-review.md), [holdout brief](holdout-authoring-brief.md) and [freeze procedure](local-ai-runbook.md).

The approved completion target is 1,500 selected development rows (500/capability: 350 ordinary, 75 boundary, 75 challenge), plus 300 independently authored final rows (100/capability: 70/15/15). Candidate count is not accepted dataset size. Development split stays approximately 80/20 by group with seed 20261029; never split variants to force exact counts. Coverage targets are design choices for this experiment, not guarantees of model quality.

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

`local-synthetic-v0` remains a local pipeline artifact. Its `brain_dump` rows are not production training material for Pyneath Assistance. Its `help_me_start` rows may be retained only after capability mapping, substantive Vietnamese rewrite and new review; no row transfers automatically.
