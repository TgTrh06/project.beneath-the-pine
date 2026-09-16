# Critical Test Cases

- [ ] User A cannot read User B's seed, intention, Circle or pact data.
- [ ] Circle member cannot read another member's private intention/seed.
- [ ] Exactly one current Open Seed per account under concurrent replace requests.
- [ ] Expired/revoked invitation cannot create membership or session access.
- [ ] Start/checkout requests are idempotent and terminal state is durable.
- [ ] Late join/reconnect renders server-derived remaining time and permitted state.
- [ ] One participant leaving does not corrupt other participant/session state.
- [ ] Milestone requires defined valid attendance and never creates score/rank data.
- [ ] Logs/events/export do not contain raw private text or secrets.
- [ ] Keyboard-only user can start/check out/resume a session.
