# Checkpoint Phase 1 QA Checklist

This checklist is the manual verification pass for the Phase 1 local-first milestone.

## Test Setup

- Use a clean browser session with no prior `checkpoint-state` local storage when possible.
- Run one pass with seeded sample data.
- Run one pass after adding custom sparse manual entries.
- Run one pass after importing a backup file.
- Verify at least one desktop-width pass and one narrow-width pass.

## Library Basics

- App loads without console-blocking errors.
- Library opens by default.
- `All Games`, `Playing`, `Finished`, and `Archived` filters all work.
- `Reset To All Games` returns the library to the full default view.
- Search updates results correctly for:
  - title
  - run label
  - storefront
  - notes
- Sort control changes visible order correctly.
- Library cards open the detail view on click.
- Library keeps `Library` selected in top navigation while on a detail page.

## Add Entry Flow

- `Add Game` opens the modal from the top bar.
- Required fields are enforced:
  - title
  - storefront
  - status
- Sparse manual entries can be saved without full metadata.
- Duplicate warning appears for matching `title + storefront + runLabel`.
- Suggested catalog matches can be selected.
- Add modal closes cleanly after save.
- New entry appears in the correct library section.

## Edit and Delete

- `Edit Entry` opens with prefilled values.
- Editing title, storefront, status, run label, and notes saves correctly.
- `Delete Entry` opens confirmation modal.
- Deleting an entry returns to the library view.
- Deleting the last run for a game removes the orphaned catalog record.
- Archived entries can be restored to `playing`.

## Detail View

- Detail view opens only through the library.
- Detail screen scrolls fully on long content.
- `Back to Library` returns to the library view.
- Progress editor saves:
  - playtime
  - completion
  - status
- Notes editor saves correctly.
- Missing metadata shows fallback copy instead of broken UI.
- Missing hero art and screenshots show fallback states cleanly.

## Backup and Restore

- `Export JSON` downloads a valid backup file.
- Export contains:
  - `schemaVersion`
  - `library`
  - `catalog`
  - `syncPreferences`
  - `uiPreferences`
- Export does not keep orphaned catalog records.
- `Import JSON` rejects invalid files with an error message.
- `Replace` import fully swaps local state.
- `Merge` import keeps local UI/sync preferences and merges entries by `entryId`.
- Imported state renders correctly after restore.

## Persistence

- Reload preserves:
  - library entries
  - custom catalog records
  - sync preferences
  - persisted UI preferences
- Last-used sort mode restores after reload.
- Last-used library status filter restores after reload.
- Last-used view restores correctly when appropriate.

## Settings and Sync Surface

- Settings page loads without layout breakage.
- Sync status cards render values correctly.
- `Simulate Sync` shows loading and success/error feedback.
- Sync history records recent sync results.
- Export/import status messaging appears inline in settings.

## Keyboard and Focus

- Top navigation is reachable by keyboard.
- Search, sort, add modal fields, and detail inputs keep focus while typing.
- Visible focus ring appears on:
  - nav/filter buttons
  - library cards
  - primary action buttons
  - form inputs
- Modal actions are keyboard reachable.

## Responsive Layout

- Top controls do not overlap on narrower widths.
- Library grids stay readable at narrow widths.
- Detail hero/action area stacks cleanly on smaller screens.
- Settings panels stack cleanly on smaller screens.
- Add modal remains usable on narrower widths.
- Delete confirmation remains readable on narrower widths.

## Regression Notes

- Log any mismatch between visible library state and exported state.
- Log any case where focus is lost during typing.
- Log any field that saves a different value than shown in the UI.
- Log any overflow, clipped content, or unreachable controls.
