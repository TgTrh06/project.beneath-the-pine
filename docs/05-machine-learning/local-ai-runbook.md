# Pyneath local AI — execution runbook

## Current state and gates

The repository contains contracts, a local provider, UI integration, CPU-tested data/training utilities, an evaluation/export pipeline and a Colab notebook. There is no trained/reviewed v2 model. Colab GPU compatibility and server performance are unverified. Keep all product flags disabled.

The candidate environment is pinned in `ml/training/requirements-colab.txt`; install it only in an isolated Colab runtime. Metadata compatibility is not a GPU smoke test. Record `pip check`, the generated full environment lock, CUDA/GPU and the 20-step smoke result before a full run. The base revision is pinned in `ml/configs/qlora-v2.yaml`.

## 1. Shared protocol and draft data

From the repository root:

```sh
pnpm --filter @pyneath/contracts build
node ml/scripts/export_protocol.cjs --check
python -m pip install -r ml/training/requirements-ci.txt
python ml/scripts/draft_v2.py --source ml/data/private/pyneath-assistance-vi-v1/all.jsonl --output ml/data/private/pyneath-assistance-vi-v2-draft
python ml/scripts/prepare_v2.py ml/data/private/pyneath-assistance-vi-v2-draft/train.jsonl ml/data/private/pyneath-assistance-vi-v2-draft/validation.jsonl --allow-drafts
```

The generator refuses overwrites. It creates 1,500 **unreviewed candidates**, including 500 recovery rows expanded from 50 recipes; it creates zero independent holdout rows. A reviewer must substantially revise weak/repetitive rows, add missing recovery boundary/adversarial coverage, review semantic overlap and approve each row. The final holdout must be written independently: 100 per capability, consisting of 70 ordinary, 15 boundary and 15 challenge cases. Do not label generated variants as independent examples.

For approved rows, supply actual `reviewer_id`, `reviewed_at`, `review_status=approved`, `provenance_stage=reviewed`, `license_status=owner_approved`, `usage=training-approved`. Final test rows additionally require `independent_holdout=true` and `provenance_class=owned_fictional_authoring`. The system prompt must exactly match the exported protocol. Keep all content under the private data directory.

Create a dataset-level human evidence JSON with `reviewer_id`, `reviewed_at`, `near_duplicate_review: "approved"`, and `dataset_hashes` mapping each input filename to its SHA-256. Review the near-duplicate report before signing; hashes bind the decision to exact files. Then freeze:

```sh
python ml/scripts/prepare_v2.py PRIVATE/train.jsonl PRIVATE/validation.jsonl PRIVATE/test.jsonl --freeze PRIVATE/manifest.json --review-evidence PRIVATE/review-evidence.json
```

Freeze requires at least 350 train and 75 validation rows per capability and exactly the final 100/capability coverage. These are minimum balance checks around the 1,500 development-row target, not a claim that volume guarantees quality.

## 2. Colab smoke and train

Open `ml/notebooks/pyneath-qlora-colab.ipynb` in a private notebook. Use an approved checkout commit and private Drive location; do not upload production data. Install pinned dependencies and build contracts before Python preflight. The notebook does not clone, upload, buy compute or start a web server automatically.

```sh
python ml/train_colab.py --train PRIVATE/train.jsonl --validation PRIVATE/validation.jsonl --manifest PRIVATE/manifest.json --output /content/pyneath-smoke --checkpoint-store PRIVATE/checkpoints --smoke
python ml/train_colab.py --train PRIVATE/train.jsonl --validation PRIVATE/validation.jsonl --manifest PRIVATE/manifest.json --output /content/pyneath-lr1e4 --checkpoint-store PRIVATE/checkpoints --smoke-evidence /content/pyneath-smoke/result.json
```

No silent truncation: revise overlong examples and freeze a new dataset before retrying. Loss applies only to assistant completion tokens; chat-template prefix mismatch fails preflight. Training checkpoints contain optimizer, scheduler, RNG, tokenizer, adapter and trainer state. A checksum-bound `complete.json` is copied last to durable storage; incomplete copies cannot resume.

Resume with `--resume PRIVATE/checkpoints/RUN/checkpoint-N` and the same identity. Use the latest complete durable checkpoint: older checkpoints are rejected to prevent rewinding the recorded GPU-time budget. Preserve the smoke result, config and environment lock outside ephemeral runtime storage. A durable run registry rejects attempts to reset the same configuration by changing the working output name. A two-hour budget includes time since the most recent checkpoint plus previously recorded elapsed training time; abrupt runtime termination can lose work and unrecorded elapsed time after the last checkpoint. An interrupted durable copy can be retried from its intact working checkpoint; each copied file is verified before the completion marker is atomically published. An existing completed checkpoint is never replaced with different state. Completed adapter, result and environment files are copied to `PRIVATE/checkpoints/RUN/completed-run/`, with the result marker copied last.

