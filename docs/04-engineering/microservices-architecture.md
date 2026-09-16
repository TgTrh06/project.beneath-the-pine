# Microservices Conditions

The approved core is a modular monolith. Consider extracting a service only with evidence of a distinct data/release owner, required resource isolation or measured scaling/failure need. A websocket gateway, notification worker, media stack or AI execution is not pre-approved merely because it may exist in a future product.
