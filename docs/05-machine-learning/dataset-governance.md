# Dataset Governance

## Target composition

600 reviewed Vietnamese scenarios: 300 Brain Dump, 220 Help Me Start and 80 safety/adversarial cases. Each has a stable `scenario_id`, capability, difficulty, safety tags and input/output message pair.

## Rules

- No raw Brain Dump, task title, check-in, beta content, direct identifier, private message or unlicensed corpus enters training data.
- Generated drafts are allowed only as drafts; the owner reviews and rewrites them before inclusion.
- Store reviewed JSONL under `ml/data/private/`; Git tracks only safe fixtures, schema/config and the aggregate hash/count.
- Dataset changes require a new version, changelog and new baseline/eval run.

## Review checklist

The target must be grounded, Vietnamese-natural, non-judgmental, ≤10 minutes, non-medical, safe under adversarial input, and conform to the shared JSON contract.