At most one follow-up configuration is allowed: copy the config with learning rate `0.0002`, repeat the matching smoke gate and compare on validation. No automatic model-size or compute-tier escalation. Runtime-specific constraints may block the experiment; record them instead of weakening review or token limits.

## 3. Evaluate, review and select

Build the API once so offline scoring uses its actual policy:

```sh
pnpm --filter @pyneath/api build
python -m ml.evaluation.run --dataset PRIVATE/validation.jsonl --output PRIVATE/eval/base-validation
python -m ml.evaluation.run --dataset PRIVATE/validation.jsonl --adapter RUN/adapter --output PRIVATE/eval/adapter-validation
python -m ml.evaluation.blind_review prepare --runs PRIVATE/eval/base-validation PRIVATE/eval/adapter-validation --output PRIVATE/review-validation
```

The review form hides provider identity. A human fills every quality/severity decision, identity and timestamp; keep `private-mapping.json` away from the reviewer until scoring. Import actual scores with `blind_review import --form ... --mapping ... --output ...`. Score each run using `python -m ml.evaluation.score --run ... --reviews ... --output ...`; attach the adapter `--training-result RUN/result.json` for measured loss.

Evaluate complete saved checkpoints by passing their directory as `--adapter`, using validation only. When attaching training loss to a checkpoint report, pass `--training-result RUN/result.json --checkpoint CHECKPOINT`; this verifies its saved state and measured loss rather than attributing the final adapter's loss to it. Select the eligible checkpoint reports from at most two training configurations using `python -m ml.evaluation.select_candidate --reports ... --test PRIVATE/test.jsonl --output PRIVATE/selection.json`. The command reads only the test hash, not its text. Run baseline and selected adapter against the final test using `--candidate-record PRIVATE/selection.json`; repeat blind human scoring. Use `--baseline-report` when scoring the adapter. Export a selected checkpoint with `--checkpoint CHECKPOINT`. A failed final report is not permission to tune on that holdout.

Raw schema quality and post-backend behavior are reported separately. Baseline and adapter comparisons require matching generation conditions. Do not compare unconstrained baseline schema accuracy to constrained GGUF accuracy as proof of training improvement.

## 4. Export and serving verification

Export requires a passed adapter report bound to the exact adapter checksum:

```sh
python -m ml.export.gguf --run RUN --adapter-report PRIVATE/adapter-final.json --llama-cpp LLAMA_CHECKOUT --llama-revision IMMUTABLE_40_CHAR_SHA --quantize-binary LLAMA_QUANTIZE --output PRIVATE/export-q4
```

Use a clean, pinned llama.cpp checkout. Export produces F16 and Q4_K_M plus `artifact.json`; status remains `candidate`. For GGUF evaluation, `ml.evaluation.run --server-url http://127.0.0.1:8011 --model-id MODEL_ID --artifact PRIVATE/export-q4/artifact.json --model-file PRIVATE/export-q4/model-q4_k_m.gguf ...` uses the same prompt and schema. Supply `PYNEATH_INFERENCE_TOKEN` through the environment. Score with `--adapter-reference` to require quality preservation against the already-passed adapter. Only try Q8_0 after a rejected Q4 report for the same adapter. No model switch is automatic. Package a passed GGUF report using `python -m ml.export.promote --artifact ... --report ... --model ... --output ...`; promotion binds report and model checksums but explicitly does not authorize deployment.

See `services/inference-service/serving/README.md` for the pinned runtime launcher. Measure model loading, RAM/VRAM and token throughput on actual hardware. The authenticated API benchmark preserves real quotas and reports a small-sample observation, not a statistically established p95. Collect additional authorized disposable-account measurements before selecting hardware. Target p95 is 5 seconds at concurrency 1 and 2; provider deadline is 6 seconds.

## 5. Integration, rollback and release

For an authorized fictional-data preview, configure server-only `API_ASSISTANCE_PROVIDER=local`, `API_LOCAL_AI_URL`, `API_LOCAL_AI_TOKEN`, `API_LOCAL_AI_MODEL`, and explicitly enable the existing web demo flag. The client reads capabilities/processing from authenticated `/api/v1/me/assistance/config`. OpenAI still exposes only the original two capabilities.

There is no database migration. Quotas remain 10/account/day and 100/global/day UTC. AI outages return manual fallback, do not retry and do not change core readiness. Inference logs only capability, configured model ID, elapsed time and outcome. Keep model IDs operational, never user text.

Rollback by disabling Assistance or restoring the previous reviewed artifact/checksum. Deployment, private-data upload, paid compute and public model release are separate actions requiring authorization. No stage may claim GPU verification, human approval, model quality or production readiness without its corresponding evidence.
