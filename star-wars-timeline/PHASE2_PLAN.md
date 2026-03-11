# Star Wars Timeline — Phase 2 Plan

Status: In progress  
Owner: UI/System refactor pass  
Date: 2026-03-03

## 1) Objective
Refactor the timeline UI into a clearer, maintainable design system layer without changing product behavior or adding new feature scope.

## 2) Scope Boundaries

### In Scope
- Token cleanup and consolidation in `styles.css`.
- Component-level style normalization for shared primitives (buttons, chips, pills, cards, modal controls).
- Media-query consolidation and motion rule normalization.
- Regression checklist and rollout gates.

### Out of Scope
- New pages, filters, interactions, or layout concepts.
- Data model changes in timeline JSON.
- Rewrite of app architecture beyond required class hooks.

## 3) Success Criteria
- No diagnostics in timeline files.
- No regressions in: header/filter hierarchy, modal episodes list, mobile filters panel, stats drawer, settings modal.
- Single canonical style path per major component class (remove duplicate conflicting declarations).
- Consistent focus-visible and reduced-motion behavior.

## 4) Workstreams (Mapped to Task List)

### WS1 — Define Phase 2 Baseline (Complete)
Deliverables:
- Freeze UX contract from Phase 1.
- Document in-scope/out-of-scope and acceptance criteria.

Implementation Notes:
- Keep HTML structure stable unless needed to remove styling duplication.
- Any structural markup touch requires parity verification in desktop + mobile.

### WS2 — Audit Token + Component Usage
Targets:
- `styles.css`

Status:
- Completed

Actions:
1. Inventory duplicate tokens for color, border, shadow, spacing, radius, motion.
2. Inventory repeated component states (`hover`, `active`, `focus-visible`, `disabled`).
3. Tag each section as: canonical, duplicate, override-only, or legacy.

Output:
- “Audit Matrix” appended to this file before code edits begin.

### WS3 — Layered CSS Refactor
Targets:
- `styles.css`

Status:
- Completed

Actions:
1. Reorganize into strict order:
   - Foundations (reset/base/a11y)
   - Tokens
   - Primitive controls
   - Feature components
   - Responsive overrides
   - Motion/accessibility overrides
2. Move duplicate declarations to canonical component blocks.
3. Keep selector names unchanged where possible to avoid JS churn.

Definition of Done:
- No duplicate competing component blocks for the same selector family.

### WS4 — Standardize Interactive Primitives
Targets:
- `styles.css`
- `timeline.js` (only if class hook consistency requires minimal markup tweak)

Status:
- Completed

Actions:
1. Normalize shared control primitives:
   - filter buttons
   - utility pills
   - modal action buttons
   - active filter chips
   - entry-row actions
2. Align state behavior across components:
   - hover elevation
   - active press behavior
   - focus-visible ring strength
   - disabled contrast and cursor handling

Definition of Done:
- Every control family follows one visual state model.

### WS5 — Responsive + Motion Unification
Targets:
- `styles.css`

Status:
- Completed

Actions:
1. Consolidate overlapping mobile breakpoints.
2. Remove duplicate orientation-specific rules where unified rules suffice.
3. Ensure reduced-motion + less-motion settings neutralize transforms/animations consistently.

Definition of Done:
- One authoritative responsive rule path per component.

### WS6 — Regression + Rollout
Targets:
- `PHASE1_QA_CHECKLIST.md`
- New `PHASE2_QA_CHECKLIST.md`

Status:
- In progress

Actions:
1. Create focused Phase 2 regression checklist.
2. Run manual checks:
   - desktop + mobile filter flows
   - modal row rendering and action buttons
   - keyboard traversal and Escape behavior
   - stats drawer + settings modal parity
3. Mark release gate as pass/fail with notes.

Definition of Done:
- Checklist fully executed with unresolved regressions = 0.

## 5) Commit Boundaries
Use small, reviewable commits in this order:
1. `refactor(css): phase2 audit markers and token normalization scaffold`
2. `refactor(css): layer component styles into canonical sections`
3. `refactor(ui): standardize control primitives and interaction states`
4. `refactor(responsive): unify breakpoint and motion override paths`
5. `docs(qa): add phase2 checklist and sign-off notes`

## 6) Risk Register
- High risk: broad CSS movement can alter precedence unexpectedly.
- Medium risk: responsive consolidation can regress edge viewport layouts.
- Medium risk: modal action/layout overrides due to deep specificity.

Mitigations:
- Keep selector names stable.
- Refactor in small commits.
- Validate critical journeys after each commit.

