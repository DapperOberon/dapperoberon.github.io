# Backloggd Reference Audit (Layout + Feature Set)

Audit date: 2026-04-01  
Reference source: screenshots in `design-reference/backloggd.com/`  
Goal: use Backloggd as the primary product-layout and feature reference while preserving Checkpoint visual style from `design-reference/DESIGN.md`.

## Screenshot Inventory

1. `Screenshot 2026-04-01 at 12-26-12 Backloggd - A Video Game Collection Tracker.png`
- Home/dashboard feed with stacked content rails.
- Left lightweight stat strip, center content sections, persistent top nav.

2. `Screenshot 2026-04-01 at 12-26-54 Games Backloggd.png`
- Dense browse grid page (many box-art tiles).
- Filter/sort controls, pagination, discovery engine footer callout.

3. `Screenshot 2026-04-01 at 12-27-07 Sable (2021).png`
- Game detail page with large hero backdrop.
- Left game card/action rail, central metadata/stats/reviews flow.

4. `Screenshot 2026-04-01 at 12-27-15 Sable (2021).png`
- Log/review modal workflow.
- Tabbed intent (`Review`, `Journal`, `Details`) and compact submit action area.

5. `Screenshot 2026-04-01 at 12-29-32 DapperOberon's games Backloggd.png`
- Profile games tab: status chips + card grid + display/sort controls.

6. `Screenshot 2026-04-01 at 12-29-43 DapperOberon's profile Backloggd.png`
- Profile overview with tabbed surfaces and compact top-level stat counters.

7. `Screenshot 2026-04-01 at 12-30-06 Backloggd - A Video Game Collection Tracker.png`
- Settings page with left category rail + right content pane.
- Long-form account/preferences structure, one clear save action.

## Feature Inventory (Backloggd Patterns)

## Strong Product Patterns to Reuse

- Persistent top navigation with global search and one high-priority CTA.
- Card-first library browsing with clear density modes and pagination.
- Dedicated game page architecture:
  - hero context
  - quick actions
  - metadata/stats
  - long-form community or notes content below fold
- Modal-first “quick log” flow for fast capture.
- Tabbed profile/account structure (separate activity types by intent).
- Settings IA with a stable left rail and grouped sections.

## Potentially Useful but Optional for Checkpoint

- Lightweight “recent activity” feed sections on home.
- Discovery/browse mode separate from personal library mode.
- Personal profile surface beyond raw settings (still private-first).

## Out of Scope Right Now (for Checkpoint)

- Public social feed/reviews/lists/friends.
- Public profile and engagement metrics.
- Community ranking/recommendation surfaces.

## Design System Choices Observed in Backloggd

- Compact, information-dense dark UI.
- Strong box-art hierarchy and low decorative chrome.
- Clear spatial zoning:
  - nav/chrome
  - content rail
  - utility controls
- Reusable page templates rather than bespoke one-off surfaces.
- Frequent use of tabs/chips for mode switching.

## Mapping to Checkpoint (Adopt / Adapt / Avoid)

## Adopt (directly)

- Keep one persistent nav + search + single top CTA pattern.
- Promote cover grid as primary browse language in library surfaces.
- Keep detail pages as vertical storytelling flow, not dashboard fragments.
- Use left-rail settings navigation for clearer configuration IA.

## Adapt (same structure, Checkpoint visual style)

- Backloggd-style page architecture, but preserve Checkpoint palette:
  - primary `#00D4FF`
  - neutral `#0A0B0C`
  - typography choices in `DESIGN.md`
- Modal quick-capture patterns adapted for run-focused inputs.
- Profile-like tabs adapted into private personal activity/history (no social).

## Avoid (do not copy)

- Pink accent/action language.
- Community-heavy components (likes/lists/reviews feed) in core app.
- Overly dense micro-labeling that conflicts with current clarity goals.

## Recommended Additions to Phase 3 Tasks

Add a new alignment track focused on information architecture, not visual re-theme.

## Proposed Phase 3I: Backloggd Layout + Feature Reference Alignment

- Define canonical page templates:
  - Library browse
  - Game details
  - Settings
  - Activity/history
- Add library display modes:
  - Compact grid
  - Comfortable grid
- Add library pagination or virtualized infinite list strategy (decision required).
- Formalize detail-page section order contract:
  - Hero
  - Quick actions
  - Run details/progress/notes
  - Metadata/artwork/maintenance
- Design settings left-rail information architecture and section grouping.
- Add “quick log/update progress” entrypoint from library cards.
- Add private activity timeline surface (per-run + sync + refresh events).

## Questions to Resolve Before Updating DESIGN.md and Phase 3 Scope

1. Should we add a **layout principle section** to `DESIGN.md` defining:
- “cover-first hierarchy”
- “template-driven surfaces”
- “left-rail settings IA”
- “single primary CTA per surface”

2. For library browsing, do you want:
- pagination (Backloggd-like), or
- infinite scroll/virtualization (more app-like)?

3. Should Checkpoint introduce a dedicated **Browse/Discover** surface in Phase 3, or keep focus strictly on **My Library** for now?

4. Do you want a **private profile/activity page** in Phase 3, or keep activity embedded inside Library/Settings only?

5. Should we add a compact **quick-log modal from library cards** (Backloggd-inspired) alongside the full details workspace?

6. For settings IA, should we move to a permanent left sidebar now, or do it in Phase 4 after Phase 3E/3F ship?

7. Should DESIGN.md explicitly permit a slightly denser information layout (Backloggd-like) while preserving the current clean/minimal constraints?

## Recommended Defaults (if no further direction)

- Add layout principles to `DESIGN.md`.
- Keep My Library as primary; defer Discover.
- Build private activity page (no social).
- Add quick-log modal shortcut from library cards.
- Move settings to left-rail IA in Phase 3.
- Use infinite scroll/virtualization over numbered pagination.
