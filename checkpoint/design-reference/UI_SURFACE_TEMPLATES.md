# Checkpoint UI Surface Templates

This document defines the canonical layout templates for core product surfaces.  
It is the implementation reference for Phase 3 design compliance.

## Template Rules (Global)

- Keep one primary CTA per surface.
- Keep global top navigation persistent.
- Keep section ordering stable; do not reorder regions ad-hoc.
- Use progressive disclosure for advanced operations.
- Use explicit scope labels for cross-scope actions (`This Entry`, `Library-wide`, `Local Device`).

## 1) Library Template

## Required Regions

1. Global top nav
2. Library controls row (`status tabs`, `search`, `Add Game`)
3. Library state row (`scope summary`, optional sort/reset)
4. Content region (`shelves` or `grid`)

## Optional Regions

- Hero intro panel (only when it supports browsing clarity)
- Empty state panel

## Primary CTA

- `Add Game`

## Section Order Contract

`nav -> controls -> state row -> content`

## Notes

- Cover art and title must dominate listing cards.
- Avoid adding diagnostics or sync-heavy messaging above content.
- Secondary actions should never visually out-rank `Add Game`.

## 2) Details Template

## Required Regions

1. Hero region (`cover`, `title`, concise identity metadata, quick actions)
2. Core run workspace (`Run Details`, `Progress`, `Notes`)
3. Secondary info region (`Game Details`, `Screenshots`, `Maintenance`)

## Optional Regions

- Edit-only side controls (metadata/artwork overrides)
- Archived-state restore action

## Primary CTA

- View mode: `Edit Details`
- Edit mode: `Save Details`

## Section Order Contract

`hero -> run details -> notes -> progress -> screenshots -> maintenance`

## Notes

- Core run tracking content stays above advanced maintenance.
- Advanced overrides are present but visually subordinate.
- Avoid introducing additional top-level panels without consolidation.

## 3) Settings Template

## Required Regions

1. Page intro (`title`, short purpose line)
2. Sync/account controls group
3. Backup/restore group
4. Maintenance/system group

## Optional Regions

- Conflict resolution panel (only when conflict exists)
- Restore safety snapshot panel (only when snapshot exists)

## Primary CTA

- One dominant action per settings section/group.

## Section Order Contract

`intro -> sync -> backup/restore -> maintenance`

## Notes

- Preference toggles should support primary actions, not compete with them.
- Keep descriptive copy concise and action-oriented.
- Avoid decorative framing that does not improve scanability.

## 4) Activity Template

## Required Regions

1. Page intro (`what this feed is`)
2. Timeline/list stream
3. Lightweight filters (type/date) if needed

## Optional Regions

- Group headers by day/week
- Empty-state guidance

## Primary CTA

- None required by default; activity is a read surface.
- If action exists, use one contextual primary CTA (for example, `Open Entry`).

## Section Order Contract

`intro -> filters -> timeline`

## Notes

- Keep entries compact and scannable.
- Do not turn Activity into a dashboard of cards.

## Non-Divergence Rules

Use these checks before shipping UI changes:

1. Does this surface still follow its template region order?
2. Did we keep exactly one primary CTA in the active context?
3. Did we avoid adding a new top-level panel when existing panels could be merged?
4. Are advanced controls disclosed progressively instead of shown by default?
5. Are cross-scope actions explicitly labeled?

If any answer is "no", update the implementation or update this template spec intentionally (with rationale).

## Phase 4 Navigation Migration Note

- Phase 3 keeps global top navigation plus lightweight per-surface local rails/tabs.
- Phase 4 should introduce the richer settings/profile left-rail architecture once profile surfaces are in scope.
- When Phase 4 lands, keep naming and section order compatible with these Phase 3 templates to avoid IA churn.
