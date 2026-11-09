# ADR-0030 — Framework-independent use cases and module-owned persistence

Status: accepted 2026-11-07; implemented and locally verified 2026-11-09. See the [verification report](../../07-testing/architecture-refactor-verification.md) for acceptance evidence and its limits.

The approved project-wide refactor precedes data review and model training. Keep the NestJS modular monolith, React/Vite client, shared wire contracts, offline ML workspace and independent llama-server runtime. Do not change database schema, HTTP/Socket.IO contracts, transaction boundaries, lock order or product behavior.

Domain and application code are framework-independent. Module composition supplies concrete repositories/providers through typed ports and factories. Public module interfaces expose DTOs, ports and injection tokens, not concrete services or ORM objects. Read-model joins and foreign-key declarations are the only final cross-owner schema exceptions; each must be explicitly inventoried. Writes use the owner's repository.

A shared opaque transaction context carries no Drizzle types. The PostgreSQL unit-of-work adapter resolves it only during its callback, allowing owner repositories to share one transaction without leaking its implementation. Business errors carry stable codes and the HTTP boundary preserves existing responses.

Migration proceeds through Assistance/Analytics/Profile/Seed, Identity, Camp/Pact/Focus/Presence, Memory/Preferences and Privacy. Existing legacy imports are recorded before migration and may only decrease. Web and ML follow after affected backend checks pass. A transitional export is not evidence that the final boundary is complete.

Remove the unused FastAPI experiment and Maven wrapper after reference verification; this supersedes the retention decision in ADR-0029. Historical reports remain historical evidence. No private data, credentials, weights or local environments are removed.

Validation requires architecture negative tests, existing API tests, real PostgreSQL concurrency/rollback tests, web behavior checks, offline ML tests, contract/protocol hash parity and container checks. Skipped database tests do not satisfy acceptance. Rollback is by reverting individual code slices against the saved baseline; no database rollback is required. This decision does not authorize deployment or model training.
