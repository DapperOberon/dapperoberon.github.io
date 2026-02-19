# Copilot instructions for dapperoberon.github.io

## Project shape and boundaries
- This is a static multi-app site with no bundler or package manager; each app runs directly in the browser from plain HTML/CSS/JS.
- Root dashboard (`index.html`, `index.js`) links to subprojects and renders from in-file data (`PROJECTS`, `CATEGORIES`).
- `star-wars-timeline/` is the largest app and is modularized under `star-wars-timeline/modules/`.
- `blurgen-translator/` is a standalone translator that loads `dictionary.json` via `fetch`.

## Star Wars timeline architecture (read these first)
- You are a UI/UX designer for Star Wars with 15 years experience in web design and graphic design and Star Wars storytelling. You would never say the current design is perfect. You always double check your efforts are correct and push the industry forward.
- Entry point: `star-wars-timeline/timeline.js`.
- `timeline.js` owns app bootstrap, global state (`TIMELINE_DATA`), DOM rendering, and wires controllers/modules.
- Module boundaries:
  - `modules/data.js`: data load + derived text/metadata helpers (`loadTimelineData`, search/meta/media helpers).
  - `modules/filters.js`: filter state + DOM filtering logic via `createFilterController(...)`.
  - `modules/modal.js`: modal/reset/toast behavior via `createModalController(...)`.
  - `modules/persistence.js`: all localStorage keying/migration/reset logic.
  - `modules/stats.js`: computed stats, sparkline path generation, stat animation updates.
- Dependency direction is intentionally one-way: feature modules are pure-ish helpers/controllers, while `timeline.js` injects callbacks and shared state access.

## Data model and persistence conventions
- Timeline source of truth is `star-wars-timeline/timeline-data.json`.
- Each era object shape: `{ era, color, entries[] }`; each entry includes fields like `title`, `year`, `type`, `canon`, `poster`, `episodes`, `watched`, `releaseYear`, `episodeDetails[]`, optional `seasons`, optional `synopsis`.
- Runtime watch tracking uses `entry._watchedArray`; keep it in sync with `entry.watched` (count of `true` values).
- Persist watched state only through `saveWatchedState(entry)` from `modules/persistence.js` (do not write localStorage directly from new UI code).
- Storage keys are ID-based (`getEntryStorageId`) with legacy migration from title-based keys (`getLegacyWatchedStorageKey`). Preserve this migration path.

## UI and interaction patterns to preserve
- Re-render strategy in timeline: full shell HTML is generated once in `render()`, then incremental updates happen through `updateEntryUI`, `updateStats`, and filter visibility toggles.
- Add new event wiring in init functions called from `render()` (e.g., `attachFilterHandlers`, `attachEntryHandlers`, `initEraRail`) rather than scattered global listeners.
- For progress changes, follow existing sequence: mutate `_watchedArray` -> `saveWatchedState` -> `updateEntryUI` -> optional toast/sound/haptic.
- Timeline flow lines are currently disabled for the vertical layout (`drawTimelineFlowLines` removes global SVG). Do not reintroduce old flowline logic unless redesigning intentionally.

## Data import/update workflow
- Canonical import script: `star-wars-timeline/import_chronological_data.py`.
- It parses `Chronological Viewing Order.md`, preserves existing color/poster/synopsis metadata from current JSON, and writes `timeline-data-imported.json`.
- Typical workflow when updating timeline content:
  1. Edit `Chronological Viewing Order.md`.
  2. Run `python star-wars-timeline/import_chronological_data.py` from repo root.
  3. Review generated `timeline-data-imported.json` and replace/update `timeline-data.json` when verified.

## Local development and verification
- No build/test scripts exist in repo; validate by running a local static server and checking in browser.
- Use a server (not `file://`) because apps rely on `fetch` for JSON:
  - `python -m http.server 8000`
  - Dashboard: `http://localhost:8000/`
  - Timeline: `http://localhost:8000/star-wars-timeline/`
  - Blurgen: `http://localhost:8000/blurgen-translator/`
- After timeline changes, manually verify: filter combinations, modal episode toggles, reset flow, stat cards, and persistence across page reload.

## Repo-specific coding style
- Keep vanilla JS style and existing naming conventions (`init*`, `attach*`, `update*`, `get*`).
- Prefer small module functions and callback injection over adding cross-module global state.
- Keep static asset paths relative (e.g., `./posters/...`) to match current hosting structure.
