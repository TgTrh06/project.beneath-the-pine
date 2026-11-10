# Pyneath Assistance Vietnamese v2 — development candidates

- Date: 2026-11-06.
- Status: **unreviewed draft; not training-ready**.
- Location: `ml/data/private/pyneath-assistance-vi-v2-draft/` (Git-ignored).
- Total: 1,500 development candidates, 500 for each capability.
- Human-approved rows: **0**. No reviewer identity or approval was manufactured.
- Independent final holdout: **0 authored rows**; authoring brief targets 300.
- No model training, GPU smoke run or release evaluation has occurred.

## Source and limitations

The two existing capabilities use a seeded selection of 1,000 rows from the unchanged v1 synthetic draft. Recovery adds 500 rows expanded from 50 task recipes and ten context variants. These are not 1,500 independently authored examples. Recovery boundary/adversarial coverage still needs authoring; semantic overlap, naturalness and action relevance require substantive Vietnamese review.

Current split counts: train 404 assisted-start, 399 Seed, 400 recovery; validation 96 assisted-start, 101 Seed, 100 recovery. Group isolation and normalized input uniqueness pass. Cross-split lexical screening flags 39 candidate pairs requiring human review; it is not a semantic deduplication guarantee.

Tokenizer check using pinned Qwen revision `989aa7980e4cf806f80c7fef2b1adb7bc71aa306`: all 1,500 examples fit 1,024 tokens; maximum observed length 558; zero prompt/completion prefix mismatches. This was measured with the locally installed tokenizer implementation, not the proposed Colab training environment.

The generator refuses overwrites. Human review edits create a new frozen manifest only after both Python and Zod checks pass. No v1 file is modified, and no production/private user work content is used. Source ownership and review remain pending; public redistribution is not authorized.

See [local AI runbook](../docs/05-machine-learning/local-ai-runbook.md) for review, holdout authorship and training gates.

## Review preparation, 2026-11-09

The original 1,500-row draft and its train/validation files remain unchanged. A separate Git-ignored workspace at `ml/data/private/pyneath-assistance-vi-v2-review/` contains 1,510 candidates: original rows plus five recovery boundary and five recovery challenge drafts. These additions are assistant-authored fictional development content, not independent human holdout examples. Ownership permission remains pending.

For calibration, 80 original rows have edited requests/answers with content-bound before/after history. Together with the ten additions they form a 90-row pending review batch: 20 ordinary, five boundary and five challenge per capability. An optional nine-row starter selects one of each category/capability from that batch. Neither editorial changes nor structural validation constitute approval.

- Current snapshot: `round-001`, ID `6fa16c502de989a06a07718bf0a1c11755666c7974fb3fcc1e125a1a850de6ca`.
- Human-approved rows: **0**. The user volunteered to review; no reviewer ID, decisions or owner permission have been recorded.
- Independent holdout: **0**; no independent author is assigned.
- Python/Zod and split-isolation checks passed for 1,510 rows. All fit 1,024 tokens with cached pinned Qwen tokenizer; maximum 558, zero prefix/length failures, local Transformers 5.22.1. This does not verify the Colab environment.
- New complete input-text lexical screening reports 37 pairs (one across splits), pending human decisions. Its method differs from the earlier serialized-request screening, so counts are not a measure of semantic deduplication progress.
- Current groups remain 80/80/60 across assisted-start/Seed/recovery; 140 capability/group buckets exceed five examples. The target diversity and category quotas have not yet been reached. Full development review/rewrites follow calibration feedback.

Read the [reviewer guide](../docs/05-machine-learning/dataset-review.md), [independent holdout brief](../docs/05-machine-learning/holdout-authoring-brief.md) and [verification report](../docs/07-testing/dataset-review-verification.md). No freeze manifest, trained adapter, upload or release was created in this step.
