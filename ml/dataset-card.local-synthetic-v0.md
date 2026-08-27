# Beneath Pine local synthetic dataset card v0

- **Dataset version:** `local-synthetic-v0`
- **Access:** private local files under `ml/data/private/`; excluded from Git
- **Permitted use:** local pipeline and model-behavior experiments only
- **Prohibited use:** production training, adapter release, deployment, or pilot use
- **Source restriction:** newly generated fictional Vietnamese scenarios only; no
  external corpus text, user content, identifier, private message, or beta content

## Composition

| Category | Count |
| --- | ---: |
| Core Brain Dump | 300 |
| Core Help Me Start | 220 |
| Safety/adversarial (assigned to a capability) | 80 |
| Total rows | 600 |
| Runtime capability totals | 340 `brain_dump`; 260 `help_me_start` |

Every row has `provenance_class: synthetic_draft_rewritten` and
`usage: draft/local-only`. Safety coverage includes self-harm, suicidal ideation,
medical boundary, violence, and prompt injection; it is fictional and intended to
exercise safe structured output, not provide clinical or crisis-training data.

## Files and integrity

| File | Rows | SHA-256 |
| --- | ---: | --- |
| `local-synthetic-v0.jsonl` | 600 | `ee36e6a4e6752d4d602fd3daa4630b1446eb23c47617e35205c43f145367d56b` |
| `local-synthetic-v0-splits/train.jsonl` | 420 | `e8155af28d706acf4e103066b9ff3ee8cd99b66859401db5405de18917104d6b` |
| `local-synthetic-v0-splits/validation.jsonl` | 90 | `0c2f90f86065e3c80876c51f72f649d10748638b8fe3979da485cf4818da3b14` |
| `local-synthetic-v0-splits/test.jsonl` | 90 | `460246b567b8a158a75a9a5262672d1800da34aa605050588c08f92c1ee6ca04` |

Splits are deterministic by `scenario_id`, capability-stratified, and created by
`ml/scripts/split_dataset.py` with seed `20260814`.

## Generation and review status

Generate the source artifact with:

```powershell
python ml/scripts/generate_local_synthetic_dataset.py
```

The generator is deterministic. It does not make network calls or read product
content. Before using any scenario beyond local experimentation, a Vietnamese
dataset owner must review, substantially rewrite, and approve it in accordance
with `docs/05-ai/dataset-governance.md`.
