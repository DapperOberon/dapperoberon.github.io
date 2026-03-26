# Implementation Status

Status: Root Entry Promoted, Release Baseline Active  
Date: 2026-03-26

## Purpose

This is the canonical implementation/status document for Star Wars: Chronicles after promotion to the `star-wars-timeline/` root.

## Public Entry Points

- App shell: `index.html`
- Guide: `guide/index.html`
- Privacy: `privacy/index.html`
- Terms: `terms/index.html`

## Active Runtime Structure

- Root entry modules:
  - `app.js`
  - `content-page.js`
- Active support modules:
  - `modules/app-layout.js`
  - `modules/app-interactions.js`
  - `modules/app-runtime.js`
  - `modules/app-state.js`
  - `modules/audio.js`
  - `modules/data.js`
  - `modules/persistence.js`
  - `modules/shell.js`
  - `modules/stats.js`
- Active data:
  - `data/timeline-data.json`
  - `data/music-data.json`

## Product State

- The new app now replaces the old root experience.
- Chronological order is fixed by product design.
- Timeline content loads from `data/timeline-data.json`.
- Background audio loads from `data/music-data.json`.
- Deep linking, share links, Wookieepedia info links, and mixed-platform `watchUrl` support are implemented.
- Guide, privacy, and terms are live product pages in the shared shell.

## Verification Completed

- `node --check` passes for the promoted root entry files and active support modules.
- Root HTTP checks return `200` for:
  - `/star-wars-timeline/`
  - `/star-wars-timeline/guide/`
  - `/star-wars-timeline/privacy/`
  - `/star-wars-timeline/terms/`
  - `/star-wars-timeline/data/timeline-data.json`
  - `/star-wars-timeline/data/music-data.json`
- `Chronological Viewing Order.md` is aligned with the live timeline data.

## Repository Structure Outcome

- `redesign/` now exists only for status/planning docs.
- `archive/` contains unused legacy files and modules.
- `modules/` contains only active runtime dependencies.
- `data/` contains the active JSON payloads.

## Remaining Work

1. Final human visual smoke test before merge.
2. Final `git diff` review and merge.