## 7) Execution Order (Start Now)
Immediate next actions:
1. Continue WS3 narrow-pass cleanup for remaining selector families and responsive rule consolidation.
2. Use `PHASE2_QA_CHECKLIST.md` after each meaningful Phase 2 batch.
3. Finish WS4/WS5 consistency cleanup, then perform final regression sign-off.

### Progress Snapshot (2026-03-10)
- [x] `:root` token duplication consolidated into one canonical block
- [x] Canonical block map and planned moves documented for Phase 2 selector families
- [x] Filter family deduplicated (`.filters-toggle[aria-expanded="true"]`, `.filters-panel`, `.filters-row`)
- [x] `command-deck-row` deduplicated to one base definition
- [x] `episode-list-wrapper` and `episode-list` collapsed to modal-specific canonical definitions
- [x] `PHASE2_QA_CHECKLIST.md` created
- [x] Reduced-motion runtime handling updated to react to OS preference changes
- [x] Duplicate targeted reduced-motion override block removed
- [x] Redundant modal mobile breakpoint declarations trimmed
- [x] Disabled-state baseline aligned across shared control families
- [x] Remaining WS3 cleanup for selector families outside the current audit set
- [x] Remaining WS4 hover/active/focus normalization across control primitives
- [ ] Final WS5 responsive rule consolidation and motion-path verification
- [ ] WS6 regression execution and release sign-off

### Progress Snapshot (2026-03-11)
- [x] Consolidated press/active interaction behavior into one shared control rule for filter buttons, modal buttons, active-filter chips, clear chips, and entry-row actions
- [x] Removed redundant tablet-only `.filters-row` spacing declaration that duplicated base behavior
- [x] Folded stats utility controls into the shared pressed-state model and removed their duplicate local focus/press overrides
- [x] Removed redundant mobile `.filters-panel` overlap override that matched the base declaration
- [x] Removed duplicate local focus/hover/active state rules now covered by canonical shared control blocks
- [x] Removed older hover overrides for selector families already owned by the canonical Phase 2 surface layer
- [x] WS4 hover/focus normalization across audited control primitives
- [x] Reduced `Less Motion` transform paths across control surfaces and animated filter-panel content
- [x] WS5 responsive and motion cleanup completed in code
- [x] Code-level WS6 verification completed for accessibility/motion and persistence flows
- [x] Chromium browser QA pass completed for desktop header/filter shell, settings/stats controls, modal layout, and key mobile filter/modal flows
- [x] Chromium modal-state QA completed for watched-row, disabled-button, and long-list scroll paths
- [x] Final WS5 motion-path verification completed for filters panel open/close transitions
- [x] WS6 regression execution and release sign-off completed

## 8) WS2 Audit Matrix (Initial)

Legend:
- Canonical: keep as source of truth.
- Duplicate: repeated with overlapping intent.
- Override-only: keep only if truly breakpoint/variant specific.
- Legacy: candidate for removal after parity check.

| Selector / Family | Current Locations | Classification | Risk | Refactor Direction |
|---|---|---|---|---|
| `:root` tokens | ~L128, ~L3866 | Duplicate | High | Consolidate into one canonical token block; keep theme-specific tokens grouped, avoid re-declaring shared card tokens twice. |
| `.filters-panel` | ~L953, ~L4185, ~L4282(media) | Duplicate + Override-only | High | Keep one base block + one mobile override block; remove overlapping max-height/padding/transition declarations. |
| `.filters-row` + nested variants | ~L1015, ~L2932(media), ~L4206, ~L4211, ~L4222, ~L4333(media) | Duplicate | High | Collapse to one base `.filters-row` and one panel-state variant, then keep only minimal media deltas. |
| `.filters-toggle[aria-expanded="true"]` | ~L942, ~L4181 | Duplicate | Medium | Keep one canonical expansion state and merge border-radius/border-bottom behavior into tokenized control state model. |
| `.command-deck-row` | ~L673, ~L2504(media), ~L4151, ~L4286(media) | Duplicate | Medium | Keep one base desktop layout + one mobile stack override; remove second desktop declaration set. |
| `.modal-actions` | ~L3286, ~L3435(media), ~L3465(media) | Override-heavy | Medium | Keep base flex/grid decision in one place and retain only truly necessary breakpoint grid toggles. |
| `.episode-list-wrapper` | ~L2245, ~L3183 | Duplicate | High | Make modal-specific wrapper canonical for modal context; keep non-modal list wrapper separated by explicit scope if still needed. |
| `.episode-list` | ~L2262, ~L3202, ~L3451(media) | Duplicate + Override-only | High | Keep modal canonical list styles (incl. clipping gutters) and reduce generic list duplication; keep narrow mobile height override only. |

