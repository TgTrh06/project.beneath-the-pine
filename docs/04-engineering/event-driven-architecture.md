# Event-Driven Architecture

The MVP uses in-process application events or direct calls only where they are durable and testable. A database transaction owns session/pact state; broadcasts occur after the durable transition.

External queues and brokers remain conditional. If introduced, commands and events must have idempotency, replay and privacy rules first.
