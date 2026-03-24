# Redesign Implementation Status

Status: Primary Functionality Complete, Cleanup Active  
Owner: `redesign/new-codebase`  
Date: 2026-03-24

## Purpose

This is the canonical implementation/status document for the `redesign/` app. It replaces the older root-level redesign planning doc and the earlier handoff/status notes.

## App Entry Points

- Shell: `redesign/index.html`
- Styles: `redesign/styles.css`
- App logic: `redesign/app.js`
- Timeline data: `timeline-data.json`

## Primary Design References

- `images/design-reference/DESIGN.md`
- `images/design-reference/desktop/`
- `images/design-reference/desktop-modal/`
- `images/design-reference/mobile/`
- `images/design-reference/mobile-modal/`

## Locked Product Decisions

- The redesign lives in `redesign/` as the new implementation baseline.
- The app remains a single-page experience.
- Chronological order is fixed by product design.
- Sorting is intentionally removed.
- Timeline content continues to load from `timeline-data.json`.
- Audio remains a supported feature.
- Desktop stats and preferences are full-page views instead of modals.

## Shared Legacy Modules Still Reused

- `modules/persistence.js`
- `modules/stats.js`
- `modules/audio.js`

## What Is Working

- Reference-based desktop and mobile shell
- Real timeline rendering from `timeline-data.json`
- Desktop and mobile entry modals
- Watched progress persistence
- Episode-level progress controls for series
- Hero and card progress summaries
- Search and filter controls
- Desktop and mobile stats views
- Desktop and mobile preferences views
- Background audio with persisted state
- Mobile mini-player
- Basic accessibility, focus restoration, and overlay keyboard handling

## Workstreams

### WS1 — State Foundation

Build a stable state model around real timeline entries instead of one-off render clones.

Acceptance:
- entries have stable ids
- entry lookup works by id
- app re-renders from a consistent in-memory state

### WS2 — Persistence Bootstrap

Reuse the legacy watched-state persistence contract so the redesign app honors saved progress.

Acceptance:
- watched state loads from local storage
- saved progress survives reload
- redesign remains compatible with existing watched data

### WS3 — Watched and Progress Interactions

Rebuild the core watch-state behavior in the redesign shell.

Acceptance:
- single-item entries can be toggled watched/unwatched
- series progress updates through modal episode controls
- modal primary CTA advances progress
- hero and card summaries update from live progress

### WS4 — Search and Filter

Restore the old app’s search/filter behavior in the redesign controls.

Acceptance:
- search works across titles, metadata, and episode titles
- canon/legends, media type, and progress filters work

### WS5 — Utility Surfaces

Restore stats, reset progress, preferences, and related utility flows.

Acceptance:
- redesign exposes the same product utility surfaces as the old app

### WS6 — Audio

Reintegrate background music behavior from the old app.

Acceptance:
- music loads and plays
- enable/disable and volume persist

### WS7 — QA and Accessibility

Close remaining parity gaps and validate keyboard/mobile behavior.

Acceptance:
- modal and timeline work on desktop and mobile
- keyboard escape/focus behavior is correct
- major old-app workflows are covered

## Status Snapshot

- WS1: complete
- WS2: complete
- WS3: complete
- WS4: complete for search and filtering
- WS5: functionally complete
- WS6: functionally complete
- WS7: browser QA and accessibility pass complete for primary flows

Notes:
- Sorting was intentionally removed from the redesign because chronology is the product contract.
- The redesign now uses full-page stats/preferences views on desktop instead of modal utilities.
- Audio is available on desktop, in preferences, and through a mobile mini-player.

## Verification Completed

- `node --check redesign/app.js`
- `node --check modules/audio.js`
- Live Selenium screenshot passes for:
  - desktop timeline
  - desktop modal
  - desktop stats
  - desktop preferences
  - mobile timeline
  - mobile modal
  - mobile stats
  - mobile preferences
- Overlay QA:
  - modal open/close
  - filter open/close
  - `Escape` close behavior
  - focus return for primary overlay flows

## Remaining Cleanup

1. Minor spacing and typography consistency cleanup across timeline, stats, and preferences.
2. Another optional reference-fidelity pass on the desktop hero and desktop timeline rhythm.
3. Optional modal refinement pass if higher screenshot fidelity is still desired.
4. Cleanup and simplify any stale logic in `redesign/app.js` after the branch direction is fully locked.
5. Final merge prep once the redesign shell is accepted as the new baseline.

## Recommended Next Steps

1. Finish the active items in `redesign/REDESIGN_CLEANUP_CHECKLIST.md`.
2. Do one final acceptance pass against the reference screenshots.
3. Decide whether `redesign/` becomes the new primary app entry.
4. If yes, perform a cleanup refactor of `redesign/app.js` before merge.
