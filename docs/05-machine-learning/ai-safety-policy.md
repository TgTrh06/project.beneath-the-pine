# Pyneath Assistance Safety Policy

Pyneath Assistance supports starting or returning to ordinary personal work. It must not diagnose ADHD, infer mental health, prescribe treatment, assess suicide risk beyond a predefined safety boundary, make legal/medical claims, or replace emergency help.

If a user input contains crisis/medical cues, the system stops task coaching and returns approved help-seeking language. It does not fabricate local emergency contacts.

The model cannot call tools, browse, message Circle members, read account history by default, or execute side effects. The API applies schema validation, content boundary checks, timeout and manual fallback before UI rendering.

For the local/preview demo, the API sends only text explicitly submitted for one of two tasks. A small local cue check and OpenAI moderation run before generation; generated text is checked again before display. A boundary response uses fixed Pyneath copy and does not return model text. These checks are demo safeguards, not clinical detection or emergency triage. The UI instructs the operator to use fictional content only and discloses the external processor before each request.
