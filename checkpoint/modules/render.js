import { renderDetailsView } from "./render/details.js";
import { renderDashboardView, renderSidebar, renderTopbar } from "./render/library.js";
import { renderAddModal, renderDeleteConfirmModal, renderGlobalNotice } from "./render/overlays.js";
import { renderSettingsView } from "./render/settings.js";

function captureFocusState(app) {
  const activeElement = document.activeElement;
  if (!activeElement || !app.contains(activeElement) || !activeElement.id) {
    return null;
  }

  return {
    id: activeElement.id,
    selectionStart: typeof activeElement.selectionStart === "number" ? activeElement.selectionStart : null,
    selectionEnd: typeof activeElement.selectionEnd === "number" ? activeElement.selectionEnd : null
  };
}

function restoreFocusState(app, focusState) {
  if (!focusState?.id) return;

  const nextActiveElement = app.querySelector(`#${focusState.id}`);
  if (!nextActiveElement) return;

  nextActiveElement.focus({ preventScroll: true });

  if (
    typeof nextActiveElement.setSelectionRange === "function"
    && typeof focusState.selectionStart === "number"
    && typeof focusState.selectionEnd === "number"
  ) {
    nextActiveElement.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
  }
}

function captureScrollState(app) {
  return Array.from(app.querySelectorAll("[data-scroll-root]")).map((element) => ({
    key: element.dataset.scrollRoot,
    top: element.scrollTop,
    left: element.scrollLeft
  }));
}

function restoreScrollState(app, scrollState) {
  if (!Array.isArray(scrollState) || !scrollState.length) return;

  scrollState.forEach((item) => {
    if (!item?.key) return;
    const nextElement = app.querySelector(`[data-scroll-root="${item.key}"]`);
    if (!nextElement) return;
    nextElement.scrollTop = item.top ?? 0;
    nextElement.scrollLeft = item.left ?? 0;
  });
}

