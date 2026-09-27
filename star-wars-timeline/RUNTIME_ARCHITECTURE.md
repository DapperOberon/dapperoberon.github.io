# Runtime Architecture

Status: Active  
Date: 2026-09-27

This document explains how the live `star-wars-timeline/` app is structured today, which files are active, where the data comes from, how local state is stored, and how to do a quick verification pass before shipping changes.

## Active Runtime Surface

The live app is served from:

- [`index.html`](./index.html)
- [`app.js`](./app.js)
- [`styles.css`](./styles.css)
- [`tailwind-config.js`](./tailwind-config.js)

Primary data files:

- [`data/timeline-data.json`](./data/timeline-data.json)
- [`data/music-data.json`](./data/music-data.json)

Static assets used at runtime:

- [`images/posters/`](./images/posters)
- [`images/eras/`](./images/eras)
- [`audio/music/`](./audio/music)

## What Is Archived

These folders are reference or legacy material and should not be treated as the live app:

- [`archive/`](./archive)
- [`redesign/`](./redesign)
- [`images/design-reference/`](./images/design-reference)
- [`images/website-reference/`](./images/website-reference)
- [`qa-artifacts/`](./qa-artifacts)

Rule of thumb:

- edit files in the root app, `modules/`, `data/`, and active `scripts/`
- treat `archive/` as historical reference unless intentionally reviving something

## Boot Flow

The app boots through [`app.js`](./app.js), which now acts as a composition layer.

High-level boot sequence:

1. Create the shared `appState`
2. Build the domain, renderer, actions, runtime helpers, and interaction wiring
3. Fetch [`data/timeline-data.json`](./data/timeline-data.json)
4. Normalize the timeline payload through [`modules/timeline-data.js`](./modules/timeline-data.js)
5. Load watched progress from `localStorage`
6. Load and apply user preferences
7. Load music metadata from [`data/music-data.json`](./data/music-data.json)
8. Apply any deep-linked entry state from the URL
9. Render the app and attach interactions

## Module Responsibilities

### App Composition

- [`app.js`](./app.js)
  - wires the app together
  - owns bootstrap-time configuration

- [`modules/app-domain.js`](./modules/app-domain.js)
  - domain-facing helpers over app state
  - filtered entry navigation
  - share URL and deep-link orchestration

- [`modules/app-renderer.js`](./modules/app-renderer.js)
  - full app render orchestration
  - escapes HTML and composes shell + content + overlays

- [`modules/app-wiring.js`](./modules/app-wiring.js)
  - connects view actions, progress actions, and UI interactions after each render

### Data Layer

- [`modules/timeline-data.js`](./modules/timeline-data.js)
  - normalizes timeline entries into the runtime contract
  - centralizes media classification, continuity flags, search text, metadata text, and watch links
  - rebuilds the flat entry index used throughout the app

- [`modules/constants.js`](./modules/constants.js)
  - era assets
  - media label logic
  - story arc options and matchers

### Filtering, Routing, and Persistence

- [`modules/filters.js`](./modules/filters.js)
  - filter defaults
  - active filter counting
  - entry matching logic

- [`modules/routing.js`](./modules/routing.js)
  - deep-link read/write helpers for entry URLs

- [`modules/persistence.js`](./modules/persistence.js)
  - watched progress storage and migration

- [`modules/preferences.js`](./modules/preferences.js)
  - default preference values
  - preference loading and schema migration
  - document-level theme variable application

### Rendering and Interaction

- [`modules/timeline-renderers.js`](./modules/timeline-renderers.js)
  - desktop timeline entry rendering
  - mobile timeline entry rendering
  - modal and episode rendering

- [`modules/utility-renderers.js`](./modules/utility-renderers.js)
  - filters overlay
  - stats page
  - preferences page

- [`modules/app-layout.js`](./modules/app-layout.js)
  - top-level page layout composition
  - desktop sidebar content and main page sections

- [`modules/shell.js`](./modules/shell.js)
  - top bar
  - desktop sidebar container
  - mobile audio player and bottom nav
  - footer shell

- [`modules/app-interactions.js`](./modules/app-interactions.js)
  - DOM event binding for shell and page interactions

- [`modules/app-runtime.js`](./modules/app-runtime.js)
  - view actions
  - focus restoration
  - overlay behavior
  - audio UI runtime helpers

- [`modules/app-state.js`](./modules/app-state.js)
  - boot process
  - progress toggling
  - global keyboard handling

- [`modules/app-actions.js`](./modules/app-actions.js)
  - user-triggered app actions such as sharing and preference updates

- [`modules/app-ui-helpers.js`](./modules/app-ui-helpers.js)
  - scroll helpers
  - focusable-element lookup
  - active-section tracking
  - page-state helpers

