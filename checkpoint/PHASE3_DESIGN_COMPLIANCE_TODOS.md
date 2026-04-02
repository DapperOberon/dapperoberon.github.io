# Checkpoint Phase 3 Design Compliance Todos

This backlog translates `design-reference/DESIGN.md` + Backloggd IA learnings into concrete design tasks for full UI cohesion.

## Foundation

- [x] Freeze a canonical layout template spec for each core surface:
  - Library
  - Details
  - Settings
  - Activity
- [x] Add implementation notes for each template (required regions, optional regions, primary CTA placement, section ordering).
- [x] Add a short “do not diverge” rule set for future UI additions so new panels/actions conform to templates.

## 1) Cover-First Hierarchy

- [x] Library: ensure cover + title dominate first scan in all statuses and viewport sizes.
- [x] Details: ensure cover/hero/title remain dominant over chips and utility controls.
- [x] Reduce non-essential metadata in above-the-fold regions where it competes with game identity.
- [x] Verify empty states still preserve cover-first visual language.

Definition of done:
- First scan on Library and Details is “what game is this?” before “what controls are here?”.

## 2) Template-Driven Surfaces

- [x] Library: enforce fixed region order (nav/search/actions -> state/filter row -> content shelves/grid).
- [x] Details: enforce fixed region order (hero -> quick actions -> run details/progress/notes -> metadata/artwork/maintenance).
- [x] Settings: enforce fixed region order (sync/account controls -> backup/restore -> maintenance/system actions).
- [x] Activity: define and enforce a single timeline/list template before implementation.

Definition of done:
- No ad-hoc one-off panel placements remain on core pages.

## 3) One Primary Action Per Surface

- [x] Library: keep one dominant CTA (`Add Game`).
- [x] Details: keep one dominant CTA per mode (`Edit Details` or `Save Details`).
- [x] Settings: keep one dominant CTA per section, demote all secondary actions.
- [x] Modals: enforce one clear submit action and one clear cancel action.

Definition of done:
- Users can identify the next action in under 1 second on each major surface.

## 4) Progressive Disclosure

- [x] Move advanced controls (overrides, maintenance, diagnostics) behind clear section headers and/or toggles.
- [x] Keep “core run logging” visible by default; reveal advanced fields only when needed.
- [x] Ensure manual fallback paths stay visible without exposing all advanced options at once.

Definition of done:
- Default views show essentials first, advanced controls are available but not noisy.

## 5) Stable Navigation Rails

- [x] Keep global top navigation consistent across all surfaces.
- [x] Normalize section-level navigation style (tabs/rail) for each surface.
- [x] Define Phase 4 migration note for settings left rail and profile surfaces so future IA is consistent.

Definition of done:
- Navigation behavior is predictable and does not change style/position unexpectedly between views.

## 6) Density by Intent

- [x] Library: allow higher information density for browse/listing contexts.
- [x] Details: reduce density in editing contexts (more whitespace, fewer competing boxes).
- [x] Settings: keep calm spacing and avoid dense control stacking.
- [x] Re-run responsive pass for 1280x800 and mobile widths to ensure visual calm survives smaller displays.

Definition of done:
- Browse is efficient; edit/settings are calm and readable.

## 7) Scope-Labeled Actions

- [x] Audit all refresh/sync/update actions to ensure labels include explicit scope when needed.
- [x] Standardize label grammar:
  - `(... This Entry)`
  - `(... Library-wide)`
  - `(... Local Device)` where relevant
- [x] Ensure conflict/recovery actions clearly indicate local vs remote effects.

Definition of done:
- No ambiguous action labels remain for cross-scope operations.

## 8) Local-First Clarity

- [x] Keep sync/cloud status visible but visually subordinate to run-tracking tasks.
- [x] Remove or demote any cloud/system message that duplicates toast feedback.
- [x] Ensure offline/fallback states explain impact briefly without displacing primary content.

Definition of done:
- The app always feels local-first even when sync is active.

## System-Wide Visual Cohesion Pass

- [x] Audit button variants and remove any non-standard button style regressions.
- [x] Audit chip/tag usage and remove decorative-only chips.
- [x] Audit typography roles:
  - labels (`Space Grotesk`) only for true labels/tabs/eyebrows
  - helper/body (`Manrope`) for normal copy
- [x] Audit border radius usage to enforce moderate roundedness and avoid stray `rounded-full` controls.
- [x] Run final contrast pass for hero/backdrop overlays with bright cover art.
- [x] Enforce global border guardrail: avoid relying on `1px` borders as primary structure.
- [x] Enforce global typography guardrail: no text smaller than `8pt` equivalent.

Border guardrail resolution (2026-04-01):
- [x] `checkpoint/styles.css`: upgraded explicit structural borders to `2px` and removed explicit `1px` border declarations.
- [x] Added global border-floor overrides for app surfaces and modals (`[data-surface]` / `[data-modal-root]`) so Tailwind `border*` utilities render at `2px`.
- [x] Shared primitives and render surfaces now inherit the same `2px` baseline without per-component rewrites.

## Validation and QA

- [x] Run Selenium visual pass (dashboard/details/settings) and archive screenshots.
- [x] Update UI cohesion metrics and compare against prior baseline.
- [x] Execute manual UX checklist:
  - add flow clarity
  - details edit clarity
  - settings action clarity
  - mobile/short-height modal behavior
- [x] Record final findings and any exceptions in `PHASE3_UI_COHESION_AUDIT.md`.
