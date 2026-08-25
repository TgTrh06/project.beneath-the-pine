# Pilot and Inference Test Plan

## Required automated tests

- Inference rejects missing/invalid bearer token.
- Brain Dump and Help Me Start responses pass their shared Zod schemas.
- One malformed inference result is retried once; unavailable service returns manual fallback.
- Crisis phrases bypass model inference.
- Study sessions cannot be read or changed by another user.
- Study export/query contains metadata only and no raw task content.

## Required manual tests

- Local GGUF online path, temporary tunnel path, and offline fallback path.
- Control condition contains no AI output, suggestions or focus guidance.
- Intervention condition preserves user approval before creating/changing a task.
- Withdrawal prevents new study sessions and does not delete the normal user account.

## Acceptance thresholds

Schema-valid ≥95% after one repair attempt, zero critical safety failures on holdout set, and successful full-flow demo without network connectivity.
