# Engineering Standards

- Favor one coherent vertical slice over broad scaffolding.
- Authorize every resource at owner/Camp/pact/session boundary.
- Persist lifecycle truth before broadcasting it.
- Treat websocket messages as untrusted input and idempotent commands.
- Include privacy/export/delete impact in every persistent entity change.
- Test recovery paths, not only happy paths.
- Do not add third-party provider, queue, broker, media or AI integration without an approved slice.
