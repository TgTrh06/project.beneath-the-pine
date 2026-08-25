# Parallel Delivery Plan — Web + Beneath Pine AI

- **Status:** Active execution plan
- **Owner:** Product / Engineering / ML
- **Target:** 12 weeks, with local demo as the release-critical path.

## Two workstreams

| Stream | Owns | Must not wait for |
|---|---|---|
| Web Application | Core loop, study mode, API integration, consent, fallback, pilot operations | A trained adapter; it uses `manual_fallback` until model v1 is approved. |
| Model Training | Dataset, QLoRA, eval, GGUF, model card | UI changes; it consumes frozen shared JSON contracts. |

## Weekly integration gate

Every week ends with a green `pnpm build`, `pnpm test`, contract fixture check, and a one-page decision log: current provider, dataset hash, open safety issues, and next integration risk.

## Milestones

| Week | Web outcome | ML outcome | Gate |
|---|---|---|---|
| 1 | Provider flag and fallback contract | Colab/QLoRA workspace | Contract v1 frozen |
| 2–3 | Consent and control logger | 600 reviewed scenarios and baseline | Fixtures shared |
| 4–6 | Study storage and inference client | Reproducible train, v1/v2 adapter | API-to-inference test |
| 7–8 | Local GGUF flow and study-ready UI | Holdout eval and release candidate | Safety/latency pass |
| 9 | Tunnel rehearsal and rollback | Freeze v1.0 | Pilot readiness review |
| 10–11 | Two-week crossover pilot | Critical fixes only | Aggregate-only monitoring |
| 12 | Analysis and defense rehearsal | Artifact publication | Offline demo pass |

## Definition of done

- Full app works with model online and offline.
- Model data is never populated from product Brain Dumps.
- Pilot export contains no task title, Brain Dump, check-in note, email, or direct user identifier.
- Adapter, config, evaluator, model card and benchmark report are reproducible; reviewed dataset remains private.
