# Retention Implementation Overview

## Delivery order

1. [Slice 01 — Data and contracts](slice-01-data-and-contracts.md)
2. [Slice 02 — Backend and bootstrap](slice-02-backend.md)
3. [Slice 03 — Frontend flows](slice-03-frontend.md)
4. [Slice 04 — Jobs and observability](slice-04-jobs-and-observability.md)
5. [Acceptance matrix](acceptance-matrix.md)

## Cross-slice invariant

`Focus completion → optional Open Seed → opted-in reminder → gentle Return → evidence-based Weekly letter`

No slice may expose task title in analytics/notifications, create a reminder without opt-in, or block the core focus flow when an optional retention mechanism fails.
