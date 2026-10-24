# Critical Test Cases

- [x] User A cannot read User B's seed, intention, Camp or pact data.
- [x] Camp member cannot read another member's private intention/seed.
- [x] Exactly one current Open Seed per account under concurrent replace requests.
- [x] Expired/revoked invitation cannot create membership or session access. See `camp-invites-verification.md` for live HTTP and browser evidence.
- [x] Pact creation is session-free with one accepted creator; invitees can change response before start, while cancel/expiry/completion lock later actions and outsiders or removed members cannot access Pact/session data. See `focus-pact-verification.md` for the current run evidence.
- [x] Independent PostgreSQL clients raced start/cancel, join/checkout and checkout/expiry; terminal state and participant access remained consistent. Removed members could not read, check out or change presence.
- [x] Two authorized Socket.IO clients received the same minimal presence update; terminal resubscribe returned a terminal snapshot and revoked access received no further presence event. See `realtime-recovery-verification.md`.
- [x] Start/checkout requests are idempotent and terminal state is durable. See `solo-core-verification.md`, `focus-pact-verification.md` and the current live HTTP run.
- [x] Late join/reconnect renders server-derived remaining time and permitted state for the tested single-instance browser flow. See `integration-privacy-ui-verification.md` and `realtime-recovery-verification.md`.
- [x] One participant leaving or checking out does not corrupt the other participant/session state in the tested Pact flow. See `integration-privacy-ui-verification.md`.
- [ ] Milestone requires defined valid attendance and never creates score/rank data.
- [x] Tested console, `product_events`, group projections and cross-account export do not contain another account's private text; own export intentionally contains own data. Long-term production logs remain unverified. See `integration-privacy-ui-verification.md`.
- [x] Solo start/check-out/resume and Camp invitation/Pact join/check-out were completed with keyboard controls in the in-app browser. Account switching used a direct test link; see `integration-privacy-ui-verification.md` for scope.
- [ ] Actual screen-reader narration, verified 200% browser zoom, cross-engine browser parity and long-term pilot logs. The current environment did not provide conclusive evidence for these checks.
