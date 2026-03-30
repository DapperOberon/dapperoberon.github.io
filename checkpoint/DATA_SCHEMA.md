# Checkpoint Data Schema

This document defines the current canonical data model for Checkpoint Phase 1.

It describes:

- the persisted app state
- the library entry model
- the catalog game model
- the enum-like value sets used throughout the app
- which fields are persisted versus derived at runtime

This schema reflects the app as implemented today and should be updated whenever the persisted model changes.

---

## Design Principles

- `library` is the user-owned record of tracked games.
- `catalog` is the metadata/art record that library entries point at through `gameId`.
- persisted state should store durable user data, not view-only UI state
- runtime state can derive search results, active records, metrics, and filtered collections
- all persisted payloads must be versioned

---

## Persisted App State

Current schema version: `3`

Persisted state shape:

```js
{
  schemaVersion: 3,
  library: LibraryEntry[],
  catalog: CatalogGame[],
  syncPreferences: SyncPreferences,
  uiPreferences: UiPreferences
}
```

### Fields

- `schemaVersion`: number
  Purpose: identifies the persisted payload format for migration.
- `library`: `LibraryEntry[]`
  Purpose: the user’s tracked game list.
- `catalog`: `CatalogGame[]`
  Purpose: metadata and artwork records referenced by library entries.
- `syncPreferences`: `SyncPreferences`
  Purpose: persisted backup/export-related preferences.
- `uiPreferences`: `UiPreferences`
  Purpose: stores a small set of last-used library UI preferences.

### Persisted vs Derived

Persisted:

- `library`
- `catalog`
- `syncPreferences`
- `uiPreferences`
- `schemaVersion`

Derived at runtime:

- filtered library views
- dashboard counts and metrics
- selected/active entry
- selected/active game via join on `gameId`
- suggestion results in the add-game flow
- sync readiness counts
- modal open state and other transient UI state

---

## LibraryEntry

Library entries are the user’s personal records.

Shape:

```js
{
  entryId: string,
  gameId: string,
  title: string,
  storefront: StorefrontId,
  status: EntryStatus,
  runLabel: string,
  addedAt: ISODateTimeString,
  updatedAt: ISODateTimeString,
  playtimeHours: number,
  completionPercent: number,
  personalRating: number | null,
  notes: string,
  spotlight: string,
  syncState: SyncState
}
```

### Field Definitions

- `entryId`: string
  Unique ID for the user’s tracked record.
  Example: `entry-hades`

- `gameId`: string
  Foreign key pointing to a `CatalogGame.id`.
  This allows multiple library records to reference catalog metadata.

- `title`: string
  Display title for the entry.
  This is currently duplicated from catalog for easier rendering and resilience.

- `storefront`: `StorefrontId`
  The storefront or platform source the user associates with this record.

- `status`: `EntryStatus`
  The user’s lifecycle state for this game.

- `runLabel`: string
  The user-facing label for a specific tracked run, save, or playthrough.
  Examples: `Main Save`, `Replay Run`, `Co-op`, `Hard Mode`

- `addedAt`: ISO date-time string
  When the entry was first created in Checkpoint.

- `updatedAt`: ISO date-time string
  When the entry was last modified.

- `playtimeHours`: number
  The tracked playtime in hours.
  Current convention: whole or decimal number, non-negative.

- `completionPercent`: number
  A number from `0` to `100`.

- `personalRating`: number | null
  User score, currently treated as a 10-point scale.

- `notes`: string
  User-authored notes about progress, impressions, or why the game is archived.

- `spotlight`: string
  Short editorial label used in the UI.
  Example: `Current obsession`

- `syncState`: `SyncState`
  Current local sync readiness indicator.

### Required Fields

Required for a valid Phase 1 entry:

- `entryId`
- `gameId`
- `title`
- `storefront`
- `status`
- `runLabel`
- `addedAt`
- `updatedAt`
- `playtimeHours`
- `completionPercent`
- `notes`
- `syncState`

Minimum user-provided fields required to save from the Phase 1 UI:

- `title`
- `storefront`
- `status`

Notes:

- `runLabel` may be left blank in the form and will normalize to `Main Save`
- duplicate `title + storefront + runLabel` combinations are warned about but not blocked

Optional but supported:

- `personalRating`
- `spotlight`

### Invariants

- `entryId` must be unique across `library`
- `gameId` should match an existing `catalog` record
- multiple entries may point at the same `gameId`
- catalog records with no remaining linked library entries should be pruned
- `runLabel` is not globally unique and should remain user-editable
- `completionPercent` should remain within `0..100`
- `playtimeHours` should be `>= 0`
- `updatedAt` should be greater than or equal to `addedAt`

