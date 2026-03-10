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
- [ ] `Stats` and `Preferences` remain grouped in the utility row
- [ ] Search input and `Continue Where I Left Off` remain aligned in the command row
- [ ] `More Filters` row visually connects to the expanded panel without a seam or corner artifact
- [ ] Command row border, spacing, and padding still match the refined Phase 1 shell

### B. Filter Panel Behavior
- [ ] Opening `More Filters` animates smoothly without snapping
- [ ] Closing `More Filters` animates smoothly without clipped content
- [ ] Changing primary quick filters does not collapse the panel on desktop
- [ ] Clicking outside the filter region closes the panel
- [ ] Active filter chips still render below the panel, not inside it

### C. Filter Density + Wrapping
- [ ] Filter groups keep consistent gap and padding after the CSS consolidation
- [ ] Wrapped filter buttons do not clip or overlap
- [ ] `More Filters (N)` count still reflects only secondary filters

## Modal Regression

### D. Episode List
- [ ] Opening an entry modal still renders the episode list correctly
- [ ] Episode list container retains its border, background, and spacing
- [ ] Episode rows do not clip on any edge
- [ ] Watched rows keep the fixed hover/border behavior
- [ ] Episode list scrolls correctly on long shows

### E. Modal Actions
- [ ] `Mark Next Episode`, `Mark All Watched`, and `Close` retain correct alignment on desktop
- [ ] Buttons do not collapse or wrap unexpectedly
- [ ] Disabled button state still reads clearly

## Mobile Regression

### F. Filters
- [ ] Search, command row, and quick filters stack cleanly on mobile
- [ ] Expanded `More Filters` panel still shows all secondary controls
- [ ] Selecting a secondary filter still collapses the panel on mobile
- [ ] Filter group spacing remains readable at narrow widths

### G. Modal Layout
- [ ] Modal action buttons switch to the intended responsive layout
- [ ] Episode list remains scrollable inside the modal on mobile
- [ ] No content is clipped at the bottom of the modal

## Accessibility + Motion
- [ ] Keyboard `Tab` navigation still reaches all filter controls, modal controls, and drawer controls
- [ ] `Escape` still closes the filter panel, modal, stats drawer, and settings modal
- [ ] Focus-visible styling remains consistent across filter buttons, pills, modal buttons, and episode rows
- [ ] With `Less Motion` enabled, major transforms and smooth-scrolling behavior are reduced as expected
- [ ] With OS reduced-motion enabled, animation-heavy surfaces still behave safely

## Persistence + State
- [ ] Watched progress still persists after reload
- [ ] `Continue Where I Left Off` still finds the next entry when progress exists
- [ ] Collapsed era state still persists after reload
- [ ] Preferences toggles still persist after reload

## Release Gate
- [ ] PASS Desktop Regression
- [ ] PASS Modal Regression
- [ ] PASS Mobile Regression
- [ ] PASS Accessibility + Motion
- [ ] PASS Persistence + State
- [ ] PASS Final Phase 2 Sign-off

## Notes
- Capture viewport size, exact interaction path, and screenshot for any failure.
- Patch only the failing path before continuing broader refactors.
