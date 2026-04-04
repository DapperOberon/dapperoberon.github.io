import { renderDetailsView } from "./render/details.js";
import { renderDashboardView, renderSidebar, renderTopbar } from "./render/library.js";
import { renderAddModal, renderDeleteConfirmModal, renderGlobalNotice, renderMediaLightbox } from "./render/overlays.js";
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
  const legacyRoots = Array.from(app.querySelectorAll("[data-scroll-root]"));
  if (!legacyRoots.length) {
    return [{
      key: "__document__",
      top: globalThis.scrollY ?? 0,
      left: globalThis.scrollX ?? 0
    }];
  }

  return legacyRoots.map((element) => ({
    key: element.dataset.scrollRoot,
    top: element.scrollTop,
    left: element.scrollLeft
  }));
}

function restoreScrollState(app, scrollState) {
  if (!Array.isArray(scrollState) || !scrollState.length) return;

  const documentState = scrollState.find((item) => item?.key === "__document__");
  if (documentState) {
    globalThis.scrollTo?.(documentState.left ?? 0, documentState.top ?? 0);
    return;
  }

  scrollState.forEach((item) => {
    if (!item?.key) return;
    const nextElement = app.querySelector(`[data-scroll-root="${item.key}"]`);
    if (!nextElement) return;
    nextElement.scrollTop = item.top ?? 0;
    nextElement.scrollLeft = item.left ?? 0;
  });
}