function getFocusableElements(container) {
  if (!container) return [];

  return Array.from(container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter((element) => !element.hasAttribute("hidden"));
}

function trapTabKey(container, event) {
  const focusableElements = getFocusableElements(container);
  if (!focusableElements.length) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function applyOverlayFocus(app, snapshot, previousSnapshot) {
  if (snapshot.isAddModalOpen && !previousSnapshot?.isAddModalOpen) {
    app.querySelector("#add-search-query")?.focus({ preventScroll: true });
    return;
  }

  if (snapshot.pendingDeleteEntryId && !previousSnapshot?.pendingDeleteEntryId) {
    app.querySelector("[data-action='close-delete-confirm']")?.focus({ preventScroll: true });
  }
}

function getDetailDraftValues(app) {
  return {
    notes: app.querySelector("#detail-notes")?.value ?? "",
    playtimeHours: app.querySelector("#detail-playtime")?.value ?? "",
    completionPercent: app.querySelector("#detail-completion")?.value ?? "",
    status: app.querySelector("#detail-status")?.value ?? ""
  };
}

function getAddDraftValues(app) {
  return {
    runLabel: app.querySelector("#add-run-label")?.value ?? "",
    notes: app.querySelector("#add-notes")?.value ?? ""
  };
}

function getDeviceDraftValues(app) {
  return {
    deviceLabel: app.querySelector("#device-label")?.value ?? ""
  };
}

function getOverrideDraftValues(app) {
  return {
    metadata: {
      developer: app.querySelector("#override-developer")?.value ?? "",
      publisher: app.querySelector("#override-publisher")?.value ?? "",
      releaseDate: app.querySelector("#override-release-date")?.value ?? "",
      criticSummary: app.querySelector("#override-critic-summary")?.value ?? "",
      steamGridSlug: app.querySelector("#override-steamgrid-slug")?.value ?? "",
      description: app.querySelector("#override-description")?.value ?? ""
    },
    artwork: {
      heroArt: app.querySelector("#override-hero-art")?.value ?? "",
      capsuleArt: app.querySelector("#override-capsule-art")?.value ?? "",
      screenshots: (app.querySelector("#override-screenshots")?.value ?? "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    }
  };
}

function getDetailWorkspaceDraftValues(app) {
  return {
    runLabel: app.querySelector("#detail-run-label")?.value ?? "",
    storefront: app.querySelector("#detail-storefront")?.value ?? ""
  };
}

export function createAppRenderer({ app, store, statusDefinitions, storefrontDefinitions }) {
  let previousSnapshot = null;
  let isShellMounted = false;
  let areEventsBound = false;
  let searchDebounceTimer = null;
  let addTitleDebounceTimer = null;
  let addSearchDebounceTimer = null;

  function ensureShell() {
    if (isShellMounted) return;

    app.innerHTML = `
      <div id="app-sidebar-root"></div>
      <main class="h-screen flex flex-col overflow-hidden bg-background">
        <div id="app-topbar-root"></div>
        <div id="app-view-root" class="flex-1 min-h-0 flex flex-col overflow-hidden"></div>
      </main>
      <div id="app-notice-root"></div>
      <div id="app-add-modal-root"></div>
      <div id="app-delete-modal-root"></div>
    `;
    isShellMounted = true;
  }

  function bindEvents() {
    if (areEventsBound) return;
    areEventsBound = true;

    app.onkeydown = (event) => {
      const snapshot = store.getSnapshot();
      const target = event.target;

      if (event.key === "Escape") {
        if (snapshot.isAddModalOpen) {
          event.preventDefault();
          store.closeAddModal();
          return;
        }

        if (snapshot.pendingDeleteEntryId) {
          event.preventDefault();
          store.closeDeleteConfirm();
          return;
        }

        if (snapshot.notice) {
          event.preventDefault();
          store.dismissNotice();
        }
      }

      if (event.key === "Tab") {
        if (snapshot.isAddModalOpen) {
          trapTabKey(app.querySelector("[data-modal-root='add-entry']"), event);
          return;
        }

        if (snapshot.pendingDeleteEntryId) {
          trapTabKey(app.querySelector("[data-modal-root='delete-confirm']"), event);
        }
      }

      if (event.key === "Enter" && target instanceof HTMLInputElement) {
        if (target.id === "global-search") {
          globalThis.clearTimeout?.(searchDebounceTimer);
          searchDebounceTimer = null;
          store.openLibrarySearch(target.value);
          return;
        }

        if (target.id === "add-title") {
          globalThis.clearTimeout?.(addTitleDebounceTimer);
          addTitleDebounceTimer = null;
          store.updateAddForm({
            title: target.value,
            selectedCatalogId: null
          });
        }

        if (target.id === "add-search-query") {
          event.preventDefault();
          globalThis.clearTimeout?.(addSearchDebounceTimer);
          addSearchDebounceTimer = null;
          store.searchAddCatalog(target.value);
        }
      }
    };

    app.onclick = async (event) => {
      const actionElement = event.target.closest("[data-action]");
      if (!actionElement || !app.contains(actionElement)) return;

      switch (actionElement.dataset.action) {
        case "set-view":
          store.setView(actionElement.dataset.view);
          break;
        case "filter-status":
          store.setActiveStatus(actionElement.dataset.status);
          break;
        case "clear-library-view":
          store.clearLibraryView();
          break;
        case "select-entry":
          store.openEntryDetails(actionElement.dataset.entryId);
          break;
        case "open-add-modal":
          store.openAddModal();
          break;
        case "toggle-detail-edit-mode":
          store.toggleDetailEditMode(actionElement.dataset.detailEditMode === "true");
          break;
        case "open-delete-confirm":
          store.openDeleteConfirm(actionElement.dataset.entryId);
          break;
        case "close-add-modal":
          globalThis.clearTimeout?.(addSearchDebounceTimer);
          addSearchDebounceTimer = null;
          store.closeAddModal();
          break;
        case "close-delete-confirm":
          store.closeDeleteConfirm();
          break;
        case "dismiss-notice":
          store.dismissNotice();
          break;
        case "pick-form-status":
          store.updateAddForm({ status: actionElement.dataset.status });
          break;
        case "search-add-catalog":
          await store.searchAddCatalog(app.querySelector("#add-search-query")?.value ?? "");
          break;
        case "select-add-search-result":
          globalThis.clearTimeout?.(addSearchDebounceTimer);
          addSearchDebounceTimer = null;
          store.selectAddSearchResult(actionElement.dataset.searchResultId);
          break;
        case "begin-add-manual":
          globalThis.clearTimeout?.(addSearchDebounceTimer);
          addSearchDebounceTimer = null;
          store.beginManualAdd();
          break;
        case "switch-add-manual":
          globalThis.clearTimeout?.(addSearchDebounceTimer);
          addSearchDebounceTimer = null;
          store.beginManualAdd();
          break;
        case "back-add-search":
          globalThis.clearTimeout?.(addSearchDebounceTimer);
          addSearchDebounceTimer = null;
          store.backToAddSearch();
          break;
        case "select-suggestion":
          await store.selectCatalogSuggestion(actionElement.dataset.catalogId);
          break;
        case "toggle-preference":
          store.togglePreference(actionElement.dataset.key);
          break;
        case "mark-all-synced":
          await store.markAllSynced();
          break;
        case "connect-google-drive":
          await store.connectGoogleDrive();
          break;
        case "disconnect-google-drive":
          store.disconnectGoogleDrive();
          break;
        case "keep-local-during-conflict":
          await store.keepLocalDuringConflict();
          break;
        case "restore-google-drive":
          await store.restoreFromGoogleDrive();
          break;
        case "restore-local-snapshot":
          store.restoreLocalSafetySnapshot();
          break;
        case "refresh-library-artwork":
          await store.refreshLibraryArtwork();
          break;
        case "refresh-library-metadata":
          await store.refreshLibraryMetadata();
          break;
        case "refresh-entry-artwork":
          await store.refreshArtworkForEntry(actionElement.dataset.entryId);
          break;
        case "refresh-entry-metadata":
          await store.refreshMetadataForEntry(actionElement.dataset.entryId);
          break;
        case "export-json": {
          const backup = store.exportLibraryBackup();
          if (!backup) break;

          const blob = new Blob([backup.content], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = backup.filename;
          document.body.append(link);
          link.click();
          link.remove();
          URL.revokeObjectURL(url);
          break;
        }
        case "trigger-import-json":
          app.querySelector("#import-json-input")?.click();
          break;
        case "set-import-mode":
          store.setImportMode(actionElement.dataset.importMode);
          break;
        case "commit-entry":
          await store.commitEntry(getAddDraftValues(app));
          break;
        case "confirm-delete-entry":
          store.confirmDeleteEntry();
          break;
        case "save-detail-progress":
          store.saveDetailProgress(getDetailDraftValues(app));
          break;
        case "save-detail-notes":
          store.saveDetailNotes({
            notes: app.querySelector("#detail-notes")?.value ?? ""
          });
          break;
        case "save-detail-workspace":
          {
            const detailDraft = getDetailWorkspaceDraftValues(app);
            const overrideDrafts = getOverrideDraftValues(app);
            store.saveDetailWorkspace({
              ...detailDraft,
              metadataOverrides: overrideDrafts.metadata,
              artworkOverrides: overrideDrafts.artwork
            });
          }
          break;
        case "update-entry-status":
          store.updateEntryStatus(actionElement.dataset.entryId, actionElement.dataset.status);
          break;
        case "save-device-label":
          store.updateDeviceLabel(getDeviceDraftValues(app).deviceLabel);
          break;
        case "save-metadata-overrides":
          store.saveMetadataOverrides(actionElement.dataset.entryId, getOverrideDraftValues(app).metadata);
          break;
        case "clear-metadata-overrides":
          store.clearMetadataOverrides(actionElement.dataset.entryId);
          break;
        case "save-artwork-overrides":
          store.saveArtworkOverrides(actionElement.dataset.entryId, getOverrideDraftValues(app).artwork);
          break;
        case "clear-artwork-overrides":
          store.clearArtworkOverrides(actionElement.dataset.entryId);
          break;
        default:
          break;
      }
    };

    app.oninput = (event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;

      if (target.id === "global-search") {
        const { value } = target;
        globalThis.clearTimeout?.(searchDebounceTimer);
        searchDebounceTimer = globalThis.setTimeout?.(() => {
          globalThis.clearTimeout?.(searchDebounceTimer);
          searchDebounceTimer = null;
          store.openLibrarySearch(value);
        }, 320);
        return;
      }

      if (target.id === "add-title") {
        const { value } = target;
        globalThis.clearTimeout?.(addTitleDebounceTimer);
        addTitleDebounceTimer = globalThis.setTimeout?.(() => {
          globalThis.clearTimeout?.(addTitleDebounceTimer);
          addTitleDebounceTimer = null;
          store.updateAddForm({
            title: value,
            selectedCatalogId: null
          });
        }, 120);
        return;
      }

      if (target.id === "add-search-query") {
        store.updateAddForm({
          searchQuery: target.value
        });
        globalThis.clearTimeout?.(addSearchDebounceTimer);
        addSearchDebounceTimer = globalThis.setTimeout?.(() => {
          globalThis.clearTimeout?.(addSearchDebounceTimer);
          addSearchDebounceTimer = null;
          store.searchAddCatalog(target.value);
        }, 900);
      }
    };

    app.onchange = async (event) => {
      const target = event.target;

      if (target instanceof HTMLSelectElement) {
        if (target.id === "library-status-filter") {
          store.setActiveStatus(target.value);
          return;
        }

        if (target.id === "library-sort" || target.id === "library-sort-state") {
          store.setSortMode(target.value);
          return;
        }

        if (target.id === "add-storefront") {
          store.updateAddForm({ storefront: target.value });
          return;
        }
      }

      if (target instanceof HTMLInputElement && target.id === "global-search") {
        globalThis.clearTimeout?.(searchDebounceTimer);
        searchDebounceTimer = null;
        store.openLibrarySearch(target.value);
        return;
      }

      if (target instanceof HTMLInputElement && target.id === "add-title") {
        globalThis.clearTimeout?.(addTitleDebounceTimer);
        addTitleDebounceTimer = null;
        store.updateAddForm({
          title: target.value,
          selectedCatalogId: null
        });
        return;
      }

      if (target instanceof HTMLInputElement && target.id === "add-search-query") {
        globalThis.clearTimeout?.(addSearchDebounceTimer);
        addSearchDebounceTimer = null;
        store.updateAddForm({
          searchQuery: target.value
        });
        return;
      }

      if (target instanceof HTMLInputElement && target.id === "import-json-input") {
        const file = target.files?.[0];
        if (!file) return;

        const content = await file.text();
        store.importLibraryBackup(content, file.name);
        target.value = "";
      }
    };
  }

  function renderView(snapshot) {
    if (snapshot.currentView === "details") {
      return renderDetailsView(snapshot, storefrontDefinitions, statusDefinitions);
    }
    if (snapshot.currentView === "settings") {
      return renderSettingsView(snapshot);
    }
    return renderDashboardView(snapshot, storefrontDefinitions, statusDefinitions);
  }

  function render() {
    ensureShell();
    const snapshot = store.getSnapshot();
    const focusState = captureFocusState(app);
    const scrollState = captureScrollState(app);
    const sidebarRoot = app.querySelector("#app-sidebar-root");
    const topbarRoot = app.querySelector("#app-topbar-root");
    const viewRoot = app.querySelector("#app-view-root");
    const noticeRoot = app.querySelector("#app-notice-root");
    const addModalRoot = app.querySelector("#app-add-modal-root");
    const deleteModalRoot = app.querySelector("#app-delete-modal-root");

    if (sidebarRoot) {
      sidebarRoot.innerHTML = renderSidebar(snapshot);
    }
    if (topbarRoot) {
      topbarRoot.innerHTML = renderTopbar(snapshot);
    }
    if (viewRoot) {
      viewRoot.innerHTML = renderView(snapshot);
    }
    if (noticeRoot) {
      noticeRoot.innerHTML = renderGlobalNotice(snapshot);
    }
    if (addModalRoot) {
      addModalRoot.innerHTML = renderAddModal(snapshot, statusDefinitions, storefrontDefinitions);
    }
    if (deleteModalRoot) {
      deleteModalRoot.innerHTML = renderDeleteConfirmModal(snapshot, storefrontDefinitions, statusDefinitions);
    }
    bindEvents();
    restoreScrollState(app, scrollState);
    const addModalJustOpened = snapshot.isAddModalOpen && !previousSnapshot?.isAddModalOpen;
    const deleteModalJustOpened = Boolean(snapshot.pendingDeleteEntryId) && !previousSnapshot?.pendingDeleteEntryId;
    if (addModalJustOpened || deleteModalJustOpened) {
      applyOverlayFocus(app, snapshot, previousSnapshot);
    } else {
      restoreFocusState(app, focusState);
    }
    previousSnapshot = snapshot;
  }

  return { render };
}
