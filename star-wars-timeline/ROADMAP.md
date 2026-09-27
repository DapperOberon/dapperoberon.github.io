# Star Wars Timeline Roadmap

Status: Active
Date: 2026-09-26
Last updated: 2026-09-27 — **Sprints 1 and 2 complete** (Workstreams A and B).
Next: Sprint 3 — Workstream D, the design system and token layer.

### Sprint 2 result

Served tree **116 MB → 44 MB** (62% smaller). Measured, not estimated.

| Bucket | Before | After |
| --- | --- | --- |
| Reference assets (unused at runtime) | 51 MB | **0 MB** (moved to `archive/`) |
| `audio/music` | 47 MB | 36 MB, and **not fetched until the user opts in** |
| `images/posters` | 18 MB | 20.5 MB across 3 role-sized variants |

Posters now occupy slightly *more* disk than before, because each one ships a
900px WebP, a 1600px hero WebP, and a 900px JPG fallback. That is deliberate:
**what matters is bytes sent to a visitor, not bytes on disk.** Any given page
view downloads one hero variant plus the standard variants that scroll into
view — never all three sets.

Typical first paint is roughly **620 KB**: app shell, modules, timeline data,
and one eager hero poster. Remaining posters are lazy (~143 KB each, on scroll)
and audio is opt-in at 0 KB.

## Purpose

This document is the single execution plan for `star-wars-timeline/`. It consolidates the findings of the 2026-09-26 full audit and adds two new product workstreams:

- per-title music playlists
- a complete UI consistency pass

It supersedes the planning portions of `PROJECT_REFACTOR_PLAN.md` and `UID_MIGRATION_PLAN.md` (both effectively complete) and absorbs the outstanding items from `POLISH_PLAN.md`.

Rule for this document: a box is only ticked when the change is implemented **and** `bash star-wars-timeline/scripts/verify_all.sh` passes.

## Current State Snapshot

Measured on 2026-09-26.

Verification: `bash star-wars-timeline/scripts/verify_all.sh` exits `0`.

- ~~25~~ **23** JavaScript files pass `node --check` (Sprint 1 removed 2 dead files)
- 7 eras, 50 entries, 563 episodes
- 16 music tracks
- ~~9~~ **8** HTTP routes respond (Sprint 1 dropped the dead `content-page.js` route)

> The gate requires `node`, `python3`, and `curl`. `check_js_syntax.py` shells
> out to `node --check`; without Node the entire pass fails at step 1.

Data integrity is clean:

- 0 duplicate entry ids
- 50/50 ids are exactly 3-character base36
- 0 missing poster files, 0 orphaned posters
- 0 `episodes` vs `episodeDetails` mismatches
- 0 entries shipping non-zero `watched`

Known weight:

- `audio/music` — 47 MB across 16 MP3s
- `images/posters` — 18 MB across 34 JPGs
- `qa-artifacts` + `images/website-reference` + `images/design-reference` — ~51 MB not used at runtime

Architecture is healthy: `app.js` is a 260-line composition layer over 24 modules. The refactor described in `PROJECT_REFACTOR_PLAN.md` is complete.

## Workstream Overview

| ID | Workstream | Priority | Risk | Depends on |
| --- | --- | --- | --- | --- |
| A | Truth and cleanup | Highest | Low | — |
| B | Performance and reach | Highest | Low | A |
| C | Per-title music playlists | High | Medium | A |
| D | UI consistency and design system | High | Medium | A |
| E | Product polish and accessibility | Medium | Low | D |
| F | Structural and render model | Medium | High | D, E |

---

## A. Truth And Cleanup

Priority: Highest
Goal: Remove dead code and stale documentation so every later decision is made against accurate information.

### A1. Resolve `content-page.js`

`content-page.js` is orphaned. Nothing loads it: `guide/`, `privacy/`, and `terms/` are now meta-refresh redirect stubs pointing at `../?page=X`, and the real content lives in `modules/content-pages.js`.

It is also broken. It calls:

- `renderContentTopBar({ basePath, activePage })` — but `modules/shell.js` defines `renderContentTopBar()` with no parameters
- `renderStandardFooter({ basePath, activeLink })` — but `basePath` is never read in `shell.js`

Two verification checks currently guard this dead file and report false confidence:

- `scripts/check_js_syntax.py` line 17
- `scripts/smoke_test.sh` line 57

Todos:

- [x] Decide: delete `content-page.js`, or restore it as a real no-JS fallback for content pages. **Decided: deleted.** It was unreachable, depended on a `<template id="page-content">` that no longer exists, and called two `shell.js` functions with unsupported arguments. Restoring it would have meant rebuilding template plumbing to serve pages that already work via `?page=X`.
- [x] If deleting, remove it from `scripts/check_js_syntax.py` and `scripts/smoke_test.sh`.
- [x] ~~If keeping, fix the call signatures~~ — not applicable; deleted.
- [x] Remove `renderContentTopBar` from `modules/shell.js` if it ends up with no callers. It was a no-op stub returning `""`; removed.

Definition of done:

- No runtime file is referenced by verification scripts unless a user can actually reach it. ✅ Smoke routes 9 → 8; JS syntax targets 25 → 23.

### A2. Remove Dead Persistence Exports

`modules/persistence.js` exports four functions with zero callers:

- `loadThemePreference`
- `saveThemePreference`
- `loadCollapsedEras`
- `saveCollapsedEras`

It also defines `DEFAULT_THEME_ID = 'modern-starwars'`, a theme id that exists nowhere else in the app. The live theme system is `preferences.interfaceTheme` (`sith-dark` / `jedi-light`) stored in `sw_redesign_preferences`.

Todos:

- [x] Delete the four unused exports and the `sw_theme` / `modern-starwars` constants. Also removed `getDefaultThemeId` (five exports total). `persistence.js` 213 → 162 lines.
- [x] Confirm `sw_collapsed_eras` is genuinely unused before dropping the helpers. Confirmed — the key appeared only inside its own getter/setter.
- [x] Delete `modules/data.js` if its compatibility re-exports have no remaining callers. Confirmed zero importers; its unique helpers `hexToRgb` and `getMediaTypeInfo` were also uncalled. Whole file deleted.
- [x] Retained `getLegacyWatchedStorageKey` — it looks externally unused but is load-bearing inside the watched-key migration chain. **Do not remove.**

Definition of done:

- Exactly one theme system exists in the codebase. ✅ Only `preferences.interfaceTheme` remains.

### A3. Verify The Second Theme Is Real

`styles.css` contains exactly one theme override block: `body[data-interface-theme="jedi-light"]` at line 600. The preferences UI presents Jedi Light and Sith Dark as an equal pair in three separate places in `modules/content-pages.js`.

**Measured 2026-09-27 — worse than described above.** The single `jedi-light`
block at `styles.css:600` contains **exactly one declaration**: a `background`
shorthand resolving to `#171d20`. That is a *dark* color. There are zero
`sith-dark`-specific blocks, so Sith Dark is simply the unthemed baseline.

Net effect: selecting "Jedi Light" — presented with a `light_mode` sun icon in
`content-pages.js:494` — produces a marginally different **dark** background and
changes nothing else. No text, surface, border, or token color is remapped.
It is not a light theme in any meaningful sense.

Todos:

- [x] Visually audit Jedi Light across timeline, stats, preferences, guide, privacy, and terms. Audited by inspection: a single `background` declaration cannot alter any of those surfaces beyond the page backdrop, so all six render effectively identically.
- [x] **DECIDED 2026-09-27: removed.** Jedi Light no longer ships. Removed the `styles.css` override, both `data-pref-theme` button pairs, the two theme status readouts (the System panel now reports Scanlines instead), the `onThemePreference` handler, and its `app-interactions.js` wiring.
  - Added `SUPPORTED_INTERFACE_THEMES` + `normalizeInterfaceTheme()` in `modules/preferences.js`. Returning users with a stored `jedi-light` are coerced to `sith-dark` on load, and `applyPreferencesToDocument` can never write a retired theme id to the DOM. Verified by test.
  - **A real light theme is deferred to Workstream D (see D2 below), not abandoned.** Rebuilding it on the token layer is the tractable path: remap the ~48 semantic color tokens once, rather than hand-writing per-surface overrides. Until then the app ships one honest theme.

### A4. Reconcile Documentation

- [x] `RUNTIME_ARCHITECTURE.md`: removed `sw_theme` / `sw_collapsed_eras` and `content-page.js`; also dropped the `modules/data.js` entry and the stale "collapsed-era / theme storage" bullets under `persistence.js`. **Additionally fixed 65 broken links** that pointed at absolute `/mnt/Misc SSD/Github Respositories/...` paths from a different machine — all are now repo-relative.
- [x] `PROJECT_REFACTOR_PLAN.md`: marked Complete with a banner noting the 2,088-line claim is historical (`app.js` is ~260).
- [x] `UID_MIGRATION_PLAN.md`: marked Complete; the four open decisions are answered from shipped data in a new Outcome section. Verified: 50/50 ids exactly 3-char lowercase base36, manifest-driven via `uid-manifest.json` (`format: base36-3`), and **`watched` is absent from live JSON entirely** — stronger than the "zeroed" outcome assumed here.
- [x] `POLISH_PLAN.md`: marked Superseded, pointing at Workstream E.
- [x] `.github/copilot-instructions.md`: rewritten. Corrected entry point (`app.js`), data paths (`data/*.json`), module map, render model, import workflow (`scripts/`), theme system, asset paths, and added the `verify_all.sh` gate plus the `checkpoint/` build exception.
- [x] `VERIFICATION.md`: added a Prerequisites section — `check_js_syntax.py` shells out to `node`, which was not obvious and silently broke the whole pass when Node was absent.
- [x] Consolidated duplicate planning docs: `redesign/` held newer condensed copies of two files also present in `archive/redesign/`. Both versions preserved; the newer pair moved to `archive/redesign/*_POST_PROMOTION.md` and the `redesign/` directory removed.