function getDetailContextKey(snapshot) {
  if (!snapshot || typeof snapshot !== "object") return "";

  if (snapshot.currentView === "details") {
    const surface = String(snapshot.uiPreferences?.lastView || "library");
    const entryId = String(snapshot.activeEntryId || "");
    return `details:${surface}:${entryId}`;
  }

  if (snapshot.currentView === "discover") {
    const selectedId = String(
      snapshot.addForm?.selectedSearchResult?.igdbId
      || snapshot.addForm?.selectedSearchResult?.id
      || ""
    ).trim();
    if (selectedId) return `discover:${selectedId}`;
  }

  return "";
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

function enforceModalFocus(app, modalSelector, fallbackSelector) {
  const modalRoot = app.querySelector(modalSelector);
  if (!modalRoot) return;

  const activeElement = document.activeElement;
  if (activeElement && modalRoot.contains(activeElement)) return;

  const fallbackTarget = app.querySelector(fallbackSelector) || getFocusableElements(modalRoot)[0];
  fallbackTarget?.focus?.({ preventScroll: true });
}

function getDiscoverScreenshotCarousel(app) {
  return app.querySelector("#discover-screenshot-carousel");
}

function getDiscoverScreenshotThumbButtons(app) {
  return Array.from(app.querySelectorAll("[data-action='discover-screenshot-jump']"));
}

function getDiscoverScreenshotCurrentIndex(app) {
  const carousel = getDiscoverScreenshotCarousel(app);
  if (!carousel) return 0;
  const raw = Number(carousel.dataset.screenshotIndex || 0);
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

function setDiscoverScreenshotIndex(app, index) {
  const carousel = getDiscoverScreenshotCarousel(app);
  const image = app.querySelector("#discover-screenshot-image");
  const thumbs = getDiscoverScreenshotThumbButtons(app);
  if (!carousel || !image || !thumbs.length) return;

  const clamped = Math.max(0, Math.min(index, thumbs.length - 1));
  const targetThumb = thumbs[clamped];
  const nextSrc = String(targetThumb.dataset.screenshotUrl || "");
  const nextAlt = String(targetThumb.dataset.screenshotAlt || "Screenshot");

  carousel.dataset.screenshotIndex = String(clamped);
  if (nextSrc) image.src = nextSrc;
  image.alt = nextAlt;
  queueDiscoverScreenshotUiUpdate(app);
}

function stepDiscoverScreenshot(app, direction) {
  const currentIndex = getDiscoverScreenshotCurrentIndex(app);
  const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
  setDiscoverScreenshotIndex(app, nextIndex);
}

function updateDiscoverScreenshotUi(app) {
  const carousel = getDiscoverScreenshotCarousel(app);
  const thumbs = getDiscoverScreenshotThumbButtons(app);
  const counter = app.querySelector("[data-discover-screenshot-counter]");
  const prevButton = app.querySelector("[data-action='discover-screenshot-prev']");
  const nextButton = app.querySelector("[data-action='discover-screenshot-next']");

  if (!carousel || !thumbs.length) {
    if (counter) counter.textContent = "";
    if (prevButton) prevButton.disabled = true;
    if (nextButton) nextButton.disabled = true;
    thumbs.forEach((button) => {
      button.classList.remove("is-active");
      button.setAttribute("aria-pressed", "false");
    });
    return;
  }

  const total = thumbs.length;
  const currentIndex = Math.max(0, Math.min(getDiscoverScreenshotCurrentIndex(app), total - 1));
  carousel.dataset.screenshotIndex = String(currentIndex);

  if (counter) {
    counter.textContent = `${currentIndex + 1} / ${total}`;
  }
  if (prevButton) {
    prevButton.disabled = currentIndex <= 0;
  }
  if (nextButton) {
    nextButton.disabled = currentIndex >= total - 1;
  }

  thumbs.forEach((button, index) => {
    const isActive = index === currentIndex;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function queueDiscoverScreenshotUiUpdate(app) {
  globalThis.setTimeout?.(() => {
    updateDiscoverScreenshotUi(app);
  }, 220);
}

function getDiscoverVideoCarousel(app) {
  return app.querySelector("#discover-video-carousel");
}

function getDiscoverVideoThumbButtons(app) {
  return Array.from(app.querySelectorAll("[data-action='discover-video-jump']"));
}

function getDiscoverVideoCurrentIndex(app) {
  const carousel = getDiscoverVideoCarousel(app);
  if (!carousel) return 0;
  const raw = Number(carousel.dataset.videoIndex || 0);
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

function buildDiscoverVideoFrame(frameRoot, { embedUrl, url, title }) {
  if (!frameRoot) return;
  frameRoot.innerHTML = "";

  if (embedUrl) {
    const iframe = document.createElement("iframe");
    iframe.className = "w-full h-full";
    iframe.src = embedUrl;
    iframe.title = title || "Video";
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.allowFullscreen = true;
    frameRoot.append(iframe);
    return;
  }

  const link = document.createElement("a");
  link.className = "w-full h-full flex items-center justify-center text-sm text-zinc-300 underline";
  link.href = url || "";
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Open video";
  frameRoot.append(link);
}

function setDiscoverVideoIndex(app, index) {
  const carousel = getDiscoverVideoCarousel(app);
  const frame = app.querySelector("#discover-video-frame");
  const thumbs = getDiscoverVideoThumbButtons(app);
  if (!carousel || !frame || !thumbs.length) return;

  const clamped = Math.max(0, Math.min(index, thumbs.length - 1));
  const targetThumb = thumbs[clamped];
  const embedUrl = String(targetThumb.dataset.videoEmbedUrl || "");
  const url = String(targetThumb.dataset.videoUrl || "");
  const title = String(targetThumb.dataset.videoTitle || "Video");

  carousel.dataset.videoIndex = String(clamped);
  buildDiscoverVideoFrame(frame, { embedUrl, url, title });
  updateDiscoverVideoUi(app);
}

function stepDiscoverVideo(app, direction) {
  const currentIndex = getDiscoverVideoCurrentIndex(app);
  const nextIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
  setDiscoverVideoIndex(app, nextIndex);
}

function updateDiscoverVideoUi(app) {
  const carousel = getDiscoverVideoCarousel(app);
  const thumbs = getDiscoverVideoThumbButtons(app);
  const counter = app.querySelector("[data-discover-video-counter]");
  const prevButton = app.querySelector("[data-action='discover-video-prev']");
  const nextButton = app.querySelector("[data-action='discover-video-next']");

  if (!carousel || !thumbs.length) {
    if (counter) counter.textContent = "";
    if (prevButton) prevButton.disabled = true;
    if (nextButton) nextButton.disabled = true;
    return;
  }

  const total = thumbs.length;
  const currentIndex = Math.max(0, Math.min(getDiscoverVideoCurrentIndex(app), total - 1));
  carousel.dataset.videoIndex = String(currentIndex);

  if (counter) {
    counter.textContent = `${currentIndex + 1} / ${total}`;
  }
  if (prevButton) prevButton.disabled = currentIndex <= 0;
  if (nextButton) nextButton.disabled = currentIndex >= total - 1;

  thumbs.forEach((button, index) => {
    const isActive = index === currentIndex;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
}

function applyOverlayFocus(app, snapshot, previousSnapshot) {
  if (snapshot.isAddModalOpen && !previousSnapshot?.isAddModalOpen) {
    app.querySelector("#add-search-query")?.focus({ preventScroll: true });
    return;
  }

  if (snapshot.pendingDeleteEntryId && !previousSnapshot?.pendingDeleteEntryId) {
    app.querySelector("[data-action='close-delete-confirm']")?.focus({ preventScroll: true });
    return;
  }

  if (snapshot.mediaLightbox?.open && !previousSnapshot?.mediaLightbox?.open) {
    app.querySelector("[data-action='close-media-lightbox']")?.focus({ preventScroll: true });
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
    playtimeHours: app.querySelector("#add-playtime-hours")?.value ?? "",
    completionPercent: app.querySelector("#add-completion-percent")?.value ?? "",
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
      <main class="flex flex-col bg-background min-h-screen">
        <div id="app-topbar-root"></div>
        <div id="app-view-root" class="flex-1 flex flex-col"></div>
      </main>
      <div id="app-notice-root"></div>
      <div id="app-add-modal-root"></div>
      <div id="app-delete-modal-root"></div>
      <div id="app-media-lightbox-root"></div>
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

        if (snapshot.mediaLightbox?.open) {
          event.preventDefault();
          store.closeMediaLightbox();
          return;
        }

        if (snapshot.notice) {
          event.preventDefault();
          store.dismissNotice();
        }
      }

      if (snapshot.mediaLightbox?.open && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
        event.preventDefault();
        store.stepMediaLightbox(event.key === "ArrowLeft" ? "prev" : "next");
        return;
      }

      if (event.key === "Tab") {
        if (snapshot.isAddModalOpen) {
          trapTabKey(app.querySelector("[data-modal-root='add-entry']"), event);
          return;
        }

        if (snapshot.pendingDeleteEntryId) {
          trapTabKey(app.querySelector("[data-modal-root='delete-confirm']"), event);
          return;
        }

        if (snapshot.mediaLightbox?.open) {
          trapTabKey(app.querySelector("[data-modal-root='media-lightbox']"), event);
          return;
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

        if (target.id === "discover-search-query") {
          event.preventDefault();
          globalThis.clearTimeout?.(addSearchDebounceTimer);
          addSearchDebounceTimer = null;
          store.searchAddCatalog(target.value);
        }
      }
    };

    app.onfocusin = (event) => {
      const snapshot = store.getSnapshot();
      if (!snapshot.mediaLightbox?.open) return;

      const lightboxRoot = app.querySelector("[data-modal-root='media-lightbox']");
      if (!lightboxRoot) return;
      if (lightboxRoot.contains(event.target)) return;

      const closeButton = app.querySelector("[data-action='close-media-lightbox']");
      closeButton?.focus?.({ preventScroll: true });
    };

    app.onclick = async (event) => {
      const actionElement = event.target.closest("[data-action]");
      if (!actionElement) {
        const lightboxRoot = app.querySelector("[data-modal-root='media-lightbox']");
        if (lightboxRoot && event.target === lightboxRoot) {
          store.closeMediaLightbox();
        }
        return;
      }
      if (!actionElement || !app.contains(actionElement)) return;

      switch (actionElement.dataset.action) {
        case "set-view":
          if (actionElement.dataset.view === "discover" && typeof store.openDiscover === "function") {
            if (typeof store.clearDiscoverSelection === "function") {
              store.clearDiscoverSelection();
            }
            await store.openDiscover();
          } else {
            store.setView(actionElement.dataset.view);
          }
          break;
        case "set-settings-section":
          store.setSettingsSection(actionElement.dataset.section);
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
          await store.openDiscover({ resetQuery: true });
          break;
        case "open-discover":
          await store.openDiscover();
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
        case "search-discover":
          await store.searchAddCatalog(app.querySelector("#discover-search-query")?.value ?? "");
          break;
        case "load-discover-top-played":
          await store.loadDiscoverTopPlayed();
          break;
        case "select-discover-result":
          await store.selectDiscoverResult(actionElement.dataset.searchResultId);
          break;
        case "select-discover-related":
          await store.selectDiscoverRelated(actionElement.dataset.searchResultId);
          break;
        case "open-media-lightbox":
          if (actionElement.dataset.mediaContext === "discover") {
            const currentDiscoverIndex = Number(app.querySelector("#discover-screenshot-carousel")?.dataset?.screenshotIndex || 0);
            store.openDiscoverScreenshotLightbox(Number.isFinite(currentDiscoverIndex) ? currentDiscoverIndex : 0);
          } else if (actionElement.dataset.mediaContext === "details") {
            store.openDetailScreenshotLightbox(Number(actionElement.dataset.mediaIndex || 0));
          }
          break;
        case "close-media-lightbox":
          store.closeMediaLightbox();
          break;
        case "media-lightbox-prev":
          store.stepMediaLightbox("prev");
          break;
        case "media-lightbox-next":
          store.stepMediaLightbox("next");
          break;
        case "media-lightbox-jump":
          store.setMediaLightboxIndex(Number(actionElement.dataset.mediaIndex || 0));
          break;
        case "discover-screenshot-prev":
          stepDiscoverScreenshot(app, "prev");
          break;
        case "discover-screenshot-next":
          stepDiscoverScreenshot(app, "next");
          break;
        case "discover-screenshot-jump":
          setDiscoverScreenshotIndex(app, Number(actionElement.dataset.screenshotIndex || 0));
          break;
        case "discover-video-prev":
          stepDiscoverVideo(app, "prev");
          break;
        case "discover-video-next":
          stepDiscoverVideo(app, "next");
          break;
        case "discover-video-jump":
          setDiscoverVideoIndex(app, Number(actionElement.dataset.videoIndex || 0));
          break;
        case "clear-discover-selection":
          store.clearDiscoverSelection();
          break;
        case "discover-add-wishlist":
          await store.addDiscoverSelection("wishlist");
          break;
        case "discover-add-library":
          await store.addDiscoverSelection("playing");
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
        case "sync-now":
          await store.syncNow();
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
        case "refresh-library-pricing":
          await store.refreshLibraryPricing();
          break;
        case "load-itad-stores":
          await store.loadItadStores();
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
        case "refresh-entry-pricing":
          await store.refreshPricingForEntry(actionElement.dataset.entryId);
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
        case "toggle-price-watch":
          store.togglePriceWatch(actionElement.dataset.entryId);
          break;
        case "save-price-watch":
          store.savePriceWatch({
            targetPrice: app.querySelector("#detail-price-target")?.value ?? "",
            currency: app.querySelector("#detail-price-currency")?.value ?? "USD"
          });
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
          await store.clearMetadataOverrides(actionElement.dataset.entryId);
          break;
        case "save-artwork-overrides":
          store.saveArtworkOverrides(actionElement.dataset.entryId, getOverrideDraftValues(app).artwork);
          break;
        case "clear-artwork-overrides":
          await store.clearArtworkOverrides(actionElement.dataset.entryId);
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
        return;
      }

      if (target.id === "discover-search-query") {
        store.updateAddForm({
          searchQuery: target.value
        });
        globalThis.clearTimeout?.(addSearchDebounceTimer);
        addSearchDebounceTimer = globalThis.setTimeout?.(() => {
          globalThis.clearTimeout?.(addSearchDebounceTimer);
          addSearchDebounceTimer = null;
          if (target.value.trim()) {
            store.searchAddCatalog(target.value);
          } else {
            store.loadDiscoverTopPlayed();
          }
        }, 900);
        return;
      }

      if (target.id === "add-run-label") {
        store.updateAddForm({
          runLabel: target.value
        });
        return;
      }

      if (target.id === "add-notes") {
        store.updateAddForm({
          notes: target.value
        });
        return;
      }

      if (target.id === "add-playtime-hours") {
        store.updateAddForm({
          playtimeHours: target.value
        });
        return;
      }

      if (target.id === "add-completion-percent") {
        store.updateAddForm({
          completionPercent: target.value
        });
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

      if (target instanceof HTMLInputElement && target.id === "discover-search-query") {
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
        return;
      }

      if (target instanceof HTMLInputElement && target.dataset.action === "toggle-itad-store") {
        store.toggleItadStoreSelection(target.dataset.storeId, target.checked);
      }
    };
  }

  function renderView(snapshot) {
    if (snapshot.currentView === "details") {
      return renderDetailsView(snapshot, storefrontDefinitions, statusDefinitions);
    }
    if (snapshot.currentView === "settings") {
      return renderSettingsView(snapshot, storefrontDefinitions);
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
    const mediaLightboxRoot = app.querySelector("#app-media-lightbox-root");

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
    if (mediaLightboxRoot) {
      mediaLightboxRoot.innerHTML = renderMediaLightbox(snapshot);
    }

    const topbarElement = app.querySelector(".checkpoint-topbar");
    const topbarHeight = topbarElement?.getBoundingClientRect?.().height || 72;
    if (globalThis.document?.documentElement?.style) {
      globalThis.document.documentElement.style.setProperty("--checkpoint-topbar-height", `${Math.ceil(topbarHeight)}px`);
    }

    if (globalThis.document?.body) {
      const shouldLockBodyScroll = Boolean(
        snapshot.isAddModalOpen
        || snapshot.pendingDeleteEntryId
        || snapshot.mediaLightbox?.open
      );
      globalThis.document.body.style.overflow = shouldLockBodyScroll ? "hidden" : "";
    }

    bindEvents();
    updateDiscoverScreenshotUi(app);
    updateDiscoverVideoUi(app);
    const nextDetailContextKey = getDetailContextKey(snapshot);
    const previousDetailContextKey = getDetailContextKey(previousSnapshot);
    const detailContextChanged = Boolean(nextDetailContextKey) && nextDetailContextKey !== previousDetailContextKey;

    if (detailContextChanged) {
      globalThis.scrollTo?.({ top: 0, left: 0, behavior: "auto" });
    } else {
      restoreScrollState(app, scrollState);
    }
    const addModalJustOpened = snapshot.isAddModalOpen && !previousSnapshot?.isAddModalOpen;
    const deleteModalJustOpened = Boolean(snapshot.pendingDeleteEntryId) && !previousSnapshot?.pendingDeleteEntryId;
    const mediaLightboxJustOpened = Boolean(snapshot.mediaLightbox?.open) && !previousSnapshot?.mediaLightbox?.open;
    if (addModalJustOpened || deleteModalJustOpened || mediaLightboxJustOpened) {
      applyOverlayFocus(app, snapshot, previousSnapshot);
    } else if (snapshot.mediaLightbox?.open) {
      enforceModalFocus(app, "[data-modal-root='media-lightbox']", "[data-action='close-media-lightbox']");
    } else {
      restoreFocusState(app, focusState);
    }
    previousSnapshot = snapshot;
  }

  return { render };
}
