# Design System Foundations

- **Status:** Approved baseline
- **Last updated:** 2026-08-27

## Brand qualities

Calm, grounded, warm, restrained, trustworthy. Hierarchy comes from spacing, typography and clear actions before decorative surfaces.

## Theme tokens

Three independent themes: `Rừng sáng`, `Chạng vạng`, `Đêm yên`. Each defines `canvas`, `surface`, `surface-subtle`, `text-primary`, `text-secondary`, `border`, `action-primary`, `action-secondary`, `danger`, `success`, `focus-ring` and `shadow`.

- `Rừng sáng`: warm off-white, pine green, leaf tint.
- `Chạng vạng`: muted moss/stone, deeper green accent.
- `Đêm yên`: dark pine canvas, lifted charcoal surface, high-contrast text; not an inverted light palette.
- All text/action/focus combinations target WCAG AA. Theme choice is local and never changes task semantics.

## Type and spacing

- Vietnamese-readable sans serif body; optional serif only for display headings.
- Body is at least 16px on mobile; utility text remains legible.
- Use a 4px spacing scale; forms and focus flows use generous vertical rhythm, data lists compact rows.
- Display type communicates section purpose, never replaces labels/instructions.

## Surface and motion

- Cards represent an independently actionable unit or needed separation; do not nest cards by default.
- Borders/subtle tint establish grouping; shadow is restrained structural depth.
- Motion is under 200ms when functional. `prefers-reduced-motion` removes decorative pine/marten motion.

## Component inventory

| Component | Required behavior |
|---|---|
| Button | Primary/secondary/destructive, disabled/loading, visible focus; one primary per decision area |
| Field/Textarea | Persistent visible label, near-field validation, preserved input on recoverable error |
| ActionCard/TaskRow | Task/time/next action with semantic heading and no false urgency |
| InlineAlert | Text + icon/tint, `aria-live` only for meaningful async feedback |
| Dialog | Native-like keyboard behavior, initial focus, Escape/close when safe, return focus |
| Timer | Textual remaining time and outcome; not dependent on sound/color |
| ReminderSlot | Opt-in, timezone context, direct disable control and durable confirmation |

## Anti-patterns

No streak counters, celebration overlays, generic glass/gradient, decorative blobs, repeated card grids, or icon-only control without a reliable label.