### A5. Repo Hygiene

- [x] Push the pending git-hygiene commit `d770b63`. **Already done** — `d770b63` is on `origin/main` and the working tree was clean. This item was stale when written.
- [x] Decide whether `qa-artifacts/` and `images/website-reference/` should stay in the served tree. **Decided: moved out.** `qa-artifacts/` (23 MB), `images/website-reference/` (24 MB), and `images/design-reference/` (4.1 MB) now live under `archive/`. 51 MB — 44% of the served tree — removed with zero code changes, since nothing loaded them at runtime.

---

## B. Performance And Reach

Priority: Highest
Goal: Cut page weight and make shared links look like a real product.

### B1. Poster Pipeline

34 JPGs totaling 18 MB, averaging ~530 KB. The worst single file is `acolyte-poster.jpg` at 2.6 MB. There is no WebP, no `srcset`, and `loading=` appears zero times in the module tree, so every poster loads eagerly.

Affected render sites in `modules/timeline-renderers.js`: lines 79, 153, 159, 216, 309.

Todos:

- [x] Convert posters to WebP with JPG fallback. New `modules/images.js` `renderPoster()` emits a `<picture>` with a WebP `<source>` and JPG `<img>` fallback; all 9 poster render sites route through it.
- [x] Add `loading="lazy"` and `decoding="async"` to all non-hero posters. Also applied to the 3 decorative era logos.
- [x] Add explicit `width` and `height` to stop layout shift.
- [x] Keep the hero poster eager so first paint stays strong (`eager: true` adds `fetchpriority="high"`).
- [x] Extend `scripts/validate_timeline_data.py` to check derivative files exist — a missing `.webp` is now a hard error.
- [x] Added `scripts/build_poster_derivatives.py` (+ `npm run build:posters`) so the set is reproducible.

Target: 18 MB down to under 4 MB.

**Corrected 2026-09-27 — the first pass shipped posters too small.**

The initial build used one global 600px width, taken from an unverified claim
that posters "render at most ~500px wide." Checking the actual markup showed
that was wrong for the most prominent image on the page: the hero
(`app-layout.js`) is a **full-bleed backdrop**, not a thumbnail, so 600px was
being upscaled **3.2× at 1920px** and 4.8× on a Retina laptop. Visibly soft.

Posters are now sized by role, regenerated from the originals in git:

| Variant | Width | Used by | Total |
| --- | --- | --- | --- |
| `*-lg.webp` | 1600px @ q70 | hero backdrop (`hero: true`) | 8.1 MB |
| `*.webp` | 900px @ q82 | cards, modal | 5.4 MB |
| `*.jpg` | 900px @ q82 | fallback for non-WebP browsers | 7.0 MB |

Notes:

- The hero variant uses quality 70 because it renders at `opacity-50` beneath
  two gradient overlays, which hides compression detail — ~25% off the largest
  asset on the page for no visible cost.
- **Never upscale.** 19 of 34 sources are narrower than 1600px and are kept at
  native width.
- The hero entry is **dynamic** (`getNextObjective` returns the next unwatched
  title), so every poster needs a `-lg` variant, not just one.
- **First paint is unchanged at ~620 KB.** The hero was always one eager image;
  it is simply the correctly-sized one now. Disk grew, bytes-to-user did not.
- `validate_timeline_data.py` now requires *both* derivatives, verified by
  deliberately removing one and confirming the failure.

> `<picture>` carries `style="display:contents"` so it generates no layout box
> and the `<img>` still sizes against its original container. Without this,
> `w-full h-full` would resolve against the `<picture>` and break every poster.

### B2. Audio Loading

47 MB of MP3s. `track-13-main-title-and-escape.mp3` alone is 10.5 MB. `modules/audio.js` defaults `musicEnabled` to `true` when no preference is stored (line 493).

Todos:

