import { APP_STATE_SCHEMA_VERSION, normalizePersistedState, pruneCatalogToLibrary } from "./schema.js";
import { normalizeCatalogGame, normalizeLibraryEntry } from "./normalization.js";
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
  return String(value ?? "").trim().toLowerCase();
}

function normalizeComparableTitle(value) {
  return normalizeTerm(value)
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getSteamPreviewPriority(matchStatus) {
  return {
    possible: 0,
    existing: 1,
    unmatched: 2
  }[matchStatus] ?? 3;
}

function normalizeSteamStoreUrl(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "");
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

function createDefaultSteamImportSession() {
  return {
    mode: "owned-library",
    step: "source",
    source: {
      steamProfile: "",
      includeFreePlayed: true
    },
    loading: false,
    lastResolvedSteamId: "",
    rawResults: [],
    igdbSuggestions: {},
    actionOverrides: {},
    rules: {
      defaultDestination: "backlog",
      suggestRecentlyPlayedAsPlaying: true,
      duplicateBehavior: "merge-appid"
    },
    candidates: [],
    commitResult: null,
    summary: {
      total: 0,
      played: 0,
      unplayed: 0,
      recent: 0,
      existing: 0,
      possibleMatches: 0,
      unmatched: 0
    },
    errors: [],
    lastFetchedAt: ""
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
    steamImport: createDefaultSteamImportSession(),
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

  function getSteamAppIdFromGame(game) {
    const directAppId = Number(game?.steam?.appid);
    if (Number.isFinite(directAppId) && directAppId > 0) {
      return directAppId;
    }

    const storefrontUrl = [
      game?.steam?.appUrl,
      ...(Array.isArray(game?.links?.storefronts) ? game.links.storefronts.map((link) => link?.url ?? link) : []),
      game?.links?.official
    ].map((value) => String(value ?? "")).find((value) => /store\.steampowered\.com\/app\/\d+/i.test(value));
    const match = storefrontUrl?.match(/store\.steampowered\.com\/app\/(\d+)/i);
    const linkedAppId = Number(match?.[1]);
    return Number.isFinite(linkedAppId) && linkedAppId > 0 ? linkedAppId : null;
  }

  function getSteamStoreUrlsFromGame(game) {
    const candidateUrls = [
      game?.steam?.appUrl,
      ...(Array.isArray(game?.links?.storefronts) ? game.links.storefronts.map((link) => link?.url ?? link) : []),
      game?.links?.official
    ];

    return candidateUrls
      .map(normalizeSteamStoreUrl)
      .filter((url) => url && url.includes("store.steampowered.com/app/"));
  }

  function findExactSteamImportMatch(steamGame) {
    const appid = Number(steamGame?.appid);
    const steamUrl = normalizeSteamStoreUrl(steamGame?.appUrl);

    if (Number.isFinite(appid) && appid > 0) {
      const directSteamEntry = state.library.find((entry) => {
        const catalogGame = getCatalogGame(entry.gameId);
        return Number(catalogGame?.steam?.appid) === appid;
      }) ?? null;

      if (directSteamEntry) {
        return {
          entry: directSteamEntry,
          reason: "steam_appid",
          confidence: "exact"
        };
      }
    }

    if (steamUrl) {
      const directUrlEntry = state.library.find((entry) => {
        const catalogGame = getCatalogGame(entry.gameId);
        return getSteamStoreUrlsFromGame(catalogGame).includes(steamUrl);
      }) ?? null;

      if (directUrlEntry) {
        return {
          entry: directUrlEntry,
          reason: "steam_url",
          confidence: "exact"
        };
      }
    }

    if (Number.isFinite(appid) && appid > 0) {
      const inferredUrlEntry = state.library.find((entry) => {
        const catalogGame = getCatalogGame(entry.gameId);
        return getSteamAppIdFromGame(catalogGame) === appid;
      }) ?? null;

      if (inferredUrlEntry) {
        return {
          entry: inferredUrlEntry,
          reason: "steam_url",
          confidence: "exact"
        };
      }
    }

    return null;
  }

  function findPossibleSteamImportMatch(steamGame) {
    const titleKey = normalizeComparableTitle(steamGame?.title);
    if (!titleKey) return null;

    const titleEntry = state.library.find((entry) => {
      const catalogGame = getCatalogGame(entry.gameId);
      return normalizeComparableTitle(entry.title) === titleKey
        || normalizeComparableTitle(catalogGame?.title) === titleKey;
    }) ?? null;

    if (!titleEntry) return null;

    return {
      entry: titleEntry,
      reason: "title",
      confidence: "high"
    };
  }

  function getSteamMatchContext(entry) {
    if (!entry) {
      return {
        surface: "",
        label: ""
      };
    }

    const isWishlist = entry.status === "wishlist";
    return {
      surface: isWishlist ? "wishlist" : "library",
      label: isWishlist ? "Wishlist" : "Library"
    };
  }

  function getSteamImportReasonLabel(reason) {
    return {
      steam_appid: "Exact Steam AppID match",
      steam_url: "Matched existing Steam store URL",
      title: "Normalized title match",
      igdb_title: "IGDB title suggestion",
      none: "No existing match"
    }[reason] ?? "No existing match";
  }

  function classifySteamImportCandidate(steamGame, options = {}) {
    const rules = options.rules ?? state.steamImport?.rules ?? createDefaultSteamImportSession().rules;
    const actionOverrides = options.actionOverrides ?? state.steamImport?.actionOverrides ?? {};
    const igdbSuggestions = options.igdbSuggestions ?? state.steamImport?.igdbSuggestions ?? {};
    const appid = Number(steamGame?.appid);
    const exactMatch = findExactSteamImportMatch(steamGame);
    const possibleMatch = exactMatch ? null : findPossibleSteamImportMatch(steamGame);
    const existingEntry = exactMatch?.entry ?? possibleMatch?.entry ?? null;
    const matchContext = getSteamMatchContext(existingEntry);
    const suggestionKey = Number.isFinite(appid) && appid > 0
      ? String(Math.trunc(appid))
      : normalizeComparableTitle(steamGame?.title);
    const igdbSuggestion = suggestionKey ? (igdbSuggestions[suggestionKey] ?? null) : null;

    const matchStatus = exactMatch
      ? "existing"
      : possibleMatch
        ? "possible"
        : "unmatched";
    const defaultDestination = rules?.defaultDestination === "playing"
      ? "playing"
      : "backlog";
    const proposedStatus = steamGame?.recentlyPlayed && rules?.suggestRecentlyPlayedAsPlaying
      ? "playing"
      : defaultDestination;
    const defaultAction = exactMatch
      ? (rules?.duplicateBehavior === "skip" ? "skip" : "merge")
      : possibleMatch
        ? "merge"
        : "add";
    const selectedAction = actionOverrides?.[suggestionKey] ?? defaultAction;
    const matchReason = exactMatch?.reason ?? possibleMatch?.reason ?? (igdbSuggestion ? "igdb_title" : "none");
    const matchConfidence = exactMatch?.confidence ?? possibleMatch?.confidence ?? (igdbSuggestion ? "medium" : "none");

    return {
      id: `steam-${appid || Math.random().toString(36).slice(2, 10)}`,
      ...steamGame,
      proposedStatus,
      matchStatus,
      matchReason,
      matchReasonLabel: getSteamImportReasonLabel(matchReason),
      matchConfidence,
      existingEntryId: existingEntry?.entryId ?? "",
      existingTitle: existingEntry?.title ?? "",
      existingSurface: matchContext.surface,
      existingSurfaceLabel: matchContext.label,
      action: selectedAction,
      defaultAction,
      igdbSuggestion
    };
  }

  function sortSteamImportCandidates(candidates) {
    return (Array.isArray(candidates) ? candidates.slice() : []).sort((a, b) => {
      const priorityDelta = getSteamPreviewPriority(a?.matchStatus) - getSteamPreviewPriority(b?.matchStatus);
      if (priorityDelta !== 0) return priorityDelta;

      const recentDelta = Number(Boolean(b?.recentlyPlayed)) - Number(Boolean(a?.recentlyPlayed));
      if (recentDelta !== 0) return recentDelta;

      const playtimeDelta = Number(b?.playtimeForeverMinutes ?? 0) - Number(a?.playtimeForeverMinutes ?? 0);
      if (playtimeDelta !== 0) return playtimeDelta;

      return String(a?.title ?? "").localeCompare(String(b?.title ?? ""));
    });
  }

  function rebuildSteamImportPreview(rawResults, workerSummary = null, options = {}) {
    const rules = {
      ...(state.steamImport?.rules ?? createDefaultSteamImportSession().rules),
      ...(options.rules ?? {})
    };
    const actionOverrides = options.actionOverrides ?? state.steamImport?.actionOverrides ?? {};
    const igdbSuggestions = options.igdbSuggestions ?? state.steamImport?.igdbSuggestions ?? {};
    const candidates = sortSteamImportCandidates(
      (Array.isArray(rawResults) ? rawResults : []).map((steamGame) => classifySteamImportCandidate(steamGame, {
        rules,
        actionOverrides,
        igdbSuggestions
      }))
    );
    const summary = summarizeSteamImportCandidates(candidates, workerSummary ?? state.steamImport?.summary ?? {});
    return { candidates, summary };
  }

  async function resolveSteamImportIgdbSuggestions(rawResults) {
    if (!integrations.metadataResolver?.isConfigured?.()) {
      return {};
    }

    const unresolved = (Array.isArray(rawResults) ? rawResults : [])
      .filter((row) => row && !findExactSteamImportMatch(row) && !findPossibleSteamImportMatch(row))
      .slice(0, 20);

    const suggestions = {};

    for (const row of unresolved) {
      const query = String(row?.title ?? "").trim();
      const key = Number.isFinite(Number(row?.appid)) && Number(row.appid) > 0
        ? String(Math.trunc(Number(row.appid)))
        : normalizeComparableTitle(query);
      if (!query || !key) continue;

      try {
        const results = await integrations.metadataResolver.searchGames({ query });
        const normalizedQuery = normalizeComparableTitle(query);
        const suggestion = (Array.isArray(results) ? results : []).find((result) => (
          normalizeComparableTitle(result?.title) === normalizedQuery
        )) ?? (Array.isArray(results) ? results[0] : null);
        if (!suggestion) continue;
        suggestions[key] = {
          igdbId: Number.isFinite(Number(suggestion?.igdbId)) ? Number(suggestion.igdbId) : null,
          title: String(suggestion?.title ?? "").trim(),
          releaseDate: String(suggestion?.releaseDate ?? "").trim()
        };
      } catch (error) {
        continue;
      }
    }

    return suggestions;
  }

  function summarizeSteamImportCandidates(candidates, workerSummary = {}) {
    const rows = Array.isArray(candidates) ? candidates : [];
    return {
      total: Number(workerSummary?.total ?? rows.length) || rows.length,
      played: Number(workerSummary?.played ?? rows.filter((row) => row.playtimeForeverMinutes > 0).length) || 0,
      unplayed: Number(workerSummary?.unplayed ?? rows.filter((row) => row.playtimeForeverMinutes === 0).length) || 0,
      recent: Number(workerSummary?.recentlyPlayed ?? rows.filter((row) => row.playtime2WeeksMinutes > 0).length) || 0,
      existing: rows.filter((row) => row.matchStatus === "existing").length,
      possibleMatches: rows.filter((row) => row.matchStatus === "possible").length,
      unmatched: rows.filter((row) => row.matchStatus === "unmatched").length
    };
  }

  function getSteamImportCommitSummary(candidates) {
    const rows = Array.isArray(candidates) ? candidates : [];
    return {
      total: rows.length,
      add: rows.filter((row) => row.action === "add").length,
      merge: rows.filter((row) => row.action === "merge").length,
      skip: rows.filter((row) => row.action === "skip").length,
      review: rows.filter((row) => row.action === "review").length
    };
  }

  function buildSteamCatalogLinks(candidate, fallbackLinks = {}) {
    const storefronts = Array.isArray(fallbackLinks?.storefronts)
      ? fallbackLinks.storefronts.filter((row) => row && typeof row === "object" && row.url)
      : [];
    const hasSteamLink = storefronts.some((row) => normalizeSteamStoreUrl(row.url) === normalizeSteamStoreUrl(candidate?.appUrl));
    const nextStorefronts = hasSteamLink || !candidate?.appUrl
      ? storefronts
      : [
          ...storefronts,
          {
            kind: "steam",
            url: String(candidate.appUrl).trim()
          }
        ];

    return {
      igdb: String(fallbackLinks?.igdb ?? "").trim(),
      official: String(fallbackLinks?.official ?? "").trim(),
      storefronts: nextStorefronts
    };
  }

  function buildCatalogGameFromSteamCandidate(candidate) {
    const igdbId = Number(candidate?.igdbSuggestion?.igdbId);
    const normalizedId = Number.isFinite(igdbId) && igdbId > 0
      ? `igdb-${Math.trunc(igdbId)}`
      : `steam-${Math.trunc(Number(candidate?.appid || Date.now()))}`;
    const now = new Date().toISOString();
    return normalizeCatalogGame({
      id: normalizedId,
      igdbId: Number.isFinite(igdbId) && igdbId > 0 ? Math.trunc(igdbId) : null,
      title: String(candidate?.igdbSuggestion?.title || candidate?.title || "Steam Import").trim(),
      storefront: "steam",
      releaseDate: String(candidate?.igdbSuggestion?.releaseDate || "").trim(),
      steam: {
        appid: Number.isFinite(Number(candidate?.appid)) ? Math.trunc(Number(candidate.appid)) : null,
        appUrl: String(candidate?.appUrl || "").trim(),
        playtimeForeverMinutes: Number(candidate?.playtimeForeverMinutes ?? 0),
        playtime2WeeksMinutes: Number(candidate?.playtime2WeeksMinutes ?? 0),
        lastImportedAt: now,
        lastRefreshedAt: now,
        importSource: String(candidate?.importSource || "steam-owned-games").trim()
      },
      links: buildSteamCatalogLinks(candidate, {})
    });
  }

  function mergeSteamCandidateIntoCatalogGame(game, candidate) {
    const now = new Date().toISOString();
    return normalizeCatalogGame({
      ...game,
      steam: {
        ...(game?.steam ?? {}),
        appid: Number.isFinite(Number(candidate?.appid)) ? Math.trunc(Number(candidate.appid)) : (game?.steam?.appid ?? null),
        appUrl: String(candidate?.appUrl || game?.steam?.appUrl || "").trim(),
        playtimeForeverMinutes: Number(candidate?.playtimeForeverMinutes ?? game?.steam?.playtimeForeverMinutes ?? 0),
        playtime2WeeksMinutes: Number(candidate?.playtime2WeeksMinutes ?? game?.steam?.playtime2WeeksMinutes ?? 0),
        lastImportedAt: now,
        lastRefreshedAt: now,
        importSource: String(candidate?.importSource || game?.steam?.importSource || "steam-owned-games").trim()
      },
      links: buildSteamCatalogLinks(candidate, game?.links ?? {}),
      releaseDate: String(game?.releaseDate || candidate?.igdbSuggestion?.releaseDate || "").trim(),
      title: String(game?.title || candidate?.title || "").trim()
    }, game);
  }

  function buildImportedEntryFromSteamCandidate({ candidate, existingEntry = null, game }) {
    const now = new Date().toISOString();
    const nextStatus = existingEntry?.status && existingEntry.status !== "wishlist"
      ? existingEntry.status
      : (candidate?.proposedStatus === "playing" ? "playing" : "backlog");
    const nextRunLabel = existingEntry?.runLabel
      ? existingEntry.runLabel
      : (nextStatus === "playing" ? "Steam Import" : "Backlog");
    const nextNotes = existingEntry?.notes
      ? existingEntry.notes
      : "Imported from Steam owned library.";

    return normalizeLibraryEntry({
      entryId: existingEntry?.entryId ?? createEntryId(),
      gameId: game.id,
      title: game.title,
      storefront: "steam",
      status: nextStatus,
      runLabel: nextRunLabel,
      addedAt: existingEntry?.addedAt ?? now,
      updatedAt: now,
      playtimeHours: existingEntry?.playtimeHours ?? 0,
      completionPercent: existingEntry?.completionPercent ?? 0,
      personalRating: existingEntry?.personalRating ?? null,
      notes: nextNotes,
      spotlight: existingEntry?.spotlight ?? "Steam import",
      syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline",
      wishlistPriority: existingEntry?.wishlistPriority ?? "medium",
      wishlistIntent: existingEntry?.wishlistIntent ?? "wait-sale",
      externalPlaytime: {
        ...(existingEntry?.externalPlaytime ?? {}),
        steam: {
          appid: Number.isFinite(Number(candidate?.appid)) ? Math.trunc(Number(candidate.appid)) : null,
          playtimeForeverMinutes: Number(candidate?.playtimeForeverMinutes ?? 0),
          playtime2WeeksMinutes: Number(candidate?.playtime2WeeksMinutes ?? 0),
          lastImportedAt: now
        }
      }
    });
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

  function setSteamImportMode(mode) {
    const normalizedMode = mode === "wishlist" ? "wishlist" : "owned-library";
    state.steamImport = {
      ...state.steamImport,
      mode: normalizedMode,
      step: "source",
      rawResults: [],
      igdbSuggestions: {},
      actionOverrides: {},
      candidates: [],
      summary: createDefaultSteamImportSession().summary,
      errors: []
    };
    emit();
  }

  function updateSteamImportSource(patch = {}) {
    const nextSource = {
      ...state.steamImport.source,
      ...patch
    };
    state.steamImport = {
      ...state.steamImport,
      source: nextSource,
      errors: []
    };
    emit();
  }

  function setSteamImportCandidateAction(candidateId, action) {
    const normalizedId = String(candidateId ?? "").trim();
    const normalizedAction = String(action ?? "").trim();
    if (!normalizedId || !["add", "skip", "merge", "review"].includes(normalizedAction)) return;

    const nextOverrides = {
      ...(state.steamImport?.actionOverrides ?? {}),
      [normalizedId]: normalizedAction
    };
    const rebuilt = rebuildSteamImportPreview(state.steamImport.rawResults, state.steamImport.summary, {
      actionOverrides: nextOverrides
    });

    state.steamImport = {
      ...state.steamImport,
      step: state.steamImport.step === "preview" ? "review" : state.steamImport.step,
      actionOverrides: nextOverrides,
      candidates: rebuilt.candidates,
      summary: rebuilt.summary,
      errors: []
    };
    emit();
  }

  function updateSteamImportRules(patch = {}) {
    const nextRules = {
      ...state.steamImport.rules,
      ...patch
    };
    const rebuilt = rebuildSteamImportPreview(state.steamImport.rawResults, state.steamImport.summary, {
      rules: nextRules
    });
    state.steamImport = {
      ...state.steamImport,
      rules: nextRules,
      candidates: rebuilt.candidates,
      summary: rebuilt.summary,
      errors: []
    };
    emit();
  }

  function setSteamImportStep(step) {
    const allowedSteps = new Set(["source", "preview", "rules", "review", "import", "complete"]);
    if (!allowedSteps.has(step)) return;
    state.steamImport = {
      ...state.steamImport,
      step
    };
    emit();
  }

  function resetSteamImportSession() {
    state.steamImport = createDefaultSteamImportSession();
    emit();
  }

  async function commitSteamOwnedImport() {
    const session = state.steamImport ?? createDefaultSteamImportSession();
    const candidates = Array.isArray(session.candidates) ? session.candidates : [];
    if (!candidates.length) {
      state.notice = {
        tone: "warning",
        message: "Fetch a Steam preview before importing."
      };
      emit();
      return;
    }

    const blocked = candidates.filter((candidate) => candidate.action === "review");
    if (blocked.length) {
      state.steamImport = {
        ...state.steamImport,
        step: "review",
        errors: [`Resolve ${blocked.length} review item${blocked.length === 1 ? "" : "s"} before import.`]
      };
      emit();
      return;
    }

    state.steamImport = {
      ...state.steamImport,
      loading: true,
      errors: []
    };
    emit();

    try {
      const catalogById = new Map(state.catalog.map((game) => [game.id, game]));
      const nextCatalog = state.catalog.slice();
      const nextLibrary = state.library.slice();
      const enrichedEntryIds = [];
      let addedCount = 0;
      let mergedCount = 0;
      let skippedCount = 0;

      for (const candidate of candidates) {
        if (candidate.action === "skip") {
          skippedCount += 1;
          continue;
        }

        const existingEntry = candidate.existingEntryId
          ? nextLibrary.find((entry) => entry.entryId === candidate.existingEntryId) ?? null
          : null;
        const existingGame = existingEntry ? catalogById.get(existingEntry.gameId) ?? null : null;
        const nextGame = existingGame
          ? mergeSteamCandidateIntoCatalogGame(existingGame, candidate)
          : buildCatalogGameFromSteamCandidate(candidate);

        catalogById.set(nextGame.id, nextGame);
        const existingCatalogIndex = nextCatalog.findIndex((game) => game.id === nextGame.id);
        if (existingCatalogIndex >= 0) {
          nextCatalog[existingCatalogIndex] = nextGame;
        } else {
          nextCatalog.unshift(nextGame);
        }

        const nextEntry = buildImportedEntryFromSteamCandidate({
          candidate,
          existingEntry,
          game: nextGame
        });
        const existingEntryIndex = existingEntry
          ? nextLibrary.findIndex((entry) => entry.entryId === existingEntry.entryId)
          : -1;
        if (existingEntryIndex >= 0) {
          nextLibrary[existingEntryIndex] = nextEntry;
          mergedCount += 1;
        } else {
          nextLibrary.unshift(nextEntry);
          addedCount += 1;
        }
        enrichedEntryIds.push(nextEntry.entryId);
      }

      state.catalog = pruneCatalogToLibrary(
        nextLibrary.map((entry) => normalizeLibraryEntry(entry)),
        nextCatalog.map((game) => normalizeCatalogGame(game))
      );
      state.library = nextLibrary
        .map((entry) => normalizeLibraryEntry(entry))
        .sort(sortByUpdatedAtDesc);

      const enrichmentResult = await enrichmentActions.enrichImportedEntries(enrichedEntryIds);

      const commitResult = {
        added: addedCount,
        merged: mergedCount,
        skipped: skippedCount,
        total: candidates.length,
        enrichment: enrichmentResult,
        completedAt: new Date().toISOString()
      };

      state.steamImport = {
        ...state.steamImport,
        loading: false,
        step: "complete",
        commitResult,
        errors: []
      };
      setActionState("metadata", {
        tone: "success",
        message: `Steam import complete: ${addedCount} added, ${mergedCount} merged, ${skippedCount} skipped.${enrichmentResult.failed ? ` ${enrichmentResult.failed} enrichment issue${enrichmentResult.failed === 1 ? "" : "s"} need review.` : ""}`
      });
      state.notice = {
        tone: enrichmentResult.failed ? "warning" : "success",
        message: `Steam import complete: ${addedCount} added, ${mergedCount} merged, ${skippedCount} skipped.${enrichmentResult.metadataUpdated || enrichmentResult.artworkUpdated || enrichmentResult.pricingUpdated ? ` Enrichment updated ${enrichmentResult.metadataUpdated} metadata, ${enrichmentResult.artworkUpdated} artwork, and ${enrichmentResult.pricingUpdated} pricing record${enrichmentResult.pricingUpdated === 1 ? "" : "s"}.` : ""}${enrichmentResult.failed ? ` ${enrichmentResult.failed} title${enrichmentResult.failed === 1 ? "" : "s"} had partial enrichment failures.` : ""}`
      };
      recordActivity({
        category: "import",
        action: "steam-import",
        scope: "library",
        message: `Steam import complete: ${addedCount} added, ${mergedCount} merged, ${skippedCount} skipped. Enrichment updated ${enrichmentResult.metadataUpdated} metadata, ${enrichmentResult.artworkUpdated} artwork, and ${enrichmentResult.pricingUpdated} pricing records${enrichmentResult.failed ? ` with ${enrichmentResult.failed} partial failures` : ""}.`,
        tone: enrichmentResult.failed ? "warning" : "success"
      });
      emit();
    } catch (error) {
      state.steamImport = {
        ...state.steamImport,
        loading: false,
        errors: [error instanceof Error ? error.message : "Steam import failed."],
        step: "import"
      };
      state.notice = {
        tone: "error",
        message: "Steam import failed. Your existing Checkpoint data is unchanged."
      };
      emit();
    }
  }

  async function fetchSteamOwnedLibraryPreview() {
    const profile = String(state.steamImport?.source?.steamProfile ?? "").trim();
    if (!profile) {
      state.steamImport = {
        ...state.steamImport,
        errors: ["Enter a SteamID64 or Steam profile URL first."]
      };
      emit();
      return;
    }

    state.steamImport = {
      ...state.steamImport,
      loading: true,
      errors: []
    };
    emit();

    try {
      const resolved = await integrations.steamImport.resolveProfile(profile);
      const ownedGames = await integrations.steamImport.fetchOwnedGames({
        steamid: resolved.steamid,
        includeFreePlayed: state.steamImport?.source?.includeFreePlayed !== false
      });
      const igdbSuggestions = await resolveSteamImportIgdbSuggestions(ownedGames.results);
      const rebuilt = rebuildSteamImportPreview(ownedGames.results, ownedGames.summary, {
        igdbSuggestions,
        actionOverrides: {}
      });
      state.steamImport = {
        ...state.steamImport,
        loading: false,
        step: "preview",
        lastResolvedSteamId: resolved.steamid,
        rawResults: Array.isArray(ownedGames.results) ? ownedGames.results.slice() : [],
        igdbSuggestions,
        actionOverrides: {},
        candidates: rebuilt.candidates,
        commitResult: null,
        summary: rebuilt.summary,
        errors: [],
        lastFetchedAt: new Date().toISOString()
      };
      emit();
    } catch (error) {
      state.steamImport = {
        ...state.steamImport,
        loading: false,
        rawResults: [],
        igdbSuggestions: {},
        actionOverrides: {},
        candidates: [],
        summary: createDefaultSteamImportSession().summary,
        errors: [error instanceof Error ? error.message : "Steam library preview failed."]
      };
      emit();
    }
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
    setSteamImportMode,
    setSteamImportStep,
    updateSteamImportSource,
    updateSteamImportRules,
    setSteamImportCandidateAction,
    fetchSteamOwnedLibraryPreview,
    commitSteamOwnedImport,
    resetSteamImportSession,
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
