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

The local AI implementation adds offline `ml/training/`, `ml/evaluation/`, `ml/export/` and a private Colab notebook. `services/inference-service/serving/` prepares a pinned llama-server runtime for the opt-in NestJS local provider; the existing FastAPI `app/` remains an independent legacy experiment. No v2 model has passed release gates. See the [local AI runbook](../05-machine-learning/local-ai-runbook.md).

The target mobile client will be added only after core API, native-auth and platform decisions are approved. API module migration is now approved by [ADR-0030](adr/0030-module-ownership-refactor.md). See the [ownership ledger](module-ownership.md) for the layers, table owners, preserved transactions and remaining transitional exports. Migration is in progress; unconverted modules are not yet evidence of the target architecture.