- [x] Never fetch audio until the user actually starts playback.
- [x] Re-encode at a lower bitrate; verify quality on the longest tracks. All 16 tracks re-encoded to 96 kbps joint stereo: **47 MB → 36 MB**, with total runtime preserved exactly at 41.9 min and 16/16 decoding cleanly. `track-13` went 10.5 MB → 5.4 MB. Reproducible via `scripts/build_audio_derivatives.sh`.
- [x] Add `preload="none"` to the background player (was `'auto'`).
- [x] Reconsider default-on behavior. **Now defaults OFF** for first-time visitors (`stored === null ? false`). Defaulting on meant a multi-megabyte fetch before any interaction, and browsers block autoplay regardless — so it cost bandwidth and delivered nothing.

> 42 minutes of audio has a floor; the real win is that **none of it loads until
> the user opts in.** Combined with default-off, typical first load now fetches
> zero audio bytes.

### B3. Metadata And Crawlability

`index.html` has zero matches for `og:`, `twitter:`, `name="description"`, and `noscript`. Every shared entry link renders an identical blank preview.

Todos:

- [x] Add `<meta name="description">`, Open Graph, and Twitter card tags. Also added a descriptive `<title>` and `rel="canonical"`.
- [x] Add a `<noscript>` block describing the app.
- [x] Add `<meta name="robots" content="noindex">` to the `guide/`, `privacy/`, and `terms/` redirect stubs (used `noindex,follow` so link equity still flows).
- [x] Generated `images/social-preview.jpg` (1200×630, 40 KB) so shared links render a real card instead of a blank box. Smoke-tested as a route.
- [ ] Investigate per-entry OG images as a later enhancement. Still open — needs either build-time generation per entry or an image service; not worth blocking on.

### B4. Tailwind Delivery

`index.html` loads `https://cdn.tailwindcss.com?plugins=forms,container-queries` plus a separate `tailwind-config.js` request. Render-blocking, FOUC-prone, and logs a production warning.

`checkpoint/` already solved this with a compiled `tailwind.generated.css` and a `build:css` script. Copy that pattern.

Todos:

- [x] Add a minimal Tailwind build mirroring `checkpoint/package.json`. Added `package.json` (`build:css`, `watch:css`, `build:posters`, `verify`), `tailwind.config.cjs`, and `tailwind.input.css`.
- [x] Generate `tailwind.generated.css` (49 KB minified) and swap the CDN script out of `index.html`. Deleted the now-obsolete `tailwind-config.js` and pointed `check_js_syntax.py` at the new config.
- [x] Document the build step in `RUNTIME_ARCHITECTURE.md`.
- [x] Coordinate with Workstream D so tokens land in the config, not in markup. All 48 existing semantic tokens carried over verbatim; added a `brand-yellow` token (`#fbe419`) as the anchor for the D2 yellow reconciliation.

> Removing the CDN also removes a render-blocking third-party script and the
> production console warning it emitted.

---

## C. Per-Title Music Playlists

Priority: High
Goal: Let users choose a soundtrack scoped to a specific film or series, so the music matches whatever they are currently exploring.

### C1. Product Intent

Today `data/music-data.json` is a flat array of 16 tracks with only `src` and `title`. The player shuffles through all of them regardless of what the user is looking at. Several tracks are already title-specific in everything but metadata — `Rebels Theme`, `The Mandalorian`, `Andor Main Title`, `Rogue One`, `Ahsoka vs. Maul`, `Corellia Chase` — but the app has no idea which entry they belong to.

Target behavior:

- Each track declares which timeline entries it belongs to.
- Users can pick a playlist: **All Music** (today's behavior), or any specific film/series that has tracks.
- Opening an entry modal offers that entry's soundtrack if one exists.
- The selection persists across reloads.
- If a playlist has no tracks, it is never offered as an empty choice.

Non-goals for this workstream:

- No new audio files are required. Ship with the 16 tracks already present.
- No streaming or external music service integration.

### C2. Data Model

Extend each track in `data/music-data.json` with optional association fields. `modules/audio.js` `normalizeMusicTracks()` already ignores unknown keys and already supports a richer `sources` array, so this is additive and backward compatible.

Proposed shape:

```json
{
  "src": "./audio/music/track-09-the-mandalorian.mp3",
  "title": "The Mandalorian",
  "entryIds": ["013"],
  "collection": "The Mandalorian",
  "era": "The New Republic"
}
```

Field definitions:

- `entryIds` — array of timeline entry ids this track scores. Empty or absent means general-purpose.
- `collection` — human-readable playlist label. Falls back to the entry title when absent.
- `era` — optional era association, enabling era-level playlists later.

Rules:

- `entryIds` must reference real ids in `data/timeline-data.json`.
- A track may belong to multiple entries.
- Tracks with no association still appear in **All Music**.

Mapping notes, verified against the live data on 2026-09-26:

- The example above is valid: id `013` is `The Mandalorian` in the New Republic era.
- `The Mandalorian` exists as **two** entries (`013` and `015`) because of chronology splitting, so its tracks need `entryIds: ["013", "015"]`. This is exactly why `entryIds` is an array.
- `Andor` is `00r`; `Star Wars Rebels` is `00t`.
- `Rogue One` has **no timeline entry**, so `track-06-rogue-one.mp3` must rely on `collection` alone. Do not invent an entry for it.
- This interacts with Workstream E3: once duplicate-title disambiguation is settled, re-check every `entryIds` mapping.

Todos:

- [ ] Add `entryIds` / `collection` / `era` to the 16 existing tracks. Several map obviously; leave genuinely general tracks unassociated.
- [ ] Extend `scripts/validate_music_data.py` to verify every `entryIds` value resolves to a real entry id and to report orphaned references as hard failures.
- [ ] Keep the existing duplicate-title and duplicate-source checks intact.
- [ ] Document the new schema in `RUNTIME_ARCHITECTURE.md` under Music Data.

Definition of done:

- `python3 star-wars-timeline/scripts/validate_music_data.py` fails loudly on a bad `entryIds` reference.

### C3. Audio Controller Changes

`modules/audio.js` currently holds `backgroundMusicTracks` as a single flat array and indexes it with `backgroundMusicIndex`. Playlist support means separating the full track library from the active queue.

Todos:

- [ ] Keep the full normalized library in one place; derive the active queue from it.
- [ ] Add `getAvailablePlaylists()` returning `{ id, label, trackCount }`, always including `all`.
- [ ] Add `setActivePlaylist(playlistId)` that rebuilds the queue, resets the index, and emits state.
- [ ] Add `getActivePlaylist()` and include the active playlist in the `emitStateChange()` payload so subscribers update.
- [ ] Persist the choice under a new `sw_music_playlist` key; fall back to `all` when the stored id no longer exists.
- [ ] Guard every empty-queue path: `nextTrack()`, `startBackgroundMusic()`, and the pill controls must no-op safely.
- [ ] Preserve existing behavior exactly when the playlist is `all`.

### C4. UI Surfaces

The music pill lives in `modules/shell.js` (`#music-pill`, currently `hidden xl:flex`) with a title, play/pause, and next button. Mobile has `renderMobileAudioPlayer`.

Todos:

- [ ] Add a playlist selector to the desktop music pill.
- [ ] Add the same control to the mobile audio player so parity holds.
- [ ] Add a soundtrack affordance in the entry modal when that entry has tracks.
- [ ] Show the active playlist name in Preferences alongside the existing music controls.
- [ ] Display track position, for example `Track 2 of 5`.
- [ ] Follow the Workstream D component tokens rather than inventing new pill styling.

### C5. Verification

- [ ] Extend `scripts/validate_music_data.py` as described in C2.
- [ ] Add a smoke assertion that `data/music-data.json` still serves and parses.
- [ ] Manual QA: switch playlists while playing, while paused, and with audio disabled.
- [ ] Manual QA: confirm a reload restores the chosen playlist.
- [ ] Manual QA: confirm an entry with no tracks shows no soundtrack affordance.

Definition of done:

- A user can pick a film or series and hear only that soundtrack.
- The default experience is unchanged for anyone who never opens the selector.

---

## D. UI Consistency And Design System

Priority: High
Goal: Make every surface use the same tokens and the same components, so the app looks deliberately designed rather than assembled.

### D1. The Problem, Measured

The app has a real design system in `tailwind-config.js` — 48 semantic color tokens, 3 font families, 4 border radii. The markup frequently bypasses it.

Counted across `modules/*.js` on 2026-09-26:

| Signal | Count | Issue |
| --- | --- | --- |
| Arbitrary Tailwind values `[...]` | 283 | bypassing the token scale |
| `text-[10px]` | 87 | a de facto font size that is not a token |
| `text-[11px]` / `text-[9px]` / `text-[8px]` | 13 / 7 / 2 | four competing micro sizes |
| Hardcoded `#FFE81F` | 8 | Star Wars yellow, not in the config |
| Hardcoded `#fbe419` | 4 | this *is* `primary-fixed`, written raw |
| Hardcoded `#75d1ff` | 4 | this *is* `secondary`, written raw |
| Hardcoded `#131313` | 3 | this *is* `background`, written raw |
| `tracking-` variants | 12 distinct | `[0.2em]` ×30, `[0.18em]` ×14, `[0.3em]` ×6, `[0.15em]` ×5, plus 8 more |

The headline problem: `#FFE81F` (the brand yellow used in the top bar and sidebar headings) and `#fbe419` (`primary-fixed`) are **two slightly different yellows used interchangeably**. One is a token, one is not, and neither is declared as the brand color.

Additionally, four custom component classes exist but are applied inconsistently: `control-pill` (8 uses), `nav-underline-button` (8), `glass-surface` (5), `glass-surface-soft` (5), `era-nav-button` (2).

### D2. Establish The Token Layer

Todos:

- [x] **Decide the canonical brand yellow. Chose `#fbe419`.** It is already the value behind `primary-fixed`, `primary-container`, and `surface-tint`; it dominates `styles.css` (9 uses vs 1); and `primary-fixed` already had 128 token uses against 8 raw `#FFE81F`. Standardizing on it collapses the raw uses into an existing token rather than introducing a 49th color. The two differ by ~2% per channel — imperceptible, but they meant there was no single answer to "what is the brand color?"
- [x] Add it as a named token. Done in `tailwind.config.cjs` (note: the roadmap said `tailwind-config.js`, which B4 replaced). `brand-yellow` is an alias of `primary-fixed` for markup that means "the brand mark" rather than "the primary fill".
- [x] Replace all raw hex occurrences with token classes. **`modules/` now contains zero raw hex colors**, enforced by a new check.
- [x] Add the micro type scale as real tokens. `text-[10px]`×83 → `text-label`, plus `text-label-lg` (11px), `text-label-sm` (9px), `text-label-xs` (8px). A stray `text-[14px]` became `text-sm` (exactly 14px).
- [x] Collapse the `tracking-` variants. 9 distinct arbitrary values → 4 named steps (`tracking-hud`, `-hud-wide`, `-hud-wider`, `-hud-widest`), plus two that mapped onto Tailwind built-ins.
- [x] Add a check that fails when a raw hex appears in `modules/*.js`. `scripts/check_design_tokens.py` guards raw hex, arbitrary `text-[Npx]`, and arbitrary `tracking-[...]`; wired into `verify_all.sh`. Verified negatively by reintroducing a violation and confirming the failure.

**Result: 501 arbitrary values → 95 (81% reduction).** 177 token substitutions
across 22 modules.

> The roadmap counted 283 arbitrary values; the real number was **501**. The
> original measurement appears to have undercounted.

Some colors could not become utility classes because they sit in contexts
Tailwind cannot reach — SVG `stroke` attributes, inline `style`, and
`shadow-[...]` arbitrary values. Those now use `var(--brand-*)` CSS variables
declared in `styles.css:8`, which must be kept in sync with the Tailwind config.

Of the 18 substitution rules, **13 are pixel-identical**. Five shift slightly
and were accepted deliberately:

| Change | Shift | Where |
| --- | --- | --- |
| `#FFE81F` → `#fbe419` | ~2%/channel | brand yellow, the point of the exercise |
| `tracking-[0.12em]` → `0.15em` | +0.03em | 2 sites |
| `tracking-[0.22em]` → `0.2em` | −0.02em | 1 site |
| `tracking-[0.4em]` → `0.3em` | −0.1em | footer copyright, 9px at 20% opacity |
| `tracking-[0.03em]` → `0.025em` | −0.005em | 1 site |

Definition of done:

- No raw hex colors in module markup.
- Micro typography comes from a named scale.

### D3. Componentize Repeated Markup

Every nav button, pill, chip, and panel is currently written as a long inline class string, duplicated at each call site. `material-symbols-outlined` appears 53 times.

Todos:

- [x] Build small render helpers for the recurring primitives. New `modules/ui.js`: `cx`, `stateClass`, `currentPageAttr`, `icon`, `stateIcon`, `button`, `navButton`, `mobileNavButton`, `footerLink`.
- [x] Replace the duplicated active/inactive class ternaries in `modules/shell.js` with a single state helper. **The ternary appeared 11 times** — 4 in the desktop nav, 4 in the mobile nav, 3 in the footer — and is now expressed once in `stateClass()`.
- [x] Keep helpers presentational only. No state, no event wiring, no data access; callers pass everything in and attach their own `data-*` hooks.
- [x] Introduced a shared `PRIMARY_NAV` list so the desktop top bar and mobile bottom nav cannot drift apart. This directly serves D4's "desktop and mobile expose the same destinations".
- [ ] Route `control-pill`, `glass-surface`, `glass-surface-soft`, and `era-nav-button` through helpers. **Deliberately deferred** — see note below.

`shell.js` is 141 → 138 lines, but the meaningful change is that four nav
variants collapsed into two data-driven loops.

**Verification.** Rather than trust review, the pre- and post-refactor modules
were imported side by side and their output compared across all 15 render
states (7 top-bar pages, 4 mobile nav pages, 4 footer variants):
**30/30 structurally identical** — same elements, same class sets, same
attributes, same visible text.

One intentional difference: `aria-hidden="true"` is now on the Settings icon,
which sits beside a visible "Settings" label. Without it a screen reader
announces "tune Settings". This matches how the mobile nav icons already
behaved and is an accessibility fix, not a regression.

> **Why the remaining classes were not routed through helpers.**
> `control-pill` (4 uses), `glass-surface` (5), `glass-surface-soft` (5), and
> `era-nav-button` (2) are already single CSS classes doing their own
> abstraction — wrapping a one-class string in a function adds indirection
> without removing duplication. The nav ternary was worth extracting because it
> was 11 copies of multi-part conditional logic. These are not. Revisit during
> D4 if the cross-surface pass shows they actually diverge.

### D4. Cross-Surface Consistency Pass

Surfaces to align: timeline, entry modal, filter panel, stats, preferences, guide, privacy, terms.

Todos:

Audited 2026-09-27 by rendering actual module output and measuring it, rather
than reading class strings. Split into D4a (focus), D4b (structural), D4c
(cosmetic), D4d (design judgment).

### D4a — Focus ring ✅

- [x] **Same focus ring on every interactive element.** Coverage was **26 of 156 rendered interactive elements (17%)**. `styles.css` styled `:focus-visible` for six component classes *by name*, so every episode checkbox, poster card, era chip, and all four footer links were invisible to keyboard users — a WCAG 2.4.7 failure across most of the app. Replaced with an element-based `:where(a[href], button, input, select, textarea, summary, [tabindex])` rule: **156/156, 100%**. New markup can no longer silently opt out.
  - Visual treatment deliberately unchanged, so elements that were already correct look identical.
  - Added a `forced-colors: active` fallback to `Highlight` for Windows High Contrast Mode.
  - Tighter `outline-offset` on inputs, which sit in cramped containers.
  - **`z-index: 1` is applied without `position: relative`.** The obvious version of this rule breaks two absolutely-positioned modal close buttons by overriding their `position` on focus. Caught before commit.

### D4b — Structural correctness ✅

- [x] **Same heading hierarchy.** The desktop timeline rendered **57 headings, all `<h3>`** — era titles and the entries inside them at the same level, giving screen-reader users a flat list of 57 peers. Eras are now `h2`, entries `h3`, on both desktop and mobile. Zero level skips; verified by rendering all 7 eras and walking the sequence.
  - Mobile separately skipped `h2 → h4`; also fixed.
  - Content pages were already correct (one `h1`, clean descent) — the roadmap's "5 `<h1>`" concern was one per page, which is right.
- [x] **Desktop and mobile expose the same controls.** Audio controls had a **dead zone at 768–1279px**: the mobile player is `md:hidden` (0–767px) and the desktop pill was `hidden xl:flex` (1280px+). Every iPad landscape and small laptop had **no way to pause playing music**. The pill is now `md:flex` with a narrower layout below `lg`, making coverage continuous.
- [x] **`aria-expanded` / `aria-controls` on the filter triggers** (roadmap E1, but cross-surface so handled here). Both triggers now report panel state. This required threading `isFilterPanelOpen` through `renderAppMainContent`, which did not previously receive it — without that the attribute would have rendered `undefined`.

### D4c — Cosmetic alignment (pending)

- [ ] Same empty-state treatment everywhere. **Mostly already true** — the roadmap implies these are missing, but both desktop and mobile have empty states with identical copy and a Clear Filters button. They differ only in framing (desktop `py-16 text-center`, mobile `p-6 rounded-xl` left-aligned).
- [ ] Same hover and active transitions. 22 `transition-all` (animates every property), 13 `transition-colors`, 7 `transition-transform`; durations 3×`duration-700`, 1×`duration-200`, rest defaulted.

### D4d — Design judgment (needs review on real screens)

- [ ] Same panel elevation and border language; reduce stacked glass and glow where they compete. Five overlapping surface treatments in use: `utility-section` (42), `glass-panel` (8), `glass-surface` (5), `glass-surface-soft` (5), `content-page-shell` (5).
- [ ] Same spacing rhythm on every page.

### D5. Consistency Guardrails

- [ ] Write a short `DESIGN_SYSTEM.md` capturing tokens, components, and usage rules.
- [ ] Add the raw-hex grep check to `scripts/verify_all.sh`.
- [ ] Re-measure the arbitrary-value count and record it; the number should fall substantially from 283.

---

## E. Product Polish And Accessibility

Priority: Medium
Goal: Absorb the remaining `POLISH_PLAN.md` work now that the design system exists.

### E1. Accessibility

Current baseline is decent: 21 `aria-label`, 8 `aria-current`, 2 `aria-modal`, and `prefers-reduced-motion` honored in CSS and two JS paths. Poster `alt` text is present and escaped; decorative era logos correctly use `alt="" aria-hidden="true"`.

Gaps:

- [ ] `aria-expanded` appears **0 times**. Add it to the filter panel, era collapse toggles, and mobile nav.
- [ ] Only 2 `role=` attributes exist app-wide. Audit landmark and widget roles.
- [ ] Primary nav is all `<button data-nav-page>`. Convert to real `<a href>` so middle-click, Ctrl+click, and crawlers work.
- [ ] Label the desktop search input; it has a placeholder only.
- [ ] Verify focus returns correctly after closing the modal and filter panel.

### E2. Navigation And Hero

- [ ] Add mobile search. It is currently `hidden lg:block`, so small screens have no search at all.
- [ ] Make the hero CTA resolve to the user's true next unwatched item.
- [ ] Ensure the brand mark navigates home.
- [ ] Audit footer links so they support rather than replace primary navigation.

### E3. Content Data Gaps

- [ ] **36 of 50 entries have no `watchUrl`** (72%). Run `scripts/import_disney_title.py` to close the gap.
- [ ] Fix the `Tales of the Empire - 20 BBY` contradiction: 5 entries titled `20 BBY` all carry `year: "between 5 and 9 ABY"`, spread across 3 eras.
- [ ] Standardize duplicate-title disambiguation. Some titles embed the year (`The Clone Wars - 22-19 BBY`), others do not, producing `The Clone Wars` ×4 and `Star Wars Resistance` ×3 in the UI.
- [ ] Normalize era colors. `Reign of the Empire` is `#fff` and `Rise of the First Order` is `#ff0000` — raw defaults next to designed palette values.
- [ ] Review the single-entry `The High Republic` and `Non-Timeline` eras for layout quality.
- [ ] `seasons` is present on only 32 of 50 entries.

---

## F. Structural And Render Model

Priority: Medium
Risk: High. Do this last.

`modules/app-renderer.js` rebuilds the entire shell on every state change via `app.innerHTML = renderShellLayout(...)`, then re-binds everything. `modules/app-interactions.js` alone contains 34 `addEventListener` calls. Toggling one episode checkbox destroys and rebuilds the whole DOM.

This is the root cause of the focus and scroll scaffolding: `filterPanelScrollTop`, `restorePendingFocus`, `restoreOverlayFocus`, `restoreFocusOrigin`, and `pendingOverlayFocusSelector` all exist to compensate for it.

Todos:

- [ ] Introduce delegated event handling at a stable root.
- [ ] Separate full-page renders from targeted state updates.
- [ ] Retire the focus and scroll restoration hacks once they are unnecessary.
- [ ] Split `modules/content-pages.js` (1,160 lines, now the largest runtime module, holding guide + preferences + privacy + terms).
- [ ] Untangle the forward-declaration pattern in `app.js`, where `let appActions = null` and `let wireInteractions = () => {}` are referenced through lazy thunks before assignment.
- [ ] Keep behavior identical; this is a refactor, not a redesign.

---

## Execution Order

### Sprint 1 — Truth
Workstream A in full. Low risk, unblocks everything else.

### Sprint 2 — Weight And Reach
B1, B2, B3. The largest user-visible wins.

### Sprint 3 — Design System
D1, D2, D3. Must land before C4 so playlist UI is built on real components.

### Sprint 4 — Playlists
C1 through C5, plus B4 (Tailwind build) alongside D.

### Sprint 5 — Polish
D4, D5, E1, E2, E3.

### Sprint 6 — Structure
F, once the surface is stable.

## Verification Gate

Every sprint ends with:

```bash
bash star-wars-timeline/scripts/verify_all.sh
```

Plus manual confirmation that timeline, stats, preferences, guide, privacy, and terms all load, search works on desktop and mobile, filter/modal/nav flows are keyboard-usable, focus returns after closing overlays, and the music playlist selection survives a reload.

## Success Criteria

- No dead code or stale docs remain.
- Page weight drops from ~66 MB toward ~10 MB.
- Shared links render a real preview.
- Users can pick a soundtrack per film or series.
- Every surface draws from one token set and one component set.
- The app is fully usable by keyboard and on mobile.
