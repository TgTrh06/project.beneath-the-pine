# Realtime Contract

Socket.IO namespace: `/realtime`. The same browser session cookie authenticates the handshake and the configured web Origin must match. Every room subscription is authorized again against the durable session participant record.

Client messages: `session.subscribe`, `presence.heartbeat`, `presence.set`.

Server messages: `session.snapshot`, `session.updated`, `presence.updated`, `session.ended`, `realtime.error`.

PostgreSQL is authoritative for session and participant state. REST owns session lifecycle mutations; realtime presence commands update only the participant presence field. A heartbeat preserves a participant's chosen `break` state, while reconnect changes `disconnected` back to `active`. Snapshots include `serverNow` and `endsAt`; browser timers are display-only.

A reconnect subscribes again and receives a fresh snapshot. Each room event is reauthorized against the durable session participant and current Camp membership before it is sent. `presence.updated` contains only `sessionId`, `accountId`, and `presence`; session snapshots return only the requesting participant's private intention.

The public `presence` enum includes `hidden`. Sharing is off by default: a participant still sees their own persisted presence, while other authorized Pact participants see `hidden` for active/break/disconnected and `checked_out` for a completed participant. The client can set only `active` or `break`; it cannot set `hidden`. A preference change publishes fresh per-recipient snapshots from the current API instance. Neither the snapshot projection nor `presence.updated` contains another member's intention or Seed.

The Socket.IO room adapter and disconnected-socket detection are process-local. Until a shared adapter is approved and configured, run one API instance so two devices receive the same broadcast updates.