---

## CatalogGame

Catalog games are metadata/art records used by the library.

Shape:

```js
{
  id: string,
  title: string,
  storefront: StorefrontId,
  developer: string,
  publisher: string,
  releaseDate: ISODateString,
  genres: string[],
  platforms: string[],
  criticSummary: string,
  description: string,
  heroArt: string,
  capsuleArt: string,
  screenshots: string[],
  steamGridSlug: string
}
```

### Field Definitions

- `id`: string
  Unique catalog identifier.
  Example: `hades-ii`

- `title`: string
  Canonical game title.

- `storefront`: `StorefrontId`
  Default source associated with the catalog record.

- `developer`: string
  Developer studio or team.

- `publisher`: string
  Publisher or owning label.

- `releaseDate`: ISO date string
  Canonical release date in `YYYY-MM-DD` format.

- `genres`: `string[]`
  High-level game categories.

- `platforms`: `string[]`
  Human-readable supported platforms.

- `criticSummary`: string
  Short editorial summary used in overview surfaces.

- `description`: string
  Longer descriptive body copy.

- `heroArt`: string
  Primary hero image URL.

- `capsuleArt`: string
  Card/poster image URL.

- `screenshots`: `string[]`
  Gallery image URLs.

- `steamGridSlug`: string
  Future lookup identifier for SteamGrid-backed assets.

### Required Fields

Required for a valid Phase 1 catalog record:

- `id`
- `title`
- `storefront`
- `developer`
- `publisher`
- `releaseDate`
- `genres`
- `platforms`
- `criticSummary`
- `description`
- `heroArt`
- `capsuleArt`
- `screenshots`
- `steamGridSlug`

### Invariants

- `id` must be unique across `catalog`
- `screenshots` should be an array, even if empty
- URLs may be local or remote strings
- custom/manual catalog entries should still follow the same shape

---

## SyncPreferences

Shape:

```js
{
  autoBackup: boolean,
  includeArtwork: boolean,
  includeNotes: boolean
}
```

### Field Definitions

- `autoBackup`
  Whether future sync/export flows should prefer automatic backups.

- `includeArtwork`
  Whether artwork references should be included in backup payloads.

- `includeNotes`
  Whether user notes should be included in backup payloads.

---

## UiPreferences

Shape:

```js
{
  lastView: string,
  lastStatusFilter: string,
  librarySort: string
}
```

### Field Definitions

- `lastView`
  The last primary app view the user opened.

- `lastStatusFilter`
  The last library status filter used in the dashboard shell.

- `librarySort`
  The last selected library sort mode.

### Current Allowed Values

- `lastView`: `dashboard | details | settings`
- `lastStatusFilter`: `all | playing | finished | archived`
- `librarySort`: `updated_desc | title_asc | playtime_desc | completion_desc`

---

## Value Sets

## EntryStatus

Allowed values:

- `playing`
- `finished`
- `archived`

## SyncState

Allowed values:

- `ready`
- `pending`
- `offline`

## StorefrontId

Allowed values in the seeded app today:

- `steam`
- `epic`
- `gog`
- `psn`
- `xbox`
- `switch`

Future storefront IDs should be added centrally and documented here.

---

## Runtime Store State

The app keeps additional non-persisted state in memory.

Current runtime-only store fields include:

- `currentView`
- `activeStatus`
- `searchTerm`
- `activeEntryId`
- `isAddModalOpen`
- `addForm`

These are intentionally not part of the persisted Phase 1 app-state payload yet.

---

## Migration Notes

Checkpoint currently supports migration from older payloads:

- legacy array-only payloads are treated as `library`
- schema version `1` payloads with `library` only are upgraded into the Phase 1 structure

When this document changes in a way that affects stored data:

1. increment `APP_STATE_SCHEMA_VERSION`
2. update normalization/migration logic
3. document the change here

---

## Known Schema Tradeoffs

- `title` exists in both `LibraryEntry` and `CatalogGame`
  Reason: simpler rendering and resilience if catalog joins fail

- `storefront` exists in both `LibraryEntry` and `CatalogGame`
  Reason: the user’s owned/storefront record may differ from a metadata source default later

- `runLabel` exists on `LibraryEntry`, not `CatalogGame`
  Reason: tracked runs are personal record instances, not canonical game metadata

- art fields are stored as plain strings today
  Reason: Phase 1 does not yet model asset provenance, sizes, or fallback priority

- ratings are numeric but not yet validated to a strict range in code
  Reason: validation is planned later in Phase 1
