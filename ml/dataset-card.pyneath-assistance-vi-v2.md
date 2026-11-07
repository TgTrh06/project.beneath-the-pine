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
