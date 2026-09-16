# ADR-0015 — Pine Assistance and Local Model Training

- **Status:** Accepted
- **Date:** 2026-09-15

## Decision

The project will maintain a self-trained/fine-tuned Vietnamese Pine Assistance model path using reviewed QLoRA artifacts and the local inference service. Its permitted capabilities are `assisted_start`, `stuck_recovery` and `open_seed_draft` only.

The NestJS API is the sole client-facing model caller. It requests a structured response, validates it and requires user confirmation before persistence. Manual flows remain complete when inference fails.

## Data and release boundary

Training uses only fictional, explicitly consented/de-identified or substantially rewritten synthetic material with frozen evaluation holdout. Raw production intent, Open Seed, Circle/presence data and private communications are excluded. A trained adapter cannot be deployed until dataset, model card, safety and evaluation gates pass.

## Consequences

This retains the existing `ml/` workspace and `services/inference-service/` as product-adjacent assets, but does not authorize their runtime integration, provider selection, background worker or production deployment.
