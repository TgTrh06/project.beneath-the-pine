# ADR-0016 — HTTP commands and Socket.IO projections

- **Status:** Accepted
- **Date:** 2026-09-16

Durable commands use HTTP and PostgreSQL transactions. Socket.IO is used for authenticated room subscription, heartbeat and account-specific snapshots. This keeps retry/idempotency semantics inspectable while providing reconnect and presence behavior on web and React Native clients.

The MVP runs one API instance with in-memory presence. Durable session state and timestamps remain in PostgreSQL. Multi-instance rollout requires a reviewed shared Socket.IO adapter and distributed rate limiting.
