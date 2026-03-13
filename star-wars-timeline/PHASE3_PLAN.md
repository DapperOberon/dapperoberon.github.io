# Star Wars Timeline — Phase 3 Plan

Status: Complete
Owner: Theme system / visual identity pass
Date: 2026-03-12

## Progress Snapshot

Current implementation status:
- WS1 complete
- WS2 complete
- WS3 complete
- WS4 complete
- WS5 complete
- WS6 complete

Implemented so far:
- shared semantic theme contract in `styles.css`
- theme runtime + persistence
- Preferences theme selector
- baseline `modern-starwars` theme
- `holonet-archive` theme
- `prequel-portal` theme
- `databank-dashboard` theme

Current next priorities:
1. Collect post-release polish notes if needed
2. Decide whether Holonet or Prequel need additional aesthetic refinement
3. Begin planning future theme expansion only if desired

## 1) Objective
Add a maintainable theme system that lets the timeline adopt distinct StarWars.com-inspired aesthetics without changing the existing product structure, data model, or interaction behavior.

## 2) Scope Boundaries

### In Scope
- Theme architecture built on top of the Phase 2 design system work.
- Theme tokens for color, typography, borders, shadows, surfaces, and atmospheric backgrounds.
- A user-selectable aesthetic mode stored in preferences.
- Initial release of a small curated theme set derived from `StarWars.com_Notes.md`.
- Theme QA for accessibility, responsiveness, persistence, and UI parity.

### Out of Scope
- Full per-year historical recreation of every StarWars.com snapshot.
- Structural rewrites of page layout for individual themes.
- New timeline content features unrelated to theming.
- Custom theme builder or user-authored themes.
- Replacing the current UX with non-responsive legacy page structures.

## 3) Success Criteria
- Theme switching does not break layout, accessibility, or persistence behavior.
- Shared components remain driven by canonical theme tokens instead of one-off theme overrides.
- All themes preserve readable contrast, focus-visible behavior, and reduced-motion support.
- The first theme set feels intentionally distinct, not like minor recolors.
- Theme choice persists across reloads and sessions.

## 4) Theme Principles
- Themes change presentation, not product behavior.
- Layout structure stays stable unless a very small, shared enhancement is required.
- Tokens first, component overrides second, one-off patches last.
- Each theme needs a clear visual thesis.
- Accessibility and responsive behavior are non-negotiable across all themes.

## 5) Initial Theme Set
Use 4 themes for the first release instead of 17 individual skins.

### Theme A — Holonet Archive
Primary references:
- 1997-01-13
- 1997-07-03
- 1998-02-15

Visual thesis:
- archival terminal / proto-web / sparse galactic briefing

Key traits:
- black or charcoal base
- pale serif body text
- green link/data accents
- thin rule lines and simple framed surfaces
- map-room / mission-briefing atmosphere

### Theme B — Prequel Portal
Primary references:
- 1998-12-02
- 2000-02-29
- 2001-06-29
- 2002-08-27

Visual thesis:
- metallic prequel-era portal with parchment, chrome, and promo-art tension

Key traits:
- sand, bronze, chrome, and black
- metallic headers and framed module shells
- stronger promo-art hero styling
- sidebar/utility-panel DNA expressed through shared surfaces

### Theme C — Databank Dashboard
Primary references:
- 2004-02-24
- 2006-02-09
- 2009-04-02

Visual thesis:
- Lucasfilm control room / dashboard / databank terminal

Key traits:
- steel blue and gunmetal surfaces
- angular frames and beveled corners
- dense utility-card look
- high-contrast labeled modules and command-center atmosphere

### Theme D — Modern StarWars.com
Primary references:
- 2011-10-01
- 2013-04-01
- 2015-01-23
- 2015-04-30
- 2019-08-31
- 2019-12-01
- 2026-03-10

Visual thesis:
- premium franchise editorial / streaming / promo shell

Key traits:
- dark shell with cinematic hero treatment
- sharper card hierarchy
- stronger accent color rails and CTA polish
- modern campaign-grid feel with higher production surfaces

## 6) Theme Contract
Themes are allowed to change:
- color tokens
- typography tokens
- background/texture tokens
- border radius tokens
- shadow/glow tokens
- hero surface treatment
- card and panel skin treatment
- icon/accent treatment where shared hooks already exist

Themes must not change:
- content model
- filtering logic
- modal behavior
- keyboard paths
- persistence rules except for storing selected theme
- responsive layout model beyond token-driven styling differences

## 7) Workstreams

### WS1 — Define Theme Token Contract
Targets:
- `styles.css`
- theme notes / planning docs

Actions:
1. Inventory all remaining hardcoded surface/color values that should become theme tokens.
2. Separate base semantic tokens from theme-assigned tokens.
3. Define the minimum token set required for all major surfaces.

Minimum token families:
- page background
- elevated surface background
- hero background
- panel border
- primary text
- secondary text
- accent
- accent-strong
- focus ring
- shadow/glow
- CTA surface
- nav chrome
- card skin
- modal skin

Definition of Done:
- A shared theme token contract exists and all core surfaces can map to it.

