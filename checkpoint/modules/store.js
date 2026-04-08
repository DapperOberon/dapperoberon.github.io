import { APP_STATE_SCHEMA_VERSION, normalizePersistedState, pruneCatalogToLibrary } from "./schema.js";
import { normalizeLibraryEntry } from "./normalization.js";
import { getServiceConfig } from "../services/index.js";
import { createEntryActions } from "./store/entry-actions.js";
import { createEnrichmentActions } from "./store/enrichment-actions.js";
import { createBackupActions } from "./store/backup-actions.js";
import { createDriveSyncActions } from "./store/drive-sync-actions.js";
import { getReleaseState } from "./render/shared.js";

function createEntryId() {
  return `entry-${Math.random().toString(36).slice(2, 10)}`;
}

function normalizeTerm(value) {
  return value.trim().toLowerCase();
}

function sortByUpdatedAtDesc(a, b) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

function createDefaultAddForm() {
  return {
    title: "",
    storefront: "steam",
    status: "playing",
    runLabel: "Main Save",
    playtimeHours: "0",
    completionPercent: "0",
    notes: "",
    selectedCatalogId: null,
    searchQuery: "",
    step: "search",
    mode: "search",
    selectedSearchResult: null
  };
}

function createDetailForm(entry = null) {
  return {
    notes: entry?.notes ?? "",
    playtimeHours: String(entry?.playtimeHours ?? 0),
    completionPercent: String(entry?.completionPercent ?? 0),
    status: entry?.status ?? "playing",
    wishlistPriority: entry?.wishlistPriority ?? "medium",
    wishlistIntent: entry?.wishlistIntent ?? "wait-sale"
  };
}

function isImportCandidate(value) {
  return Array.isArray(value) || (
    value !== null
    && typeof value === "object"
    && Array.isArray(value.library)
  );
}

function mergeById(currentItems, incomingItems, getId, normalizeItem) {
  const merged = new Map();

  currentItems.forEach((item) => {
    merged.set(getId(item), normalizeItem(item));
  });

  incomingItems.forEach((item) => {
    merged.set(getId(item), normalizeItem(item));
  });

  return Array.from(merged.values());
}

function createActionState() {
  return {
    backup: null,
    sync: null,
    artwork: null,
    metadata: null,
    pricing: null
  };
}

function createSyncHistoryEntry({ ok = true, mode = "manual", message = "" }) {
  return {
    id: `sync-${Math.random().toString(36).slice(2, 10)}`,
    ok,
    mode,
    message,
    timestamp: new Date().toISOString()
  };
}

function createActivityEntry({
  category = "system",
  action = "updated",
  scope = "library",
  title = "",
  message = "",
  tone = "info"
}) {
  return {
    id: `activity-${Math.random().toString(36).slice(2, 10)}`,
    category,
    action,
    scope,
    title,
    message,
    tone,
    timestamp: new Date().toISOString()
  };
}

const LOCAL_RESTORE_POINT_KEY = "checkpoint.restorePoint";
const ITAD_STORES_CACHE_KEY = "checkpoint.itadStoresCache";
const DISCOVER_METADATA_CACHE_KEY = "checkpoint.discoverMetadataCache";
const AUTO_BACKUP_DEBOUNCE_MS = 5000;
const AUTO_BACKUP_MIN_INTERVAL_MS = 60000;

