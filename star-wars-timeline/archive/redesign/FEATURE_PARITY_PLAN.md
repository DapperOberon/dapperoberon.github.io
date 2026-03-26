# Redesign Implementation Status

Status: Root Entry Promoted, Release Baseline Active  
Owner: `redesign/new-codebase`  
Date: 2026-03-26

## Purpose

This is the canonical implementation/status document for the promoted Star Wars: Chronicles app. It replaces the older root-level redesign planning doc and the earlier handoff/status notes.

## App Entry Points

- Public app shell: `index.html`
- Public content pages:
  - `guide/index.html`
  - `privacy/index.html`
  - `terms/index.html`
- Root app/runtime files:
  - `app.js`
  - `app-layout.js`
  - `app-interactions.js`
  - `app-runtime.js`
  - `app-state.js`
  - `shell.js`
  - `content-page.js`
- Root shared assets:
  - `styles.css`
  - `tailwind-config.js`
  - `favicon.svg`
  - `favicon.ico`
- Timeline data: `timeline-data.json`

## Primary Design References

- `images/design-reference/DESIGN.md`
- `images/design-reference/desktop/`
- `images/design-reference/desktop-modal/`
- `images/design-reference/mobile/`
- `images/design-reference/mobile-modal/`

## Locked Product Decisions

- The public product root is now `star-wars-timeline/`, not `star-wars-timeline/redesign/`.
- `redesign/` is now reserved for implementation/status docs only.
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
- Deep linking and share links for entries
- Wookieepedia info links for every entry
- Mixed-platform external watch links through `watchUrl`
- Real guide, privacy, and terms pages at the product root in the shared shell
- Shared shell/content-page architecture for non-app pages
- Favicon wired across the app and content pages
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
- WS7: browser QA and accessibility pass complete for primary flows and footer/content pages

Notes:
- Sorting was intentionally removed from the redesign because chronology is the product contract.
- The redesign now uses full-page stats/preferences views on desktop instead of modal utilities.
- Audio is available on desktop, in preferences, and through a mobile mini-player.
- Navigating away from the timeline now closes modal/filter overlays instead of leaving them active across page switches.
- `watchUrl` is the canonical external destination field and now covers Disney+, YouTube, and other supported targets under one model.

## Verification Completed

- `node --check app.js`
- `node --check app-runtime.js`
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
- Rendered page checks for:
  - `guide/`
  - `privacy/`
  - `terms/`
- Overlay QA:
  - modal open/close
  - filter open/close
  - `Escape` close behavior
  - focus return for primary overlay flows
  - page navigation closes modal/filter overlays
- Data verification:
  - `Chronological Viewing Order.md` aligned with `timeline-data.json`
  - all timeline entries now carry external watch destinations through `watchUrl`
  - all timeline entries now carry Wookieepedia info URLs

## Architecture Updates

- Shared shell rendering now lives outside the timeline app via:
  - `shell.js`
  - `content-page.js`
  - `app-layout.js`
  - `app-interactions.js`
  - `app-runtime.js`
  - `app-state.js`
- `app.js` now acts primarily as an orchestrator instead of owning all shell, runtime, and state logic inline.
- Guide, privacy, and terms pages now render through the same shell path instead of duplicating standalone shell markup.

## Current Remaining Work

1. Final merge-prep cleanup and review.
2. Optionally do one last visual polish pass if more screenshot-level refinement is still desired.

## Recommended Next Steps

1. Do the final merge-prep cleanup and review.
2. Keep `redesign/REDESIGN_CLEANUP_CHECKLIST.md` as the short release-prep tracker until release cleanup is complete.

## Footer And Policy Follow-Up

- `Guide` now points to a real guide page.
- `Support` now points to the repository GitHub issues page.
- `Privacy` and `Terms` now point to real pages in the shared shell.
- Footer placeholder links have been removed from the product surface.
