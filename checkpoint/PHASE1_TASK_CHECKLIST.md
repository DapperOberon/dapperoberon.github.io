# Checkpoint Phase 1 Task Checklist

This checklist translates the master plan into concrete implementation work.

## Phase 1A: Data and Persistence

- [x] Define the initial persisted app-state boundary.
- [x] Persist more than the library array.
- [x] Add schema version handling for persisted state.
- [x] Support migration from the old library-only payload.
- [x] Preserve custom catalog entries across reloads.
- [x] Document the canonical entry schema.
- [x] Document the canonical catalog schema.
- [x] Add shared normalization helpers for entry creation and updates.
- [x] Decide which UI preferences should persist beyond sync settings.

## Phase 1B: Core User Actions

- [x] Add edit-entry flow using the existing add-game modal.
- [x] Add delete-entry flow with confirmation.
- [x] Add restore flow for archived entries if needed.
- [x] Add duplicate-title/storefront warning behavior.
- [x] Add validation for required fields and invalid values.
- [x] Add success/error feedback for create and update operations.

## Phase 1C: Library UX

- [x] Add sorting controls.
- [ ] Add “recently added” and “recently updated” views.
- [x] Improve filter visibility and active-state clarity.
- [x] Improve empty states for search/filter combinations.
- [x] Stress-test the layout against larger libraries.

## Phase 1D: Detail and Backup

- [x] Allow editing notes from the detail view.
- [x] Allow editing progress from the detail view.
- [x] Improve missing-art and partial-metadata handling.
- [x] Add JSON export for the persisted app state.
- [x] Add JSON import with validation.
- [x] Support import merge vs replace behavior.

## Phase 1E: Integration Readiness

- [x] Document service adapter contracts.
- [x] Separate mock data from production adapter contracts.
- [x] Add loading/error/success UI states for service-backed actions.
- [x] Add a sync history or sync result surface in settings.

## Phase 1F: QA and Ship Prep

- [x] Write a manual QA checklist.
- [x] Run keyboard navigation audit.
- [x] Run contrast and focus-state audit.
- [x] Verify desktop and mobile layouts.
- [x] Verify persistence and import/export behavior.
- [x] Add a short implementation summary doc for Phase 1.

## Phase 1G: Usability Refinement

- [x] Strengthen primary action hierarchy across library, detail, and settings.
- [x] Improve detail-page action affordance and control clarity.
- [x] Add stronger orientation cues for library, detail, and settings views.
- [x] Tighten search and filter discoverability.
- [x] Improve settings scanability with clearer operational grouping.
- [x] Expand hover and keyboard focus feedback on key controls.
- [x] Run a responsive density pass for smaller widths.
- [x] Add targeted helper microcopy where interaction intent is still ambiguous.
