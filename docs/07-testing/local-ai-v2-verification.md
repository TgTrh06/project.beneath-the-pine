# Local AI v2 — implementation verification, updated 2026-11-07

## Implemented

- Three-capability contract, shared versioned prompt, authenticated runtime-config endpoint and opt-in NestJS local provider.
- Recovery suggestions with explicit edit/accept/dismiss and break acceptance; no automatic persistence or timer/presence mutations.
- Reviewed-data freeze, cross-language schema validation, Colab notebook, assistant-only label masks, checkpoint integrity checks and durable run registry.
- Offline predictions, blind human-review forms, validation selection, score gates, exact-base merge/export and checksum-bound artifact promotion.
- Loopback llama-server launcher, end-to-end benchmark utility, CI CPU tests and deployment/rollback instructions.

## Executed evidence

| Check | Result |
| --- | --- |
| API TypeScript/tooling/module-boundary lint | Passed; 73 source files, no import cycles |
| API tests | 52 passed, 10 PostgreSQL-gated tests skipped, zero failures |
| Web tests | 94 passed across 22 files |
| Workspace production build | Passed; Vite reported large-chunk and third-party annotation warnings |
| V2 CPU pipeline tests | 26 passed: review gates, cross-field validation, leakage, Python/Zod agreement, loss-mask/padding, resume integrity, interrupted checkpoint copies, elapsed-time validation, stale-resume rejection, run identity, checkpoint ranking, scoring and final-holdout promotion |
| Legacy v1 dataset tests | 10 passed |
| Shared protocol drift check | Passed |
| Python compile/CLI smoke | Passed for training, evaluation, export and serving modules; no model loaded |
| Direct training dependency metadata | 13 pinned packages checked against PyPI Linux/Python 3.12 requirements; no conflicts between the checked direct pins. This is not a transitive resolver or GPU compatibility test |

Browser verification used the real recovery/coach components and existing styles with fictional, mocked HTTP responses in an ignored local harness. Observed blank-input disablement, explicit requests, loading, editable suggestion acceptance, dismissal, break suggestion acceptance, stale-input rejection, fallback/boundary messages, error preservation and keyboard navigation. A suggestion did not start a break; pressing its accept button did. Edited text reached only the manual draft. No horizontal overflow was observed at 320, 768 or 1280 CSS pixels. Light and night themes were inspected. The final small focus-restoration change was typechecked and unit-tested; it was not re-exercised in the browser.

This was component-level browser QA, not a full database-backed Solo/Pact session. Browser zoom at 200%, a screen reader, native mobile and live Pact connection transitions were not exercised in this run.

## Data evidence

Created 1,500 private draft candidates: 500 per capability, split into 1,203 train and 297 validation. All remain `pending_review`; approved rows = 0. The independent holdout has an authoring brief only, not fabricated examples.

Python and actual Zod checks pass; the reviewed-data gate rejects the draft as intended. Group isolation/normalized uniqueness pass. Lexical cross-split screening flags 39 candidate pairs for semantic review. The model tokenizer at revision `989aa7980e4cf806f80c7fef2b1adb7bc71aa306` reports maximum 558 tokens, zero examples above 1,024 and zero prompt/completion prefix mismatches. Tokenizer measurement used local Transformers 5.22.1; the proposed Colab training pins still require their own preflight.

The original v1 `all.jsonl` SHA-256 remains `95d86ac0b707db3ad7c3b41a9f7de7435c0bb68374fd406af9ddd61008f78455`.

## Not completed / release blockers

1. Vietnamese human rewriting/review, ownership approval, recovery safety/adversarial expansion and independent final holdout authorship.
2. Colab GPU installation, complete transitive environment lock, smoke run, actual QLoRA/resume and baseline-versus-adapter evaluation. This workstation has CPU-only PyTorch.
3. Real adapter merge, GGUF conversion, server binary/flag verification, hardware memory/throughput measurement and statistically useful latency evidence.
4. Database-backed provider quota regression, full Solo/Pact UI integration, 200% zoom and assistive-technology checks. Docker CLI is available, but its Linux daemon was unavailable when checked on 2026-11-07; the PostgreSQL-gated tests remain unexecuted locally.
5. Deployment authorization and chosen server hardware. No production config, remote service, paid resource, private-data upload or model publication was changed.

No model quality, GPU performance or deployment readiness is claimed. Provider/UI defaults remain disabled. Use the [local AI runbook](../05-machine-learning/local-ai-runbook.md) for the next authorized steps.
