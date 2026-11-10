# Pyneath Assistance Training Workspace

This directory contains reproducible, data-safe material for a Vietnamese Pyneath Assistance model. The model is intended only to suggest a small start, a stuck-recovery step or a draft Open Seed; it is not a general chatbot.

Read [ML governance](../docs/05-machine-learning/README.md) before creating a dataset, training an adapter or serving an artifact.

## Assets

- `notebooks/pyneath-qlora-colab.ipynb`: private Colab workflow, mandatory smoke run and reviewed-data gate.
- `common/`: protocol, dataset/review validation, checksum/file I/O, approved config, frozen manifests, checkpoint identity/publication and redirect policy. This layer does not import training, evaluation, export or GPU libraries.
- `authoring/`: unreviewed candidate generation, separate from training and CLI parsing.
- `training/`: environment preflight, assistant-only token masking and the QLoRA workflow. Resume uses the same `common/checkpoints.py` verifier as scoring and export.
- `scripts/prepare_v2.py` and `scripts/draft_v2.py`: review candidates, strict validation and manifest freeze; never fabricate human approval.
- `scripts/review_dataset.py`: immutable local review snapshots, content-bound human forms, revisions, coverage/duplicate audit, cached-tokenizer check and reviewed handoff before freeze. See [Vietnamese reviewer guide](../docs/05-machine-learning/dataset-review.md). Calibration is prepared; human approval and independent holdout authorship are still missing.
- `evaluation/`: baseline/adapter/GGUF predictions, blind review, scoring and candidate selection.
- `export/`: exact-base merge, GGUF conversion and evidence-bound promotion; no deployment.
- CLI modules retain their documented names and arguments and call implementation modules (`workflow`, `predictions`, `scoring`, `measurement`, `selection`, `review`, `conversion`, `promotion`). Implementations never import CLI entry points.
- `scripts/check_boundaries.py`: AST import ownership and cycle checks, exercised by negative fixtures in `tests/test_architecture.py` and CI.
- `dataset-card.pyneath-assistance-vi-v2.md`: current draft status and outstanding author/reviewer work.

- `dataset-card.pyneath-assistance-vi-v1.md`: 80,000-row **unreviewed** Vietnamese Assistance draft, coverage, checksums and measured limitations.
- `scripts/generate_pyneath_dataset.py`: reproducible generation from private authoring banks; refuses overwriting existing artifacts.
- `common/v1_dataset.py`: strict Assistance v1 validation and family-level split logic. The existing `scripts/validate_dataset.py --require-reviewed` command still rejects the current draft. Legacy fixture validation lives in `common/legacy_validation.py`; both generations keep their original contracts.
- `scripts/audit_pyneath_dataset.py`: full exact/group checks and a bounded, disclosed near-duplicate sample.
- `scripts/validate_pyneath_contract.cjs`: validates every row against the actual repository Zod contracts using existing dependencies.
- `scripts/test_pyneath_dataset.py`: focused validation, review-gate and split-isolation tests.
- `configs/qlora-v1.yaml`: baseline experiment configuration.
- `scripts/validate_dataset.py`: schema/provenance validation.
- `scripts/split_dataset.py`: deterministic split generation.
- `scripts/generate_local_synthetic_dataset.py`: local fictional fixture generator.
- Dataset/model card templates: release evidence, not deployment authorization.

The v1 dataset is at `ml/data/private/pyneath-assistance-vi-v1/`, with 64,000/8,000/8,000 train/validation/test rows, an 800-row review sample, source register and quality reports. Its 80,000 rows are compositional expansions of 80 task families and 800 task–target pairs, not independently authored examples. It remains unchanged. `train_colab.py` now forwards to the v2 pipeline and requires a reviewed frozen manifest and durable checkpoint store. Successful file loading is not a governance gate.

## Privacy boundary

Private training data stays in `ml/data/private/` and is excluded from Git. Never train on raw production intentions, Open Seeds, Camp data, user messages, transcripts or scraped text. Record only aggregate counts and checksums in committed documentation.

`services/inference-service/` can serve reviewed local artifacts later, but a training run does not authorize API integration or production use.
