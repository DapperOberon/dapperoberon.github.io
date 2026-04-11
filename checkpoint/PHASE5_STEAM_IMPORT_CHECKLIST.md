# Checkpoint Phase 5 Steam Import Checklist

This checklist translates `PHASE5_STEAM_IMPORT_PLAN.md` into actionable implementation slices.

## Phase 5A: Planning + IA Shell

- [x] Add `Imports` to the Settings local navigation.
- [x] Add a `Steam Import` settings surface with two import modes:
  - `Owned Library`
  - `Wishlist`
- [x] Add a shared import stepper shell:
  - Source
  - Preview
  - Rules
  - Review
  - Import
  - Complete
- [x] Add first-pass empty/setup states for:
  - missing Steam API key
  - private Steam game details
  - invalid Steam profile URL / SteamID
- [x] Document Steam import scope and privacy expectations in-app.

Definition of done:
- Settings can render the Phase 5 import surface without performing any import yet.

## Phase 5B: Steam Data Model + Normalization

- [x] Add normalized Steam metadata fields to catalog games:
  - `steam.appid`
  - `steam.appUrl`
  - `steam.playtimeForeverMinutes`
  - `steam.playtime2WeeksMinutes`
  - `steam.lastImportedAt`
  - `steam.lastRefreshedAt`
  - `steam.importSource`
- [x] Add optional entry-level external playtime metadata:
  - `externalPlaytime.steam.appid`
  - `externalPlaytime.steam.playtimeForeverMinutes`
  - `externalPlaytime.steam.playtime2WeeksMinutes`
  - `externalPlaytime.steam.lastImportedAt`
- [x] Add migration defaults for existing catalog games and entries.
- [x] Ensure backup/export/import preserves Steam metadata.
- [x] Keep Steam playtime separate from editable Checkpoint progress fields.

Definition of done:
- Existing saves load safely, and Steam metadata can be stored without overwriting Checkpoint progress.

## Phase 5C: Worker Steam Owned-Library API

- [x] Add optional Cloudflare Worker secret/env config:
  - `STEAM_WEB_API_KEY`
- [x] Add worker route:
  - `GET /api/steam/owned-games?steamid=...&includeFreePlayed=true`
- [x] Add worker route:
  - `GET /api/steam/resolve-profile?profile=...`
- [x] Normalize Steam owned-game payloads:
  - Steam AppID
  - title
  - icon/art references when available
  - total playtime minutes
  - recent playtime minutes
- [x] Handle API errors:
  - missing key
  - invalid SteamID
  - private/inaccessible game details
  - Steam API unavailable
- [x] Add worker syntax/regression coverage.

Definition of done:
- Frontend can request a normalized owned-library preview from the worker.

## Phase 5D: Owned-Library Preview

- [x] Add Steam source form:
  - SteamID64/Profile URL
  - include played free games toggle
- [x] Fetch owned library into transient import session state.
- [x] Render preview summary:
  - total games found
  - played games
  - unplayed games
  - recently played games
  - exact existing matches
  - possible matches
  - unmatched items
- [x] Render import preview rows/cards:
  - Steam title
  - Steam AppID
  - total playtime
  - recent playtime
  - proposed status
  - match confidence/status
- [x] Keep this preview read-only until the user confirms.

Definition of done:
- User can safely inspect Steam library data before any local writes happen.

## Phase 5E: Import Rules

- [x] Add import rules screen.
- [x] Default destination to `Backlog`.
- [x] Add optional rule:
  - suggest recently played as `Playing`
- [x] Prevent automatic `Finished` assignment.
- [x] Add duplicate behavior:
  - skip exact match
  - merge Steam metadata for exact AppID match
  - ask for title-only match
- [x] Store chosen rules in transient session state.

Definition of done:
- Import rules match Checkpoint's status model and never infer completion from Steam.

## Phase 5F: Matching + Conflict Review

- [x] Match by Steam AppID first.
- [x] Match by existing Steam store/app URL second.
- [x] Match by normalized title third.
- [x] Use IGDB search only for unresolved title candidates.
- [x] Add candidate actions:
  - Add
  - Skip
  - Merge
  - Review
