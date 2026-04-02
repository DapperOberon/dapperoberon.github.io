export function createEntryActions(ctx) {
  const {
    state,
    emit,
    integrations,
    statusDefinitions,
    getEntry,
    getCatalogGame,
    createDefaultAddForm,
    createDetailForm,
    getAddFormValidation,
    createEntryId,
    sortByUpdatedAtDesc,
    normalizeLibraryEntry,
    pruneCatalogToLibrary,
    mergeArtworkIntoCatalogGame,
    mergeMetadataIntoCatalogGame,
    buildEntrySaveFeedback,
    applyMetadataOverridesToGame,
    applyArtworkOverridesToGame,
    recordActivity
  } = ctx;

  function selectEntry(entryId) {
    state.activeEntryId = entryId;
    emit();
  }

  function openEntryDetails(entryId) {
    const entry = getEntry(entryId);
    if (!entry) return;
    state.activeEntryId = entry.entryId;
    state.currentView = "details";
    state.isDetailEditMode = false;
    state.detailForm = createDetailForm(entry);
    emit();
  }

  function openAddModal() {
    state.editingEntryId = null;
    state.addForm = createDefaultAddForm();
    state.addSearchResults = [];
    state.addSearchLoading = false;
    state.addSearchError = "";
    state.addFormFeedback = null;
    state.isAddFormSubmitting = false;
    state.isAddModalOpen = true;
    emit();
  }

  function closeAddModal() {
    state.isAddModalOpen = false;
    state.editingEntryId = null;
    state.addForm = createDefaultAddForm();
    state.addSearchResults = [];
    state.addSearchLoading = false;
    state.addSearchError = "";
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
    if (Object.prototype.hasOwnProperty.call(patch, "searchQuery")) {
      state.addSearchError = "";
    }
    state.addFormFeedback = null;
    emit();
  }

  async function searchAddCatalog(query = state.addForm.searchQuery) {
    const normalizedQuery = String(query ?? "").trim();

    state.addForm = {
      ...state.addForm,
      searchQuery: normalizedQuery
    };

    if (!normalizedQuery) {
      state.addSearchResults = [];
      state.addSearchLoading = false;
      state.addSearchError = "";
      emit();
      return;
    }

    state.addSearchLoading = true;
    state.addSearchError = "";
    emit();

    const results = await integrations.metadataResolver.searchGames({ query: normalizedQuery });
    if (state.addForm.searchQuery !== normalizedQuery) {
      return;
    }

    const baseResults = Array.isArray(results) ? results : [];
    const enrichedResults = await Promise.all(baseResults.map(async (result) => {
      try {
        const artwork = await integrations.steamGrid.resolveArtwork({
          title: result.title,
          storefront: state.addForm.storefront,
          catalogGame: null
        });
        return {
          ...result,
          steamGridCover: artwork?.capsuleArt || "",
          steamGridMeta: artwork?.meta ?? null
        };
      } catch (error) {
        return {
          ...result,
          steamGridCover: "",
          steamGridMeta: {
            resolved: false,
            usedFallback: true,
            reason: "steamgrid_cover_failed"
          }
        };
      }
    }));

    if (state.addForm.searchQuery !== normalizedQuery) {
      return;
    }

    state.addSearchResults = enrichedResults;
    state.addSearchLoading = false;
    state.addSearchError = state.addSearchResults.length ? "" : "No matches found. You can switch to manual entry.";
    emit();
  }

  function backToAddSearch() {
    state.addForm = {
      ...state.addForm,
      step: "search",
      mode: "search"
    };
    emit();
  }

  function beginManualAdd() {
    const fallbackTitle = state.addForm.title.trim() || state.addForm.searchQuery.trim();
    state.addForm = {
      ...state.addForm,
      title: fallbackTitle,
      step: "log",
      mode: "manual",
      selectedSearchResult: null,
      selectedCatalogId: null
    };
    state.addFormFeedback = null;
    emit();
  }

  function selectAddSearchResult(resultId) {
    const selectedResult = state.addSearchResults.find((item) => item.id === resultId);
    if (!selectedResult) return;

    state.addForm = {
      ...state.addForm,
      title: selectedResult.title || state.addForm.title,
      selectedCatalogId: null,
      selectedSearchResult: selectedResult,
      step: "log",
      mode: "search"
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

  async function commitEntry(draft = {}) {
    if (state.isAddFormSubmitting) return;

    const draftRunLabel = typeof draft.runLabel === "string" ? draft.runLabel : state.addForm.runLabel;
    const draftNotes = typeof draft.notes === "string" ? draft.notes : state.addForm.notes;
    const draftPlaytimeHours = typeof draft.playtimeHours === "string" ? draft.playtimeHours : String(state.addForm.playtimeHours ?? "0");
    const draftCompletionPercent = typeof draft.completionPercent === "string" ? draft.completionPercent : String(state.addForm.completionPercent ?? "0");
    const previousRunLabel = state.addForm.runLabel;
    const previousNotes = state.addForm.notes;
    const previousPlaytimeHours = state.addForm.playtimeHours;
    const previousCompletionPercent = state.addForm.completionPercent;
    state.addForm = {
      ...state.addForm,
      runLabel: draftRunLabel,
      notes: draftNotes,
      playtimeHours: draftPlaytimeHours,
      completionPercent: draftCompletionPercent
    };

    const validation = getAddFormValidation();
    if (validation.errors.length) {
      state.addForm = {
        ...state.addForm,
        runLabel: previousRunLabel,
        notes: previousNotes,
        playtimeHours: previousPlaytimeHours,
        completionPercent: previousCompletionPercent
      };
      state.addFormFeedback = {
        tone: "error",
        message: "Fix the required fields before saving this entry."
      };
      emit();
      return;
    }

    const {
      title,
      storefront,
      status,
      runLabel,
      playtimeHours,
      completionPercent
    } = validation.normalized;
    state.isAddFormSubmitting = true;
    state.addFormFeedback = {
      tone: "info",
      message: "Fetching metadata and resolving artwork..."
    };
    emit();

    try {
      const existingEntry = state.editingEntryId ? getEntry(state.editingEntryId) : null;
      const selectedCatalog = state.catalog.find((item) => item.id === state.addForm.selectedCatalogId);
      const selectedSearchResult = state.addForm.selectedSearchResult;
      const catalogSeed = selectedCatalog ?? (selectedSearchResult
        ? {
            id: selectedSearchResult.igdbId
              ? `igdb-${selectedSearchResult.igdbId}`
              : `game-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "manual"}`,
            title: selectedSearchResult.title || title,
            storefront,
            developer: "",
            publisher: "",
            releaseDate: selectedSearchResult.releaseDate || "",
            genres: [],
            platforms: Array.isArray(selectedSearchResult.platforms) ? selectedSearchResult.platforms : [],
            criticSummary: "",
            description: selectedSearchResult.description || "",
            steamGridSlug: "",
            heroArt: "",
            capsuleArt: selectedSearchResult.steamGridCover || selectedSearchResult.coverArt || "",
            screenshots: [],
            lockedFields: []
          }
        : null);
      const metadata = await integrations.metadataResolver.resolveGameMetadata({
        title,
        storefront,
        catalogGame: catalogSeed
      });
      const artwork = await integrations.steamGrid.resolveArtwork({
        title,
        storefront,
        catalogGame: catalogSeed
      });

      const metadataGame = mergeMetadataIntoCatalogGame(catalogSeed, metadata, { title, storefront });
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
        playtimeHours: existingEntry?.playtimeHours ?? playtimeHours,
        completionPercent: existingEntry
          ? (status === "finished" ? Math.max(existingEntry.completionPercent, 100) : existingEntry.completionPercent)
          : (status === "finished" ? 100 : completionPercent),
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
      recordActivity({
        category: "entry",
        action: existingEntry ? "updated" : "added",
        scope: "entry",
        title: entry.title,
        message: existingEntry ? "Entry details were updated." : "Entry was added to the library.",
        tone: saveFeedback.tone
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
      return;
    } catch (error) {
      state.addForm = {
        ...state.addForm,
        runLabel: draftRunLabel,
        notes: draftNotes,
        playtimeHours: draftPlaytimeHours,
        completionPercent: draftCompletionPercent
      };
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
      return;
    }
  }

  function confirmDeleteEntry() {
    const targetEntryId = state.pendingDeleteEntryId;
    if (!targetEntryId) return;
    const removedEntry = getEntry(targetEntryId);

    state.library = state.library.filter((entry) => entry.entryId !== targetEntryId);
    state.catalog = pruneCatalogToLibrary(state.library, state.catalog);

    if (state.editingEntryId === targetEntryId) {
      state.isAddModalOpen = false;
      state.editingEntryId = null;
      state.addForm = createDefaultAddForm();
    }

    if (state.activeEntryId === targetEntryId) {
      const nextActiveEntry = state.library[0] ?? null;
      state.activeEntryId = nextActiveEntry?.entryId ?? null;
      state.detailForm = createDetailForm(nextActiveEntry);
    }

    state.currentView = "dashboard";
    state.uiPreferences.lastView = "dashboard";
    state.pendingDeleteEntryId = null;
    recordActivity({
      category: "entry",
      action: "deleted",
      scope: "entry",
      title: removedEntry?.title ?? "",
      message: removedEntry?.title ? `${removedEntry.title} was removed from the library.` : "Entry was removed from the library.",
      tone: "warning"
    });
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

  function updateEntryStatus(entryId, status) {
    if (!ctx.validStatusIds.has(status)) return;
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
    recordActivity({
      category: "entry",
      action: "status",
      scope: "entry",
      title: existingEntry.title,
      message: `Status changed to ${statusLabel}.`,
      tone: "success"
    });
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

  function toggleDetailEditMode(forceValue) {
    const nextValue = typeof forceValue === "boolean" ? forceValue : !state.isDetailEditMode;
    state.isDetailEditMode = nextValue;
    emit();
  }

  function saveDetailWorkspace(draft = {}) {
    const entry = getEntry();
    if (!entry) return false;
    const game = getCatalogGame(entry.gameId);

    const nextRunLabel = typeof draft.runLabel === "string" && draft.runLabel.trim()
      ? draft.runLabel.trim()
      : (entry.runLabel || "Main Save");
    const nextStorefront = typeof draft.storefront === "string" && ctx.validStorefrontIds.has(draft.storefront)
      ? draft.storefront
      : entry.storefront;

    const updatedEntry = normalizeLibraryEntry({
      ...entry,
      storefront: nextStorefront,
      runLabel: nextRunLabel,
      updatedAt: new Date().toISOString(),
      syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline"
    });

    const nextMetadataGame = draft.metadataOverrides
      ? applyMetadataOverridesToGame(game, draft.metadataOverrides)
      : game;
    const nextArtworkGame = draft.artworkOverrides
      ? applyArtworkOverridesToGame(nextMetadataGame, draft.artworkOverrides)
      : nextMetadataGame;

    state.library = state.library
      .map((item) => (item.entryId === entry.entryId ? updatedEntry : item))
      .sort(sortByUpdatedAtDesc);
    if (nextArtworkGame) {
      state.catalog = state.catalog.map((item) => (
        item.id === nextArtworkGame.id ? nextArtworkGame : item
      ));
    }
    state.catalog = pruneCatalogToLibrary(state.library, state.catalog);
    state.detailForm = createDetailForm(updatedEntry);
    state.isDetailEditMode = false;
    recordActivity({
      category: "entry",
      action: "details",
      scope: "entry",
      title: updatedEntry.title,
      message: "Run details and overrides were saved.",
      tone: "success"
    });
    state.notice = {
      tone: "success",
      message: `${updatedEntry.title} details saved.`
    };
    emit();
    return true;
  }

  function saveDetailNotes(draft = {}) {
    const entry = getEntry();
    if (!entry) return;
    const nextNotes = typeof draft.notes === "string" ? draft.notes : state.detailForm.notes;

    const updatedEntry = normalizeLibraryEntry({
      ...entry,
      notes: nextNotes.trim() || "No notes recorded yet.",
      updatedAt: new Date().toISOString(),
      syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline"
    });

    state.library = state.library
      .map((item) => (item.entryId === entry.entryId ? updatedEntry : item))
      .sort(sortByUpdatedAtDesc);
    state.catalog = pruneCatalogToLibrary(state.library, state.catalog);
    state.detailForm = createDetailForm(updatedEntry);
    recordActivity({
      category: "entry",
      action: "notes",
      scope: "entry",
      title: updatedEntry.title,
      message: "Run notes were updated.",
      tone: "success"
    });
    state.notice = {
      tone: "success",
      message: `${updatedEntry.title} notes saved.`
    };
    emit();
  }

  function saveDetailProgress(draft = {}) {
    const entry = getEntry();
    if (!entry) return;
    const nextStatus = typeof draft.status === "string" ? draft.status : state.detailForm.status;
    const nextPlaytimeValue = draft.playtimeHours ?? state.detailForm.playtimeHours;
    const nextCompletionValue = draft.completionPercent ?? state.detailForm.completionPercent;

    const status = ctx.validStatusIds.has(nextStatus) ? nextStatus : entry.status;
    const parsedPlaytime = Number.parseFloat(nextPlaytimeValue);
    const parsedCompletion = Number.parseFloat(nextCompletionValue);
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
    recordActivity({
      category: "entry",
      action: "progress",
      scope: "entry",
      title: updatedEntry.title,
      message: `Progress saved (${updatedEntry.playtimeHours}h, ${updatedEntry.completionPercent}%).`,
      tone: "success"
    });
    state.notice = {
      tone: "success",
      message: `${updatedEntry.title} progress updated.`
    };
    emit();
  }

  function togglePreference(key) {
    const allowedPreferenceKeys = new Set(["autoBackup", "includeArtwork", "includeNotes", "includeActivityHistory"]);
    if (!allowedPreferenceKeys.has(key)) return;
    state.syncPreferences[key] = !state.syncPreferences[key];
    emit();
  }

  return {
    selectEntry,
    openEntryDetails,
    openAddModal,
    closeAddModal,
    openDeleteConfirm,
    closeDeleteConfirm,
    updateAddForm,
    searchAddCatalog,
    backToAddSearch,
    beginManualAdd,
    selectAddSearchResult,
    selectCatalogSuggestion,
    commitEntry,
    confirmDeleteEntry,
    dismissNotice,
    updateEntryStatus,
    updateDetailForm,
    toggleDetailEditMode,
    saveDetailWorkspace,
    saveDetailNotes,
    saveDetailProgress,
    togglePreference
  };
}
