export function createProgressActions({
  appState,
  isSeriesEntry,
  saveWatchedState,
  rebuildEntryIndex,
  renderApp
}) {
  function persistAndRender() {
    rebuildEntryIndex();
    renderApp(appState.timelineData);
  }

  function ensureWatchedArray(entry) {
    if (!Array.isArray(entry._watchedArray) || entry._watchedArray.length !== entry.episodes) {
      entry._watchedArray = new Array(entry.episodes).fill(false);
    }
  }

  function toggleSingleEntry(entryId) {
    const entry = appState.entryMap.get(entryId);
    if (!entry) return;
    ensureWatchedArray(entry);
    entry._watchedArray[0] = !Boolean(entry._watchedArray[0]);
    saveWatchedState(entry);
    persistAndRender();
  }

  function toggleEpisode(entryId, episodeIndex) {
    const entry = appState.entryMap.get(entryId);
    if (!entry) return;
    ensureWatchedArray(entry);
    if (episodeIndex < 0 || episodeIndex >= entry._watchedArray.length) return;
    entry._watchedArray[episodeIndex] = !Boolean(entry._watchedArray[episodeIndex]);
    saveWatchedState(entry);
    persistAndRender();
  }

  function advanceEntryProgress(entryId) {
    const entry = appState.entryMap.get(entryId);
    if (!entry) return;
    ensureWatchedArray(entry);

    if (!isSeriesEntry(entry)) {
      entry._watchedArray[0] = !Boolean(entry._watchedArray[0]);
      saveWatchedState(entry);
      persistAndRender();
      return;
    }

    const nextIndex = entry._watchedArray.findIndex((watched) => !watched);
    if (nextIndex >= 0) {
      entry._watchedArray[nextIndex] = true;
    }
    saveWatchedState(entry);
    persistAndRender();
  }

  return {
    toggleSingleEntry,
    toggleEpisode,
    advanceEntryProgress
  };
}

export function attachGlobalKeyHandlers({
  appState,
  getFocusableElements,
  viewActions
}) {
  document.addEventListener("keydown", (event) => {
    if (event.key === "Tab") {
      const overlay = document.getElementById("entry-modal") || document.getElementById("filter-panel");
      if (overlay) {
        const focusable = getFocusableElements(overlay);
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const active = document.activeElement;

          if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    }

    if (event.key !== "Escape") return;
    if (appState.activeEntryId) {
      viewActions.closeModal();
      return;
    }
    if (appState.isFilterPanelOpen) {
      viewActions.closeFilters();
      return;
    }
    if (appState.isPreferencesOpen) {
      viewActions.closePreferences();
      return;
    }
    if (appState.isStatsOpen) {
      viewActions.closeStats();
    }
  });
}

export async function bootstrapApp({
  app,
  appState,
  fetchUrl,
  fetchImpl = fetch,
  prepareTimelineData,
  getAudioController,
  initializeWatchedState,
  rebuildEntryIndex,
  loadPreferences,
  applyPreferencesToDocument,
  createDefaultFilters,
  cloneFilters,
  applyEntryStateFromUrl,
  renderApp,
  escapeHtml
}) {
  app.innerHTML = '<div class="loading-shell">Initializing Star Wars: Chronicles</div>';

  try {
    const response = await fetchImpl(fetchUrl);
    if (!response.ok) throw new Error(`Failed to load timeline data: ${response.status}`);
    const sections = prepareTimelineData(await response.json());
    await getAudioController().loadMusicData();
    appState.timelineData = sections;
    initializeWatchedState(appState.timelineData, () => {});
    rebuildEntryIndex();
    appState.preferences = loadPreferences();
    applyPreferencesToDocument();
    appState.filters = createDefaultFilters();
    appState.filterDraft = cloneFilters(appState.filters);
    appState.searchInputValue = "";
    applyEntryStateFromUrl({ shouldRender: false });
    renderApp(appState.timelineData);
  } catch (error) {
    app.innerHTML = `
      <div class="loading-shell" style="padding:2rem; text-align:center;">
        Unable to load Star Wars: Chronicles.<br>
        <span style="display:block; margin-top:0.75rem; letter-spacing:0; text-transform:none; font-size:0.9rem;">${escapeHtml(error.message)}</span>
      </div>
    `;
    console.error(error);
  }
}
