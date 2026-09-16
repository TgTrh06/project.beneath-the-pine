# Training Runbook

## Approved training shape

Use the existing QLoRA configuration as an experiment baseline: `Qwen/Qwen2.5-1.5B-Instruct`, deterministic split, pinned config and recorded seed. A run creates a new adapter artifact; it does not authorize serving it.

## Procedure

1. Validate private dataset with `ml/scripts/validate_dataset.py`.
2. Generate/freeze train-validation-test splits by `scenario_id`.
3. Record dataset SHA-256, config revision, base model revision, license and owner.
4. Run SFT/QLoRA in an isolated environment; store artifact outside Git.
5. Evaluate base model and adapter on the same frozen holdout.
6. Complete model card, safety review and local inference smoke test.
7. Request a separate implementation approval before registering an adapter for API use.

Never use production traffic as training input or silently replace a served model.
