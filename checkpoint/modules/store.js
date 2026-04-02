import { APP_STATE_SCHEMA_VERSION, normalizePersistedState, pruneCatalogToLibrary } from "./schema.js";
import { normalizeLibraryEntry } from "./normalization.js";
import { getServiceConfig } from "../services/index.js";
import { createEntryActions } from "./store/entry-actions.js";
import { createEnrichmentActions } from "./store/enrichment-actions.js";
import { createBackupActions } from "./store/backup-actions.js";
import { createDriveSyncActions } from "./store/drive-sync-actions.js";

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
    status: entry?.status ?? "playing"
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
    integrations: null
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

const LOCAL_RESTORE_POINT_KEY = "checkpoint.restorePoint";

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

export function createStore({ initialLibrary, catalog, persistence, integrations, statusDefinitions, storefrontDefinitions }) {
  const listeners = new Set();
  const validStatusIds = new Set(statusDefinitions.map((item) => item.id));
  const validStorefrontIds = new Set(storefrontDefinitions.map((item) => item.id));
  let autoBackupTimer = null;
  let queuedAutoBackupSignature = "";
  let lastAutoBackupSignature = "";
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

  const state = {
    currentView: persistedState.uiPreferences.lastView,
    library: hydratedLibrary,
    catalog: persistedState.catalog,
    activeStatus: persistedState.uiPreferences.lastStatusFilter,
    sortMode: persistedState.uiPreferences.librarySort,
    searchTerm: "",
    activeEntryId: hydratedLibrary[0]?.entryId ?? null,
    isAddModalOpen: false,
    editingEntryId: null,
    pendingDeleteEntryId: null,
    addForm: createDefaultAddForm(),
    addSearchResults: [],
    addSearchLoading: false,
    addSearchError: "",
    addFormFeedback: null,
    isAddFormSubmitting: false,
    detailForm: createDetailForm(hydratedLibrary[0] ?? null),
    isDetailEditMode: false,
    importMode: "replace",
    actionState: createActionState(),
    syncHistory: [],
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

  function getPersistedState() {
    return {
      library: state.library,
      catalog: pruneCatalogToLibrary(state.library, state.catalog),
      syncPreferences: state.syncPreferences,
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

  function buildSyncPayload() {
    const syncAt = new Date().toISOString();
    return {
      syncAt,
      state: {
        ...buildExportState(),
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
      syncPreferences: state.syncPreferences,
      uiPreferences: state.uiPreferences
    });
  }

  function buildComparableStateSignature(inputState) {
    const library = Array.isArray(inputState?.library) ? inputState.library : [];
    const catalog = Array.isArray(inputState?.catalog) ? inputState.catalog : [];

    return JSON.stringify({
      library,
      catalog: pruneCatalogToLibrary(library, catalog),
      syncPreferences: inputState?.syncPreferences ?? {},
      uiPreferences: inputState?.uiPreferences ?? {}
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
    if (suppressAutoBackup || !state.syncPreferences.autoBackup || !integrations.googleDrive.isConfigured() || state.syncConflict || getSyncComparisonStatus() === "diverged") {
      return;
    }

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
        mode: "auto"
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
        lastAutoBackupSignature = JSON.stringify(buildExportState());
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
    }, 1200);
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
      const game = getCatalogGame(entry.gameId);
      const haystack = [
        entry.title,
        entry.runLabel,
        entry.storefront,
        entry.notes,
        game?.developer,
        game?.publisher,
        ...(game?.genres ?? [])
      ].join(" ").toLowerCase();
      const matchesTerm = !term || haystack.includes(term);
      return matchesStatus && matchesTerm;
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
        runLabel
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
    state.currentView = view;
    state.uiPreferences.lastView = view;
    if (view !== "dashboard" && !state.activeEntryId && state.library[0]) {
      state.activeEntryId = state.library[0].entryId;
    }
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
    state.activeStatus = status;
    state.uiPreferences.lastStatusFilter = status;
    emit();
  }

  function setSortMode(sortMode) {
    state.sortMode = sortMode;
    state.uiPreferences.librarySort = sortMode;
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

  const enrichmentActions = createEnrichmentActions({
    state,
    emit,
    integrations,
    normalizeTerm,
    setActionState,
    getEntry,
    getCatalogGame
  });

  const entryActions = createEntryActions({
    state,
    emit,
    integrations,
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
    applyArtworkOverridesToGame: enrichmentActions.applyArtworkOverridesToGame
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
      },
      setLastTrackedSyncDataSignature() {
        lastTrackedSyncDataSignature = buildTrackedSyncDataSignature();
      }
    }
  });

  lastTrackedSyncDataSignature = buildTrackedSyncDataSignature();

  return {
    subscribe,
    getSnapshot,
    setView,
    setSearchTerm,
    openLibrarySearch,
    setActiveStatus,
    setSortMode,
    clearLibraryView,
    ...entryActions,
    setImportMode: backupActions.setImportMode,
    exportLibraryBackup: backupActions.exportLibraryBackup,
    importLibraryBackup: backupActions.importLibraryBackup,
    refreshMetadataForEntry: enrichmentActions.refreshMetadataForEntry,
    refreshArtworkForEntry: enrichmentActions.refreshArtworkForEntry,
    refreshLibraryMetadata: enrichmentActions.refreshLibraryMetadata,
    refreshLibraryArtwork: enrichmentActions.refreshLibraryArtwork,
    saveMetadataOverrides: enrichmentActions.saveMetadataOverrides,
    clearMetadataOverrides: enrichmentActions.clearMetadataOverrides,
    saveArtworkOverrides: enrichmentActions.saveArtworkOverrides,
    clearArtworkOverrides: enrichmentActions.clearArtworkOverrides,
    connectGoogleDrive: driveActions.connectGoogleDrive,
    disconnectGoogleDrive: driveActions.disconnectGoogleDrive,
    updateDeviceLabel: driveActions.updateDeviceLabel,
    restoreFromGoogleDrive: driveActions.restoreFromGoogleDrive,
    restoreLocalSafetySnapshot: driveActions.restoreLocalSafetySnapshot,
    markAllSynced: driveActions.markAllSynced,
    keepLocalDuringConflict: driveActions.keepLocalDuringConflict
  };
}
