# Redesign Cleanup Checklist

Status: Active  
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

## Remaining

### Acceptance QA

#### 1. Legacy Feature Parity Audit

- Confirm there are no important functions from the previous app that are still missing in `redesign/`.

Current audit status:

- Matched:
  - timeline rendering from `timeline-data.json`
  - watched toggles for single items
  - episode-level progress for series
  - modal progress actions
  - persistence after reload
  - stats surfaces
  - preferences surfaces
  - background audio
  - search
  - canon/legends, media type, progress, and era filters
  - story-arc filters (`Clone Wars`, `Mandoverse`, `Sequel Era`, `George Lucas`)
  - `Sound FX` preference
  - reduced-motion behavior via `prefers-reduced-motion`
- Intentionally changed:
  - sorting removed because chronology is fixed by product design
  - desktop stats moved from drawer to full page
  - desktop preferences moved from modal to full page
  - theme selection reduced to redesign-specific interface modes instead of the older legacy theme picker
- Intentionally omitted:
  - `Watch Mode` preference

Testing plan:
- Compare the legacy app feature set against the redesign feature set one category at a time:
  - timeline rendering
  - search
  - filters
  - watched toggles
  - episode progress
  - modal actions
  - persistence after reload
  - stats
  - preferences
  - audio
- For each category, mark one of:
  - matched
  - intentionally changed
  - missing
- Record any missing or intentionally deferred behavior before merge.

#### 2. Design/UI Implementation Audit

- Confirm there are no design-facing controls or affordances in the redesign that appear interactive but are not actually implemented.

Current audit status:

- Implemented and behaving as real controls:
  - hero CTAs
  - timeline card primary actions on desktop and mobile
  - modal close controls
  - modal primary CTA
  - episode watched toggles on desktop and mobile
  - filter open/close/apply/clear flows
  - filter era/type/canon/progress controls
  - stats “open entry” actions
  - preferences toggles, ranges, theme controls, reset, and audio controls
  - desktop/mobile page nav
  - audio controls in top bar, mobile player, and preferences
- Resolved during audit:
  - removed the dead mobile top-left menu button from the header
  - mobile top-left menu button is intentionally removed and should stay removed
- Remaining verification focus:
  - re-check that every remaining visible button or input performs a real action
  - confirm no decorative icon still reads like a primary affordance
- Product follow-up todos accepted from audit:
  - modal `Info` action is now implemented and opens the entry's stored Wookieepedia article
  - Disney+ play actions now support real external URLs when `episodeDetails[].disneyPlusUrl` is present; current test cases are `The Clone Wars - S1.E1 - Ambush` and the `The Clone Wars` film entry
  - modal previous/next entry navigation is now implemented for desktop and mobile using the current filtered chronology
  - deep linking and share are now implemented using the entry's unique id plus a readable title slug in the URL

Testing plan:
- Click or activate every visible interactive element on desktop and mobile:
  - hero CTAs
  - timeline card actions
  - modal primary/secondary actions
  - filter controls
  - stats actions
  - preferences controls
  - audio controls
  - rail/mobile nav actions
- For each item, verify:
  - it performs a real action
  - its state updates correctly
  - it does not appear as dead chrome
- Remove, disable, or implement anything that still reads as a fake control.

#### 3. Cross-State Flow QA

- Confirm the redesign flow works cleanly across major states on both desktop and mobile.

Testing plan:
- Desktop flow:
  - load timeline
  - search and filter
  - open modal
  - mark items watched / update episodes
  - close modal
  - move to stats
  - move to preferences
  - return to timeline
  - reload and verify persistence
- Mobile flow:
  - load timeline
  - use bottom nav
  - open filters
  - open modal
  - update watched state
  - move to stats
  - move to preferences
  - verify bottom nav persistence
  - verify mobile audio behavior
  - reload and verify persistence
- During both flows, verify:
  - no overlapping fixed UI blocks content
  - no focus/overlay trap regressions
  - no stale state after page switches
  - no labels/buttons become inconsistent after state changes

### Final Cleanup Pass

- Do a final spacing and typography consistency sweep across timeline, modal, stats, preferences, and footer.
- Review the remaining one-off class patterns in `redesign/app.js` and replace the best candidates with shared primitives.
- Do a last visual acceptance pass against the reference screenshots after cleanup is complete.

### Optional Fidelity Work

- Another desktop hero and desktop timeline rhythm pass if tighter screenshot fidelity is still desired.
- Another modal fidelity pass if we want to push closer to the desktop/mobile modal references.

### Pre-Merge Cleanup

- Simplify any stale or overly branched logic in `redesign/app.js`.
- Decide whether `redesign/` becomes the new primary app entry.
- If yes, do final merge prep and cleanup refactor.

## Reference Notes Carried Forward

- The shell should avoid reading like a generic dark application and lean harder into campaign/editorial framing.
- The hero, controls, rail, cards, and utility surfaces should all feel like one cinematic system rather than separate UI modes.
- Shared fixes should continue to win over one-off surface patches whenever practical.
