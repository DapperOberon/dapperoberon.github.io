# Checkpoint Phase 5 Plan: Steam Import

## Purpose

Phase 5 should add a safe, reviewable Steam import system that can bring a user's Steam owned library into Checkpoint without damaging curated local tracking data.

The feature should feel like a guided import assistant, not a one-click blind sync. Steam libraries can be large, old playtime can be noisy, and metadata matching can be imperfect. The import flow should therefore preview, classify, resolve conflicts, and only then commit selected entries.

## Phase 5 Goals

Phase 5 should deliver:

- Steam owned-library import through the official Steam Web API.
- A multi-step import preview and conflict-review workflow.
- Backlog-first destination behavior that preserves Checkpoint's tracking semantics.
- Separate read-only Steam playtime metadata beside editable Checkpoint progress.
- Optional recently-played suggestions for `Playing`, but no automatic `Finished` assignment.
- Best-effort Steam wishlist import from pasted wishlist pages/lists.
- Post-import IGDB/ITAD enrichment using the existing media/pricing rules.

Phase 5 should remain:

- local-first in persistence and user control
- explicit before writing imported data
- conservative about status changes
- honest about Steam wishlist import reliability

Phase 5 should not build:

- a permanent Steam account connection/session
- automatic recurring Steam sync
- automatic story-completion detection
- automatic `Finished` status from Steam data
- unofficial scraping as a hard dependency for owned-library import

---

## Locked Scope Decisions

### 1. Status Mapping

Steam playtime should not equal Checkpoint status.

Default owned-library import behavior:

- Owned games import to `Backlog` by default.
- Games with `playtime_forever > 0` still import to `Backlog` by default.
- Games with `playtime_2weeks > 0` may be suggested as `Playing`.
- No game should import as `Finished` automatically.

Rationale:

- `Playing` means currently active in Checkpoint, not "has ever launched."
- Steam playtime can include accidental launches, old sessions, demos, idle time, and abandoned attempts.
- Steam cannot reliably tell whether a story/campaign was completed.

### 2. Playtime Model

Steam playtime should be stored separately from Checkpoint's editable progress/playtime.

Checkpoint playtime remains:

- user-entered
- editable
- run/context-specific
- platform-agnostic

Steam playtime becomes source metadata:

- read-only by default
- refreshable from Steam
- visible in details
- never automatically overwrites Checkpoint progress

Recommended stored shape:

```js
steam: {
  appid: 12345,
  playtimeForeverMinutes: 1200,
  playtime2WeeksMinutes: 45,
  lastImportedAt: "2026-04-10T00:00:00.000Z",
  importSource: "steam-owned-games"
}
```

Optional UI actions:

- `Use Steam Total`
- `Add Steam Time to Checkpoint`

These should be explicit user actions, not automatic import behavior.

### 3. Wishlist Import

Steam wishlist import should be best-effort and review-based.

Steam does not provide a stable official public wishlist API suitable for a durable import feature. Therefore Phase 5 should support:

- pasted Steam wishlist page URLs
- pasted/copied wishlist content
- extracted Steam app IDs and titles when possible
- match confidence and user review before commit

Wishlist imports should:

- add missing titles to Checkpoint Wishlist
- preserve Steam app IDs when detected
- never duplicate existing wishlist entries
- never move existing library entries unless explicitly chosen

---

## Product Flow

## Steam Import Hub

Add a Settings section or panel named `Steam Import`.

Import modes:

- `Owned Library`
- `Wishlist`

Both modes should share:

- stepper layout
- preview counts
- conflict resolver
- import confirmation
- post-import enrichment

## Owned Library Flow

### Step 1: Source

Inputs:

- SteamID64 or Steam profile URL
- Steam Web API key status/config guidance
- `Include played free games`

Helper copy:

- Steam game details must be public or accessible to the API key.
- Imported data stays local until the user confirms.

### Step 2: Preview

Show counts:

- total games found
- played games
- unplayed games
- recently played games
- existing matches
- possible title matches
- unmatched items

Preview rows/cards:

- Steam title
- Steam AppID
- total playtime
- recent playtime
- proposed Checkpoint destination
- match status

### Step 3: Rules

Default rules:

- default destination: `Backlog`
- recently played suggestion: optional `Playing`
- duplicate behavior: `Skip`, `Merge Steam Data`, or `Ask`
- finished status: unavailable for automatic import

Recommended default:

- `Backlog`
- `Suggest recently played as Playing`
- `Merge Steam data for exact AppID matches`
- `Ask for title-only matches`

### Step 4: Review Matches

Each import candidate should support:

- `Add`
- `Skip`
- `Merge`
- `Review`

Conflict priority:

1. Existing catalog/library entry with same Steam AppID.
2. Existing entry with Steam store URL/app link.
3. Normalized title match.
4. IGDB title match.
5. Steam-only fallback.

### Step 5: Import

Commit selected entries locally.

For imported owned games:

- default status: `backlog`
- source/storefront: `steam`
- preserve Steam AppID and playtime metadata
- do not overwrite existing curated Checkpoint fields unless user chose merge/update

### Step 6: Enrich

After commit:

- hydrate IGDB metadata
- use IGDB-first media, SteamGrid fallback
- fetch ITAD pricing where possible
- preserve Steam metadata
- avoid overwriting user-locked/curated local edits

