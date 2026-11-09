# ADR-0029 — Pyneath local Assistance and offline QLoRA

- Status: accepted for implementation and fictional-data verification; deployment not authorized
- Date: 2026-11-06

## Decision

Train an adapter for Qwen2.5-1.5B-Instruct on reviewed fictional Vietnamese data using Colab Free. Keep training in `ml/` and inference in an independently managed llama-server process. The original decision retained the FastAPI experiment outside the new request path; that retention decision is superseded by [ADR-0030](0030-module-ownership-refactor.md), and the unused experiment has been removed. No LangGraph, tools, retrieval, queue or database migration is introduced.

NestJS retains authentication, per-account/global quotas, the public response envelope, validation and fixed fallback/boundary messages. Add `stuck_recovery` with either one editable microstep or an explicitly accepted two-minute break. Existing start/Seed requests retain their wire format. Local requests never fall back to OpenAI or use external moderation.

The shared prompt and Zod contracts are exported into a hash-bound training protocol. Python validates JSON Schema plus cross-field invariants; the actual Zod validator is a second gate. Dataset v1 remains immutable; v2 drafts cannot train until a Vietnamese reviewer and data owner approve them. The independent final holdout is authored separately and opened only after validation-based selection.

## Security, privacy and compatibility

The inference token is server-only. Use loopback for same-host service; a separate GPU host requires private networking/TLS in its deployment plan. Do not log prompts, responses or secrets. Inference failure does not make the core application unready. Preserve 10/account and 100/global daily reservations including failed attempts; no automatic retries. Input remains private to the requester and model output never writes data or changes presence/timers directly.

Local checks and a small model are not established safety evidence. The release gates include human review, boundary cases, benign negatives and independent evaluation. Current demo flags remain disabled and demo copy requires fictional inputs.

## Reversal and evidence

Set provider to `disabled` to retain manual flows, or point to a previous reviewed artifact. Do not automatically select a hosted provider. Model and server binaries are pinned by immutable revision/checksum. Keep training, evaluation and runtime evidence separate: CPU tests do not establish GPU compatibility, and a completed training run does not establish model quality or deployment readiness.

See the local AI runbook and verification record. Server purchase, dataset upload, paid compute, production activation and public artifact release require their own authorization.
