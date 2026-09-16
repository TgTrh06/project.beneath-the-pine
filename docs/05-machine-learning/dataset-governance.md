# Dataset Governance

## Non-negotiable boundary

Never train on raw production intention, Open Seed, Circle content, presence, private message, research transcript, scraped social post or medical/therapy content.

Training rows must be one of:

- `owned_fictional_authoring`;
- `consented_contributor`, de-identified and separately consented for training; or
- `synthetic_draft_rewritten`, substantially rewritten and approved by a Vietnamese reviewer.

External corpora may inform abstract coverage dimensions only. Do not copy, translate, paraphrase or retain source utterances in training rows or reviewer notes.

## Governance gates

Each dataset version needs provenance manifest, deterministic split, SHA-256, reviewer sign-off, safety review and documented license. The holdout is frozen before training. Publish aggregate metadata/model card only; keep raw data and contributor mapping out of Git.
