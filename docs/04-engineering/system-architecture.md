# System Architecture

## Target

```text
Web validation client ─┐
                       ├── HTTP API + realtime gateway ── NestJS modular monolith ── PostgreSQL/Drizzle
React Native client ───┘                                      │
                                                              └── allowlisted analytics/logging
```

The backend owns authorization, durable session lifecycle, pact/invitation state and server timestamps. Realtime transports presence and session snapshots; it is not the only durable state store.

After core evidence, an internal Pine Assistance module may call the reviewed local inference service or a provider adapter. Clients never call models directly. No broker, worker, public-room service or media service is part of the approved MVP architecture.