- [x] Detect existing Wishlist entries and avoid duplicates.
- [x] Detect existing Library entries and avoid duplicate library entries.
- [x] Show match confidence and reason.

Definition of done:
- User can resolve conflicts before committing import selections.

## Phase 5G: Owned-Library Commit

- [x] Commit selected owned games to local catalog/library.
- [x] Default imported entries to `Backlog`.
- [x] Apply `Playing` only when user accepted recently-played suggestion/rule.
- [x] Preserve Steam AppID and playtime metadata.
- [x] Do not overwrite Checkpoint progress/playtime.
- [x] Do not overwrite curated metadata unless user chose merge/update.
- [x] Add activity entries for import summary.
- [x] Add toast/status result after import.

Definition of done:
- User can import selected Steam owned games without duplicates or destructive overwrites.

## Phase 5H: Steam Playtime UI

- [x] Display Steam total playtime separately from Checkpoint playtime in Library details.
- [x] Display Steam recent playtime when available.
- [x] Add optional action:
  - `Use Steam Total`
- [x] Add optional action:
  - `Add Steam Time to Checkpoint`
- [x] Keep these actions explicit and reversible where possible.
- [x] Add card-level Steam playtime only if it does not create visual clutter.

Definition of done:
- Steam playtime is useful context without taking over Checkpoint's editable tracking fields.

## Phase 5I: Post-Import Enrichment

- [x] Queue imported titles for IGDB metadata hydration.
- [x] Preserve Steam metadata while applying IGDB-first media.
- [x] Use SteamGrid fallback only when IGDB media is missing.
- [x] Fetch ITAD pricing where possible.
- [x] Prevent enrichment from overwriting user-locked fields.
- [x] Add partial-failure reporting for enrichment after import.

Definition of done:
- Imported games converge toward existing Discover/Library metadata quality.

## Phase 5J: Best-Effort Steam Wishlist Import

- [ ] Add Wishlist mode to Steam Import surface.
- [ ] Add paste input for:
  - Steam wishlist URL
  - copied page content
  - plain Steam app URLs/title list
- [ ] Parse Steam AppIDs where available.
- [ ] Parse titles where AppIDs are not available.
- [ ] Show parse confidence and unresolved rows.
- [ ] Reuse matching/conflict review:
  - already in Wishlist
  - already in Library
  - add to Wishlist
  - skip
  - needs review
- [ ] Commit selected missing titles to Wishlist.
- [ ] Add Steam wishlist import metadata:
  - `source: "steam-wishlist-import"`
  - `steam.wishlistImportedAt`
- [ ] Label this mode best-effort because Steam wishlist APIs are not stable/official.

Definition of done:
- User can paste Steam wishlist data and review resolved titles before adding them to Checkpoint Wishlist.

## Phase 5K: QA + Hardening

- [ ] Add automated fixtures for:
  - played owned game
  - unplayed owned game
  - recently played owned game
  - exact AppID duplicate
  - title-only possible match
  - private/inaccessible profile
  - missing API key
  - pasted wishlist with app URLs
  - pasted wishlist with title-only rows
- [ ] Add regression checks:
  - no duplicate import on repeat import
  - no auto-finished status
  - no Checkpoint playtime overwrite
  - Steam metadata survives export/import
  - enrichment preserves Steam fields
- [ ] Add smoke script stage for Steam import logic using mock payloads.
- [ ] Manual QA:
  - small library
  - large library
  - invalid profile
  - duplicate import
  - wishlist paste import

Definition of done:
- Steam import is safe, testable, and non-destructive.

---

## Phase 5 Exit Criteria

- [ ] Owned Steam library can be previewed before import.
- [ ] Selected owned games can be imported to Backlog.
- [ ] Recently played games can be suggested as Playing without being forced.
- [ ] No imported game is automatically marked Finished.
- [x] Steam playtime is stored and displayed separately from Checkpoint progress.
- [ ] Repeat imports do not create duplicates.
- [ ] Pasted Steam wishlist data can be reviewed and imported to Wishlist best-effort.
- [x] Imported games use existing IGDB-first media and ITAD enrichment.
- [ ] Automated regression checks cover import safety and no-overwrite behavior.
