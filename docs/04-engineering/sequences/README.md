# Sequence Diagrams

The sequence set translates PRD journeys into runtime responsibilities, including recoverable failures, privacy boundaries and idempotent side effects.

## Read by flow

- [Core Focus Flow](core-focus-flow.md): capture, Brain Dump, focus lifecycle and stuck recovery.
- [Gentle Return Flow](gentle-return-flow.md): Open Seed, bootstrap/return, reminders and Weekly Letter.
- [Commercial Flow](commercial-flow.md): entitlement, checkout, webhook reconciliation, cancellation and restore.
- [Asynchronous AI Flow](async-ai-flow.md): job acceptance, outbox publication, model execution and result retrieval.
- [Reminder Delivery Flow](reminder-delivery-flow.md): scheduling, opt-out recheck, external delivery, retry and acknowledgement.

## Shared conventions

- Web never treats a local UI check as authorization.
- API validates identity, ownership and input before invoking a use case.
- Analytics receives identifiers/enums/timestamps only; private text is excluded.
- Optional services fail independently from the core focus path.
- Dashed provider participants describe future adapter boundaries, not selected vendors.

Capability IDs and release order are defined in the [Tiered Delivery Plan](../../02-product/tiered-delivery-plan.md).
