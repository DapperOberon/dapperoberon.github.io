# Checkpoint UI Cohesion Audit (Selenium)

Audit date: 2026-04-01  
Method: Selenium headless pass on real app routes (`dashboard`, `details`, `settings`) with screenshots and DOM metrics.

Artifacts:
- `/tmp/checkpoint-dashboard.png`
- `/tmp/checkpoint-details.png`
- `/tmp/checkpoint-settings.png`
- `/tmp/checkpoint_ui_audit.json`
- `/tmp/checkpoint-dashboard-after.png`
- `/tmp/checkpoint-details-after.png`
- `/tmp/checkpoint-settings-after.png`
- `/tmp/checkpoint_ui_audit_after.json`
- `/tmp/checkpoint-phase3-dashboard-1280x800.png`
- `/tmp/checkpoint-phase3-details-1280x800.png`
- `/tmp/checkpoint-phase3-settings-1280x800.png`
- `/tmp/checkpoint-phase3-mobile-add.png`
- `/tmp/checkpoint-phase3-visual-pass.json`
- `/tmp/checkpoint_ui_audit_final.json`
- `/tmp/checkpoint-manual-ux-checklist.json`
- `/tmp/checkpoint-manual-ux-desktop.png`
- `/tmp/checkpoint-manual-ux-mobile.png`
- `/tmp/checkpoint-manual-ux-desktop-rerun.png`

## Snapshot Metrics

| View | Buttons | Panels | Uppercase Nodes | Rounded-Full |
|---|---:|---:|---:|---:|
| Dashboard | 26 | 3 | 68 | 15 |
| Details | 14 | 9 | 16 | 1 |
| Settings | 18 | 6 | 13 | 3 |

Interpretation:
- Dashboard still carries the highest typography/chrome noise (`68` uppercase nodes).
- Details still has the heaviest panel density (`9`), which hurts visual calm.
- Settings is cleaner than before, but action hierarchy is still too flat (many equal-weight primary CTAs).

## UI Cohesion Findings

## 1) Dashboard has residual chrome overload

Evidence:
- Two fixed bars + filter tabs + sort + search + add at all times.
- High uppercase node count and many micro-labels.

Impact:
- First scan still feels "UI-heavy" instead of content-first.
- Competes with cover art shelves and hero messaging.

Files:
- `modules/render/library.js`

## 2) Details page still reads as two competing layouts

Evidence:
- Hero + run/progress/notes/media stack + a dense sticky sidebar with metadata/edit forms.
- `9` panel containers on one screen.

Impact:
- Section intent is clearer than before, but cognitive load remains high.
- Edit mode especially feels like "form inspector bolted onto detail view."

Files:
- `modules/render/details.js`

## 3) Settings action hierarchy is too uniform

Evidence:
- Multiple bright cyan CTA buttons at similar prominence (`Connect`, `Refresh Metadata`, `Refresh Art`, `Save Label`, etc.).
- User has to parse copy to infer priority.

Impact:
- Harder to identify "primary next action" at a glance.

Files:
- `modules/render/settings.js`
- `modules/render/shared.js`

## 4) Global typography still overuses label treatment in utility copy

Evidence:
- Many helper strings still use label styling and strong tracking in controls/metadata rows.
- Dashboard carries largest uppercase concentration.

Impact:
- Product UI can feel shouty instead of calm.

Files:
- `modules/render/library.js`
- `modules/render/details.js`
- `modules/render/settings.js`
- `styles.css`

## 5) Refresh/maintenance actions are split across surfaces without clear grouping

Evidence:
- Entry-level refresh actions are in details media block.
- Library-level refresh actions are in settings.
- No explicit shared "maintenance" language between them.

Impact:
- Functional but semantically fragmented.

Files:
- `modules/render/details.js`
- `modules/render/settings.js`

## Actionable UI TODOs

## Priority 1: Reduce dashboard chrome and scan friction

- [x] Collapse top-bar utility controls (`sort`, `search`, `add`) into a cleaner single-row layout with stronger spacing and fewer micro-states.
- [x] Remove or demote non-essential helper labels in dashboard hero and state bar.
- [x] Replace remaining all-caps helper text in dashboard sections with normal-case body copy.

## Priority 2: Simplify details into one dominant reading path

- [x] In display mode, reduce sidebar to a compact metadata summary only (no extra framing blocks).
- [x] In edit mode, flatten metadata/artwork editor into fewer grouped form blocks (reduce nested panel feel).
- [x] Move refresh actions into a dedicated "Maintenance" row shared with metadata/artwork wording.
- [x] Standardize section header language (`Run details`, `Progress`, `Notes`, `Game details`, `Artwork`) with consistent case and spacing.

## Priority 3: Rebuild settings action hierarchy

