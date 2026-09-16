# Realtime Contract

Socket.IO namespace: `/realtime`. The same browser session cookie authenticates the handshake and the configured web Origin must match. Every room subscription is authorized again against the durable session participant record.

Client messages: `session.subscribe`, `presence.heartbeat`, `presence.set`.

Server messages: `session.snapshot`, `session.updated`, `presence.updated`, `session.ended`, `realtime.error`.

REST owns durable mutations. Realtime messages carry snapshots and ephemeral presence only. A reconnect subscribes again and receives a fresh snapshot; no private intention is projected to another account. MVP presence is process-local and therefore deployment is limited to one API instance until a shared adapter is approved.
