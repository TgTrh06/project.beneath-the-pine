# PostgreSQL and Drizzle Data Access

Drizzle schema and reviewed SQL migrations describe persistence; neither is an authorization boundary or a deployment command. Every private read/write scopes its resource through the authenticated principal and relevant Circle/pact/session eligibility.

Use transactions for lifecycle invariants: starting a pact/session, participant check-out and milestone derivation. Retryable mutations need durable idempotency records/constraints, not in-memory caches. Run schema/migration tests on PostgreSQL; do not apply migrations on application startup or assume Git can roll back user data.

Before the first target-domain migration, inventory the actual target database, create a reviewed baseline on a test copy and agree an expand/contract or forward-fix path.
