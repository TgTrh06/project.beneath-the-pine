# Dataset review tooling — verification 2026-11-09

Status: review preparation implemented; human calibration pending. This does not complete data acceptance. The user will review Vietnamese content; reviewer ID and actual decisions are not yet supplied. No independent holdout author is available.

## Delivered

- `ml/common/data_review.py`: content hashing, reviewer/owner evidence checks, rubric, coverage and complete lexical pair screening without model dependencies.
- `ml/authoring/review_workflow.py`: immutable source snapshots, readable/JSON forms, partial decisions, revisions invalidating approval, selected/composed snapshots, audit and guarded handoff. Existing snapshots are not overwritten; their completion marker binds row/history/source hashes.
- `ml/scripts/review_dataset.py`: thin CLI; optional token check reuses training tokenization with a cached pinned tokenizer, no model weights or network calls.
- Existing training preflight now also exposes an aggregate dataset token report. Training mask behavior and config remain unchanged.
- Vietnamese reviewer guide, independent holdout authoring brief, specification/card/runbook updates. No application API, database, prompt, contract, dependency or product-flag changes.

The handoff gate requires 1,500 development + 300 holdout rows, per-capability category/split balance, recovery mode/action presence, every row approved with matching human/owner evidence, independent holdout attestations, duplicate/semantic review, Python/Zod and a matching successful tokenizer report. It creates `reviewed-awaiting-freeze`, not a training manifest. Existing freeze and training gates remain required.

## Private artifacts

`ml/data/private/pyneath-assistance-vi-v2-review/round-001` contains 1,510 pending candidates. Original v2 source hashes still match the preparation source register. All six v1 output checksums match the historical manifest.

The 90-row calibration batch contains 80 assistant editorial revisions of original rows plus ten new recovery boundary/challenge drafts. All preserve pending review and no human or owner approval is fabricated. An optional nine-row starter is a subset of the 90. Original source files and the earlier snapshot remain intact.

Snapshot ID: `6fa16c502de989a06a07718bf0a1c11755666c7974fb3fcc1e125a1a850de6ca`.

Rows SHA-256: `5b5ca161b5773837d09c8ad4bc1b878d15b8de00342fd157ae2e9343a09e9067`.

Raw candidates, readable forms, decisions and test logs are Git-ignored. Only aggregate evidence is recorded here. No private content was uploaded or published.

## Executed checks

Environment: Windows, Python 3.12.6, Node 22.12.0; existing dependencies, no new installation.

| Check | Result |
| --- | --- |
| ML CPU suite | 55 tests passed, including 20 new review workflow tests |
| Historical v1 dataset suite | 10 tests passed |
| Python architecture | 50 source files, no violations/cycles |
| Contracts build | Passed |
| Protocol export check | Passed; `pyneath-assistance-v2.1`, contract hash `b843f4bd7708e641210e386b22dfedb631f438ce466f5e25c0768699ae883247` unchanged |
| Python validation on current private snapshot | 1,510 rows passed; no group overlap or duplicate normalized request signatures |
| Actual Zod request/output/response validation | 1,510 rows passed |
| Cached pinned tokenizer | 1,510 rows passed; maximum 558/1,024 tokens; zero length/prefix violations |
| Local tokenizer environment | Transformers 5.22.1; Qwen revision `989aa7980e4cf806f80c7fef2b1adb7bc71aa306` |
| Input-text lexical screening | 37 candidate pairs, one cross-split; human review outstanding |
| Historical source protection | v2 source register hashes and all six v1 historical output hashes match |
| Diff whitespace and private ignore checks | Passed |

New tests exercise score/rights/identity/timestamp requirements, stale hashes, altered display content, explicit holdout attestation, duplicate review IDs, no partial commit after an invalid decision, revision/reject/escalate behavior, content rewrite gates, partial calibration resumption, snapshot tampering, split leakage, selection/history preservation, CLI operation outside cwd, token overflow and complete 1,800-row handoff using fictional test decisions. The unit handoff test mocks the Zod subprocess; the separate real 1,510-row Zod run above validates actual contracts. Test reviewer/owner identities are confined to temporary fixtures and never apply to private candidates.

The initial handoff test exposed direct JSON parsing of a commented YAML config; the implementation now uses the existing shared config loader. Final regression logs: private review workspace `cpu-tests-final.log`. Draft audits deliberately report missing coverage rather than treating a successful command exit as data readiness.

## Outstanding human and dataset work

- Review/calibrate the 90 cases with the user; resolve policy disagreements before bulk review. All 1,510 candidates remain pending.
- Fill missing category/diversity coverage after calibration and select 1,500 accepted development examples. Current scenario-group counts are 80/80/60; 140 capability/group buckets exceed five variants.
- Review all flagged lexical pairs and semantic overlap across groups/capabilities; screening is not a semantic guarantee.
- Assign an independent author and write/review 300 final cases. No test rows were generated by the assistant.
- Run final token/contract/audit gates after edits, issue real dataset-level evidence and freeze in the next step.

Hash-bound JSON attestations detect content/version mismatch but are not cryptographic proof of human identity, ownership or semantic independence. GPU compatibility, model training, model quality, serving benchmark and deployment were not run. Product/API/browser tests were not rerun because this slice changes offline ML review tooling and documentation only.