- [`modules/stats.js`](./modules/stats.js)
  - derived progress and sparkline stats

- [`modules/audio.js`](./modules/audio.js)
  - music playlist loading
  - playback state
  - UI sound effects

## Data Workflow

### Timeline Data

Source file:

- [`data/timeline-data.json`](./data/timeline-data.json)

Each section currently contains:

- `era`
- `color`
- `entries`

Each entry currently contains a raw source shape like:

- `id`
- `title`
- `year`
- `type`
- `canon`
- `poster`
- `episodes`
- `watched`
- `releaseYear`
- `synopsis`
- optional `watchUrl`
- optional `wookieepediaUrl`
- optional `seasons`
- optional `episodeDetails`

Before rendering, [`modules/timeline-data.js`](./modules/timeline-data.js) normalizes each entry into a richer runtime shape with fields such as:

- `posterUrl`
- `primaryWatchUrl`
- `mediaLabel`
- `metaText`
- `metaDisplay`
- `storyMeta`
- `searchText`
- `episodeDetails` with normalized `episodeCode`
- `isCanon`, `isLegends`, `isMovie`, `isAnimated`, `isLiveAction`, `isShort`, `isSeries`

That normalized contract is what active renderers and filters should prefer.

### Music Data

Source file:

- [`data/music-data.json`](./data/music-data.json)

This is loaded by [`modules/audio.js`](./modules/audio.js) and currently contains a `tracks` array with `src` and `title`.

## Local Storage

The app stores several user-facing pieces of state in `localStorage`.

### Watched Progress

Handled by:

- [`modules/persistence.js`](./modules/persistence.js)

Current storage behavior:

- watched progress is stored per-entry using `watched_<entry-id>`
- legacy watched keys based on title and older fingerprint formats are still migrated forward
- when a legacy key is found, the app rewrites it to the current key and removes the old key

### Preferences

Handled by:

- [`modules/preferences.js`](./modules/preferences.js)

Current preference storage:

- main preference blob key: `sw_redesign_preferences`
- schema version currently set in [`app.js`](./app.js) as `2`

Theme is part of that preference blob as `interfaceTheme` (`sith-dark` by default) and is applied to the page by `applyPreferencesToDocument` as `body[data-interface-theme]`.

There is exactly one theme system. The legacy `sw_theme` and `sw_collapsed_eras` keys were removed in Sprint 1 along with their unused helpers.

## URL And Navigation Behavior

Deep linking is entry-based.

- the app can read an entry id from the URL and open that modal on load
- share actions build an entry-specific URL
- browser `popstate` is used so Back/Forward keeps modal state in sync

This behavior is coordinated across:

- [`modules/routing.js`](./modules/routing.js)
- [`modules/app-domain.js`](./modules/app-domain.js)
- [`modules/app-runtime.js`](./modules/app-runtime.js)

## Active Scripts

Active scripts live in:

- [`scripts/`](./scripts)

Current active scripts:

- [`import_disney_title.py`](./scripts/import_disney_title.py)
  - imports Disney+ play URLs into [`data/timeline-data.json`](./data/timeline-data.json)
  - supports film and series updates
  - expects a logged-in Firefox profile for Disney+

- [`import_chronological_data.py`](./scripts/import_chronological_data.py)
  - imports timeline structure from the markdown chronology source
  - preserves poster, synopsis, and id metadata where possible

- verification scripts
  - [`check_js_syntax.py`](./scripts/check_js_syntax.py)
  - [`validate_timeline_data.py`](./scripts/validate_timeline_data.py)
  - [`validate_music_data.py`](./scripts/validate_music_data.py)
  - [`smoke_test.sh`](./scripts/smoke_test.sh)
  - [`verify_all.sh`](./scripts/verify_all.sh)

Superseded one-off extractors have been moved to:

- [`archive/scripts/`](./archive/scripts)

## Recommended Change Workflow

When changing app logic:

1. Edit the active runtime files in the root app or `modules/`
2. If data shape is involved, prefer updating [`modules/timeline-data.js`](./modules/timeline-data.js) instead of spreading new assumptions into renderers
3. Run the verification pass in [`VERIFICATION.md`](./VERIFICATION.md)

When changing timeline or music data:

1. Update the source JSON
2. Run the validators
3. Run the smoke test
4. Manually spot-check the affected entry or page

When changing scripts:

1. Keep active tools in `scripts/`
2. Move one-off or superseded scripts into `archive/scripts/`
3. Prefer documenting prerequisites directly in the script or in this folder’s docs

## Quick Verification

The fast project check is:

```bash
bash star-wars-timeline/scripts/verify_all.sh
```

See full notes in:

- [`VERIFICATION.md`](./VERIFICATION.md)