Status:
- Done on 2026-03-13
- Shared semantic tokens now cover page, shell, panel, card, rail, era header, badge, modal, and switch surfaces.

### WS2 — Build Theme Runtime + Persistence
Targets:
- `timeline.js`
- `modules/persistence.js`
- `index.html` if a minimal root hook is needed

Actions:
1. Add a single root theme hook, preferably `data-theme` on `body` or `documentElement`.
2. Add theme preference persistence.
3. Restore saved theme on load before major UI paint where feasible.
4. Provide a safe default theme fallback.

Definition of Done:
- Theme selection persists and applies reliably with no broken default state.

Status:
- Done on 2026-03-12

### WS3 — Add Theme Selector UI
Targets:
- `timeline.js`
- settings/preference UI styles

Actions:
1. Add theme selection to the existing Preferences flow rather than creating a new control surface.
2. Keep the selector compact and explicit.
3. Ensure theme names are user-facing and readable.
4. Do not overload the selector with all historical dates in v1.

Definition of Done:
- Users can switch between the initial theme set from Preferences with clear labeling.

Status:
- Done on 2026-03-12

### WS4 — Implement Theme Skins
Targets:
- `styles.css`

Actions:
1. Implement theme token overrides for the 4 initial themes.
2. Limit component-specific theme overrides to areas where tokens alone are insufficient.
3. Keep overrides grouped by theme and surface family.
4. Preserve one canonical component structure across themes.

High-priority themed surfaces:
- page shell
- hero/header shell
- filter controls
- command row
- cards
- active filter chips
- stats drawer
- settings modal
- entry modal
- timeline section headers
- CTA buttons

Definition of Done:
- All 4 themes feel materially distinct while maintaining the same interaction model.

Status:
- Done on 2026-03-13
- Initial theme set now includes `modern-starwars`, `holonet-archive`, `prequel-portal`, and `databank-dashboard`.
- Further aesthetic refinement can continue under QA and sign-off without blocking WS4 completion.

### WS5 — Motion, Accessibility, and Contrast Pass
Targets:
- `styles.css`
- theme runtime as needed

Actions:
1. Validate focus-visible treatment in each theme.
2. Validate contrast for text, buttons, chips, and modal actions.
3. Ensure themed glows/shadows do not reduce readability.
4. Ensure reduced-motion and less-motion paths remain intact across themes.

Definition of Done:
- Themes preserve accessibility and motion behavior parity.

Status:
- Done on 2026-03-13
- QA checklist created
- Formal Chromium automation pass completed for all 4 themes
- Manual visual screenshot review completed for all 4 themes
- Keyboard focus smoke and less-motion verification completed across all 4 themes
- No release-blocking issues identified in current coverage

### WS6 — Regression + Sign-off
Targets:
- New `PHASE3_QA_CHECKLIST.md`
- optional screenshot artifacts

Actions:
1. Create a focused theme QA checklist.
2. Validate each theme in desktop and mobile viewports.
3. Validate persistence, selector behavior, and modal/filter parity.
4. Record release gates and sign-off notes.

Definition of Done:
- All initial themes pass regression and accessibility checks with unresolved issues = 0.

Status:
- Done on 2026-03-13
- QA checklist created
- Theme-by-theme automation execution completed
- Manual visual review completed
- Final sign-off recorded in `PHASE3_QA_CHECKLIST.md`

## 8) Commit Boundaries
Use small, reviewable commits in this order:
1. `refactor(theme): define semantic theme token contract`
2. `feat(theme): add theme runtime and persistence`
3. `feat(theme): add preferences theme selector`
4. `feat(theme): implement initial aesthetic themes`
5. `docs(qa): add phase3 theme checklist and sign-off notes`

## 9) Risk Register
- High risk: theme overrides can reintroduce CSS sprawl after Phase 2 cleanup.
- High risk: a visually ambitious theme can hurt readability or contrast.
- Medium risk: theme-specific hero/card styling can accidentally change spacing or responsive behavior.
- Medium risk: selector UI can become cluttered if it tries to expose too many historical variants.

Mitigations:
- Keep a strict semantic token layer.
- Favor theme tokens over component-specific overrides.
- Ship 4 themes, not 17.
- Re-run responsive and accessibility checks for every theme.

## 10) Execution Order
Immediate next actions:
1. Audit remaining hardcoded visual values that should move into semantic theme tokens.
2. Define the root theme hook and persistence shape.
3. Add a compact theme selector in Preferences.
4. Implement one pilot theme beyond the default to validate the architecture.
5. Expand to the remaining initial themes only after the pilot proves stable.

## 11) Recommended Pilot Theme
Start with `Holonet Archive`.

Reason:
- it is the most visually different from the current site
- it will stress-test the token system properly
- if the architecture can support that theme cleanly, the others will be easier

## 12) Phase 3 Exit Criteria
- Theme contract is implemented and documented.
- Theme selector exists in Preferences.
- Selected theme persists across reloads.
- 4 initial themes are implemented.
- Desktop and mobile theme QA are complete.
- Accessibility + motion checks pass for every theme.
- Final Phase 3 sign-off is recorded.
