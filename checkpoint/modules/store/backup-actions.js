import {
  APP_STATE_SCHEMA_VERSION,
  normalizePersistedState
} from "../schema.js";
import { normalizeCatalogGame, normalizeLibraryEntry } from "../normalization.js";

export function createBackupActions(ctx) {
  const {
    state,
    emit,
    setActionState,
    buildExportState,
    createDefaultAddForm,
    createDetailForm,
    sortByUpdatedAtDesc,
    mergeById,
    pruneCatalogToLibrary
  } = ctx;

  function mergeHistoryById(currentItems, incomingItems, limit) {
    const map = new Map();
    [...(Array.isArray(incomingItems) ? incomingItems : []), ...(Array.isArray(currentItems) ? currentItems : [])]
      .forEach((item) => {
        if (!item || typeof item !== "object" || typeof item.id !== "string") return;
        if (!map.has(item.id)) {
          map.set(item.id, item);
        }
      });
    return Array.from(map.values()).slice(0, limit);
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
    const exportState = {
      schemaVersion: APP_STATE_SCHEMA_VERSION,
      ...buildExportState()
    };
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
    const currentDeviceIdentity = state.deviceIdentity;
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

    if (!ctx.isImportCandidate(parsed)) {
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
    state.activityHistory = state.importMode === "merge"
      ? mergeHistoryById(state.activityHistory, importedState.activityHistory, 24)
      : (Array.isArray(importedState.activityHistory) ? importedState.activityHistory.slice(0, 24) : []);
    state.syncHistory = state.importMode === "merge"
      ? mergeHistoryById(state.syncHistory, importedState.syncHistory, 12)
      : (Array.isArray(importedState.syncHistory) ? importedState.syncHistory.slice(0, 12) : []);
    state.syncMeta = importedState.syncMeta;
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
    state.deviceIdentity = currentDeviceIdentity;
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

  return {
    setImportMode,
    exportLibraryBackup,
    importLibraryBackup
  };
}
