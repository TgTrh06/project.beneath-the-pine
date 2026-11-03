# Pyneath Assistance Training Workspace

This directory contains reproducible, data-safe material for a Vietnamese Pyneath Assistance model. The model is intended only to suggest a small start, a stuck-recovery step or a draft Open Seed; it is not a general chatbot.

Read [ML governance](../docs/05-machine-learning/README.md) before creating a dataset, training an adapter or serving an artifact.

## Assets

- `dataset-card.pyneath-assistance-vi-v1.md`: 80,000-row **unreviewed** Vietnamese Assistance draft, coverage, checksums and measured limitations.
- `scripts/generate_pyneath_dataset.py`: reproducible generation from private authoring banks; refuses overwriting existing artifacts.
- `scripts/pyneath_dataset.py`: strict Assistance v1 validation and family-level split logic. `validate_dataset.py --require-reviewed` rejects the current draft.
- `scripts/audit_pyneath_dataset.py`: full exact/group checks and a bounded, disclosed near-duplicate sample.
- `scripts/validate_pyneath_contract.cjs`: validates every row against the actual repository Zod contracts using existing dependencies.
- `scripts/test_pyneath_dataset.py`: focused validation, review-gate and split-isolation tests.
- `configs/qlora-v1.yaml`: baseline experiment configuration.
- `scripts/validate_dataset.py`: schema/provenance validation.
- `scripts/split_dataset.py`: deterministic split generation.
- `scripts/generate_local_synthetic_dataset.py`: local fictional fixture generator.
- Dataset/model card templates: release evidence, not deployment authorization.

The v1 dataset is at `ml/data/private/pyneath-assistance-vi-v1/`, with 64,000/8,000/8,000 train/validation/test rows, an 800-row review sample, source register and quality reports. Its 80,000 rows are compositional expansions of 80 task families and 800 task–target pairs, not independently authored examples. See its private README before training. The older training script does not automatically enforce the review validator; successful file loading is not a governance gate.

## Privacy boundary

Private training data stays in `ml/data/private/` and is excluded from Git. Never train on raw production intentions, Open Seeds, Camp data, user messages, transcripts or scraped text. Record only aggregate counts and checksums in committed documentation.

`services/inference-service/` can serve reviewed local artifacts later, but a training run does not authorize API integration or production use.
