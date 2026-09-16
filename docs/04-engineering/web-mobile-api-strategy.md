# Web/Mobile API Strategy

Web proves flows and HTTP/realtime contracts; it must not become the source of product business state. A later React Native client consumes the same authenticated account, Circle, pact, session and seed APIs.

## Mobile gate

Before creating `apps/mobile`, approve:

1. First platform(s) and native credential/session lifecycle.
2. Deep-link and notification ownership/opt-in behavior.
3. App-resume, process-kill and reconnect behavior for active sessions.
4. Offline policy; MVP assumes online session authority, not offline sync.

No web-only local timer or browser storage may be treated as canonical session truth.
