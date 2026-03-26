# Redesign Cleanup Checklist

Status: Merge Prep  
Companion doc: `redesign/FEATURE_PARITY_PLAN.md`

This checklist is derived from the audit against [DESIGN.md](../images/design-reference/DESIGN.md) and now tracks actual completion state instead of only the original cleanup priorities.

## Completed

### Priority 1 — Border-Led Sectioning

- Reduced border-led sectioning across the shell and shared surfaces.
- Replaced many hard borders with tonal separation, glass layers, glow, and spacing.
- Softened or removed obvious box outlines from the top bar, sidebar shell, timeline header, stats/preferences shells, modal shell, and footer.

### Priority 2 — Filter Simplification

- Simplified desktop and mobile filter surfaces so they read more editorial and less dashboard-heavy.
- Reduced boxed toggles and equal-weight control styling.
- Moved filter grouping toward space, surface nesting, and calmer segmented controls.
- Shifted the command/filter area away from “dark product toolbar” and closer to premium franchise navigation.

### Priority 3 — Stats and Preferences Alignment

- Brought stats and preferences into the same visual family across desktop and mobile.
- Shared header weight, utility shell treatment, section rhythm, and calmer surface language between the two pages.
- Reduced remaining telemetry/dashboard language in stats.
- Simplified preferences wording so it reads less like a system console and more like a companion utility page.

### Priority 4 — Divider Cleanup

- Removed many unnecessary divider-style breaks inside modal, filters, stats, preferences, and footer.
- Replaced several line-led separations with spacing, tonal shifts, glow, and softer surface transitions.

### Priority 5 — Timeline Card Metadata Reduction

- Reduced visible metadata on desktop and mobile timeline cards.
- Trimmed chips, labels, and auxiliary chrome so story-first content carries more of the presentation.
- Pushed timeline card framing away from “polished app card” and closer to “premium editorial media object.”

### Priority 6 — Active-State Normalization

- Normalized navigation active states across top nav, mobile nav, filter triggers, and mobile era chips.
- Brought active-state language closer to the design guide using underline, glow, and restrained highlight rather than mixed patterns.
- Improved era tracking so the Galactic Eras rail reflects the current browsing position more accurately.

### Priority 7 — Control Styling

- Unified more inputs, toggles, chips, segmented controls, and preference controls around shared control styles.
- Reduced older border-heavy one-off treatments in preferences and mobile utility surfaces.
- Kept the HUD-style search/input language as the primary control reference.

### Priority 8 — Shared Primitives

- Replaced several one-off utility/button/chip/surface patterns in `app.js` with reusable classes from `styles.css`.
- Added and used shared primitives including:
  - `utility-section`
  - `utility-mobile-section`
  - `utility-mobile-row`
  - `utility-mobile-subsection`
  - `filter-sheet`
  - `filter-block`
  - `filter-option`
  - `filter-segment`
  - `filter-segment-button`
  - `filter-link-button`
  - `story-meta`
  - `story-meta-dot`
  - `nav-underline-button`
  - `control-pill`
  - `toggle-shell`
  - `ghost-button`
  - `glass-surface-soft`
- Consolidated repeated mobile utility-page shell and row patterns into shared primitives instead of repeated `glass-panel` class stacks.

### Priority 9 — Footer Endcap

- Reworked the footer into a softer cinematic endcap.
- Reduced the old bordered-strip feeling.
- Shifted footer branding and links onto softer glassy surfaces.

### Priority 10 — Final Subtraction Pass

- Removed a large amount of non-essential copy and micro-labeling from hero, filters, modal, stats, rail, and footer.
- Shortened labels so the app feels less narrated and more cinematic.
- Reduced duplicate phrasing across timeline and utility surfaces.

### Acceptance Audit — Legacy Feature Parity

- Completed the redesign vs legacy feature audit.
- Confirmed the redesign now covers the meaningful legacy behavior set:
  - timeline rendering from `timeline-data.json`
  - watched toggles for single items
  - episode-level progress for series
  - modal progress actions
  - persistence after reload
  - stats surfaces
  - preferences surfaces
  - background audio
  - search
  - canon/legends, media type, progress, era, and story-arc filters
  - sound effects preference
  - reduced-motion behavior
  - deep linking, share, Wookieepedia info, modal previous/next, and mixed-platform watch links
- Final audit verdict:
  - no remaining meaningful parity gaps were found
  - intentional product differences remain documented:
    - sorting removed because chronology is fixed
    - desktop stats moved from drawer to full page
    - desktop preferences moved from modal to full page
    - `Watch Mode` intentionally omitted

## Remaining

### Release Decision

- Completed:
  - `star-wars-timeline/` is now the primary public app path.
  - root content pages now live at:
    - `guide/`
    - `privacy/`
    - `terms/`
  - the promoted runtime, shell, styles, favicon, and content-page assets now live at the root.
  - `redesign/` now contains only:
    - `FEATURE_PARITY_PLAN.md`
    - `REDESIGN_CLEANUP_CHECKLIST.md`

### Pre-Merge Cleanup

- Do one final sanity pass after the entry-point decision is applied.

### Optional Polish

- Another tiny visual/content pass if you still want to refine the new favicon or the footer pages.
- Another optional screenshot-fidelity pass on the main timeline surfaces.

## Final State Snapshot

- All numbered cleanup priorities are complete.
- Legacy parity audit is complete.
- Design/UI implementation audit is complete.
- Cross-state flow QA is complete.
- `watchUrl` validation is complete.
- Deep link/share validation is complete.
- Wookieepedia info-link validation is complete.
- Modal previous/next validation is complete.
- Shell/app separation refactor is complete.
- Guide, privacy, and terms are now real product pages in the shared shell.
- The public product root now lives at `star-wars-timeline/` instead of `star-wars-timeline/redesign/`.
- Root `timeline-data.json` now serves correctly for the promoted app entry.
- `Chronological Viewing Order.md` is aligned with `timeline-data.json`.
- Page navigation now closes modal/filter overlays when leaving the timeline.
- A branded favicon is now wired across the app and content pages.

## Reference Notes Carried Forward

- The shell should avoid reading like a generic dark application and lean harder into campaign/editorial framing.
- The hero, controls, rail, cards, and utility surfaces should all feel like one cinematic system rather than separate UI modes.
- Shared fixes should continue to win over one-off surface patches whenever practical.
