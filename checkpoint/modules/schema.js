import { normalizeCatalogGame, normalizeLibraryEntry } from "./normalization.js";

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function createDeviceId() {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }

  return `device-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function normalizeDeviceIdentity(deviceIdentity) {
  const source = isRecord(deviceIdentity) ? deviceIdentity : {};
  const deviceId = typeof source.deviceId === "string" && source.deviceId.trim()
    ? source.deviceId.trim()
    : createDeviceId();

  return {
    deviceId,
    deviceLabel: typeof source.deviceLabel === "string" && source.deviceLabel.trim()
      ? source.deviceLabel.trim()
      : "This Device"
  };
}

function normalizeSyncMeta(syncMeta) {
  const source = isRecord(syncMeta) ? syncMeta : {};
  return {
    lastLocalMutationAt: typeof source.lastLocalMutationAt === "string" ? source.lastLocalMutationAt : "",
    lastLocalMutationByDeviceId: typeof source.lastLocalMutationByDeviceId === "string" ? source.lastLocalMutationByDeviceId : "",
    lastLocalMutationByDeviceLabel: typeof source.lastLocalMutationByDeviceLabel === "string" ? source.lastLocalMutationByDeviceLabel : "",
    lastRemoteSyncAt: typeof source.lastRemoteSyncAt === "string" ? source.lastRemoteSyncAt : "",
    lastRemoteFileId: typeof source.lastRemoteFileId === "string" ? source.lastRemoteFileId : "",
    lastRemoteModifiedTime: typeof source.lastRemoteModifiedTime === "string" ? source.lastRemoteModifiedTime : "",
    lastRemoteVersion: typeof source.lastRemoteVersion === "string" ? source.lastRemoteVersion : "",
    lastSyncedByDeviceId: typeof source.lastSyncedByDeviceId === "string" ? source.lastSyncedByDeviceId : "",
    lastSyncedByDeviceLabel: typeof source.lastSyncedByDeviceLabel === "string" ? source.lastSyncedByDeviceLabel : ""
  };
}

function normalizeActivityHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : `activity-${Math.random().toString(36).slice(2, 10)}`,
      category: typeof item.category === "string" ? item.category : "system",
      action: typeof item.action === "string" ? item.action : "updated",
      scope: typeof item.scope === "string" ? item.scope : "library",
      title: typeof item.title === "string" ? item.title : "",
      message: typeof item.message === "string" ? item.message : "",
      tone: typeof item.tone === "string" ? item.tone : "info",
      timestamp: typeof item.timestamp === "string" ? item.timestamp : new Date().toISOString()
    }))
    .slice(0, 24);
}

function normalizeSyncHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: typeof item.id === "string" ? item.id : `sync-${Math.random().toString(36).slice(2, 10)}`,
      ok: item.ok !== false,
      mode: typeof item.mode === "string" ? item.mode : "manual",
      message: typeof item.message === "string" ? item.message : "",
      timestamp: typeof item.timestamp === "string" ? item.timestamp : new Date().toISOString()
    }))
    .slice(0, 12);
}

export const APP_STATE_SCHEMA_VERSION = 5;

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
      includeNotes: true,
      includeActivityHistory: true
    },
    activityHistory: [],
    syncHistory: [],
    deviceIdentity: normalizeDeviceIdentity(null),
    syncMeta: normalizeSyncMeta(null),
    uiPreferences: {
      lastView: "dashboard",
      lastStatusFilter: "all",
      librarySort: "updated_desc",
      settingsSection: "settings-sync-account"
    }
  };
}

function normalizeSyncPreferences(syncPreferences) {
  const source = isRecord(syncPreferences) ? syncPreferences : {};
  return {
    autoBackup: source.autoBackup !== false,
    includeArtwork: source.includeArtwork !== false,
    includeNotes: source.includeNotes !== false,
    includeActivityHistory: source.includeActivityHistory !== false
  };
}

function normalizeUiPreferences(uiPreferences) {
  const source = isRecord(uiPreferences) ? uiPreferences : {};
  const lastStatusFilter = typeof source.lastStatusFilter === "string"
    ? (source.lastStatusFilter === "archived" ? "backlog" : source.lastStatusFilter)
    : "all";
  return {
    lastView: typeof source.lastView === "string" ? source.lastView : "dashboard",
    lastStatusFilter,
    librarySort: typeof source.librarySort === "string" ? source.librarySort : "updated_desc",
    settingsSection: typeof source.settingsSection === "string" ? source.settingsSection : "settings-sync-account"
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

  if (rawState.schemaVersion === 3 && Array.isArray(rawState.library)) {
    const library = rawState.library.map((entry) => normalizeLibraryEntry(entry));
    const catalog = Array.isArray(rawState.catalog) ? rawState.catalog.map((game) => normalizeCatalogGame(game)) : initialState.catalog;
    return {
      ...initialState,
      library,
      catalog: pruneCatalogToLibrary(library, catalog),
      syncPreferences: normalizeSyncPreferences(rawState.syncPreferences),
      activityHistory: normalizeActivityHistory(rawState.activityHistory),
      syncHistory: normalizeSyncHistory(rawState.syncHistory),
      uiPreferences: normalizeUiPreferences(rawState.uiPreferences),
      deviceIdentity: normalizeDeviceIdentity(rawState.deviceIdentity),
      syncMeta: normalizeSyncMeta(rawState.syncMeta)
    };
  }

  if (rawState.schemaVersion === 4 && Array.isArray(rawState.library)) {
    const library = rawState.library.map((entry) => normalizeLibraryEntry(entry));
    const catalog = Array.isArray(rawState.catalog) ? rawState.catalog.map((game) => normalizeCatalogGame(game)) : initialState.catalog;
    return {
      ...initialState,
      library,
      catalog: pruneCatalogToLibrary(library, catalog),
      syncPreferences: normalizeSyncPreferences(rawState.syncPreferences),
      activityHistory: normalizeActivityHistory(rawState.activityHistory),
      syncHistory: normalizeSyncHistory(rawState.syncHistory),
      uiPreferences: normalizeUiPreferences(rawState.uiPreferences),
      deviceIdentity: normalizeDeviceIdentity(rawState.deviceIdentity),
      syncMeta: normalizeSyncMeta(rawState.syncMeta)
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
    activityHistory: normalizeActivityHistory(rawState.activityHistory),
    syncHistory: normalizeSyncHistory(rawState.syncHistory),
    deviceIdentity: normalizeDeviceIdentity(rawState.deviceIdentity),
    syncMeta: normalizeSyncMeta(rawState.syncMeta),
    uiPreferences: normalizeUiPreferences(rawState.uiPreferences)
  };
}