function readLocalRestorePoint() {
  try {
    const raw = globalThis.localStorage?.getItem(LOCAL_RESTORE_POINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || typeof parsed.content !== "string") {
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
}

function writeLocalRestorePoint(payload) {
  try {
    globalThis.localStorage?.setItem(LOCAL_RESTORE_POINT_KEY, JSON.stringify(payload));
    return true;
  } catch (error) {
    return false;
  }
}

function readItadStoresCache() {
  try {
    const raw = globalThis.localStorage?.getItem(ITAD_STORES_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row) => row && typeof row === "object")
      .map((row) => ({
        id: String(row.id ?? "").trim(),
        name: String(row.name ?? "").trim()
      }))
      .filter((row) => row.id && row.name);
  } catch (error) {
    return [];
  }
}

function writeItadStoresCache(stores) {
  try {
    const rows = Array.isArray(stores)
      ? stores
        .filter((row) => row && typeof row === "object")
        .map((row) => ({
          id: String(row.id ?? "").trim(),
          name: String(row.name ?? "").trim()
        }))
        .filter((row) => row.id && row.name)
      : [];
    globalThis.localStorage?.setItem(ITAD_STORES_CACHE_KEY, JSON.stringify(rows));
    return true;
  } catch (error) {
    return false;
  }
}

function readDiscoverMetadataCache() {
  try {
    const raw = globalThis.localStorage?.getItem(DISCOVER_METADATA_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch (error) {
    return {};
  }
}

function writeDiscoverMetadataCache(cache) {
  try {
    const normalized = cache && typeof cache === "object" && !Array.isArray(cache)
      ? cache
      : {};
    globalThis.localStorage?.setItem(DISCOVER_METADATA_CACHE_KEY, JSON.stringify(normalized));
    return true;
  } catch (error) {
    return false;
  }
}

export function createStore({ initialLibrary, catalog, persistence, integrations, statusDefinitions, storefrontDefinitions }) {
  const listeners = new Set();
  const validStatusIds = new Set(statusDefinitions.map((item) => item.id));
  const validStorefrontIds = new Set(storefrontDefinitions.map((item) => item.id));
  let autoBackupTimer = null;
  let queuedAutoBackupSignature = "";
  let lastAutoBackupSignature = "";
  let lastAutoBackupCompletedAt = 0;
  let lastTrackedSyncDataSignature = "";
  let suppressAutoBackup = false;
  const persistedState = normalizePersistedState(persistence.load({
    initialLibrary,
    initialCatalog: catalog
  }), {
    initialLibrary,
    initialCatalog: catalog
  });
  const hydratedLibrary = persistedState.library.slice().sort(sortByUpdatedAtDesc);
  const initialRestorePoint = readLocalRestorePoint();
  const cachedItadStores = readItadStoresCache();
  const discoverMetadataCache = readDiscoverMetadataCache();

  const state = {
    currentView: persistedState.uiPreferences.lastView,
    library: hydratedLibrary,
    catalog: persistedState.catalog,
    activeStatus: persistedState.uiPreferences.lastStatusFilter,
    sortMode: persistedState.uiPreferences.lastView === "wishlist"
      ? persistedState.uiPreferences.wishlistSort
      : persistedState.uiPreferences.librarySort,
    searchTerm: "",
    activeEntryId: hydratedLibrary[0]?.entryId ?? null,
    isAddModalOpen: false,
    editingEntryId: null,
    pendingDeleteEntryId: null,
    addForm: createDefaultAddForm(),
    addSearchResults: [],
    addSearchLoading: false,
    addSearchError: "",
    discoverEntryDetails: null,
    discoverEntryLoading: false,
    discoverEntryError: "",
    discoverEntryPricing: null,
    discoverEntryPricingLoading: false,
    discoverEntryPricingError: "",
    discoverEntryRelated: [],
    discoverEntryRelatedLoading: false,
    discoverEntryRelatedError: "",
    discoverEntryLinks: {
      igdb: "",
      official: "",
      storefronts: []
    },
    mediaLightbox: {
      open: false,
      images: [],
      index: 0,
      title: ""
    },
    discoverMetadataCache,
    discoverNavigationToken: 0,
    addFormFeedback: null,
    isAddFormSubmitting: false,
    detailForm: createDetailForm(hydratedLibrary[0] ?? null),
    isDetailEditMode: false,
    importMode: "replace",
    actionState: createActionState(),
    itadStores: cachedItadStores,
    itadStoresLoading: false,
    itadStoresError: "",
    syncHistory: Array.isArray(persistedState.syncHistory) ? persistedState.syncHistory : [],
    activityHistory: Array.isArray(persistedState.activityHistory) ? persistedState.activityHistory : [],
    syncConflict: null,
    notice: null,
    syncPreferences: persistedState.syncPreferences,
    deviceIdentity: persistedState.deviceIdentity,
    syncMeta: persistedState.syncMeta,
    uiPreferences: persistedState.uiPreferences,
    restorePointMeta: initialRestorePoint
      ? {
          timestamp: initialRestorePoint.timestamp ?? "",
          source: initialRestorePoint.source ?? "local snapshot"
        }
      : null
  };

  function getWishlistPriorityRank(entry) {
    return {
      low: 1,
      medium: 2,
      high: 3,
      "must-buy": 4
    }[entry?.wishlistPriority] ?? 2;
  }

  function getEntryCurrentBestAmount(entry) {
    const game = getCatalogGame(entry?.gameId);
    const amount = Number(game?.pricing?.currentBest?.amount);
    return Number.isFinite(amount) ? amount : Number.POSITIVE_INFINITY;
  }

  function isEntryReleased(entry) {
    const game = getCatalogGame(entry?.gameId);
    return getReleaseState(game?.releaseDate) === "released";
  }

  function getEntryCurrentDiscount(entry) {
    const game = getCatalogGame(entry?.gameId);
    const discountPercent = Number(game?.pricing?.currentBest?.discountPercent);
    return Number.isFinite(discountPercent) ? discountPercent : Number.NEGATIVE_INFINITY;
  }

  function getEntryTargetDistance(entry) {
    const game = getCatalogGame(entry?.gameId);
    const currentAmount = Number(game?.pricing?.currentBest?.amount);
    const targetAmount = Number(entry?.priceWatch?.targetPrice);
    if (!Number.isFinite(currentAmount) || !Number.isFinite(targetAmount) || targetAmount < 0) {
      return {
        metTargetRank: 1,
        distance: Number.POSITIVE_INFINITY
      };
    }
    return {
      metTargetRank: currentAmount <= targetAmount ? 0 : 1,
      distance: Math.abs(currentAmount - targetAmount)
    };
  }

  function getWishlistIntentRank(entry) {
    return {
      "buy-now": 4,
      "wait-sale": 3,
      research: 2,
      "monitor-release": 1
    }[entry?.wishlistIntent] ?? 2;
  }

  function getNextBuySortTuple(entry) {
    const releasedRank = isEntryReleased(entry) ? 0 : 1;
    const targetDistance = getEntryTargetDistance(entry);
    const hasPrice = Number.isFinite(getEntryCurrentBestAmount(entry)) ? 0 : 1;
    const intentRank = getWishlistIntentRank(entry);
    const priorityRank = getWishlistPriorityRank(entry);
    const currentPrice = getEntryCurrentBestAmount(entry);

    return {
      releasedRank,
      hasPrice,
      metTargetRank: targetDistance.metTargetRank,
      intentRank,
      priorityRank,
      price: currentPrice,
      distance: targetDistance.distance
    };
  }

  function getWishlistPriceStatus(entry) {
    const game = getCatalogGame(entry?.gameId);
    const pricing = game?.pricing ?? {};
    const releaseState = getReleaseState(game?.releaseDate);
    const amount = Number(pricing?.currentBest?.amount);
    if (Number.isFinite(amount)) {
      const discountPercent = Number(pricing?.currentBest?.discountPercent);
      return Number.isFinite(discountPercent) && discountPercent > 0 ? "on-sale" : "full-price";
    }
    if (releaseState === "releasing-soon" || releaseState === "coming-soon" || releaseState === "tbd") {
      return "coming-soon";
    }
    return pricing?.status === "unsupported" || pricing?.status === "no_match" ? "coming-soon" : "no-data";
  }

  function getPersistedState() {
    return {
      library: state.library,
      catalog: pruneCatalogToLibrary(state.library, state.catalog),
      syncPreferences: state.syncPreferences,
      activityHistory: state.activityHistory,
      syncHistory: state.syncHistory,
      deviceIdentity: state.deviceIdentity,
      syncMeta: state.syncMeta,
      uiPreferences: state.uiPreferences
    };
  }

  function buildExportState() {
    const persistedState = getPersistedState();
    const { deviceIdentity: _deviceIdentity, ...exportableState } = persistedState;
    return {
      schemaVersion: APP_STATE_SCHEMA_VERSION,
      ...exportableState
    };
  }

  function buildSyncExportState() {
    const exportState = buildExportState();
    const includeNotes = state.syncPreferences.includeNotes !== false;
    const includeArtwork = state.syncPreferences.includeArtwork !== false;
    const includeActivityHistory = state.syncPreferences.includeActivityHistory !== false;
    const artworkFields = new Set(["heroArt", "capsuleArt", "screenshots", "steamGridSlug"]);

    const library = includeNotes
      ? exportState.library
      : exportState.library.map((entry) => ({
          ...entry,
          notes: ""
        }));

    const catalog = includeArtwork
      ? exportState.catalog
      : exportState.catalog.map((game) => ({
          ...game,
          heroArt: "",
          capsuleArt: "",
          screenshots: [],
          steamGridSlug: "",
          providerValues: game?.providerValues && typeof game.providerValues === "object"
            ? {
                ...game.providerValues,
                heroArt: "",
                capsuleArt: "",
                screenshots: [],
                steamGridSlug: ""
              }
            : game.providerValues,
          lockedFields: Array.isArray(game?.lockedFields)
            ? game.lockedFields.filter((field) => !artworkFields.has(field))
            : game?.lockedFields
        }));

    return {
      ...exportState,
      library,
      catalog,
      activityHistory: includeActivityHistory ? (exportState.activityHistory ?? []) : [],
      syncHistory: includeActivityHistory ? (exportState.syncHistory ?? []) : []
    };
  }

  function buildSyncPayload() {
    const syncAt = new Date().toISOString();
    return {
      syncAt,
      state: {
        ...buildSyncExportState(),
        syncMeta: {
          ...state.syncMeta,
          lastRemoteSyncAt: syncAt,
          lastSyncedByDeviceId: state.deviceIdentity.deviceId,
          lastSyncedByDeviceLabel: state.deviceIdentity.deviceLabel
        }
      }
    };
  }

  function buildTrackedSyncDataSignature() {
    return JSON.stringify({
      library: state.library,
      catalog: pruneCatalogToLibrary(state.library, state.catalog),
      syncPreferences: state.syncPreferences
    });
  }

  function buildComparableStateSignature(inputState) {
    const library = Array.isArray(inputState?.library) ? inputState.library : [];
    const catalog = Array.isArray(inputState?.catalog) ? inputState.catalog : [];

    return JSON.stringify({
      library,
      catalog: pruneCatalogToLibrary(library, catalog),
      syncPreferences: inputState?.syncPreferences ?? {}
    });
  }

  function markLocalMutationIfNeeded() {
    const nextSignature = buildTrackedSyncDataSignature();
    if (nextSignature === lastTrackedSyncDataSignature) {
      return;
    }

    const now = new Date().toISOString();
    state.syncMeta = {
      ...state.syncMeta,
      lastLocalMutationAt: now,
      lastLocalMutationByDeviceId: state.deviceIdentity.deviceId,
      lastLocalMutationByDeviceLabel: state.deviceIdentity.deviceLabel
    };
    lastTrackedSyncDataSignature = nextSignature;
  }

  function getSyncComparisonStatus() {
    if (state.syncConflict?.mode) {
      return state.syncConflict.mode;
    }

    const { syncMeta, deviceIdentity } = state;

    if (!syncMeta.lastRemoteSyncAt) {
      return "local-only";
    }

    const localMutationAt = syncMeta.lastLocalMutationAt ? new Date(syncMeta.lastLocalMutationAt).getTime() : 0;
    const remoteSyncAt = syncMeta.lastRemoteSyncAt ? new Date(syncMeta.lastRemoteSyncAt).getTime() : 0;
    const remoteDeviceChanged = Boolean(syncMeta.lastSyncedByDeviceId) && syncMeta.lastSyncedByDeviceId !== deviceIdentity.deviceId;

    if (remoteDeviceChanged && localMutationAt > remoteSyncAt) {
      return "diverged";
    }

    if (localMutationAt > remoteSyncAt) {
      return "local-newer";
    }

    return "in-sync";
  }

  function applySort(entries) {
    const sorted = entries.slice();
    switch (state.sortMode) {
      case "discount_desc":
        sorted.sort((a, b) => {
          const discountDelta = getEntryCurrentDiscount(b) - getEntryCurrentDiscount(a);
          if (discountDelta !== 0) return discountDelta;
          return sortByUpdatedAtDesc(a, b);
        });
        break;
      case "closest_to_target":
        sorted.sort((a, b) => {
          const aDistance = getEntryTargetDistance(a);
          const bDistance = getEntryTargetDistance(b);
          const metDelta = aDistance.metTargetRank - bDistance.metTargetRank;
          if (metDelta !== 0) return metDelta;
          const distanceDelta = aDistance.distance - bDistance.distance;
          if (distanceDelta !== 0) return distanceDelta;
          return sortByUpdatedAtDesc(a, b);
        });
        break;
      case "wishlist_priority_desc":
        sorted.sort((a, b) => {
          const priorityDelta = getWishlistPriorityRank(b) - getWishlistPriorityRank(a);
          if (priorityDelta !== 0) return priorityDelta;
          return sortByUpdatedAtDesc(a, b);
        });
        break;
      case "next_to_buy":
        sorted.sort((a, b) => {
          const aTuple = getNextBuySortTuple(a);
          const bTuple = getNextBuySortTuple(b);
          const releasedDelta = aTuple.releasedRank - bTuple.releasedRank;
          if (releasedDelta !== 0) return releasedDelta;
          const hasPriceDelta = aTuple.hasPrice - bTuple.hasPrice;
          if (hasPriceDelta !== 0) return hasPriceDelta;
          const metTargetDelta = aTuple.metTargetRank - bTuple.metTargetRank;
          if (metTargetDelta !== 0) return metTargetDelta;
          const intentDelta = bTuple.intentRank - aTuple.intentRank;
          if (intentDelta !== 0) return intentDelta;
          const priorityDelta = bTuple.priorityRank - aTuple.priorityRank;
          if (priorityDelta !== 0) return priorityDelta;
          const distanceDelta = aTuple.distance - bTuple.distance;
          if (distanceDelta !== 0) return distanceDelta;
          const priceDelta = aTuple.price - bTuple.price;
          if (priceDelta !== 0) return priceDelta;
          return sortByUpdatedAtDesc(a, b);
        });
        break;
      case "price_asc":
        sorted.sort((a, b) => {
          const releasedDelta = (isEntryReleased(a) ? 0 : 1) - (isEntryReleased(b) ? 0 : 1);
          if (releasedDelta !== 0) return releasedDelta;
          const priceDelta = getEntryCurrentBestAmount(a) - getEntryCurrentBestAmount(b);
          if (priceDelta !== 0) return priceDelta;
          return sortByUpdatedAtDesc(a, b);
        });
        break;
      case "title_asc":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "playtime_desc":
        sorted.sort((a, b) => (b.playtimeHours || 0) - (a.playtimeHours || 0));
        break;
      case "completion_desc":
        sorted.sort((a, b) => (b.completionPercent || 0) - (a.completionPercent || 0));
        break;
      case "updated_desc":
      default:
        sorted.sort(sortByUpdatedAtDesc);
        break;
    }
    return sorted;
  }

  function emit() {
    markLocalMutationIfNeeded();
    persistence.save(getPersistedState());
    scheduleAutoBackupIfNeeded();
    listeners.forEach((listener) => listener(getSnapshot()));
  }

  function scheduleAutoBackupIfNeeded() {
    const comparisonStatus = getSyncComparisonStatus();
    if (
      suppressAutoBackup
      || !state.syncPreferences.autoBackup
      || !integrations.googleDrive.isConfigured()
      || state.syncConflict
      || (comparisonStatus !== "local-newer" && comparisonStatus !== "local-only")
    ) {
      return;
    }

    const now = Date.now();
    const elapsedSinceLastAutoBackup = now - lastAutoBackupCompletedAt;
    const remainingCooldown = Math.max(0, AUTO_BACKUP_MIN_INTERVAL_MS - elapsedSinceLastAutoBackup);

    const syncPayload = buildSyncPayload();
    const signature = JSON.stringify(syncPayload.state);
    if (signature === lastAutoBackupSignature || signature === queuedAutoBackupSignature) {
      return;
    }

    queuedAutoBackupSignature = signature;
    globalThis.clearTimeout?.(autoBackupTimer);
    autoBackupTimer = globalThis.setTimeout?.(async () => {
      setActionState("sync", {
        tone: "info",
        message: "Auto-backup syncing to Google Drive..."
      });
      listeners.forEach((listener) => listener(getSnapshot()));

      const syncResult = await integrations.googleDrive.syncAppState({
        state: JSON.parse(signature),
        mode: "auto",
        interactive: false
      });

      queuedAutoBackupSignature = "";
      if (syncResult?.ok) {
        suppressAutoBackup = true;
        state.syncMeta = {
          ...state.syncMeta,
          lastRemoteSyncAt: syncResult?.remote?.syncedAt ?? syncPayload.syncAt,
          lastRemoteFileId: syncResult?.remote?.fileId ?? state.syncMeta.lastRemoteFileId,
          lastRemoteModifiedTime: syncResult?.remote?.modifiedTime ?? state.syncMeta.lastRemoteModifiedTime,
          lastRemoteVersion: syncResult?.remote?.version ?? state.syncMeta.lastRemoteVersion,
          lastSyncedByDeviceId: state.deviceIdentity.deviceId,
          lastSyncedByDeviceLabel: state.deviceIdentity.deviceLabel
        };
        state.library = state.library.map((entry) => ({
          ...entry,
          syncState: "ready"
        }));
        suppressAutoBackup = false;
        lastAutoBackupCompletedAt = Date.now();
        lastAutoBackupSignature = JSON.stringify(buildSyncExportState());
      }

      setActionState("sync", {
        tone: syncResult?.ok === false ? "error" : "success",
        message: syncResult?.message ?? "Auto-backup complete."
      });
      state.syncHistory = [
        createSyncHistoryEntry({
          ok: syncResult?.ok !== false,
          mode: syncResult?.mode ?? "auto",
          message: syncResult?.message ?? "Auto-backup complete."
        }),
        ...state.syncHistory
      ].slice(0, 6);
      suppressAutoBackup = true;
      emit();
      suppressAutoBackup = false;
    }, Math.max(AUTO_BACKUP_DEBOUNCE_MS, remainingCooldown));
  }

  function getCatalogGame(gameId) {
    return state.catalog.find((item) => item.id === gameId) ?? null;
  }

  function getEntry(entryId = state.activeEntryId) {
    return state.library.find((item) => item.entryId === entryId) ?? null;
  }

  function getEntryWithGame(entryId = state.activeEntryId) {
    const entry = getEntry(entryId);
    if (!entry) return null;
    const game = getCatalogGame(entry.gameId);
    return {
      ...entry,
      game
    };
  }

  function getVisibleLibrary() {
    const term = normalizeTerm(state.searchTerm);
    return applySort(state.library.filter((entry) => {
      const matchesStatus = state.activeStatus === "all" || entry.status === state.activeStatus;
      const wishlistPriorityFilter = state.uiPreferences.wishlistPriorityFilter || "all";
      const wishlistIntentFilter = state.uiPreferences.wishlistIntentFilter || "all";
      const matchesWishlistPriority = state.currentView !== "wishlist"
        || wishlistPriorityFilter === "all"
        || entry.wishlistPriority === wishlistPriorityFilter;
      const matchesWishlistIntent = state.currentView !== "wishlist"
        || wishlistIntentFilter === "all"
        || entry.wishlistIntent === wishlistIntentFilter;
      const wishlistPriceStatusFilter = state.uiPreferences.wishlistPriceStatusFilter || "all";
      const matchesWishlistPriceStatus = state.currentView !== "wishlist"
        || wishlistPriceStatusFilter === "all"
        || getWishlistPriceStatus(entry) === wishlistPriceStatusFilter;
      const game = getCatalogGame(entry.gameId);
      const haystack = [
        entry.title,
        entry.runLabel,
        entry.storefront,
        entry.notes,
        entry.wishlistPriority,
        entry.wishlistIntent,
        game?.developer,
        game?.publisher,
        ...(game?.genres ?? [])
      ].join(" ").toLowerCase();
      const matchesTerm = !term || haystack.includes(term);
      return matchesStatus && matchesWishlistPriority && matchesWishlistIntent && matchesWishlistPriceStatus && matchesTerm;
    }));
  }

  function getStatusBuckets() {
    return statusDefinitions.reduce((acc, status) => {
      acc[status.id] = state.library.filter((entry) => entry.status === status.id);
      return acc;
    }, {});
  }

  function getDashboardMetrics() {
    const buckets = getStatusBuckets();
    const totalPlaytime = state.library.reduce((sum, entry) => sum + (entry.playtimeHours || 0), 0);
    const averageCompletion = state.library.length
      ? Math.round(state.library.reduce((sum, entry) => sum + (entry.completionPercent || 0), 0) / state.library.length)
      : 0;

    return {
      totalEntries: state.library.length,
      playingCount: buckets.playing?.length ?? 0,
      finishedCount: buckets.finished?.length ?? 0,
      backlogCount: buckets.backlog?.length ?? 0,
      wishlistCount: buckets.wishlist?.length ?? 0,
      totalPlaytime,
      averageCompletion
    };
  }

  function getSuggestedCatalog() {
    const term = normalizeTerm(state.addForm.title);
    return state.catalog.filter((item) => {
      if (!term) return true;
      const haystack = [item.title, item.developer, item.publisher, ...(item.genres ?? [])].join(" ").toLowerCase();
      return haystack.includes(term);
    }).slice(0, 5);
  }

  function getSyncStatus() {
    const driveStatus = typeof integrations.googleDrive.getStatus === "function"
      ? integrations.googleDrive.getStatus()
      : {
          available: integrations.googleDrive.isConfigured(),
          connected: integrations.googleDrive.isConfigured(),
          clientConfigured: integrations.googleDrive.isConfigured()
        };
    const ready = state.library.filter((entry) => entry.syncState === "ready").length;
    const pending = state.library.filter((entry) => entry.syncState === "pending").length;
    const offline = state.library.filter((entry) => entry.syncState === "offline").length;

    return {
      ready,
      pending,
      offline,
      driveConnected: driveStatus.connected,
      driveAvailable: driveStatus.available,
      driveClientConfigured: driveStatus.clientConfigured,
      steamGridReady: integrations.steamGrid.isConfigured(),
      metadataReady: integrations.metadataResolver.isConfigured(),
      currentDeviceId: state.deviceIdentity.deviceId,
      currentDeviceLabel: state.deviceIdentity.deviceLabel,
      lastSyncedByDeviceLabel: state.syncMeta.lastSyncedByDeviceLabel || "",
      lastRemoteSyncAt: state.syncMeta.lastRemoteSyncAt || "",
      lastLocalMutationAt: state.syncMeta.lastLocalMutationAt || "",
      syncConflict: state.syncConflict,
      comparisonMode: getSyncComparisonStatus()
    };
  }

  function getAddFormValidation() {
    const title = state.addForm.title.trim();
    const storefront = state.addForm.storefront;
    const status = state.addForm.status;
    const runLabel = state.addForm.runLabel.trim() || "Main Save";
    const parsedPlaytime = Number.parseFloat(String(state.addForm.playtimeHours ?? "0"));
    const parsedCompletion = Number.parseFloat(String(state.addForm.completionPercent ?? "0"));
    const playtimeHours = Number.isFinite(parsedPlaytime) ? Math.max(0, parsedPlaytime) : Number.NaN;
    const completionPercent = Number.isFinite(parsedCompletion) ? Math.min(100, Math.max(0, parsedCompletion)) : Number.NaN;
    const errors = [];

    if (!title) {
      errors.push("Title is required.");
    }
    if (!validStorefrontIds.has(storefront)) {
      errors.push("Choose a valid storefront.");
    }
    if (!validStatusIds.has(status)) {
      errors.push("Choose a valid status.");
    }
    if (!Number.isFinite(playtimeHours)) {
      errors.push("Playtime must be a valid number.");
    }
    if (!Number.isFinite(completionPercent)) {
      errors.push("Completion must be a valid number from 0 to 100.");
    }

    const duplicateEntry = title
      ? state.library.find((entry) => (
        entry.entryId !== state.editingEntryId
        && normalizeTerm(entry.title) === normalizeTerm(title)
        && entry.storefront === storefront
        && normalizeTerm(entry.runLabel || "Main Save") === normalizeTerm(runLabel)
      )) ?? null
      : null;

    return {
      errors,
      duplicateEntry,
      normalized: {
        title,
        storefront,
        status,
        runLabel,
        playtimeHours,
        completionPercent
      }
    };
  }

  function getSnapshot() {
    const serviceConfig = getServiceConfig();

    return {
      ...state,
      serviceConfig,
      visibleLibrary: getVisibleLibrary(),
      activeEntry: getEntryWithGame(),
      dashboardMetrics: getDashboardMetrics(),
      suggestions: getSuggestedCatalog(),
      addSearchResults: state.addSearchResults,
      addSearchLoading: state.addSearchLoading,
      addSearchError: state.addSearchError,
      syncStatus: getSyncStatus(),
      addFormValidation: getAddFormValidation()
    };
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function setView(view) {
    if (view === "details") return;
    if (view === "wishlist") {
      state.activeStatus = "wishlist";
      state.uiPreferences.lastStatusFilter = "wishlist";
      state.sortMode = state.uiPreferences.wishlistSort;
    } else if (view === "discover") {
      state.activeStatus = "all";
      state.uiPreferences.lastStatusFilter = "all";
      state.sortMode = state.uiPreferences.librarySort;
    } else if (view === "dashboard" && state.activeStatus === "wishlist") {
      state.activeStatus = "all";
      state.uiPreferences.lastStatusFilter = "all";
      state.sortMode = state.uiPreferences.librarySort;
    } else if (view !== "wishlist") {
      state.sortMode = state.uiPreferences.librarySort;
    }
    state.currentView = view;
    state.uiPreferences.lastView = view;
    if (view !== "dashboard" && !state.activeEntryId && state.library[0]) {
      state.activeEntryId = state.library[0].entryId;
    }
    emit();
  }

  function openDetailsByGameId(gameId, sourceView = "dashboard") {
    const normalizedGameId = String(gameId ?? "").trim();
    if (!normalizedGameId) return false;

    const matchedEntry = state.library.find((entry) => String(entry?.gameId ?? "").trim() === normalizedGameId);
    if (!matchedEntry) return false;

    const normalizedSourceView = ["dashboard", "discover", "wishlist", "settings"].includes(sourceView)
      ? sourceView
      : "dashboard";
    state.uiPreferences.lastView = normalizedSourceView;
    state.activeEntryId = matchedEntry.entryId;
    state.currentView = "details";
    state.isDetailEditMode = false;
    state.detailForm = createDetailForm(matchedEntry);
    emit();
    if (matchedEntry.status === "wishlist") {
      void entryActions.hydrateTrackedGameDecisionData?.(matchedEntry).then(() => {
        emit();
      }).catch(() => {
        // Best effort only; keep route-open stable even if enrichment fails.
      });
    }
    return true;
  }

  function setSettingsSection(sectionId) {
    if (typeof sectionId !== "string" || !sectionId.trim()) return;
    state.uiPreferences.settingsSection = sectionId;
    emit();
  }

  function setSearchTerm(value) {
    state.searchTerm = value;
    emit();
  }

  function openLibrarySearch(value) {
    state.currentView = "dashboard";
    state.uiPreferences.lastView = "dashboard";
    state.searchTerm = value;
    emit();
  }

  function setActiveStatus(status) {
    if (status !== "all" && !validStatusIds.has(status)) {
      return;
    }
    if (state.currentView === "dashboard" && status === "wishlist") {
      state.activeStatus = "all";
      state.uiPreferences.lastStatusFilter = "all";
      emit();
      return;
    }
    state.activeStatus = status;
    state.uiPreferences.lastStatusFilter = status;
    emit();
  }

  function setSortMode(sortMode) {
    state.sortMode = sortMode;
    if (state.currentView === "wishlist") {
      state.uiPreferences.wishlistSort = sortMode;
    } else {
      state.uiPreferences.librarySort = sortMode;
    }
    emit();
  }

  function setWishlistPriorityFilter(value) {
    state.uiPreferences.wishlistPriorityFilter = value || "all";
    emit();
  }

  function setWishlistIntentFilter(value) {
    state.uiPreferences.wishlistIntentFilter = value || "all";
    emit();
  }

  function setWishlistPriceStatusFilter(value) {
    state.uiPreferences.wishlistPriceStatusFilter = value || "all";
    emit();
  }

  function clearLibraryView() {
    state.activeStatus = "all";
    state.uiPreferences.lastStatusFilter = "all";
    state.searchTerm = "";
    emit();
  }

  function setActionState(key, value) {
    state.actionState = {
      ...state.actionState,
      [key]: value
    };
  }

  function recordActivity(event = {}) {
    state.activityHistory = [
      createActivityEntry(event),
      ...state.activityHistory
    ].slice(0, 24);
  }

  function normalizeMediaImages(images) {
    if (!Array.isArray(images)) return [];
    return images
      .map((value) => String(value ?? "").trim())
      .filter(Boolean);
  }

  function openMediaLightbox({ images = [], index = 0, title = "" } = {}) {
    const normalizedImages = normalizeMediaImages(images);
    if (!normalizedImages.length) return;
    const clampedIndex = Math.max(0, Math.min(Number(index) || 0, normalizedImages.length - 1));
    state.mediaLightbox = {
      open: true,
      images: normalizedImages,
      index: clampedIndex,
      title: String(title || "").trim()
    };
    emit();
  }

  function openDiscoverScreenshotLightbox(index = 0) {
    const details = state.discoverEntryDetails ?? state.addForm.selectedSearchResult ?? {};
    openMediaLightbox({
      images: normalizeMediaImages(details?.screenshots),
      index,
      title: String(details?.title || state.addForm.selectedSearchResult?.title || "Discover screenshot").trim()
    });
  }

  function openDetailScreenshotLightbox(index = 0) {
    const active = getEntryWithGame();
    const images = normalizeMediaImages(active?.game?.screenshots);
    openMediaLightbox({
      images,
      index,
      title: String(active?.title || "Screenshot").trim()
    });
  }

  function closeMediaLightbox() {
    if (!state.mediaLightbox?.open) return;
    state.mediaLightbox = {
      open: false,
      images: [],
      index: 0,
      title: ""
    };
    emit();
  }

  function setMediaLightboxIndex(index = 0) {
    if (!state.mediaLightbox?.open) return;
    const images = normalizeMediaImages(state.mediaLightbox.images);
    if (!images.length) {
      closeMediaLightbox();
      return;
    }
    const clampedIndex = Math.max(0, Math.min(Number(index) || 0, images.length - 1));
    state.mediaLightbox = {
      ...state.mediaLightbox,
      images,
      index: clampedIndex
    };
    emit();
  }

  function stepMediaLightbox(direction = "next") {
    if (!state.mediaLightbox?.open) return;
    const images = normalizeMediaImages(state.mediaLightbox.images);
    if (!images.length) {
      closeMediaLightbox();
      return;
    }
    const delta = direction === "prev" ? -1 : 1;
    const nextIndex = Math.max(0, Math.min((Number(state.mediaLightbox.index) || 0) + delta, images.length - 1));
    if (nextIndex === state.mediaLightbox.index) return;
    state.mediaLightbox = {
      ...state.mediaLightbox,
      images,
      index: nextIndex
    };
    emit();
  }

  const enrichmentActions = createEnrichmentActions({
    state,
    emit,
    integrations,
    normalizeTerm,
    setActionState,
    getEntry,
    getCatalogGame,
    recordActivity
  });

  const entryActions = createEntryActions({
    state,
    emit,
    integrations,
    setActionState,
    statusDefinitions,
    validStorefrontIds,
    validStatusIds,
    getEntry,
    getCatalogGame,
    createDefaultAddForm,
    createDetailForm,
    getAddFormValidation,
    createEntryId,
    sortByUpdatedAtDesc,
    normalizeLibraryEntry,
    pruneCatalogToLibrary,
    mergeArtworkIntoCatalogGame: enrichmentActions.mergeArtworkIntoCatalogGame,
    mergeMetadataIntoCatalogGame: enrichmentActions.mergeMetadataIntoCatalogGame,
    buildEntrySaveFeedback: enrichmentActions.buildEntrySaveFeedback,
    applyMetadataOverridesToGame: enrichmentActions.applyMetadataOverridesToGame,
    applyArtworkOverridesToGame: enrichmentActions.applyArtworkOverridesToGame,
    recordActivity,
    writeItadStoresCache,
    writeDiscoverMetadataCache
  });

  const backupActions = createBackupActions({
    state,
    emit,
    setActionState,
    buildExportState,
    createDefaultAddForm,
    createDetailForm,
    sortByUpdatedAtDesc,
    mergeById,
    pruneCatalogToLibrary,
    isImportCandidate
  });

  const driveActions = createDriveSyncActions({
    state,
    emit,
    integrations,
    setActionState,
    buildExportState,
    buildSyncExportState,
    buildComparableStateSignature,
    getDeviceIdentity() {
      return state.deviceIdentity;
    },
    updateSyncMeta(patch) {
      state.syncMeta = {
        ...state.syncMeta,
        ...patch
      };
    },
    getSyncConflict() {
      return state.syncConflict;
    },
    setSyncConflict(conflict) {
      state.syncConflict = conflict;
    },
    importLibraryBackup: backupActions.importLibraryBackup,
    normalizePersistedState,
    createSyncHistoryEntry,
    recordActivity,
    readLocalRestorePoint,
    writeLocalRestorePoint,
    driveRuntime: {
      clearAutoBackupQueue() {
        globalThis.clearTimeout?.(autoBackupTimer);
        queuedAutoBackupSignature = "";
      },
      clearQueuedAutoBackupSignature() {
        queuedAutoBackupSignature = "";
      },
      setLastAutoBackupSignature(signature) {
        lastAutoBackupSignature = signature;
        lastAutoBackupCompletedAt = Date.now();
      },
      setLastTrackedSyncDataSignature() {
        lastTrackedSyncDataSignature = buildTrackedSyncDataSignature();
      }
    }
  });

  lastTrackedSyncDataSignature = buildTrackedSyncDataSignature();
  const parsedLastRemoteSyncAt = Date.parse(state.syncMeta.lastRemoteSyncAt || "");
  if (Number.isFinite(parsedLastRemoteSyncAt) && parsedLastRemoteSyncAt > 0) {
    lastAutoBackupCompletedAt = parsedLastRemoteSyncAt;
  }

  return {
    subscribe,
    getSnapshot,
    setView,
    setSettingsSection,
    setSearchTerm,
    openLibrarySearch,
    openDetailsByGameId,
    setActiveStatus,
    setSortMode,
    setWishlistPriorityFilter,
    setWishlistIntentFilter,
    setWishlistPriceStatusFilter,
    clearLibraryView,
    ...entryActions,
    setImportMode: backupActions.setImportMode,
    exportLibraryBackup: backupActions.exportLibraryBackup,
    importLibraryBackup: backupActions.importLibraryBackup,
    refreshMetadataForEntry: enrichmentActions.refreshMetadataForEntry,
    refreshArtworkForEntry: enrichmentActions.refreshArtworkForEntry,
    refreshLibraryMetadata: enrichmentActions.refreshLibraryMetadata,
    refreshLibraryArtwork: enrichmentActions.refreshLibraryArtwork,
    refreshPricingForEntry: entryActions.refreshPricingForEntry,
    refreshLibraryPricing: entryActions.refreshLibraryPricing,
    savePriceWatch: entryActions.savePriceWatch,
    togglePriceWatch: entryActions.togglePriceWatch,
    loadItadStores: entryActions.loadItadStores,
    toggleItadStoreSelection: entryActions.toggleItadStoreSelection,
    saveMetadataOverrides: enrichmentActions.saveMetadataOverrides,
    clearMetadataOverrides: enrichmentActions.clearMetadataOverrides,
    saveArtworkOverrides: enrichmentActions.saveArtworkOverrides,
    clearArtworkOverrides: enrichmentActions.clearArtworkOverrides,
    connectGoogleDrive: driveActions.connectGoogleDrive,
    disconnectGoogleDrive: driveActions.disconnectGoogleDrive,
    updateDeviceLabel: driveActions.updateDeviceLabel,
    restoreFromGoogleDrive: driveActions.restoreFromGoogleDrive,
    restoreLocalSafetySnapshot: driveActions.restoreLocalSafetySnapshot,
    syncNow: driveActions.syncNow,
    keepLocalDuringConflict: driveActions.keepLocalDuringConflict
    ,
    openMediaLightbox,
    openDiscoverScreenshotLightbox,
    openDetailScreenshotLightbox,
    closeMediaLightbox,
    setMediaLightboxIndex,
    stepMediaLightbox
  };
}
