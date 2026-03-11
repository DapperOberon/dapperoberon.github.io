# Star Wars Timeline — Phase 2 QA Checklist

Scope: Phase 2 design-system and CSS consolidation pass.
Run on local server (`http://localhost:8000/star-wars-timeline/`) in desktop and mobile viewports after each meaningful Phase 2 refactor batch.

## Setup
- [ ] Hard refresh (`Ctrl+Shift+R`)
- [ ] Clear active filters (`Clear all` if shown)
- [ ] Confirm no stale modal is open on load
- [ ] Confirm `Watch Mode` is OFF in Preferences unless a check requires it
- [ ] Confirm `Less Motion` is OFF for standard motion checks

## Desktop Regression

### A. Header + Filter Shell
- [x] `Stats` and `Preferences` remain grouped in the utility row
- [x] Search input and `Continue Where I Left Off` remain aligned in the command row
- [x] `More Filters` row visually connects to the expanded panel without a seam or corner artifact
- [x] Command row border, spacing, and padding still match the refined Phase 1 shell

### B. Filter Panel Behavior
- [x] Opening `More Filters` animates smoothly without snapping
- [x] Closing `More Filters` animates smoothly without clipped content
- [x] Changing primary quick filters does not collapse the panel on desktop
- [x] Clicking outside the filter region closes the panel
- [x] Active filter chips still render below the panel, not inside it

### C. Filter Density + Wrapping
- [x] Filter groups keep consistent gap and padding after the CSS consolidation
- [x] Wrapped filter buttons do not clip or overlap
- [x] `More Filters (N)` count still reflects only secondary filters

## Modal Regression

### D. Episode List
- [x] Opening an entry modal still renders the episode list correctly
- [x] Episode list container retains its border, background, and spacing
- [x] Episode rows do not clip on any edge
- [x] Watched rows keep the fixed hover/border behavior
- [x] Episode list scrolls correctly on long shows

### E. Modal Actions
- [x] `Mark Next Episode`, `Mark All Watched`, and `Close` retain correct alignment on desktop
- [x] Buttons do not collapse or wrap unexpectedly
- [x] Disabled button state still reads clearly

## Mobile Regression

### F. Filters
- [x] Search, command row, and quick filters stack cleanly on mobile
- [x] Expanded `More Filters` panel still shows all secondary controls
- [x] Selecting a secondary filter still collapses the panel on mobile
- [x] Filter group spacing remains readable at narrow widths

### G. Modal Layout
- [x] Modal action buttons switch to the intended responsive layout
- [x] Episode list remains scrollable inside the modal on mobile
- [x] No content is clipped at the bottom of the modal

## Accessibility + Motion
- [x] Keyboard `Tab` navigation still reaches all filter controls, modal controls, and drawer controls
- [x] `Escape` still closes the filter panel, modal, stats drawer, and settings modal
- [x] Focus-visible styling remains consistent across filter buttons, pills, modal buttons, and episode rows
- [x] With `Less Motion` enabled, major transforms and smooth-scrolling behavior are reduced as expected
- [x] With OS reduced-motion enabled, animation-heavy surfaces still behave safely

## Persistence + State
- [x] Watched progress still persists after reload
- [x] `Continue Where I Left Off` still finds the next entry when progress exists
- [x] Collapsed era state still persists after reload
- [x] Preferences toggles still persist after reload

## Release Gate
- [x] PASS Desktop Regression
- [x] PASS Modal Regression
- [x] PASS Mobile Regression
- [x] PASS Accessibility + Motion
- [x] PASS Persistence + State
- [x] PASS Final Phase 2 Sign-off

## Notes
- Capture viewport size, exact interaction path, and screenshot for any failure.
- Patch only the failing path before continuing broader refactors.

---

## Agent Progress (2026-03-10)

### Completed Phase 2 Deliverables
- [x] Focused Phase 2 checklist created
- [x] Phase 1 baseline preserved and signed off before continuing Phase 2
- [x] Token cleanup started and duplicate root token path removed
- [x] Filter shell canonicalized across base/open/mobile paths
- [x] Modal episode list canonicalized to one selector path
- [x] `command-deck-row` canonicalized to one selector path
- [x] WS3 selector-family cleanup completed across the audited canonical set
- [x] Reduced-motion runtime path improved
- [x] Shared disabled-state consistency pass started for control primitives
- [x] Shared pressed-state consistency pass applied across key control families
- [x] Removed one redundant tablet filter-row spacing override
- [x] Stats utility controls moved onto the shared pressed-state path
- [x] Removed one redundant mobile filter-panel overlap override
- [x] Removed duplicate local focus/hover/active rules superseded by canonical control blocks
- [x] Removed redundant older hover overrides superseded by the Phase 2 surface layer
- [x] WS4 control-state normalization pass completed across audited primitives
- [x] Less-motion transform suppression expanded across control and filter-panel surfaces
- [x] WS5 responsive and motion cleanup completed in code

### Remaining For Final QA Run
- [x] Record final pass/fail notes for desktop, modal, mobile, and release gates

### Agent QA Run (2026-03-11, code verification)
- [x] Verified keyboard-trap and `Escape` close paths in filter panel, modal, stats drawer, and settings modal
- [x] Verified shared focus-visible coverage for audited control families and episode-row focus states
- [x] Verified `Less Motion` and OS reduced-motion code paths for scroll behavior, transitions, and transform suppression
- [x] Verified watched progress, collapsed era state, continue action, and preferences persistence via storage-backed code paths

### Agent QA Run (2026-03-11, Chromium Playwright)
- [x] Verified desktop header shell layout, filters panel open state, active filter chips placement, and filtered card rendering
- [x] Verified desktop quick-filter changes keep the panel open and outside-click dismissal closes the panel
- [x] Verified mixed secondary filters update the `More Filters` active count (`2 ACTIVE` in Chromium)
- [x] Verified filters panel open/close paths transition over time rather than snapping (`0 -> 2 -> 69.31 -> 83.83` open, `83.83 -> 50.73 -> 14.58 -> 0.02` close)
- [x] Verified desktop modal open path, multi-episode list rendering, and action-button alignment
- [x] Verified long-show modal episode lists scroll on desktop and mobile via inner episode-list scroll position
- [x] Verified watched episode rows enter the watched-state styling path and disabled modal buttons remain readable in completed-state UI
- [x] Verified desktop settings modal and stats drawer open correctly; `Less Motion` toggle changes state
- [x] Verified mobile header/filter stack, expanded filters panel layout, secondary-filter collapse behavior, and filtered card rendering
- [x] Verified mobile modal responsive action layout and bottom-of-modal visibility
- [x] Captured desktop and mobile viewport screenshots for baseline, filters-open, filter-active, and modal states

### Final Pass/Fail Notes (2026-03-11)
- [x] Desktop Regression: Pass
- [x] Modal Regression: Pass
- [x] Mobile Regression: Pass
- [x] Accessibility + Motion: Pass
- [x] Persistence + State: Pass
- [x] Phase 2 Sign-off: Pass
