# Tiered Delivery Plan — Capability Map T0–T5

- **Status:** Draft for implementation sequencing
- **Last updated:** 2026-09-08
- **Scope:** Product and logical system design; infrastructure capacity is deferred

## How to read this plan

Tier is a dependency boundary. A higher tier may be designed early, but it cannot be considered releasable before the gates it depends on are met.

Delivery status:

- **Implemented:** working code exists for the principal path.
- **Partial:** code exists but the capability or its release evidence is incomplete.
- **Designed:** behavior/contracts are documented but production code is not complete.
- **Planned:** product intent exists; detailed contract is still needed.
- **Future:** depends on evidence or an external decision.

Entitlement is independent from tier:

- **Core:** always required for a safe product.
- **Free:** available without payment.
- **Free quota:** available with a transparent usage allowance.
- **Plus hypothesis:** a candidate for paid validation, not a commitment.
- **Internal/Public:** system or acquisition capability rather than an end-user plan.

## Dependency spine

`T0 foundation → T1 useful session → T2 easy return → T3 personal space → T4 public learning → T5 paid validation`

T2 and T3 may progress in parallel after T1 contracts stabilize. T5 requires public-product evidence from T4, even if entitlement interfaces are designed earlier.

## Tier 0 — Product foundation

| Capability ID | Capability | Status | Entitlement | Depends on | Implementation output | Acceptance gate |
|---|---|---|---|---|---|---|
| T0-PRODUCT-01 | Product boundaries and vocabulary | Implemented | Core | — | Direction, PRD, glossary, non-goals | Docs have no conflict on core promise, safety or tier meaning |
| T0-WEB-01 | App shell and feature boundaries | Implemented | Core | T0-PRODUCT-01 | App, layout, providers, router, feature/shared folders | Entry point, routing and errors work without circular ownership |
| T0-CONTRACT-01 | Shared request/output contracts | Partial | Core | T0-PRODUCT-01 | Schemas, stable error codes, contract tests | Web/API interpret success and failure consistently |
| T0-IDENTITY-01 | Identity, consent and access policy | Partial | Core | T0-CONTRACT-01 | Auth adapter, consent state, profile/timezone | Unauthorized/private data paths are denied and recoverable |
| T0-PRIVACY-01 | Data inventory and rights | Partial | Core | T0-IDENTITY-01 | Retention, encryption, export/delete coverage | Every user-owned entity has purpose, retention and deletion behavior |
| T0-QUALITY-01 | Accessibility, logging and observability baseline | Partial | Core | T0-WEB-01, T0-CONTRACT-01 | Error boundary, redacted logs, keyboard/mobile rules | No private text in logs; main paths work at 320px and keyboard-only |

### T0 exit

Start T1 delivery when the API error model, authorization boundary, consent behavior and critical UX rules are stable enough to implement without guessing.

## Tier 1 — Reliable core focus

| Capability ID | Capability | Status | Entitlement | Depends on | Implementation output | Acceptance gate |
|---|---|---|---|---|---|---|
| T1-CAPTURE-01 | Manual capture | Partial | Free | T0-CONTRACT-01 | Capture UI/API and one actionable result | User can create an action without AI |
| T1-AI-01 | Brain Dump extraction and confirmation | Partial | Free quota | T1-CAPTURE-01, T0-PRIVACY-01 | Structured suggestion, schema validation, confirm/edit/reject | Invalid/unavailable inference falls back to manual input |
| T1-ACTION-01 | One next action | Partial | Free | T1-CAPTURE-01 | Action selection/state transition | One primary action is available without exposing full backlog first |
| T1-FOCUS-01 | Focus Room session lifecycle | Partial | Free | T1-ACTION-01 | Start, timer, pause/resume, done, exit | Timer and outcome remain coherent across interaction states |
| T1-STUCK-01 | Still-stuck recovery | Partial | Free quota | T1-FOCUS-01, T1-AI-01 | Smaller-step suggestion and user confirmation | User returns to an editable action; stuck is not treated as failure |
| T1-EVENTS-01 | Core event instrumentation | Partial | Internal | T0-PRIVACY-01, T1-FOCUS-01 | Minimal event payloads and validation | Activation/time-to-start can be measured without raw content |

### T1 exit

PJ-01 and PJ-02 pass on mobile and keyboard. AI, analytics and audio failures do not prevent manual capture or timer use.

## Tier 2 — Gentle return

| Capability ID | Capability | Status | Entitlement | Depends on | Implementation output | Acceptance gate |
|---|---|---|---|---|---|---|
| T2-SEED-01 | Open Seed lifecycle | Designed | Free | T1-FOCUS-01, T0-PRIVACY-01 | Create/open/replace/dismiss state and API | One open seed per user; event payload excludes prompt text |
| T2-RETURN-01 | Return eligibility | Designed | Free | T1-EVENTS-01, T0-IDENTITY-01 | Bootstrap-derived state using timezone | Threshold is deterministic; absence duration is not shown as pressure |
| T2-RETURN-02 | Return Ritual | Designed | Free | T2-SEED-01, T2-RETURN-01 | Start fresh/open seed/check-in flow | Failure preserves normal Now/Capture access |
| T2-REMINDER-01 | In-app reminder preferences | Designed | Free | T0-IDENTITY-01, T2-SEED-01 | Opt-in, up to two slots, disable path | Default off and disable takes effect immediately |
| T2-EVENTS-01 | Return instrumentation | Designed | Internal | T2-SEED-01, T2-RETURN-02 | Seed/reminder/return events | Seed conversion and return recovery are measurable without content |

### T2 exit

Open Seed and Return Ritual create a reliable re-entry path. Reminder state respects opt-in, timezone and opt-out under retries and failures.

