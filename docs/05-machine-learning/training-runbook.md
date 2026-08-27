# Training Runbook — Beneath Pine AI v1

## Scope

Fine-tune `Qwen/Qwen2.5-1.5B-Instruct` using supervised QLoRA for two outputs only: Brain Dump Extraction and Help Me Start. Weekly Review remains deterministic/template based.

## Before a run

1. Review every scenario; synthetic examples need human approval before training.
2. Run `python ml/scripts/validate_dataset.py <private-jsonl>` and record the printed SHA-256 and aggregate counts.
3. Create deterministic train/validation/test files (70/15/15) by `scenario_id`; never move a test scenario into training.
4. Copy `ml/configs/qlora-v1.yaml` into the Colab run and pin its Git commit.

## Train and select

- Use Unsloth + PEFT, 4-bit NF4 QLoRA, rank 16, alpha 32, dropout 0.05, learning rate `2e-4`, maximum 1,024 tokens, three epochs and seed `20260814`.
- Train one baseline evaluation before training and one evaluation per checkpoint.
- Select the checkpoint using validation metrics, then run the holdout set exactly once for the final report.

## Release

Merge the approved adapter only after safety review, quantize to GGUF Q4, run local benchmark, publish adapter/model card to Hugging Face, and publish code/config/evaluator to GitHub. Keep datasets and pilot data private.

## Rollback

Set `AI_PROVIDER=manual_fallback`; do not retrain during the two-week pilot unless a critical defect has been documented and the pilot is paused.
