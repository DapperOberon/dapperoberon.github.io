# Checkpoint Service Adapter Contracts

This document defines the Phase 1 adapter contracts for the external services Checkpoint plans to use.

The goal is to keep the app store and renderer dependent on stable adapter interfaces even while the implementation is still mock-backed.

---

## Design Rules

- adapters expose a small, stable surface area
- adapters may be mock or production-backed without changing caller code
- callers should assume adapters can fail
- adapter responses should already be normalized into app-friendly shapes
- production adapters may enrich data, but should not require the UI to understand provider-specific payloads

---

## Integration Bundle

The app expects `createIntegrations()` to return:

```js
{
  steamGrid: SteamGridService,
  storefronts: StorefrontMetadataService,
  googleDrive: GoogleDriveService
}
```

---

## SteamGridService

Purpose:

- resolve hero art, capsule art, and screenshot URLs for a game

Required methods:

```js
{
  isConfigured(): boolean,
  resolveArtwork(input): Promise<ArtworkResult>
}
```

Input:

```js
{
  title: string,
  storefront: string,
  catalogGame?: CatalogGame | null
}
```

Output:

```js
{
  heroArt: string,
  capsuleArt: string,
  screenshots: string[]
}
```

Behavior notes:

- if `catalogGame` already contains art, the adapter may reuse it
- production implementations may return empty strings/arrays when art is unavailable
- callers should not assume screenshots exist

---

## StorefrontMetadataService

Purpose:

- look up normalized game metadata from a storefront or fallback source

Required methods:

```js
{
  isConfigured(): boolean,
  lookupGame(input): Promise<StorefrontMetadataResult>
}
```

Input:

```js
{
  title: string,
  storefront: string,
  catalogGame?: CatalogGame | null
}
```

Output:

```js
{
  developer: string,
  publisher: string,
  releaseDate: string,
  genres: string[],
  platforms: string[],
  criticSummary: string,
  description: string,
  steamGridSlug: string
}
```

Behavior notes:

- if `catalogGame` exists, the adapter may echo normalized catalog data instead of fetching
- production implementations should return normalized strings/arrays, not raw provider payloads
- unknown values may be returned as empty strings or explicit pending placeholders

---

## GoogleDriveService

Purpose:

- sync or back up persisted Checkpoint state to Google Drive

Required methods:

```js
{
  isConfigured(): boolean,
  syncLibrary(input?): Promise<GoogleDriveSyncResult>
}
```

Suggested input for production:

```js
{
  state: PersistedAppState,
  mode?: "manual" | "auto"
}
```

Output:

```js
{
  ok: boolean,
  mode: string,
  message: string
}
```

Behavior notes:

- the current scaffold does not yet call `syncLibrary()` with full backup payloads
- Phase 2 should make the sync input explicit and versioned

---

## Mock vs Production

Current state:

- service interfaces are already stable enough for Phase 1
- current implementations are mock-backed
- mock response data is intentionally separated from adapter code in `services/mock-data.js`

Production adapters should preserve:

- method names
- input shapes
- return shapes

They may change:

- internal transport
- auth flow
- caching
- retry behavior
- provider-specific mapping logic

---

## Caller Expectations

The store currently depends on these guarantees:

- `lookupGame()` always resolves to a metadata object
- `resolveArtwork()` always resolves to an artwork object
- `syncLibrary()` always resolves to an object with `ok` and `message`
- `isConfigured()` is cheap and synchronous

If production implementations can reject, the store/UI should treat that as a recoverable service error and surface feedback instead of crashing.