## Tier 3 — Personal focus space

| Capability ID | Capability | Status | Entitlement | Depends on | Implementation output | Acceptance gate |
|---|---|---|---|---|---|---|
| T3-THEME-01 | Local theme selection | Designed | Free + Plus library | T1-FOCUS-01, T0-QUALITY-01 | Theme tokens, selector and local persistence | Contrast/focus/reduced-motion pass for each shipped theme |
| T3-AUDIO-01 | First-party ambient audio | Planned | Free + Plus library | T1-FOCUS-01 | Player state, licensed assets, failure fallback | Timer never depends on playback; controls are accessible |
| T3-AUDIO-02 | YouTube opt-in embed | Designed | Free | T1-FOCUS-01, T0-PRIVACY-01 | URL validation, click-to-load, privacy copy | No private data in URL/log/event; blocked embed leaves timer usable |
| T3-PRESET-01 | Focus presets | Planned | Plus hypothesis | T3-THEME-01, T3-AUDIO-01 | Named duration/theme/audio configuration | Preset can be applied, edited and removed without changing task data |
| T3-PREFERENCE-01 | Local preference persistence | Designed | Free | T3-THEME-01 | Versioned local storage and reset | Corrupt/old preference falls back safely |

### T3 exit

Personalization shortens repeat setup and never adds a required choice before focus. Paid candidates demonstrate repeat use before an entitlement is attached.

## Tier 4 — Public product and learning

| Capability ID | Capability | Status | Entitlement | Depends on | Implementation output | Acceptance gate |
|---|---|---|---|---|---|---|
| T4-ACQUIRE-01 | Public landing and onboarding | Planned | Public | T1 exit | Clear proposition, privacy summary, start/demo CTA | A new user reaches capture without facilitator help |
| T4-DEMO-01 | Low-friction demo/anonymous path | Planned | Public | T1-CAPTURE-01, T0-PRIVACY-01 | Local/demo state and upgrade-to-account boundary | User knows what is local and what requires an account |
| T4-REFLECT-01 | Weekly Letter | Designed | Free | T1-EVENTS-01, T2-EVENTS-01 | Facts, evidence, optional experiment, feedback | Letter is withheld when evidence is insufficient |
| T4-FEEDBACK-01 | Contextual product feedback | Planned | Public | T0-PRIVACY-01 | Short feedback entry and safe metadata | Feedback does not attach private content by default |
| T4-RIGHTS-01 | Public data rights UX | Partial | Core | T0-PRIVACY-01, T2/T4 entities | Export/delete UI and completion evidence | All user-owned data is covered; destructive action is confirmed |
| T4-OPS-01 | Release/support/measurement readiness | Partial | Internal | T0-QUALITY-01, T4-ACQUIRE-01 | Readiness checklist, support path, dashboards | Public alpha has incident, feedback and rollback owners |

### T4 exit

External users can understand, start, return, give feedback and control their data. Baseline activation, D3/D7 and qualitative evidence support the next decision.

## Tier 5 — Sustainable product

| Capability ID | Capability | Status | Entitlement | Depends on | Implementation output | Acceptance gate |
|---|---|---|---|---|---|---|
| T5-ENTITLEMENT-01 | Capability entitlement service | Future | Internal | T4 evidence | Plan/capability policy and server-side check | Access is consistent across UI/API and failure does not corrupt data |
| T5-BILLING-01 | Billing adapter and subscription lifecycle | Future | Pine Plus | T5-ENTITLEMENT-01 | Checkout, webhook, state machine, restore/cancel | Replay-safe webhook; entitlement follows verified provider state |
| T5-SYNC-01 | Cross-device preferences/presets | Future | Plus hypothesis | T3-PRESET-01, T5-ENTITLEMENT-01 | Versioned sync and conflict policy | Local data is preserved across conflict/offline-like failures |
| T5-REMINDER-01 | Outbound reminder adapter | Future | Undecided | T2-REMINDER-01, T4 evidence | Provider adapter, idempotent delivery and audit metadata | Provider/privacy review; opt-out rechecked before every send |
| T5-INSIGHT-01 | Advanced insights/ML personalization | Future | Plus hypothesis | T4-REFLECT-01, ML evaluation gates | Explainable suggestion and feedback loop | No clinical/mood inference; evaluation, cost and safety thresholds pass |

### T5 exit

Paid conversion and recurring capability use justify ongoing cost. Cancellation, restore, refund and provider failure paths are understood before general availability.

## Next executable slices

1. **S1 — Core-flow gap audit:** map T1 requirements to current Web/API/contracts and list missing states/tests.
2. **S2 — T1 completion:** finish manual fallback, confirmation and still-stuck loop; complete mobile/keyboard evidence.
3. **S3 — Engagement contracts:** implement the approved T2 data/contracts slice before UI.
4. **S4 — Open Seed vertical slice:** data → API → bootstrap → Now/Focus UI → events.
5. **S5 — Return Ritual vertical slice:** eligibility → bootstrap → flow → recovery states → metrics.
6. **S6 — Local Focus Studio:** theme/preference first; audio as an independent optional slice.
7. **S7 — Public alpha surface:** landing/onboarding/demo/feedback and release readiness.
8. **S8 — Paid discovery:** test the Pine Plus proposition with evidence; design entitlements before provider selection.

## Traceability

- Requirements: [PRD](prd.md)
- System/component/data relationships: [System Diagrams](../04-engineering/system-diagrams.md)
- Runtime flows: [Sequence Diagrams](../04-engineering/sequences/README.md)
- Retention implementation slices: [AI Retention Handbook](../ai/retention/README.md)
- Acceptance coverage: [Retention Acceptance Matrix](../ai/retention/acceptance-matrix.md)
