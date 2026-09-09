# Beneath the Pine — Documentation Map

> A calm path through product decisions, implementation detail and the safety boundaries that keep them aligned.

This documentation is the project's shared memory: why Beneath the Pine exists, what it promises, how it is built and where it must stop. The application is under active development, so every document must distinguish current behavior from intended work.

## Choose a reading path

| Goal | Reading path |
| --- | --- |
| Understand product intent, Tier 0–5 and boundaries | [Foundation](00-foundation/README.md) → [PRD](02-product/prd.md) → [Tiered Delivery Plan](02-product/tiered-delivery-plan.md) → [Design](03-design/README.md) |
| Implement an application change | [Tiered Delivery Plan](02-product/tiered-delivery-plan.md) → [System Diagrams](04-engineering/system-diagrams.md) → [Sequence Diagrams](04-engineering/sequences/README.md) → [Engineering](04-engineering/README.md) → [Testing](07-testing/README.md) |
| Work on the Java/distributed target | [Technology Stack](04-engineering/technology-stack.md) → [Target Microservices Architecture](04-engineering/microservices-architecture.md) → [Event-Driven Architecture](04-engineering/event-driven-architecture.md) → [Event Catalog](04-engineering/event-catalog.md) |
| Change an AI output or model | [Machine Learning](05-machine-learning/README.md) → [AI Handbook](ai/README.md) → [Security and Privacy](06-security-privacy/README.md) |
| Prepare a beta or release | [Testing](07-testing/README.md) → [Operations](08-operations/README.md) → [Release](09-release/README.md) |
| Validate an assumption before committing to a solution | [Research](01-research/README.md) |

## How to use this set

- Numbered directories hold durable product, UX, engineering, ML, privacy, quality, operations and release decisions.
- [`ai/`](ai/README.md) turns accepted decisions into small implementation slices. It does not override the PRD, design decisions, privacy rules or ADRs.
- If a handbook conflicts with a numbered decision document or ADR, stop and resolve the decision instead of choosing silently.
- Mark important documents `Draft`, `Review`, `Approved` or `Superseded`. Record significant architecture changes in `04-engineering/adr/`.
- Never store identifying information, real health data or real research transcripts in the repository.

## Map

| Area | Question answered | Start |
| --- | --- | --- |
| 00 — Foundation | Why does the product exist, for whom and what is success? | [Foundation](00-foundation/README.md) |
| 01 — Research | What must be validated before it is trusted? | [Research](01-research/README.md) |
| 02 — Product | What are we building and how is it accepted? | [Product](02-product/README.md) |
| 03 — Design | How does the experience reduce pressure and support return? | [Design](03-design/README.md) |
| 04 — Engineering | How is the current system structured and run? | [Engineering](04-engineering/README.md) |
| 05 — Machine Learning | How are AI behavior, data, evaluation and safety governed? | [Machine Learning](05-machine-learning/README.md) |
| 06 — Security and Privacy | How are data, consent and risk protected? | [Security and Privacy](06-security-privacy/README.md) |
| 07 — Testing | How is confidence built before release? | [Testing](07-testing/README.md) |
| 08 — Operations | How is the service deployed, observed and recovered? | [Operations](08-operations/README.md) |
| 09 — Release | How is beta or release readiness decided? | [Release](09-release/README.md) |

## Before changing code

1. [Product Direction](00-foundation/product-direction.md)
2. [PRD](02-product/prd.md)
3. [Tiered Delivery Plan](02-product/tiered-delivery-plan.md)
4. [System Diagrams](04-engineering/system-diagrams.md) and the applicable sequence
5. [Technology Stack](04-engineering/technology-stack.md)
6. [System Architecture](04-engineering/system-architecture.md)
7. [Target Microservices Architecture](04-engineering/microservices-architecture.md), for Java, Redis, messaging or service work
8. [AI Safety Policy](05-machine-learning/ai-safety-policy.md), if AI behavior changes
9. [Test Strategy](07-testing/test-strategy.md)

For retention work, also use the [AI Implementation Handbook](ai/README.md) and linked contracts. For user-facing work, read the relevant design decision before opening a component.

## Status vocabulary

- **Draft** — being shaped; not an implementation commitment.
- **Review** — ready for critique and awaiting confirmation.
- **Approved** — the current basis for implementation.
- **Superseded** — replaced and linked to the newer decision.
