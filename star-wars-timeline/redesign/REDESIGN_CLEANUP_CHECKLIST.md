# Redesign Cleanup Checklist

Status: Active  
Companion doc: `redesign/FEATURE_PARITY_PLAN.md`

This checklist is derived from the audit against [DESIGN.md](../images/design-reference/DESIGN.md).

## Priority 1

- Reduce border-led sectioning across the shell and shared surfaces.
- Replace hard borders with tonal separation, glass layers, glow, and spacing.
- Remove obvious box outlines from the top bar, sidebar, footer, timeline header, and utility-page shells.

## Priority 2

- Simplify the filter surfaces so they feel editorial instead of dashboard-heavy.
- Reduce the number of boxed toggles and equal-weight controls.
- Make filter grouping rely more on space and surface nesting than outlines.
- Push the command/filter area away from “dark product toolbar” and toward premium franchise navigation.

## Priority 3

- Bring stats fully into the same visual family as preferences.
- Reduce telemetry/dashboard styling and make stats read more like a guided archive page.
- Trim chart-like widgets that feel too “admin panel.”
- Make supporting utility surfaces feel integrated into the same branded shell as timeline and hero.
- Also review preferences afterward and pull it closer to the calmer stats-page rhythm where that improves consistency.

## Priority 4

- Remove unnecessary dividers inside modal, filters, stats, preferences, and footer.
- Use spacing and surface shifts instead of line breaks between sections.

## Priority 5

- Reduce visible metadata on timeline cards and keep story-first content dominant.
- Audit chips, labels, and auxiliary actions on desktop and mobile timeline entries.
- Keep pushing card framing away from “polished app card” and toward “premium editorial media object.”

## Priority 6

- Normalize navigation active states across top nav, sidebar, mobile nav, and mobile chips.
- Keep active-state language consistent with the design guide: underline, glow, or restrained highlight.
- Make the rail feel branded and navigational rather than purely functional.

## Priority 7

- Unify control styling across inputs, toggles, chips, and segmented choices.
- Prefer the existing HUD-style search/input language over boxed UI treatments.

## Priority 8

- Replace more one-off utility classes in `app.js` with shared reusable design primitives from `styles.css`.
- Expand shared CTA, chip, panel, and label patterns as needed.

## Priority 9

- Rework the footer into a softer cinematic endcap.
- Reduce the feeling of a bordered site footer strip.

## Priority 10

- Do a final subtraction pass.
- Remove non-essential copy, labels, chips, and controls that are not helping the page narrative.

## Reference Notes Carried Forward

- The shell should avoid reading like a generic dark application and lean harder into campaign/editorial framing.
- The hero, controls, rail, cards, and utility surfaces should all feel like one cinematic system rather than separate UI modes.
- Shared fixes should continue to win over one-off surface patches whenever practical.
