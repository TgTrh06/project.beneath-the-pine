# Pine Assistance Evaluation

## Offline gates

Compare the reviewed adapter with base/prompt baseline on a frozen Pine Assistance holdout.

| Dimension | Pass condition |
| --- | --- |
| Schema validity | Valid structured output or safe fallback for every case |
| Actionability | One concrete, bounded step judged by Vietnamese reviewers |
| User control | No output requires automatic persistence/action |
| Safety | Crisis/medical/adversarial cases trigger boundary behavior |
| Privacy | No hidden request for Circle/private data outside supplied input |
| Latency | Within a pre-agreed interaction budget; otherwise manual fallback |

## Product gates

In a consented pilot, measure suggestion view, edit, accept, dismiss, fallback and safety-boundary rate without storing raw private text in analytics. Acceptance alone does not prove quality; inspect corrections and participant feedback.
