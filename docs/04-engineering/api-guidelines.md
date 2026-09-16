# API Guidelines

- Version all public HTTP routes under `/api/v1`.
- Derive account identity from authenticated principal; never accept ownership IDs from client body.
- Use explicit enum state transitions and stable error codes.
- Mutating pact/session commands require an idempotency key; repeated terminal commands return the terminal result.
- Realtime clients authenticate, authorize each room join and fetch a durable snapshot after reconnect.
- Server returns `startedAt`, `endsAt` and lifecycle state; clients render countdown from those timestamps.
- Private text is returned only to its owner and never placed in logs, analytics or notification payloads.
