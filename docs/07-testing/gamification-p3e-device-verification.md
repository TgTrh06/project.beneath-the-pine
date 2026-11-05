# P3E — Browser zoom, narration and physical-device verification

Date: 2026-11-05 (Asia/Saigon). Authorized by the user's `ccept plan P3E` acceptance. Status: **in progress**. Product implementation, deployment and participant invitations are outside this validation phase.

## Current evidence

The user has confirmed access to an iPhone and availability to listen to Narrator directly. Device model, iOS version and a reachable development URL are still pending. Availability is not a passed device or narration test.

| Check | Observed result | Remaining limit |
| --- | --- | --- |
| Native Edge zoom | Edge menu explicitly showed 200% after native Zoom-in actions. Content viewport changed from 1280×900, DPR 1 to 640×450, DPR 2; visual viewport scale stayed 1. | This establishes browser zoom, not pinch zoom or enlarged CSS text. |
| Keyboard journey at 200% | Nineteen checkpoints completed through Return, Solo, stuck checkout, Seed, personal Memory, hide/save/restore arrangement, shared Memory, Camp, Menu/Escape and failed-progress retry. Each target's focus rectangle was checked within the vertical viewport. | Synthetic HTTP responses; no new server-persistence or authorization evidence. |
| Horizontal reflow | No horizontal document overflow at seven saved semantic checkpoints: arrival, personal journal, saved arrangement, shared journal, Camp summary, loading and error. | Keyboard checkpoints additionally cover the editor and checkout. Do not infer complete visual review from focus checks alone. |
| Rendering/themes | The completed journey used the light theme and static scenes. A Camp screenshot was visually inspected. | Dark theme, a 3D pass and broader screenshot review remain pending. |
| Narrator | Narrator started; the update introduction was dismissed and the personal Memory page prepared. Listening card 1 was sent to the user. | No listener result received yet. Voice/language and spoken names, states, order and live announcements remain unverified. |
| Physical iPhone | User confirmed iPhone availability. | No Safari device session yet; no keyboard, rotation, background, touch, GPU or battery claims. |

Environment: Windows 11 Home Single Language, OS 10.0.26300/build 26300; Edge 156.0.4314.58; installed Narrator executable file version 10.0.26100.8972. Voice has not been recorded. The isolated browser uses software rendering flags, so any later 3D result from this session will not establish physical GPU performance.

## Evidence and test limitations

Local ignored evidence is under `.openai/p3e-validation/`: `zoom-menu.txt`, `zoom.json`, `keyboard-results.json`, and named PNG/ARIA files for `arrival`, `personal-journal`, `arrangement-saved`, `shared-journal`, `camp-summary`, `camp-loading`, `camp-error`. Browser-menu screenshots were also observed in the tool output. The scripts are `.openai/p3e-harness.cjs` and `.openai/p3e-journey.cjs`.

The keyboard result records one synthetic checkout, a saved synthetic Seed, restored visible arrangement at version 2 and zero captured page errors. The journey reached its final checkpoint and wrote these results; its final assertion then failed because the Node REPL and required module used different array prototypes for an empty array. The harness assertion was changed to compare error count with zero. That correction has not yet been rerun; the whole script is therefore not reported as an entirely successful run. No product code changed for this harness issue.

Initial native control attempts included a tab closing and an input geometry error. A fresh window observation and keyboard-opened menu allowed native zoom verification. These are automation observations, not established product defects. The fixture's history endpoint is empty independently of its personal milestone counter, and synthetic visibility events drive the loading/error exercise; neither should be interpreted as real history consistency or physical background/resume evidence.

## Narration cards

Record actual heard words or a short paraphrase, whether Vietnamese is understandable, unexpected repeats/interruption, and any assistance needed. A DOM/ARIA snapshot cannot close these cards.

1. **Earned versus future memories:** read the personal journal with one completed session. Distinguish the seedling's saved/visible state from future flower and lamp thresholds. Confirm reading order and private-progress wording.
2. **Arrangement:** open Sắp xếp, move among layout radios, hide the earned seedling and save. Hear the checkbox state and save result; reopen and restore it. Confirm focus returns meaningfully and hiding does not suggest deleting the memory.
3. **Shared progress and recovery:** switch to Cùng Camp, distinguish shared from private progress, open Camp, then observe a controlled loading/error/retry cycle. Record whether status is announced usefully without repeated interruption.

Narrator was initially off. Keep the isolated browser and temporary loopback server available during the live listening handoff. Once the handoff finishes, restore Narrator's prior off state and close only the test browser/server; record cleanup then. No voice, software, extension, security or privacy setting is installed or changed by this plan.

## iPhone verification cards

First record model, iOS/Safari version, orientation and access URL. If there is no already authorized reachable dev URL, prepare a separate concrete connection plan before binding to LAN, opening a tunnel or changing hosting. The current server listens only on `127.0.0.1:5174`; that address is not usable from the phone. Browser-side route mocks do not make a working mobile backend.

| Card | Procedure | Required observation |
| --- | --- | --- |
| Touch and keyboard | Return → intention → Solo → checkout → Seed; open/close the real keyboard. | Input and primary controls remain reachable, entered text is preserved. |
| Rotation and resume | Rotate with a draft open; background Safari, return, and review the draft and session state. | Record actual preservation/refresh behavior and elapsed time. |
| Memories and decoration | Open personal/shared Memory, hide/save/reopen/restore an earned item. | Clear state, usable controls and preserved memory/date. |
| Camp rendering | Compare static and 3D with the available reduced-motion preference. | Core work stays usable; record visible artifacts or heat/sluggishness without inventing FPS or battery measurements. |
| Access refresh | With an approved test backend/account setup, change access and resume Safari. | Previously accessible private content is handled according to the existing access policy. A fixture-only run cannot establish server authorization. |

No iPhone result, cross-engine parity, pilot participant outcome or absence-of-pressure finding has been established. The pilot remains unopened. Finish the remaining cards and existing release gates before any readiness claim.
