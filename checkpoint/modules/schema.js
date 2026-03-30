import { normalizeCatalogGame, normalizeLibraryEntry } from "./normalization.js";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

export const APP_STATE_SCHEMA_VERSION = 3;

export function pruneCatalogToLibrary(library, catalog) {
  const referencedGameIds = new Set(
    Array.isArray(library)
      ? library.map((entry) => entry?.gameId).filter((gameId) => typeof gameId === "string" && gameId.length > 0)
      : []
  );

  if (!Array.isArray(catalog)) return [];
  return catalog.filter((game) => referencedGameIds.has(game.id));
}

export function createInitialPersistedState({ initialLibrary, initialCatalog }) {
  const library = Array.isArray(initialLibrary) ? initialLibrary.map((entry) => normalizeLibraryEntry(entry)) : [];
  const catalog = Array.isArray(initialCatalog) ? initialCatalog.map((game) => normalizeCatalogGame(game)) : [];

  return {
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    library,
    catalog: pruneCatalogToLibrary(library, catalog),
    syncPreferences: {
      autoBackup: true,
      includeArtwork: true,
      includeNotes: true
    },
    uiPreferences: {
      lastView: "dashboard",
      lastStatusFilter: "all",
      librarySort: "updated_desc"
    }
  };
}

function normalizeSyncPreferences(syncPreferences) {
  const source = isRecord(syncPreferences) ? syncPreferences : {};
  return {
    autoBackup: source.autoBackup !== false,
    includeArtwork: source.includeArtwork !== false,
    includeNotes: source.includeNotes !== false
  };
}

function normalizeUiPreferences(uiPreferences) {
  const source = isRecord(uiPreferences) ? uiPreferences : {};
  return {
    lastView: typeof source.lastView === "string" ? source.lastView : "dashboard",
    lastStatusFilter: typeof source.lastStatusFilter === "string" ? source.lastStatusFilter : "all",
    librarySort: typeof source.librarySort === "string" ? source.librarySort : "updated_desc"
  };
}

export function normalizePersistedState(rawState, { initialLibrary, initialCatalog }) {
  const initialState = createInitialPersistedState({ initialLibrary, initialCatalog });

  if (Array.isArray(rawState)) {
    const library = rawState.map((entry) => normalizeLibraryEntry(entry));
    return {
      ...initialState,
      library,
      catalog: pruneCatalogToLibrary(library, initialState.catalog)
    };
  }

  if (!isRecord(rawState)) {
    return initialState;
  }

  if (rawState.schemaVersion === 1 && Array.isArray(rawState.library)) {
    const library = rawState.library.map((entry) => normalizeLibraryEntry(entry));
    return {
      ...initialState,
      library,
      catalog: pruneCatalogToLibrary(library, initialState.catalog)
    };
  }

  if (rawState.schemaVersion === 2 && Array.isArray(rawState.library)) {
    const library = rawState.library.map((entry) => normalizeLibraryEntry(entry));
    const catalog = Array.isArray(rawState.catalog) ? rawState.catalog.map((game) => normalizeCatalogGame(game)) : initialState.catalog;
    return {
      ...initialState,
      library,
      catalog: pruneCatalogToLibrary(library, catalog),
      syncPreferences: normalizeSyncPreferences(rawState.syncPreferences),
      uiPreferences: normalizeUiPreferences(rawState.uiPreferences)
    };
  }

  if (rawState.schemaVersion !== APP_STATE_SCHEMA_VERSION) {
    return initialState;
  }

  const library = Array.isArray(rawState.library) ? rawState.library.map((entry) => normalizeLibraryEntry(entry)) : initialState.library;
  const catalog = Array.isArray(rawState.catalog) ? rawState.catalog.map((game) => normalizeCatalogGame(game)) : initialState.catalog;

  return {
    schemaVersion: APP_STATE_SCHEMA_VERSION,
    library,
    catalog: pruneCatalogToLibrary(library, catalog),
    syncPreferences: normalizeSyncPreferences(rawState.syncPreferences),
    uiPreferences: normalizeUiPreferences(rawState.uiPreferences)
  };
}
