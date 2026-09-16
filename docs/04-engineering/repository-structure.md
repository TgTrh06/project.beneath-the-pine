# Repository Structure

```text
apps/web/                 Web validation client
apps/api/                 NestJS API scaffold and target modular backend
packages/contracts/       Client-independent schemas/types
docs/                     Product and engineering source of truth
ml/                       Private-data-safe training workspace and reproducible configs
services/inference-service/
                          Local inference adapter; not a current runtime dependency
```

The target mobile client will be added only after core API, native-auth and platform decisions are approved. The existing API module folders are legacy scaffold and require a separate code migration plan before being renamed or removed.
