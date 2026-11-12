# Beeknoee local trial evidence

Interpret with the [acceptance record](../../beeknoee-trial-readiness.md). All model content is fictional. No credentials, account details, session cookies, consent grants or usage-record IDs are included.

| Artifact | What it establishes |
| --- | --- |
| [model-calls.json](model-calls.json) | All 23 real attempts, bounded calls/cost, timing, fictional output, authenticated prices, reconciled balance. Timestamps are UTC; trial date is Asia/Saigon. |
| [evaluation.json](evaluation.json) | Manual quality judgment on the identical nine-case sets; Luna selected 9/9 versus Haiku 8/9. |
| [provider-tests.txt](provider-tests.txt) | 27 mocked-network provider/context tests, including OpenRouter regression. |
| [web-tests.txt](web-tests.txt) | 12 focused Assistance component/state/hook tests. |
| [harness-tests.txt](harness-tests.txt) | Five budget and cost-reconciliation tests; no paid inference. |
| [lint.txt](lint.txt), [build.txt](build.txt) | Workspace compilation and boundaries; existing bundle warnings retained. |
| [authorization.json](authorization.json) | Live API unauthorized/cross-account/stale-grant checks; no model calls. |
| [browser-results.json](browser-results.json) | Three actual Luna UI flows, persistence, plus explicitly mocked failure/discard checks. |
| [ui-followup.json](ui-followup.json) | Recorded actual Seed response replayed at 320px light/dark; keyboard, focus, contrast and no premature save. Zero inference. |

Screenshots: [start 320px](start-320.png), [recovery desktop](recovery-desktop.png), [Seed light](seed-controls-320-light.png), [Seed dark](seed-controls-320-dark.png). The temporary browser monitor/harness remains ignored local tooling; production logging does not store model output. This is local demo evidence, not an accuracy benchmark or production audit.
