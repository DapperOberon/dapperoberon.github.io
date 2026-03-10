# Star Wars Timeline — Phase 2 Plan

Status: Ready to execute  
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

Actions:
1. Inventory duplicate tokens for color, border, shadow, spacing, radius, motion.
2. Inventory repeated component states (`hover`, `active`, `focus-visible`, `disabled`).
3. Tag each section as: canonical, duplicate, override-only, or legacy.

Output:
- “Audit Matrix” appended to this file before code edits begin.

### WS3 — Layered CSS Refactor
Targets:
- `styles.css`

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
1. Build WS2 audit matrix from current `styles.css`.
2. Identify top 10 duplicate selector families by impact.
3. Implement WS3 in narrow passes with quick regression checks.

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
