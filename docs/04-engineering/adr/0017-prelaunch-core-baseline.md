# ADR-0017 — Pre-launch core database baseline

- **Status:** Accepted
- **Date:** 2026-09-16

The product has not launched, so the identity-only migration is replaced by one generated core baseline. Legacy Wanderer/Pine Keeper roles and seed operations are removed rather than migrated into the product domain.

No database is modified by this decision. A developer database that previously applied the old `0000` must be recreated explicitly; never apply the replacement as though it were a forward production migration.
