import { APP_STATE_SCHEMA_VERSION, normalizePersistedState, pruneCatalogToLibrary } from "./schema.js";
import { normalizeCatalogGame, normalizeLibraryEntry } from "./normalization.js";
import { getServiceConfig } from "../services/index.js";

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
    selectedCatalogId: null
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
  let suppressAutoBackup = false;
  const persistedState = persistence.load({
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
    addFormFeedback: null,
    isAddFormSubmitting: false,
    detailForm: createDetailForm(hydratedLibrary[0] ?? null),
    importMode: "replace",
    actionState: createActionState(),
    syncHistory: [],
    notice: null,
    syncPreferences: persistedState.syncPreferences,
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
      uiPreferences: state.uiPreferences
    };
  }

  function buildExportState() {
    return {
      schemaVersion: APP_STATE_SCHEMA_VERSION,
      ...getPersistedState()
    };
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
    persistence.save(getPersistedState());
    scheduleAutoBackupIfNeeded();
    listeners.forEach((listener) => listener(getSnapshot()));
  }

  function scheduleAutoBackupIfNeeded() {
    if (suppressAutoBackup || !state.syncPreferences.autoBackup || !integrations.googleDrive.isConfigured()) {
      return;
    }

    const signature = JSON.stringify(buildExportState());
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
    return {
      playing: state.library.filter((entry) => entry.status === "playing"),
      finished: state.library.filter((entry) => entry.status === "finished"),
      archived: state.library.filter((entry) => entry.status === "archived")
    };
  }

  function getDashboardMetrics() {
    const buckets = getStatusBuckets();
    const totalPlaytime = state.library.reduce((sum, entry) => sum + (entry.playtimeHours || 0), 0);
    const averageCompletion = state.library.length
      ? Math.round(state.library.reduce((sum, entry) => sum + (entry.completionPercent || 0), 0) / state.library.length)
      : 0;

    return {
      totalEntries: state.library.length,
      playingCount: buckets.playing.length,
      finishedCount: buckets.finished.length,
      archivedCount: buckets.archived.length,
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
      metadataReady: integrations.metadataResolver.isConfigured()
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

  function setActiveStatus(status) {
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

  function selectEntry(entryId) {
    state.activeEntryId = entryId;
    emit();
  }

  function openEntryDetails(entryId) {
    const entry = getEntry(entryId);
    if (!entry) return;
    state.activeEntryId = entry.entryId;
    state.currentView = "details";
    state.detailForm = createDetailForm(entry);
    emit();
  }

  function openAddModal() {
    state.editingEntryId = null;
    state.addForm = createDefaultAddForm();
    state.addFormFeedback = null;
    state.isAddFormSubmitting = false;
    state.isAddModalOpen = true;
    emit();
  }

  function openEditModal(entryId = state.activeEntryId) {
    const entry = getEntry(entryId);
    if (!entry) return;
    const game = getCatalogGame(entry.gameId);

    state.editingEntryId = entry.entryId;
    state.addForm = {
      title: entry.title,
      storefront: entry.storefront,
      status: entry.status,
      runLabel: entry.runLabel || "Main Save",
      notes: entry.notes || "",
      selectedCatalogId: game?.id ?? null
    };
    state.addFormFeedback = null;
    state.isAddFormSubmitting = false;
    state.isAddModalOpen = true;
    emit();
  }

  function closeAddModal() {
    state.isAddModalOpen = false;
    state.editingEntryId = null;
    state.addForm = createDefaultAddForm();
    state.addFormFeedback = null;
    state.isAddFormSubmitting = false;
    emit();
  }

  function openDeleteConfirm(entryId = state.activeEntryId) {
    const entry = getEntry(entryId);
    if (!entry) return;
    state.pendingDeleteEntryId = entry.entryId;
    emit();
  }

  function closeDeleteConfirm() {
    if (!state.pendingDeleteEntryId) return;
    state.pendingDeleteEntryId = null;
    emit();
  }

  function updateAddForm(patch) {
    state.addForm = {
      ...state.addForm,
      ...patch
    };
    state.addFormFeedback = null;
    emit();
  }

  async function selectCatalogSuggestion(catalogId) {
    const item = state.catalog.find((catalogItem) => catalogItem.id === catalogId);
    if (!item) return;

    state.addForm = {
      ...state.addForm,
      title: item.title,
      storefront: item.storefront,
      runLabel: state.addForm.runLabel || "Main Save",
      selectedCatalogId: catalogId
    };
    emit();
  }

  async function commitEntry() {
    if (state.isAddFormSubmitting) return;

    const validation = getAddFormValidation();
    if (validation.errors.length) {
      state.addFormFeedback = {
        tone: "error",
        message: "Fix the required fields before saving this entry."
      };
      emit();
      return;
    }

    const { title, storefront, status, runLabel } = validation.normalized;
    state.isAddFormSubmitting = true;
    state.addFormFeedback = {
      tone: "info",
      message: "Fetching metadata and resolving artwork..."
    };
    emit();

    try {
      const existingEntry = state.editingEntryId ? getEntry(state.editingEntryId) : null;
      const selectedCatalog = state.catalog.find((item) => item.id === state.addForm.selectedCatalogId);
      const metadata = await integrations.metadataResolver.resolveGameMetadata({
        title,
        storefront,
        catalogGame: selectedCatalog
      });
      const artwork = await integrations.steamGrid.resolveArtwork({
        title,
        storefront,
        catalogGame: selectedCatalog
      });

      const metadataGame = mergeMetadataIntoCatalogGame(selectedCatalog, metadata, { title, storefront });
      const catalogGame = mergeArtworkIntoCatalogGame(metadataGame, artwork);

      const catalogGameExists = state.catalog.some((item) => item.id === catalogGame.id);
      state.catalog = catalogGameExists
        ? state.catalog.map((item) => (item.id === catalogGame.id ? catalogGame : item))
        : [catalogGame, ...state.catalog];

      const now = new Date().toISOString();
      const entry = normalizeLibraryEntry({
        entryId: existingEntry?.entryId ?? createEntryId(),
        gameId: catalogGame.id,
        title: catalogGame.title,
        storefront,
        status,
        runLabel,
        addedAt: existingEntry?.addedAt ?? now,
        updatedAt: now,
        playtimeHours: existingEntry?.playtimeHours ?? 0,
        completionPercent: existingEntry
          ? (status === "finished" ? Math.max(existingEntry.completionPercent, 100) : existingEntry.completionPercent)
          : (status === "finished" ? 100 : 0),
        personalRating: existingEntry?.personalRating ?? null,
        notes: state.addForm.notes.trim() || "Freshly added to Checkpoint. Ready for notes, milestones, and sync metadata.",
        spotlight: existingEntry?.spotlight ?? "New intake",
        syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline"
      });

      state.library = existingEntry
        ? state.library.map((item) => (item.entryId === existingEntry.entryId ? entry : item)).sort(sortByUpdatedAtDesc)
        : [entry, ...state.library].sort(sortByUpdatedAtDesc);
      state.catalog = pruneCatalogToLibrary(state.library, state.catalog);
      state.activeEntryId = entry.entryId;
      state.currentView = "details";
      state.uiPreferences.lastView = "details";
      state.detailForm = createDetailForm(entry);
      const saveFeedback = buildEntrySaveFeedback({
        title: entry.title,
        metadata,
        artwork,
        isEditing: Boolean(existingEntry)
      });
      state.notice = {
        tone: saveFeedback.tone,
        message: saveFeedback.notice
      };
      state.addFormFeedback = {
        tone: saveFeedback.tone,
        message: saveFeedback.form
      };
      closeAddModal();
    } catch (error) {
      state.isAddFormSubmitting = false;
      state.addFormFeedback = {
        tone: "error",
        message: "Checkpoint couldn't save this entry. Try again."
      };
      state.notice = {
        tone: "error",
        message: "Save failed. Your existing library data is unchanged."
      };
      emit();
    }
  }

  function confirmDeleteEntry() {
    const targetEntryId = state.pendingDeleteEntryId;
    if (!targetEntryId) return;

    state.library = state.library.filter((entry) => entry.entryId !== targetEntryId);
    state.catalog = pruneCatalogToLibrary(state.library, state.catalog);

    if (state.editingEntryId === targetEntryId) {
      state.isAddModalOpen = false;
      state.editingEntryId = null;
      state.addForm = {
        title: "",
        storefront: "steam",
        status: "playing",
        runLabel: "Main Save",
        notes: "",
        selectedCatalogId: null
      };
    }

    if (state.activeEntryId === targetEntryId) {
      const nextActiveEntry = state.library[0] ?? null;
      state.activeEntryId = nextActiveEntry?.entryId ?? null;
      state.detailForm = createDetailForm(nextActiveEntry);
    }

    state.currentView = "dashboard";
    state.uiPreferences.lastView = "dashboard";
    state.pendingDeleteEntryId = null;
    state.notice = {
      tone: "success",
      message: "Entry removed from your library."
    };
    emit();
  }

  function dismissNotice() {
    if (!state.notice) return;
    state.notice = null;
    emit();
  }

  function setActionState(key, value) {
    state.actionState = {
      ...state.actionState,
      [key]: value
    };
  }

  function mergeArtworkIntoCatalogGame(game, artwork) {
    return normalizeCatalogGame({
      ...game,
      heroArt: artwork.heroArt || game.heroArt,
      capsuleArt: artwork.capsuleArt || game.capsuleArt,
      screenshots: artwork.screenshots?.length ? artwork.screenshots : game.screenshots
    });
  }

  function mergeMetadataIntoCatalogGame(game, metadata, entryLike = {}) {
    const baseGame = game ?? {
      id: `custom-${normalizeTerm(entryLike.title ?? "").replace(/\s+/g, "-")}`,
      title: entryLike.title ?? "",
      storefront: entryLike.storefront ?? "steam"
    };

    return normalizeCatalogGame({
      ...baseGame,
      title: entryLike.title ?? baseGame.title,
      storefront: entryLike.storefront ?? baseGame.storefront,
      developer: metadata.developer || baseGame.developer,
      publisher: metadata.publisher || baseGame.publisher,
      releaseDate: metadata.releaseDate || baseGame.releaseDate,
      genres: metadata.genres?.length ? metadata.genres : (baseGame.genres ?? []),
      platforms: metadata.platforms?.length ? metadata.platforms : (baseGame.platforms ?? []),
      criticSummary: metadata.criticSummary || baseGame.criticSummary,
      description: metadata.description || baseGame.description,
      steamGridSlug: metadata.steamGridSlug || baseGame.steamGridSlug
    });
  }

  function didArtworkChange(previousGame, nextGame) {
    return (
      (nextGame?.heroArt ?? "") !== (previousGame?.heroArt ?? "")
      || (nextGame?.capsuleArt ?? "") !== (previousGame?.capsuleArt ?? "")
      || JSON.stringify(nextGame?.screenshots ?? []) !== JSON.stringify(previousGame?.screenshots ?? [])
    );
  }

  function didMetadataChange(previousGame, nextGame) {
    return (
      (nextGame?.developer ?? "") !== (previousGame?.developer ?? "")
      || (nextGame?.publisher ?? "") !== (previousGame?.publisher ?? "")
      || (nextGame?.releaseDate ?? "") !== (previousGame?.releaseDate ?? "")
      || JSON.stringify(nextGame?.genres ?? []) !== JSON.stringify(previousGame?.genres ?? [])
      || JSON.stringify(nextGame?.platforms ?? []) !== JSON.stringify(previousGame?.platforms ?? [])
      || (nextGame?.criticSummary ?? "") !== (previousGame?.criticSummary ?? "")
      || (nextGame?.description ?? "") !== (previousGame?.description ?? "")
      || (nextGame?.steamGridSlug ?? "") !== (previousGame?.steamGridSlug ?? "")
    );
  }

  function getArtworkRefreshMessage(entryTitle, artwork, changed) {
    if (changed) {
      return {
        tone: "success",
        actionMessage: `${entryTitle} artwork refreshed.`,
        noticeMessage: `${entryTitle} artwork updated.`
      };
    }

    const reason = artwork?.meta?.reason;
    if (reason === "missing_worker_url") {
      return {
        tone: "error",
        actionMessage: "Add the deployed Cloudflare Worker URL in checkpoint/config.js before refreshing artwork.",
        noticeMessage: "A SteamGrid proxy URL is required to refresh artwork."
      };
    }
    if (reason === "no_match") {
      return {
        tone: "info",
        actionMessage: `No SteamGridDB match was found for ${entryTitle}. Existing artwork was kept.`,
        noticeMessage: `${entryTitle} had no SteamGridDB match, so the current artwork stayed in place.`
      };
    }
    if (reason === "worker_request_failed") {
      return {
        tone: "error",
        actionMessage: `Checkpoint couldn't reach the SteamGrid proxy for ${entryTitle}. Existing artwork was kept.`,
        noticeMessage: `${entryTitle} artwork could not be refreshed because the SteamGrid proxy request failed.`
      };
    }

    return {
      tone: "info",
      actionMessage: `No new artwork was applied for ${entryTitle}.`,
      noticeMessage: `${entryTitle} artwork was unchanged.`
    };
  }

  function getMetadataRefreshMessage(entryTitle, metadata, changed) {
    if (changed) {
      return {
        tone: "success",
        actionMessage: `${entryTitle} metadata refreshed.`,
        noticeMessage: `${entryTitle} metadata updated.`
      };
    }

    const reason = metadata?.meta?.reason;
    if (reason === "missing_worker_url") {
      return {
        tone: "error",
        actionMessage: "Add the deployed Cloudflare Worker URL in checkpoint/config.js before refreshing metadata.",
        noticeMessage: "A metadata proxy URL is required to refresh metadata."
      };
    }
    if (reason === "no_match") {
      return {
        tone: "info",
        actionMessage: `No IGDB match was found for ${entryTitle}. Existing metadata was kept.`,
        noticeMessage: `${entryTitle} had no IGDB match, so the current metadata stayed in place.`
      };
    }
    if (reason === "worker_request_failed") {
      return {
        tone: "error",
        actionMessage: `Checkpoint couldn't reach the metadata proxy for ${entryTitle}. Existing metadata was kept.`,
        noticeMessage: `${entryTitle} metadata could not be refreshed because the metadata proxy request failed.`
      };
    }

    return {
      tone: "info",
      actionMessage: `No new metadata was applied for ${entryTitle}.`,
      noticeMessage: `${entryTitle} metadata was unchanged.`
    };
  }

  function buildEntrySaveFeedback({ title, metadata, artwork, isEditing }) {
    const metadataResolved = Boolean(metadata?.meta?.resolved);
    const artworkResolved = Boolean(artwork?.meta?.resolved);

    if (metadataResolved && artworkResolved) {
      return {
        tone: "success",
        notice: isEditing
          ? `${title} was updated with live metadata and artwork.`
          : `${title} was added with live metadata and artwork.`,
        form: "Metadata and artwork resolved successfully."
      };
    }

    if (metadataResolved || artworkResolved) {
      return {
        tone: "info",
        notice: isEditing
          ? `${title} was updated with partial enrichment.`
          : `${title} was added with partial enrichment.`,
        form: metadataResolved
          ? "Metadata resolved, but artwork stayed on the current asset set."
          : "Artwork resolved, but metadata stayed on the current values."
      };
    }

    return {
      tone: "info",
      notice: isEditing
        ? `${title} was updated as a manual or fallback entry.`
        : `${title} was added as a manual or fallback entry.`,
      form: "Saved without live metadata or artwork. You can refresh enrichment later."
    };
  }

  async function refreshArtworkForEntry(entryId = state.activeEntryId) {
    const entry = getEntry(entryId);
    if (!entry) return false;

    const game = getCatalogGame(entry.gameId);
    setActionState("artwork", {
      tone: "info",
      message: `Refreshing artwork for ${entry.title}...`
    });
    emit();

    try {
      const artwork = await integrations.steamGrid.resolveArtwork({
        title: entry.title,
        storefront: entry.storefront,
        catalogGame: game
      });
      const nextGame = mergeArtworkIntoCatalogGame(game, artwork);
      const changed = didArtworkChange(game, nextGame);

      state.catalog = state.catalog.map((item) => (
        item.id === entry.gameId ? nextGame : item
      ));
      const refreshMessage = getArtworkRefreshMessage(entry.title, artwork, changed);
      setActionState("artwork", {
        tone: refreshMessage.tone,
        message: refreshMessage.actionMessage
      });
      state.notice = {
        tone: refreshMessage.tone,
        message: refreshMessage.noticeMessage
      };
      emit();
      return changed;
    } catch (error) {
      setActionState("artwork", {
        tone: "error",
        message: `Checkpoint couldn't refresh artwork for ${entry.title}.`
      });
      state.notice = {
        tone: "error",
        message: `${entry.title} artwork refresh failed.`
      };
      emit();
      return false;
    }
  }

  async function refreshMetadataForEntry(entryId = state.activeEntryId) {
    const entry = getEntry(entryId);
    if (!entry) return false;

    const game = getCatalogGame(entry.gameId);
    setActionState("metadata", {
      tone: "info",
      message: `Refreshing metadata for ${entry.title}...`
    });
    emit();

    try {
      const metadata = await integrations.metadataResolver.resolveGameMetadata({
        title: entry.title,
        storefront: entry.storefront,
        catalogGame: game
      });
      const nextGame = mergeMetadataIntoCatalogGame(game, metadata, {
        title: entry.title,
        storefront: entry.storefront
      });
      const changed = didMetadataChange(game, nextGame);

      state.catalog = state.catalog.map((item) => (
        item.id === entry.gameId ? nextGame : item
      ));
      const refreshMessage = getMetadataRefreshMessage(entry.title, metadata, changed);
      setActionState("metadata", {
        tone: refreshMessage.tone,
        message: refreshMessage.actionMessage
      });
      state.notice = {
        tone: refreshMessage.tone,
        message: refreshMessage.noticeMessage
      };
      emit();
      return changed;
    } catch (error) {
      setActionState("metadata", {
        tone: "error",
        message: `Checkpoint couldn't refresh metadata for ${entry.title}.`
      });
      state.notice = {
        tone: "error",
        message: `${entry.title} metadata refresh failed.`
      };
      emit();
      return false;
    }
  }

  async function refreshLibraryArtwork() {
    const referencedGames = state.catalog.filter((game) => state.library.some((entry) => entry.gameId === game.id));

    if (!referencedGames.length) {
      setActionState("artwork", {
        tone: "info",
        message: "No tracked games are available for artwork refresh."
      });
      emit();
      return false;
    }

    setActionState("artwork", {
      tone: "info",
      message: `Refreshing artwork for ${referencedGames.length} ${referencedGames.length === 1 ? "game" : "games"}...`
    });
    emit();

    let refreshedCount = 0;

    for (const game of referencedGames) {
      const linkedEntry = state.library.find((entry) => entry.gameId === game.id);
      if (!linkedEntry) continue;

      try {
        const artwork = await integrations.steamGrid.resolveArtwork({
          title: linkedEntry.title,
          storefront: linkedEntry.storefront,
          catalogGame: game
        });

        const nextGame = mergeArtworkIntoCatalogGame(game, artwork);
        const artworkChanged = didArtworkChange(game, nextGame);

        state.catalog = state.catalog.map((item) => (item.id === game.id ? nextGame : item));
        if (artworkChanged) {
          refreshedCount += 1;
        }
      } catch (error) {
        // Keep best-effort refresh behavior for the rest of the library.
      }
    }

    setActionState("artwork", {
      tone: refreshedCount > 0 ? "success" : "info",
      message: refreshedCount > 0
        ? `Artwork refreshed for ${refreshedCount} ${refreshedCount === 1 ? "game" : "games"}.`
        : "Artwork refresh finished with no new assets found."
    });
    state.notice = {
      tone: refreshedCount > 0 ? "success" : "info",
      message: refreshedCount > 0
        ? `Checkpoint refreshed artwork for ${refreshedCount} ${refreshedCount === 1 ? "title" : "titles"}.`
        : "Artwork refresh finished. Existing artwork was retained."
    };
    emit();
    return true;
  }

  async function refreshLibraryMetadata() {
    const referencedGames = state.catalog.filter((game) => state.library.some((entry) => entry.gameId === game.id));

    if (!referencedGames.length) {
      setActionState("metadata", {
        tone: "info",
        message: "No tracked games are available for metadata refresh."
      });
      emit();
      return false;
    }

    setActionState("metadata", {
      tone: "info",
      message: `Refreshing metadata for ${referencedGames.length} ${referencedGames.length === 1 ? "game" : "games"}...`
    });
    emit();

    let refreshedCount = 0;

    for (const game of referencedGames) {
      const linkedEntry = state.library.find((entry) => entry.gameId === game.id);
      if (!linkedEntry) continue;

      try {
        const metadata = await integrations.metadataResolver.resolveGameMetadata({
          title: linkedEntry.title,
          storefront: linkedEntry.storefront,
          catalogGame: game
        });

        const nextGame = mergeMetadataIntoCatalogGame(game, metadata, {
          title: linkedEntry.title,
          storefront: linkedEntry.storefront
        });
        const metadataChanged = didMetadataChange(game, nextGame);

        state.catalog = state.catalog.map((item) => (item.id === game.id ? nextGame : item));
        if (metadataChanged) {
          refreshedCount += 1;
        }
      } catch (error) {
        // Keep best-effort refresh behavior for the rest of the library.
      }
    }

    setActionState("metadata", {
      tone: refreshedCount > 0 ? "success" : "info",
      message: refreshedCount > 0
        ? `Metadata refreshed for ${refreshedCount} ${refreshedCount === 1 ? "game" : "games"}.`
        : "Metadata refresh finished with no new values found."
    });
    state.notice = {
      tone: refreshedCount > 0 ? "success" : "info",
      message: refreshedCount > 0
        ? `Checkpoint refreshed metadata for ${refreshedCount} ${refreshedCount === 1 ? "title" : "titles"}.`
        : "Metadata refresh finished. Existing metadata was retained."
    };
    emit();
    return true;
  }

  function setImportMode(mode) {
    state.importMode = mode === "merge" ? "merge" : "replace";
    emit();
  }

  function exportLibraryBackup() {
    setActionState("backup", {
      tone: "info",
      message: "Preparing JSON backup..."
    });
    const exportState = buildExportState();
    const stamp = new Date().toISOString().slice(0, 10);
    setActionState("backup", {
      tone: "success",
      message: "Backup ready for download."
    });
    state.notice = {
      tone: "success",
      message: "Checkpoint backup exported."
    };
    emit();
    return {
      filename: `checkpoint-backup-${stamp}.json`,
      content: JSON.stringify(exportState, null, 2)
    };
  }

  function importLibraryBackup(rawContent, sourceName = "backup") {
    setActionState("backup", {
      tone: "info",
      message: `Validating ${sourceName}...`
    });
    let parsed;

    try {
      parsed = JSON.parse(rawContent);
    } catch (error) {
      setActionState("backup", {
        tone: "error",
        message: `${sourceName} is not valid JSON.`
      });
      state.notice = {
        tone: "error",
        message: `${sourceName} is not valid JSON.`
      };
      emit();
      return false;
    }

    if (!isImportCandidate(parsed)) {
      setActionState("backup", {
        tone: "error",
        message: `${sourceName} does not contain a valid Checkpoint backup.`
      });
      state.notice = {
        tone: "error",
        message: `${sourceName} does not contain a valid Checkpoint backup.`
      };
      emit();
      return false;
    }

    const importedState = normalizePersistedState(parsed, {
      initialLibrary: [],
      initialCatalog: []
    });

    const nextLibrary = state.importMode === "merge"
      ? mergeById(state.library, importedState.library, (entry) => entry.entryId, normalizeLibraryEntry).sort(sortByUpdatedAtDesc)
      : importedState.library.slice().sort(sortByUpdatedAtDesc);
    const mergedCatalog = state.importMode === "merge"
      ? mergeById(state.catalog, importedState.catalog, (game) => game.id, normalizeCatalogGame)
      : importedState.catalog;

    state.library = nextLibrary;
    state.catalog = pruneCatalogToLibrary(state.library, mergedCatalog);
    state.syncPreferences = state.importMode === "merge" ? state.syncPreferences : importedState.syncPreferences;
    state.uiPreferences = state.importMode === "merge"
      ? state.uiPreferences
      : {
          ...importedState.uiPreferences,
          lastView: "dashboard"
        };
    state.currentView = "dashboard";
    state.activeStatus = state.importMode === "merge" ? state.activeStatus : importedState.uiPreferences.lastStatusFilter;
    state.sortMode = state.importMode === "merge" ? state.sortMode : importedState.uiPreferences.librarySort;
    state.searchTerm = "";
    state.activeEntryId = state.library[0]?.entryId ?? null;
    state.detailForm = createDetailForm(state.library[0] ?? null);
    state.isAddModalOpen = false;
    state.editingEntryId = null;
    state.pendingDeleteEntryId = null;
    state.addForm = createDefaultAddForm();
    state.addFormFeedback = null;
    state.isAddFormSubmitting = false;
    state.notice = {
      tone: "success",
      message: `${state.importMode === "merge" ? "Merged" : "Imported"} ${importedState.library.length} ${importedState.library.length === 1 ? "entry" : "entries"} from ${sourceName}.`
    };
    setActionState("backup", {
      tone: "success",
      message: `${state.importMode === "merge" ? "Merge" : "Import"} complete. ${state.library.length} total entries now tracked.`
    });
    emit();
    return true;
  }

  function updateEntryStatus(entryId, status) {
    if (!validStatusIds.has(status)) return;
    const existingEntry = getEntry(entryId);
    if (!existingEntry) return;

    state.library = state.library.map((entry) => (
      entry.entryId === entryId
        ? {
            ...normalizeLibraryEntry({
              ...entry,
              status,
              completionPercent: status === "finished" ? 100 : entry.completionPercent,
              updatedAt: new Date().toISOString(),
              syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline"
            })
          }
        : entry
    ));
    state.catalog = pruneCatalogToLibrary(state.library, state.catalog);

    if (state.activeEntryId === entryId) {
      const updatedEntry = getEntry(entryId);
      state.detailForm = createDetailForm(updatedEntry);
    }

    const statusLabel = statusDefinitions.find((item) => item.id === status)?.label ?? status;
    state.notice = {
      tone: "success",
      message: `${existingEntry.title} moved to ${statusLabel.toLowerCase()}.`
    };
    emit();
  }

  function updateDetailForm(patch) {
    state.detailForm = {
      ...state.detailForm,
      ...patch
    };
    emit();
  }

  function saveDetailNotes() {
    const entry = getEntry();
    if (!entry) return;

    const updatedEntry = normalizeLibraryEntry({
      ...entry,
      notes: state.detailForm.notes.trim() || "No notes recorded yet.",
      updatedAt: new Date().toISOString(),
      syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline"
    });

    state.library = state.library
      .map((item) => (item.entryId === entry.entryId ? updatedEntry : item))
      .sort(sortByUpdatedAtDesc);
    state.catalog = pruneCatalogToLibrary(state.library, state.catalog);
    state.detailForm = createDetailForm(updatedEntry);
    state.notice = {
      tone: "success",
      message: `${updatedEntry.title} notes saved.`
    };
    emit();
  }

  function saveDetailProgress() {
    const entry = getEntry();
    if (!entry) return;

    const status = validStatusIds.has(state.detailForm.status) ? state.detailForm.status : entry.status;
    const parsedPlaytime = Number.parseFloat(state.detailForm.playtimeHours);
    const parsedCompletion = Number.parseFloat(state.detailForm.completionPercent);
    const playtimeHours = Number.isFinite(parsedPlaytime) ? Math.max(0, parsedPlaytime) : entry.playtimeHours;
    const nextCompletion = Number.isFinite(parsedCompletion)
      ? Math.min(100, Math.max(0, Math.round(parsedCompletion)))
      : entry.completionPercent;

    const updatedEntry = normalizeLibraryEntry({
      ...entry,
      status,
      playtimeHours,
      completionPercent: status === "finished" ? 100 : nextCompletion,
      updatedAt: new Date().toISOString(),
      syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline"
    });

    state.library = state.library
      .map((item) => (item.entryId === entry.entryId ? updatedEntry : item))
      .sort(sortByUpdatedAtDesc);
    state.catalog = pruneCatalogToLibrary(state.library, state.catalog);
    state.detailForm = createDetailForm(updatedEntry);
    state.notice = {
      tone: "success",
      message: `${updatedEntry.title} progress updated.`
    };
    emit();
  }

  function togglePreference(key) {
    state.syncPreferences[key] = !state.syncPreferences[key];
    emit();
  }

  async function connectGoogleDrive() {
    setActionState("sync", {
      tone: "info",
      message: "Connecting to Google Drive..."
    });
    emit();

    const result = await integrations.googleDrive.connect();
    setActionState("sync", {
      tone: result.ok ? "success" : "error",
      message: result.message
    });
    state.notice = {
      tone: result.ok ? "success" : "error",
      message: result.message
    };
    emit();
  }

  function disconnectGoogleDrive() {
    const result = integrations.googleDrive.disconnect();
    globalThis.clearTimeout?.(autoBackupTimer);
    queuedAutoBackupSignature = "";
    state.library = state.library.map((entry) => ({
      ...entry,
      syncState: "offline"
    }));
    setActionState("sync", {
      tone: result.ok ? "success" : "error",
      message: result.message
    });
    state.notice = {
      tone: result.ok ? "success" : "error",
      message: result.message
    };
    emit();
  }

  function saveLocalRestorePoint(source) {
    const payload = {
      timestamp: new Date().toISOString(),
      source,
      content: JSON.stringify(buildExportState(), null, 2)
    };
    const saved = writeLocalRestorePoint(payload);
    if (saved) {
      state.restorePointMeta = {
        timestamp: payload.timestamp,
        source: payload.source
      };
    }
    return saved;
  }

  function restoreLocalSafetySnapshot() {
    const restorePoint = readLocalRestorePoint();
    if (!restorePoint?.content) {
      setActionState("backup", {
        tone: "error",
        message: "No local restore safety snapshot is available."
      });
      state.notice = {
        tone: "error",
        message: "No local restore safety snapshot is available."
      };
      emit();
      return false;
    }

    const restored = importLibraryBackup(restorePoint.content, "local restore snapshot");
    if (restored) {
      setActionState("backup", {
        tone: "success",
        message: "Local restore safety snapshot applied."
      });
    }
    return restored;
  }

  async function restoreFromGoogleDrive() {
    setActionState("sync", {
      tone: "info",
      message: "Fetching Checkpoint backup from Google Drive..."
    });
    emit();

    try {
      const backup = await integrations.googleDrive.restoreAppState();
      saveLocalRestorePoint("before Google Drive restore");
      const imported = importLibraryBackup(backup.content, "Google Drive backup");
      if (!imported) {
        setActionState("sync", {
          tone: "error",
          message: "Drive backup was found, but it could not be restored."
        });
        emit();
        return false;
      }

      setActionState("sync", {
        tone: "success",
        message: "Google Drive backup restored into local Checkpoint state. A local safety snapshot was saved first."
      });
      emit();
      return true;
    } catch (error) {
      setActionState("sync", {
        tone: "error",
        message: error instanceof Error ? error.message : "Google Drive restore failed."
      });
      state.notice = {
        tone: "error",
        message: error instanceof Error ? error.message : "Google Drive restore failed."
      };
      emit();
      return false;
    }
  }

  async function markAllSynced() {
    setActionState("sync", {
      tone: "info",
      message: integrations.googleDrive.isConfigured()
        ? "Syncing library to Google Drive..."
        : "Connect Google Drive before syncing."
    });
    if (!integrations.googleDrive.isConfigured()) {
      state.notice = {
        tone: "error",
        message: "Google Drive must be connected before sync can run."
      };
      emit();
      return;
    }
    emit();

    let syncResult;
    try {
      syncResult = await integrations.googleDrive.syncAppState({
        state: buildExportState(),
        mode: "manual"
      });
    } catch (error) {
      setActionState("sync", {
        tone: "error",
        message: "Sync failed before completion."
      });
      state.syncHistory = [
        createSyncHistoryEntry({
          ok: false,
          mode: "manual",
          message: "Sync failed before completion."
        }),
        ...state.syncHistory
      ].slice(0, 6);
      state.notice = {
        tone: "error",
        message: "Checkpoint could not complete the sync."
      };
      emit();
      return;
    }

    state.library = state.library.map((entry) => ({
      ...entry,
      syncState: integrations.googleDrive.isConfigured() ? "ready" : "offline",
      updatedAt: entry.updatedAt
    }));
    lastAutoBackupSignature = JSON.stringify(buildExportState());
    queuedAutoBackupSignature = "";
    setActionState("sync", {
      tone: syncResult?.ok === false ? "error" : "success",
      message: syncResult?.message ?? "Sync complete."
    });
    state.syncHistory = [
      createSyncHistoryEntry({
        ok: syncResult?.ok !== false,
        mode: syncResult?.mode ?? "manual",
        message: syncResult?.message ?? "Sync complete."
      }),
      ...state.syncHistory
    ].slice(0, 6);
    state.notice = {
      tone: syncResult?.ok === false ? "error" : "success",
      message: syncResult?.message ?? "Checkpoint sync finished."
    };
    emit();
  }

  return {
    subscribe,
    getSnapshot,
    setView,
    setSearchTerm,
    setActiveStatus,
    setSortMode,
    clearLibraryView,
    selectEntry,
    openEntryDetails,
    openAddModal,
    openEditModal,
    closeAddModal,
    openDeleteConfirm,
    closeDeleteConfirm,
    updateAddForm,
    selectCatalogSuggestion,
    commitEntry,
    confirmDeleteEntry,
    dismissNotice,
    setImportMode,
    exportLibraryBackup,
    importLibraryBackup,
    updateEntryStatus,
    updateDetailForm,
    saveDetailNotes,
    saveDetailProgress,
    refreshMetadataForEntry,
    refreshArtworkForEntry,
    refreshLibraryMetadata,
    refreshLibraryArtwork,
    togglePreference,
    connectGoogleDrive,
    disconnectGoogleDrive,
    restoreFromGoogleDrive,
    restoreLocalSafetySnapshot,
    markAllSynced
  };
}