- [x] Define one primary action per settings section; demote secondary operations visually.
- [x] Reduce simultaneous bright-primary buttons in viewport; keep one dominant CTA per row/group.
- [x] Tighten long helper copy blocks so actions are discoverable without paragraph parsing.
- [x] Make toggle/preference rows visually subordinate to connect/sync/recovery actions.

## Priority 4: Typography cohesion pass

- [x] Remove remaining uppercase utility copy that is not a label, eyebrow, tab, or chip.
- [x] Normalize helper-copy style to body text (`font-body`, normal case, lower tracking).
- [x] Keep `Space Grotesk` label treatment only on true labels and controls.

## Priority 5: Cross-surface maintenance coherence

- [x] Align wording for refresh actions between details and settings (`Refresh metadata`, `Refresh artwork`) and add a shared "Maintenance" language pattern.
- [x] Clarify scope in labels (`This entry` vs `Library-wide`) directly in action text.

## Definition of Done (UI Cohesion)

- Dashboard first scan is content-led, not chrome-led.
- Details page reads as one coherent layout in both display and edit mode.
- Settings has clear action hierarchy with obvious primary next step.
- Label/body typography roles are consistent across all main surfaces.
- Maintenance actions feel like one system, not separate islands.

## Post-Cleanup Verification (2026-04-01)

Second Selenium run used real in-app navigation (dashboard -> details -> settings).

| View | Buttons (Before -> After) | Panels (Before -> After) | Uppercase Nodes (Before -> After) | Rounded-Full (Before -> After) |
|---|---:|---:|---:|---:|
| Dashboard | 26 -> 26 | 3 -> 3 | 68 -> 1 | 15 -> 15 |
| Details | 14 -> 14 | 9 -> 10 | 16 -> 1 | 1 -> 1 |
| Settings | 18 -> 18 | 6 -> 7 | 13 -> 1 | 3 -> 3 |

Interpretation:
- Typography cohesion improved substantially across all surfaces (uppercase noise effectively removed).
- Action density stayed stable, which is good for usability consistency.
- Panel count increased by one in Details and Settings due explicit Maintenance grouping; this helps system clarity but adds slight surface density.

## Final Design Pass Checklist (Before Feature Work)

- [x] Consider removing one low-value panel wrapper in Details edit sidebar to offset the new Maintenance panel density.
- [x] In Settings, visually merge the Maintenance intro tile into the first refresh card header to reduce box count by one.
- [x] Reduce rounded-full usage in dashboard status bubbles if you want stricter adherence to "moderate roundedness".
- [x] Run one final manual contrast pass on hero-backdrop overlays (especially bright artwork) to ensure copy remains legible.

## Final Verification Pass (2026-04-01, latest)

Latest Selenium metrics (`/tmp/checkpoint_ui_audit_final.json`):

| View | Buttons | Panels | Uppercase Nodes | Rounded-Full |
|---|---:|---:|---:|---:|
| Dashboard | 26 | 3 | 0 | 0 |
| Details | 14 | 11 | 0 | 1 |
| Settings | 18 | 7 | 0 | 0 |

Compare vs post-cleanup baseline:
- Uppercase utility noise is now fully removed in sampled surfaces (`1 -> 0`).
- Rounded-full controls are now removed outside progress bars (`dashboard 15 -> 0`, `settings 3 -> 0`).
- Button count is stable (no action explosion during cleanup).
- Panel count in Details remains elevated due explicit sectioning and advanced-edit grouping (`10 -> 11`), which is an intentional tradeoff for clearer scope separation.

## Manual UX Checklist (2026-04-01)

Checklist run artifacts:
- `/tmp/checkpoint-manual-ux-checklist.json`
- `/tmp/checkpoint-manual-ux-desktop.png`
- `/tmp/checkpoint-manual-ux-mobile.png`
- `/tmp/checkpoint-manual-ux-desktop-rerun.png`

Result summary:
- Add flow clarity: Pass (with caveat)
- Details edit clarity: Pass
- Settings action clarity: Pass
- Mobile/short-height modal behavior: Pass

Caveat:
- Local test environment returned no IGDB result candidates during this run, so add-flow validation confirmed search-step behavior, manual fallback, and back-to-search path, but did not validate full candidate-selection behavior end-to-end in that run.

## Guardrail Audit Update (2026-04-01)

Scope:
- Global typography minimum (`8pt` equivalent floor)
- Global border guardrail (avoid `1px` border-first structure)

Results:
- Typography floor: Pass. Removed all `text-[9px]` and `text-[10px]` usages from active render surfaces; smallest explicit utility text in render layer is now `text-[11px]`.
- Border guardrail: Pass. Updated explicit structural borders to `2px` in global stylesheet and added border-floor overrides for `data-surface` + modal roots so thin border utilities no longer render at `1px`.

Next:
- Continue trimming border usage where spacing/contrast already provides enough separation, keeping the new `2px` floor for borders that remain.
