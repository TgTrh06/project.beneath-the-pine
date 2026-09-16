# Pine Assistance Training Workspace

This directory contains reproducible, data-safe material for a Vietnamese Pine Assistance model. The model is intended only to suggest a small start, a stuck-recovery step or a draft Open Seed; it is not a general chatbot.

Read [ML governance](../docs/05-machine-learning/README.md) before creating a dataset, training an adapter or serving an artifact.

## Assets

- `configs/qlora-v1.yaml`: baseline experiment configuration.
- `scripts/validate_dataset.py`: schema/provenance validation.
- `scripts/split_dataset.py`: deterministic split generation.
- `scripts/generate_local_synthetic_dataset.py`: local fictional fixture generator.
- Dataset/model card templates: release evidence, not deployment authorization.

## Privacy boundary

Private training data stays in `ml/data/private/` and is excluded from Git. Never train on raw production intentions, Open Seeds, Circle data, user messages, transcripts or scraped text. Record only aggregate counts and checksums in committed documentation.

`services/inference-service/` can serve reviewed local artifacts later, but a training run does not authorize API integration or production use.
