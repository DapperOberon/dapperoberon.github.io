export function createAppDomain({
  appState,
  buildDefaultFilters,
  getActiveFilterCount,
  matchesEntryFilters,
  buildFilteredSections,
  createEntryShareUrl,
  syncHistoryEntryUrl,
  readEntryIdFromUrl,
  buildEntryIndex,
  slugifyTitle,
  getEntrySearchText,
  getWatchedCount,
  isComplete,
  storyArcMatchers
}) {
  function getAllEraNames() {
    return appState.timelineData.map((section) => section.era);
  }

  function createDefaultFilters() {
    return buildDefaultFilters(getAllEraNames());
  }

  function countActiveFilters(filters) {
    return getActiveFilterCount(filters, getAllEraNames());
  }

  function entryMatchesFilters(entry, filters) {
    return matchesEntryFilters({
      entry,
      filters,
      preferences: appState.preferences,
      timelineData: appState.timelineData,
      getEntrySearchText,
      getWatchedCount,
      isComplete,
      storyArcMatchers
    });
  }

  function getFilteredSections() {
    return buildFilteredSections(
      appState.timelineData,
      (entry) => entryMatchesFilters(entry, appState.filters)
    );
  }

  function getFilteredEntries() {
    return getFilteredSections().flatMap((section) => section.entries);
  }

  function getModalEntryNavigation(entryId) {
    const entries = getFilteredEntries();
    const currentIndex = entries.findIndex((entry) => entry.id === entryId);
    if (currentIndex === -1) {
      return {
        previous: null,
        next: null
      };
    }

    return {
      previous: currentIndex > 0 ? entries[currentIndex - 1] : null,
      next: currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null
    };
  }

  function buildEntryShareUrl(entry) {
    return createEntryShareUrl(entry, slugifyTitle);
  }

  function syncEntryUrl(entry, { mode = "replace" } = {}) {
    syncHistoryEntryUrl(entry, buildEntryShareUrl, { mode });
  }

  function getEntryIdFromUrl() {
    return readEntryIdFromUrl();
  }

  function applyEntryStateFromUrl(renderApp, { shouldRender = true } = {}) {
    const entryId = getEntryIdFromUrl();
    const nextEntryId = entryId && appState.entryMap.has(entryId) ? entryId : null;
    if (entryId && !nextEntryId) {
      syncEntryUrl(null, { mode: "replace" });
    }
    appState.activeEntryId = nextEntryId;
    if (nextEntryId) {
      appState.pendingOverlayFocusSelector = "#entry-modal button[data-close-modal='true']";
    }
    if (shouldRender) {
      renderApp(appState.timelineData);
    }
  }

  function rebuildEntryIndex() {
    const { entryMap, entries } = buildEntryIndex(appState.timelineData);
    appState.entryMap = entryMap;
    appState.entries = entries;
  }

  return {
    getAllEraNames,
    createDefaultFilters,
    countActiveFilters,
    getFilteredSections,
    getModalEntryNavigation,
    buildEntryShareUrl,
    syncEntryUrl,
    applyEntryStateFromUrl,
    rebuildEntryIndex
  };
}
