# Critical Test Cases

- [x] User A cannot read User B's seed, intention, Circle or pact data.
- [x] Circle member cannot read another member's private intention/seed.
- [x] Exactly one current Open Seed per account under concurrent replace requests.
- [x] Expired/revoked invitation cannot create membership or session access. See `circle-invites-verification.md` for live HTTP and browser evidence.
- [x] Pact creation is session-free with one accepted creator; invitees can change response before start, while cancel/expiry/completion lock later actions and outsiders or removed members cannot access Pact/session data. See `focus-pact-verification.md` for the current run evidence.
- [ ] Start/checkout requests are idempotent and terminal state is durable.
- [ ] Late join/reconnect renders server-derived remaining time and permitted state.
- [ ] One participant leaving does not corrupt other participant/session state.
- [ ] Milestone requires defined valid attendance and never creates score/rank data.
- [ ] Logs/events/export do not contain raw private text or secrets.
- [ ] Keyboard-only user can start/check out/resume a session.
