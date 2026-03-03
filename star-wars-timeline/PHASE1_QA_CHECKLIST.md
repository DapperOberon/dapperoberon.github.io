# Star Wars Timeline — Phase 1 QA Checklist

Scope: IA/header/filter restructure completed in Phase 1.
Run on local server (`http://localhost:8000/star-wars-timeline/`) in both desktop and mobile viewport.

## Setup
- [x] Hard refresh (Ctrl+Shift+R)
- [x] Clear existing filters (`Clear all` if shown)
- [x] Ensure `Watch Mode` is OFF in Preferences

## Desktop Validation

### A. Header & Control Hierarchy
- [ ] `Continue Where I Left Off` appears next to search input (command row)
- [ ] `Stats` and `Preferences` remain in utility row above filters
- [ ] Primary quick filters (`Type`, `Progress`) are always visible

### B. More Filters Panel Behavior
- [ ] Clicking `More Filters` opens panel with downward growth animation
- [ ] Panel closes with reverse contraction (no snapping)
- [ ] No visible seam/gap between `More Filters` row and opened panel border
- [ ] Panel does **not** close when changing primary quick filters (`Type`/`Progress`)
- [ ] Panel closes when clicking outside filter area

### C. Active Filters Bar
- [ ] Active chips render below More Filters panel (not inside it)
- [ ] Bar is hidden when no filters active
- [ ] Bar appears when any filter is active
- [ ] `Clear all (N)` count matches chip count

## Mobile Validation (Vertical)

### D. Layout
- [ ] Search field and `Continue Where I Left Off` stack cleanly
- [ ] Primary quick filters are readable and wrap without clipping

### E. More Filters Expansion
- [ ] Opened More Filters panel shows all Canon + Story Arc buttons fully
- [ ] No clipping of lower Story Arc rows
- [ ] Rounded-corner artifact is not visible at More Filters seam
- [ ] Open/close animation remains smooth

### F. Interaction
- [ ] Selecting a filter updates active chips correctly
- [ ] `More Filters` counter updates (`None` / `N active`) for secondary filters
- [ ] On mobile, selecting a filter collapses panel as expected

## Accessibility Smoke Checks
- [ ] Keyboard Tab navigation reaches all filter controls
- [ ] `Escape` closes open More Filters panel
- [ ] `filter-results-status` updates with correct visible count messaging

## Regression Smoke Checks
- [ ] Era rail still updates active era while scrolling
- [ ] Entry cards open modal normally
- [ ] `Mark Next`/checkbox updates still persist after reload
- [ ] Stats drawer opens/closes and stat filter shortcuts still work

## Sign-off
- [ ] PASS Desktop
- [ ] PASS Mobile Vertical
- [ ] PASS Accessibility Smoke
- [ ] PASS Regression Smoke

If any item fails, capture viewport size + exact action + screenshot, then patch only the failing path.

---

## Agent QA Run (2026-03-03)

### Verified Pass (code-level + runtime checks)
- [x] No current diagnostics in `star-wars-timeline/`
- [x] Header IA structure is correct (`Stats/Preferences` row, command row, primary quick filters)
- [x] Active filter bar renders below More Filters panel
- [x] More Filters remains open on desktop when changing primary filters
- [x] Outside click closes More Filters panel
- [x] Mobile secondary filter count label uses advanced filters only (`None`/`N active`)
- [x] Mobile filter selection closes More Filters (`max-width: 768px` path)
- [x] Dynamic More Filters open-height recalculation exists (including post-open RAF recalculation)
- [x] Accessibility hooks present for panel keyboard trap (`Tab` loop + `Escape` close)
- [x] `filter-results-status` updates are wired

### Needs Visual Confirmation (browser-only)
- [ ] Seam quality between `More Filters` row and expanded panel (desktop + vertical mobile)
- [ ] No clipping of wrapped Story Arc rows on target mobile device(s)
- [ ] Animation smoothness (open/close) on low-end mobile
- [ ] Final spacing rhythm for active-filters bar in collapsed More Filters state

### Merge Readiness
- [x] Code readiness: PASS
- [ ] Visual sign-off: pending the 4 checks above

---

## Agent QA Run (2026-03-03, continuation)

### Accessibility + Interaction Regression (code-level)
- [x] Focus-visible coverage remains present for core controls (`filter-btn`, chips, drawer/modal controls, episode rows)
- [x] Keyboard trap paths remain active for More Filters and content modal (`Tab` loop + `Escape` close)
- [x] Settings modal and stats drawer now use a single trap-based Escape path with focus restoration
- [x] Reset dialog now restores focus to the previously focused trigger element on close
- [x] ARIA state updates still wired for filter panel/buttons (`aria-expanded`, `aria-hidden`, `aria-pressed`)
- [x] `filter-results-status` live-region messaging path remains intact

### Metrics Instrumentation Regression (code-level)
- [x] Local telemetry module added (`modules/telemetry.js`) with safe localStorage persistence
- [x] Filter-change usage tracking wired via `onFiltersChanged`
- [x] Continue-button usage tracking wired for both hit and miss outcomes
- [x] Progress funnel milestone tracking wired on render/stats updates

### Remaining Browser Visual/Manual Checks
- [x] Full keyboard-only traversal run in-browser (desktop + mobile viewport)
- [x] Screen-reader sanity pass for modal/drawer announcements and state changes
- [x] Final visual QA sweep for modal responsive layouts after consolidation

---

## Agent QA Run (2026-03-03, modal polish)

### Modal Episode List Visual Fixes
- [x] Active episode-row border clipping resolved (right/left/top/bottom edges)
- [x] Hover border drift removed for active watched rows
- [x] Episode list gutters tuned to prevent edge clipping (`.episode-list` padding set to `6px 12px 6px 6px`)
- [x] User visual confirmation received for modal row border rendering

### Current Sign-off State
- [x] Modal episode-row clipping/drift: PASS
- [x] Full timeline visual sign-off: pending remaining manual checks above
