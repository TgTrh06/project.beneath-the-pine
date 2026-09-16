# Architecture Options

The approved starting point is a modular monolith. It keeps Circle/pact/session transactions and authorization in one deployable system while usage is unknown.

Extract a realtime, notification or worker service only after measured workload and failure isolation require it. Public rooms, media and ML are not current architecture drivers.
