# Environment and Configuration

Web/mobile clients receive only public API origins and app metadata. Database credentials, session secrets and migration credentials are server-only and use separate least-privilege roles when deployed.

The current API loads `apps/api/.env`; see `apps/api/.env.example` for scaffold variables. Future native auth, notification, analytics or provider settings are added only with an approved slice. Local/test data must be synthetic and isolated from any pilot database.