### Top 8 Priority Families (by impact)
1. `:root` token duplication
2. `.filters-panel`
3. `.filters-row`
4. `.episode-list`
5. `.episode-list-wrapper`
6. `.command-deck-row`
7. `.filters-toggle[aria-expanded="true"]`
8. `.modal-actions`

### WS2 Exit Criteria (to begin WS3)
- Confirm canonical block location for each priority family.
- Mark expected deletions/moves per family before applying edits.
- Preserve modal row clipping fix (`.episode-list` guttering and watched-row hover behavior) as non-regression constraints.

### WS2 Canonical Block Map (Confirmed)

| Selector / Family | Canonical Block | Keep | Move / Remove |
|---|---|---|---|
| `:root` tokens | Primary token block near top of `styles.css` (`~L128`) | All global tokens live here as the single source of truth. | Remove later duplicate token block. |
| `.filters-panel` | Refined filter-panel block in the Phase 1 surface layer (`~L4185`) | Base panel shell, padding model, border treatment, open-state border logic. | Fold structural animation properties from early block into canonical block, then remove duplicate base/open declarations from `~L953` and keep only necessary mobile overrides. |
| `.filters-row` | Base row at `~L1015`, with panel-scoped variant at `~L4211` | Generic row layout stays in the earlier shared filters section; panel-specific padding/animation stays scoped under `.filters-panel .filters-row`. | Remove duplicate later base row at `~L4206`; keep only true responsive deltas in media queries. |
| `.filters-toggle[aria-expanded="true"]` | Later control-state block in Phase 1 surface layer (`~L4181`) | Expanded-state seam behavior for the refined filter surface. | Merge radius and border-bottom behavior into one declaration and remove the earlier duplicate at `~L942`. |
| `.command-deck-row` | Early structural layout block in filters/header section (`~L673`) | Base flex alignment and gap remain canonical. | Move border/padding refinements from `~L4151` into the canonical block, then remove the later duplicate desktop block and keep mobile-only overrides. |
| `.modal-actions` | Modal section base block (`~L3286`) | Base action layout belongs with modal component styles. | Keep only responsive layout changes in modal media queries; remove any duplicate base-like declarations from responsive sections if found. |
| `.episode-list-wrapper` | Modal-specific wrapper block in modal section (`~L3183`) | Visual shell, flex behavior, border, shadow, and modal-specific overflow handling. | Scope any generic fade-overlay behavior explicitly if it is still needed outside the modal; remove the unspecific early duplicate at `~L2245` once parity is verified. |
| `.episode-list` | Modal-specific list block in modal section (`~L3202`) | Canonical gutter, gap, scrolling, and flex behavior tied to the modal clipping fix. | Remove the early generic `overflow-y` block at `~L2262` after confirming no non-modal callers rely on it; keep only narrow responsive height/spacing overrides. |

### WS2 Planned Moves / Deletions

- `:root`
  Keep the top-level token section as canonical. The duplicate Phase 1 token block has already been removed as part of the first Phase 2 pass.

- `.filters-panel`
  Merge structural animation concerns from the early block (`max-height`, visibility, pointer-events, transform origin, transition timing, `--filters-panel-open-height`, `--filters-panel-overlap`) into the later refined surface block. After that, delete the early duplicate base/open block and retain only mobile-specific overrides.

- `.filters-row`
  Preserve the early shared row layout for all filter rows. Keep the later `.filters-panel .filters-row` and `.filters-panel.open .filters-row` as the only panel animation path, and remove the later duplicate plain `.filters-row` declaration plus redundant media-query restatements that do not change behavior.

- `.filters-toggle[aria-expanded="true"]`
  Collapse the two expanded-state declarations into the later control-state block so the seam treatment is defined once. Remove the earlier duplicate after the merged state is in place.

- `.command-deck-row`
  Keep the early layout definition as the home for base structure. Fold in the later border-bottom and padding refinements, then delete the later duplicate desktop block. Preserve only the mobile stack override and any truly tablet-specific delta.

- `.modal-actions`
  Keep the modal component block as canonical. Trim responsive sections so they only express layout changes required by viewport size and do not restate base flex behavior.

- `.episode-list-wrapper`
  Treat the modal section as canonical because the wrapper’s current job is primarily modal-specific. If the top-level fade overlay is still needed, re-scope it to a modal selector or a clearly named variant; otherwise remove the early generic wrapper block.

- `.episode-list`
  Keep the modal section block as canonical to protect the clipping/gutter fix. Delete the earlier generic list rule after confirming there is no second usage site, and keep only the responsive max-height or spacing overrides that materially change small-screen behavior.