## Wishlist Flow

### Step 1: Paste Wishlist

Inputs:

- Steam wishlist URL
- pasted page content
- pasted plain list of Steam URLs/titles

Copy should clearly label this as best-effort.

### Step 2: Parse

Extract:

- Steam AppID when present
- title when present
- source URL when present

Show:

- parsed count
- items needing review
- items with app IDs
- items with title-only fallback

### Step 3: Resolve

Use the same resolver path as Discover/Wishlist:

- Steam AppID when known
- IGDB search by title
- ITAD matching where possible
- conflict detection against current library and wishlist

### Step 4: Review

Actions:

- `Add to Wishlist`
- `Already in Wishlist`
- `Already in Library`
- `Skip`
- `Needs Review`

### Step 5: Import

Commit selected wishlist entries:

```js
source: "steam-wishlist-import"
status: "wishlist"
steam: {
  appid,
  wishlistImportedAt
}
```

Then run the same self-healing metadata hydration used by Discover/Wishlist details.

---

## Worker/API Plan

## Worker Environment

Add optional worker secret:

```txt
STEAM_WEB_API_KEY
```

If the key is missing:

- owned-library import should show a clear setup error
- wishlist paste mode can still parse user-provided text, but cannot call owned-library APIs

## Worker Routes

Owned-library route:

```txt
GET /api/steam/owned-games?steamid=...&includeFreePlayed=true
```

Responsibilities:

- validate SteamID input
- call Steam `IPlayerService/GetOwnedGames`
- request app info when useful
- normalize game payloads
- return safe app data to the frontend
- handle private profile / inaccessible game-details errors clearly

Implemented normalized response shape:

```js
{
  results: [
    {
      appid: 292030,
      title: "The Witcher 3: Wild Hunt",
      appUrl: "https://store.steampowered.com/app/292030/",
      iconUrl: "https://media.steampowered.com/steamcommunity/public/images/apps/292030/...",
      logoUrl: "",
      playtimeForeverMinutes: 1234,
      playtime2WeeksMinutes: 56,
      hasPlayed: true,
      recentlyPlayed: true,
      importSource: "steam-owned-games"
    }
  ],
  summary: {
    total: 1,
    played: 1,
    unplayed: 0,
    recentlyPlayed: 1
  },
  meta: {
    resolved: true,
    reason: "steam_owned_games",
    steamid: "76561198000000000",
    includeFreePlayed: true
  }
}
```

Profile resolution route:

```txt
GET /api/steam/resolve-profile?profile=...
```

Responsibilities:

- accept SteamID64 or profile URL
- resolve vanity URL where possible
- return canonical SteamID64

SteamID64 values and `/profiles/...` URLs resolve locally. Vanity names and `/id/...` URLs require `STEAM_WEB_API_KEY`.

Wishlist parse route is optional:

```txt
POST /api/steam/parse-wishlist
```

This can also be frontend-only if parsing pasted text is simple enough.

---

## Data Model Additions

Catalog game fields:

```js
steam: {
  appid: null,
  appUrl: null,
  playtimeForeverMinutes: 0,
  playtime2WeeksMinutes: 0,
  lastImportedAt: null,
  lastRefreshedAt: null,
  importSource: null
}
```

Library entry fields:

```js
importSource: null,
importedAt: null,
externalPlaytime: {
  steam: {
    appid: null,
    playtimeForeverMinutes: 0,
    playtime2WeeksMinutes: 0,
    lastImportedAt: null
  }
}
```

Import session state:

```js
steamImport: {
  mode: "owned-library" | "wishlist",
  step: "source" | "preview" | "rules" | "review" | "importing" | "complete",
  source: {},
  rules: {},
  candidates: [],
  summary: {},
  errors: []
}
```

Keep import session data transient unless the user confirms import.

---

## UI Placement

Settings should gain a Steam import surface.

Recommended IA:

- Add Settings rail item: `Imports`
- Inside `Imports`, show:
  - `Steam Library Import`
  - `Steam Wishlist Import`

Alternative:

- Keep import tools under `Backup & Restore`

Recommendation:

- Use a dedicated `Imports` section. Importing is distinct enough from backup/restore and will likely grow.

---

## QA Risks

Must test:

- invalid SteamID
- private Steam profile / inaccessible game details
- missing worker API key
- huge Steam libraries
- duplicate imports
- exact AppID merge
- title-only possible match
- skipped item stays skipped in session
- import interruption and retry
- zero-playtime games
- recently played games
- existing wishlist/library conflicts
- pasted wishlist with Steam app URLs
- pasted wishlist with title-only rows
- export/import preserves Steam metadata
- no Checkpoint playtime overwrite during import

---

## Phase 5 Exit Criteria

- User can preview a Steam owned library before importing.
- User can import selected owned games into Backlog.
- Recently played games can be suggested as Playing without being auto-forced.
- Steam playtime is visible separately from editable Checkpoint progress.
- Existing entries are not duplicated when Steam AppID matches.
- Pasted Steam wishlist imports can add missing titles to Wishlist through a review step.
- Imported titles use existing IGDB-first media and ITAD pricing enrichment.
- Smoke/regression tests cover core import matching and no-overwrite behavior.
