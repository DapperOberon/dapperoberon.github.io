# Copilot instructions for dapperoberon.github.io

## Project shape and boundaries
- Static multi-app site served from GitHub Pages. Apps run directly in the browser from plain HTML/CSS/ES modules.
- Root dashboard (`index.html`, `index.js`) links to subprojects and renders from in-file data (`PROJECTS`, `CATEGORIES`).
- `star-wars-timeline/` is the flagship app, modularized under `star-wars-timeline/modules/`. No bundler, but it now has a compiled Tailwind build (`npm run build:css` -> `tailwind.generated.css`). Re-run it after adding new utility classes.
- `checkpoint/` is a game backlog tracker. **It is the exception: it has a real `package.json` and a compiled Tailwind build (`npm run build:css`).** It also has a Cloudflare Worker proxy under `checkpoint/cloudflare-worker/`.
- `blurgen-translator/` is a standalone translator that loads `dictionary.json` via `fetch`.
- Treat `archive/` and `images/design-reference/` as historical reference, not live code.

## Star Wars timeline architecture (read these first)
- You are a UI/UX designer for Star Wars with 15 years experience in web design and graphic design and Star Wars storytelling. You would never say the current design is perfect. You always double check your efforts are correct and push the industry forward.
- **Active execution plan: `star-wars-timeline/ROADMAP.md`. Read it before starting work.**
- **Current structure reference: `star-wars-timeline/RUNTIME_ARCHITECTURE.md`.**
- Entry point: `star-wars-timeline/app.js`. It is a ~260-line composition layer only — it wires modules together and owns bootstrap-time config. It does not own rendering or state internals.
- App core modules (in `star-wars-timeline/modules/`):
  - `app-state.js`: shared `appState`, bootstrap, global key handlers, progress actions.
  - `app-domain.js`: domain helpers over state, filtered navigation, share/deep-link orchestration.
  - `app-renderer.js`: full render orchestration, HTML escaping, shell/content/overlay composition.
  - `app-actions.js` / `app-wiring.js` / `app-interactions.js`: view actions and post-render DOM event binding.
  - `app-layout.js` / `app-ui-helpers.js` / `app-runtime.js`: page layout composition, focus/scroll helpers, audio UI runtime.
- Feature modules:
  - `timeline-data.js`: normalization, media classification, search/meta text, entry index. **Prefer changing data shape here rather than in renderers.**
  - `timeline-renderers.js` / `utility-renderers.js` / `shell.js` / `content-pages.js`: markup generation.
  - `filters.js`, `stats.js`, `routing.js`, `audio.js`, `constants.js`, `preferences.js`, `persistence.js`.
- Dependency direction is intentionally one-way: modules are pure-ish helpers/controllers, and `app.js` injects callbacks and shared state access.
- There is no `timeline.js`, no `modules/modal.js`, and no `modules/data.js`. Do not reference them.

## Data model and persistence conventions
- Timeline source of truth is `star-wars-timeline/data/timeline-data.json`. Music is `star-wars-timeline/data/music-data.json`. UID mapping is `star-wars-timeline/data/uid-manifest.json`.
- Each era object shape: `{ era, color, entries[] }`; each entry includes fields like `id`, `title`, `year`, `type`, `canon`, `poster`, `episodes`, `releaseYear`, `episodeDetails[]`, optional `seasons`, optional `synopsis`, optional `watchUrl`.
- Entry `id` is a stable 3-character lowercase base36 UID tracked in `data/uid-manifest.json`. Never renumber ids by hand; use `scripts/migrate_entry_uids.py` / `scripts/sync_uid_manifest.py`.
- Live JSON does **not** ship a `watched` value. Progress is per-user in `localStorage` only.
- Runtime watch tracking uses `entry._watchedArray`; keep it in sync with `entry.watched` (count of `true` values).
- Persist watched state only through `saveWatchedState(entry)` from `modules/persistence.js` (do not write localStorage directly from new UI code).
- Storage keys are ID-based (`getEntryStorageId`) with legacy migration from title-based keys (`getLegacyWatchedStorageKey`). Preserve this migration path.

