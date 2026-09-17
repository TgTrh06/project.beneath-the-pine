# Focus

Owns solo/shared focus sessions, participant-private intentions, server timestamps, active-account exclusivity, check-out and lazy/background expiry reconciliation. Open Seed update during check-out is atomic. Pact state and shared milestone derivation are coordinated in the same modular monolith.

Clients render time from `endsAt` and must never treat a local interval as canonical.
