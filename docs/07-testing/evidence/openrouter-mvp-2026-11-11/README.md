# OpenRouter internship MVP evidence — 2026-11-11

Interpret these artifacts with the [acceptance record](../../internship-mvp-ai-readiness.md), especially its limits and distinction between real inference, mocked responses and replayed output. Fictional data only; no API keys, session cookies, consent grants or raw prompts are included.

| File | Scope |
| --- | --- |
| [workspace-test.txt](workspace-test.txt) | Workspace regression before the last provider schema/prompt refinement; opt-in HTTP suites skipped here. |
| [http-tests.txt](http-tests.txt) | Separate live Solo, Camp and Pact suites: 24 passed, no skips, disposable PostgreSQL. |
| [openrouter-tests.txt](openrouter-tests.txt) | Final adapter regression: 8 passed, mocked network responses. |
| [final-lint.txt](final-lint.txt), [final-build.txt](final-build.txt) | Final source type/boundary checks and production compilation. |
| [authorization.json](authorization.json) | Live API context ownership/grant/input checks; zero model calls. |
| [model-calls.json](model-calls.json) | Sanitized ledger of all 11 real inference attempts, including failures and unknown timeout cost. |
| [browser-results.json](browser-results.json) | Partial actual-model browser walkthrough: assisted start and recovery; stopped on a test locator error. |
| [browser-followup-results.json](browser-followup-results.json) | Corrected follow-up: actual recovery and Seed, persistence/reload, plus injected failure/discard checks. |
| [ui-followup.json](ui-followup.json) | Recorded Seed output replayed at 320px in light/dark themes; contrast, Enter, Escape/focus, no premature save; zero model calls. |

Screenshots: [start at 320px](start-320.png), [recovery on desktop](recovery-desktop.png), [Seed controls light](seed-controls-320-light.png), [Seed controls dark](seed-controls-320-dark.png). The recovery screenshot intentionally retains the model's stray character; the browser flow edits it before use. Screenshots and JSON contain only fictional work content.

These artifacts document a local verification session. They are not a production audit, a model accuracy benchmark, or a physical-device certification. The temporary browser harness and transport call counter remain in ignored local tooling; application logs do not record raw input/output.
