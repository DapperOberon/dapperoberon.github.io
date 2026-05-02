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

- [x] Add Wishlist mode to Steam Import surface.
- [x] Add paste input for:
  - Steam wishlist URL
  - copied page content
  - plain Steam app URLs/title list
- [x] Parse Steam AppIDs where available.
- [x] Parse titles where AppIDs are not available.
- [x] Show parse confidence and unresolved rows.
- [x] Reuse matching/conflict review:
  - already in Wishlist
  - already in Library
  - add to Wishlist
  - skip
  - needs review
- [x] Commit selected missing titles to Wishlist.
- [x] Add Steam wishlist import metadata:
  - `source: "steam-wishlist-import"`
  - `steam.wishlistImportedAt`
- [x] Label this mode best-effort because Steam wishlist APIs are not stable/official.

Definition of done:
- User can paste Steam wishlist data and review resolved titles before adding them to Checkpoint Wishlist.

## Phase 5K: QA + Hardening

- [x] Expand automated fixtures for owned-library import:
  - played owned game
  - unplayed owned game
  - recently played owned game
  - exact AppID duplicate
  - title-only possible match
  - Steam-decorated title that requires normalized IGDB matching
  - title that resolves to sparse Steam metadata and must promote through IGDB
- [x] Expand automated fixtures for Steam profile and worker failure states:
  - private/inaccessible profile
  - invalid vanity/profile URL
  - missing API key
  - Steam API returning partial/empty wishlist app details
- [x] Expand automated fixtures for wishlist import:
  - pasted wishlist URL backed by GetWishlist
  - pasted wishlist with app URLs
  - pasted wishlist with title-only rows
  - mixed Steam/IGDB/library duplicate cases
  - rows with AppID fallback titles that later enrich successfully
- [ ] Add regression checks for import safety:
  - no duplicate import on repeat owned-library import
  - no duplicate import on repeat wishlist import
  - exact-match merge keeps a single catalog identity
  - no auto-finished status
  - no Checkpoint playtime overwrite
  - no unintended status downgrade for existing Library entries
- [ ] Add regression checks for metadata/enrichment safety:
  - Steam metadata survives export/import
  - enrichment preserves Steam fields
  - refresh game data can promote Steam App placeholder titles
  - refresh game data can hydrate hero/poster/screenshots/videos when IGDB match exists
  - progress toast shows numeric progress and visible bar fill during bulk refresh
- [x] Add UI regression checks:
  - bulk refresh notice updates do not re-trigger card hover animations
  - screenshot modal opens the correct gallery after switching games
  - Wishlist detail maintenance panel width matches left-column panels
  - Discover/Library/Wishlist maintenance actions match intended surface responsibilities
- [x] Add smoke script stage for Steam import logic using mock payloads.
- [x] Manual QA: owned-library import
  - small library
  - large library
  - repeat import against an already imported account
  - import with recently played suggestions enabled
  - import with recently played suggestions disabled
- [x] Manual QA: wishlist import
  - public Steam wishlist URL
  - wishlist URL containing titles with partial Steam metadata
  - duplicate wishlist import
  - mixed existing Wishlist + existing Library conflicts
- [x] Manual QA: maintenance and enrichment
  - library-wide metadata refresh
  - library-wide artwork refresh
  - library-wide pricing refresh
  - spot-check unresolved Steam-imported titles after refresh
  - verify refreshed titles gain IGDB-backed media when available
- [x] Manual QA: cross-surface cohesion
  - Steam-imported Wishlist detail page
  - Steam-imported Library detail page
  - source labels and relevant links consistency
  - route/back-forward behavior after import and enrichment
- [x] Polish import/review messaging:
  - clearer unresolved-row explanations in conflict review
  - clearer add/merge/skip/review decision copy
  - safer preview language that reinforces read-only behavior
  - completion summaries that explain enrichment follow-up and partial failures

## Phase 5K.6: Canonical IGDB Promotion For Resolved Steam Imports

- [x] Add a shared promotion helper for `steam-*` catalog identities:
  - detect successful IGDB resolution
  - compute canonical target id as `igdb-<igdbId>`
- [x] Only promote when all are true:
  - current catalog id is `steam-*`
  - `igdbId` is present and valid
  - resolved title is not a `Steam App <appid>` placeholder
  - metadata enrichment succeeded strongly enough to trust the match
- [x] Preserve Steam provider metadata on promotion:
  - `steam.appid`
  - `steam.appUrl`
  - Steam playtime/import timestamps
  - Steam import source markers
- [x] Repoint all referencing entries from `steam-*` to canonical `igdb-*`.
- [x] Preserve all user-tracked entry fields during promotion:
  - `entryId`
  - status
  - notes
  - Checkpoint playtime
  - completion percent
  - wishlist settings
- [x] Merge safely when the target `igdb-*` catalog game already exists:
  - keep richer IGDB metadata/media
  - attach Steam metadata if missing
  - avoid duplicate catalog rows
- [x] Remove old `steam-*` catalog record only when no entries reference it.
- [x] Trigger promotion from:
  - `Refresh Game Data`
  - post-import enrichment
  - library-wide metadata refresh
- [x] Add regression coverage:
  - Steam placeholder refresh promotes `gameId` to `igdb-*`
  - Steam metadata survives promotion
  - repeat promotion is idempotent
  - existing `igdb-*` targets merge safely without duplicate catalog identities

Definition of done:
- Successfully enriched Steam imports converge to canonical IGDB identities while preserving Steam metadata and all user-tracked entry data.

Definition of done:
- Steam import is safe, testable, and non-destructive.

---

## Phase 5 Exit Criteria

- [ ] Owned Steam library can be previewed before import.
- [ ] Selected owned games can be imported to Backlog.
- [ ] Recently played games can be suggested as Playing without being forced.
- [ ] No imported game is automatically marked Finished.
- [x] Steam playtime is stored and displayed separately from Checkpoint progress.
- [x] Repeat imports do not create duplicates.
- [x] Pasted Steam wishlist data can be reviewed and imported to Wishlist best-effort.
- [x] Imported games use existing IGDB-first media and ITAD enrichment.
- [x] Bulk maintenance actions show trustworthy progress and do not visually thrash the UI.
- [x] Steam-imported placeholder titles can be promoted into full IGDB-backed entries when resolvable.
- [x] Automated regression checks cover import safety and no-overwrite behavior.