## UI and interaction patterns to preserve
- Current re-render strategy: `modules/app-renderer.js` rebuilds the whole shell via `app.innerHTML = renderShellLayout(...)` on state change, then re-binds interactions through `modules/app-wiring.js`. This is why the focus/scroll restoration helpers in `modules/app-runtime.js` exist.
- Reworking that render model is **Workstream F** in `ROADMAP.md` and is explicitly scheduled last. Do not start it opportunistically.
- Add new event wiring inside the existing init/wiring functions (`initializeAppInteractions`, `initializeShellInteractions`, `createInteractionWiring`) rather than scattering global listeners.
- For progress changes, follow the existing sequence: mutate `_watchedArray` -> `saveWatchedState` -> re-render/update -> optional toast/sound/haptic.
- Theme is `preferences.interfaceTheme` (`sith-dark` / `jedi-light`) stored in the `sw_redesign_preferences` blob and applied as `body[data-interface-theme]`. This is the only theme system.

## Data import/update workflow
- Canonical import script: `star-wars-timeline/scripts/import_chronological_data.py` (note: under `scripts/`).
- It parses `Chronological Viewing Order.md` and preserves existing color/poster/synopsis/id metadata from the current JSON.
- Typical workflow when updating timeline content:
  1. Edit `star-wars-timeline/Chronological Viewing Order.md`.
  2. Run `python3 star-wars-timeline/scripts/import_chronological_data.py` from repo root.
  3. Review the generated output, then update `star-wars-timeline/data/timeline-data.json` when verified.
  4. Run `python3 star-wars-timeline/scripts/sync_uid_manifest.py` so ids stay stable.
  5. Run the verification pass below.
- `scripts/import_disney_title.py` backfills Disney+ `watchUrl` values.

## Local development and verification
- **The timeline has a real verification gate. Run it before claiming work is done:**
  ```bash
  bash star-wars-timeline/scripts/verify_all.sh   # must exit 0
  ```
  It runs `node --check` across active JS, validates timeline + music data, and smoke-tests routes over HTTP. Requires `python3`, `node`, and `curl`. Details in `star-wars-timeline/VERIFICATION.md`.
- `checkpoint/` has its own loop: `npm run build:css`, `node scripts/preflight_config.mjs`, `bash scripts/smoke_test.sh` (see `checkpoint/ENGINEERING_RULES.md`).
- The root dashboard and `blurgen-translator/` have no build step.
- Use a server (not `file://`) because apps rely on `fetch` for JSON:
  - `python -m http.server 8000`
  - Dashboard: `http://localhost:8000/`
  - Timeline: `http://localhost:8000/star-wars-timeline/`
  - Blurgen: `http://localhost:8000/blurgen-translator/`
- After timeline changes, manually verify: filter combinations, modal episode toggles, reset flow, stat cards, and persistence across page reload.

## Repo-specific coding style
- Keep vanilla JS style and existing naming conventions (`init*`, `attach*`, `update*`, `get*`).
- Prefer small module functions and callback injection over adding cross-module global state.
- Keep static asset paths relative (e.g., `./images/posters/...`, `./audio/music/...`) to match current hosting structure.
- **Render posters through `renderPoster()` in `modules/images.js`**, never a bare `<img>`. It emits WebP + JPG fallback with lazy loading and intrinsic dimensions. New posters need `npm run build:posters`, or data validation fails.
- Background audio is opt-in: `preload="none"` and music defaults off. Do not reintroduce eager audio loading.
- Timeline markup currently uses many arbitrary Tailwind values and some raw hex colors. Tokenizing this is **Workstream D** in `ROADMAP.md`; prefer existing `tailwind-config.js` tokens in new markup rather than adding more arbitrary values.
