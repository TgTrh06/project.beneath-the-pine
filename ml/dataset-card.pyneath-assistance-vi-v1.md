# Pyneath Assistance Vietnamese v1 — 80,000-row draft

- Created: 2026-10-29.
- Status: **unreviewed compositional synthetic draft; not a release dataset**.
- Location: `ml/data/private/pyneath-assistance-vi-v1/` (Git-ignored).
- Language: Vietnamese; controlled accentless, informal and mixed-language inputs. Outputs use accented Vietnamese.
- Human-approved rows: **0**. Every row is `pending_review`, `draft/local-only`.
- License: privately authored material, owner release decision pending; no public redistribution license granted.

## Coverage

| Category | Rows |
| --- | ---: |
| Ordinary assisted starts | 38,400 |
| Ordinary Open Seed drafts | 25,600 |
| Difficult, adversarial and benign-negative cases | 9,600 |
| Safety boundaries | 6,400 |
| Total | 80,000 |

Including challenge/boundary rows, capabilities total 46,400 `assisted_start` and 33,600 `open_seed_draft`. Expected outputs total 67,200 suggestions, 6,400 fallbacks and 6,400 boundaries. `stuck_recovery` is excluded because the current contract does not serve it.

Eight domains each contribute 10,000 rows: study, writing, code, design, data, administration, home organization and creative work. There are **80 task families and 800 task–target pairs**, expanded by work stages, constraints and return intentions. These are **not 80,000 independently authored situations**. Input spelling variants replace existing rows rather than inflate the count.

## Authoring and sources

Codex authored a private catalog, domain action recipes and response policies. A deterministic local Python generator combined them. No remote generation API, production data, contributor data or external source utterances were used.

Only abstract coverage dimensions from the dataset cards for WikiHow GOSC, Vi-Alpaca and No Robots informed design. No external rows were copied, translated or paraphrased. Their license checks and exact URLs are recorded in private `source-register.json`.

`provenance_class=synthetic_draft_rewritten` is the intended final governance class. The separate `provenance_stage=unreviewed_synthetic_draft` explicitly records that substantive Vietnamese reviewer rewriting/approval has **not** happened. This is a candidate dataset awaiting those governance gates, not evidence that they passed.

## Format

UTF-8 JSONL, one object per line. Rows contain `messages` with system/user/assistant roles plus scenario/group IDs, capability, domain, difficulty, safety tags, split assignment, provenance and review fields. User content is serialized `AssistanceRequest` JSON. Assistant content is serialized **AssistanceOutput**, not a tool call, persistence instruction or response envelope. The API owns `suggestionId`.

The output mirrors `packages/contracts/src/assistance.ts`. Fixed fallback/boundary copy matches the current service, including its legacy `Pine` spelling. Changing that copy for training must be coordinated with the product contract in a separately approved change.

## Splits and reproducibility

Seed: `20261029`. Each domain has ten task families; eight go to train, one to validation and one to test. Entire families and all their target variants stay together.

| File | Rows | SHA-256 |
| --- | ---: | --- |
| `all.jsonl` | 80,000 | `95d86ac0b707db3ad7c3b41a9f7de7435c0bb68374fd406af9ddd61008f78455` |
| `train.jsonl` | 64,000 | `35596f270d47e4a6da298dbd40148eff8e3a169769f9a310a7d8897fbf4a37b0` |
| `validation.jsonl` | 8,000 | `8e380b57c5cde884e956eff4546094ea1e16f6f99afa4f9bbc3941ae55d9a444` |
| `test.jsonl` | 8,000 | `ddf5ad515375c3a76777da0db41e6de96acdeb1179ec233fadec2250f41ab550` |

Full generation was repeated into a separate directory; manifests and artifact hashes matched. The separate split command also reproduced all three split files byte for byte. Existing generated datasets and split files are not overwritten by these commands. Freeze a new dataset version if review changes content; do not tune against this test set after training.

## Verification actually performed

- Strict Python validation across all 80,000 rows: required metadata, role sequence, request/output types, lengths, allowed durations, safety behavior, exact input uniqueness and group isolation.
- Actual repository Zod request/output/response schemas passed for all 80,000 rows. Contract SHA-256: `18b84da7498e1ae970f631175979cb94ce11abbf9cb696a75487305210972d9e`.
- Frozen hashes verified; all split contents agree with `all.jsonl`.
- Zero duplicate inputs after case/accent/punctuation normalization.
- 63,770 distinct output JSON objects. Ordinary-start outputs: 38,262 unique; ordinary-seed outputs: 25,504 unique. Fixed fallback/boundary outputs repeat intentionally.
- Near-duplicate screening: 3,200 sampled rows, 50,232 LSH candidate pairs, word-trigram Jaccard threshold 0.75. Found 28 near pairs, all within the same split. **This is sampled lexical screening, not exhaustive semantic deduplication.**
- Ten focused unit tests passed for output modes, invalid types/durations, forbidden extra fields, reviewer gates, source provenance, request limits, group leakage and deterministic frozen splits.
- Both legacy public fixtures still pass their existing validator path.
- Assistant spot inspection found and corrected a low-energy wording/response mismatch before the final build. This does not count as independent human review.

## Limits and required next gates

Shared sentence/action templates remain across all splits. The test set is held out by work family, **not independently authored**; results can overestimate generalization. The safety portion has only eight base cue scenarios; the challenge portion has twelve base scenarios. Their expansion is not evidence of broad safety coverage. Some inputs are deliberately formulaic, and some suggestions remain generic or awkward.

The existing API's cue filter may classify benign negative examples differently from the desired training labels. This dataset does not change API behavior. The full AssistanceOutput target also differs from the current provider's narrower generation output, so a trained adapter is not a drop-in runtime replacement.

No model training, base-versus-adapter evaluation, tokenizer-length measurement, latency testing or human sign-off was performed. Before training, check the actual tokenizer/chat template against the configured 1,024-token limit and avoid silently truncating answers. Before release, obtain substantive Vietnamese review, license/owner approval, an independently authored holdout and all dataset/model safety gates.

See private `quality-report.json`, `quality-report.md`, `review-sample.md` (800 examples), `manifest.json` and `validation-evidence.json` for audit evidence. Raw inputs, authoring banks and review samples remain outside Git.
