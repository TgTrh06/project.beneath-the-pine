# Responsive and Accessibility Contract

## Layout

- At 320px, task/timer/primary action precede navigation, customization and history.
- At tablet widths, preserve reading order before choosing a two-column layout; verify reflow and 200% zoom without lost controls.
- Desktop can use sidebar; mobile uses a prioritized 3–5 destination navigation pattern when implemented.
- Long settings forms are one column; slots use a linked compact group only when tap targets remain clear.

## Interaction

- Use buttons for actions, labels for fields and native inputs where possible.
- Visible `:focus-visible`; logical Tab order; dialog moves focus in and returns it on close.
- Escape closes non-destructive dialogs; destructive account actions keep confirmation.
- Async region uses concise status text and preserves input after recoverable failures.
- Authorization-denied states explain the permitted next action without exposing protected data.

## Sensory and motion

- No requirement depends on color, sound, hover or pointer precision.
- Hover/active styles supplement—not replace—visible focus and clear text/icon labels.
- Theme variants maintain contrast independently.
- Under reduced motion, stop decorative animation; retain only state-relevant changes.
- YouTube/media requires explicit user action and a text fallback for unavailable/blocked state.
