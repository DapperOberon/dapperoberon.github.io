import { calculateStats } from "./stats.js";
import { getNextObjective } from "./timeline-data.js";
import { getCurrentPage } from "./app-ui-helpers.js";

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function createAppRenderer({
  app,
  appState,
  rebuildEntryIndex,
  countActiveFilters,
  getFilteredSections,
  renderFilterPanel,
  renderModal,
  renderDesktopSection,
  renderMobileSection,
  buildRenderShellOptions,
  renderAppMainContent,
  renderShellLayout,
  getEraAssetPath,
  renderStandardTopBar,
  renderDesktopSidebar,
  renderMobileAudioPlayer,
  renderMobileBottomNav,
  renderStandardFooter,
  getModalEntryNavigation,
  restorePendingFocus,
  escapeHtmlFn = escapeHtml,
  wireInteractions
}) {
  function renderApp(sections) {
    rebuildEntryIndex();
    const normalizedSections = sections;
    const flatEntries = appState.entries;
    const stats = calculateStats(normalizedSections);
    const currentPage = getCurrentPage(appState);
    const heroEntry = getNextObjective(flatEntries) || flatEntries[0];
    const activeEntry = appState.entryMap.get(appState.activeEntryId) || null;
    const filteredSections = getFilteredSections();
    const filteredEntries = filteredSections.flatMap((section) => section.entries);
    const activeFilterCount = countActiveFilters(appState.filters);
    const shellOptions = buildRenderShellOptions({
      currentPage,
      activeEntry,
      isFilterPanelOpen: appState.isFilterPanelOpen,
      normalizedSections,
      searchInputValue: appState.searchInputValue,
      escapeHtml: escapeHtmlFn,
      getEraAssetPath,
      renderStandardTopBar,
      renderDesktopSidebar,
      renderMobileAudioPlayer,
      renderMobileBottomNav,
      renderStandardFooter
    });
    const overlays = `
      ${renderFilterPanel()}
      ${renderModal(activeEntry, { escapeHtml: escapeHtmlFn, getModalEntryNavigation })}
    `;
    const mainContent = renderAppMainContent({
      currentPage,
      heroEntry,
      flatEntries,
      stats,
      activeFilterCount,
      filteredEntries,
      filteredSections,
      normalizedSections,
      timelineData: normalizedSections,
      preferences: appState.preferences,
      searchInputValue: appState.searchInputValue,
      escapeHtml: escapeHtmlFn,
      renderDesktopSection: (section, startIndex) => renderDesktopSection(section, startIndex, { escapeHtml: escapeHtmlFn }),
      renderMobileSection: (section) => renderMobileSection(section, { escapeHtml: escapeHtmlFn })
    });

    app.innerHTML = renderShellLayout({
      topBar: shellOptions.topBar,
      desktopSidebar: shellOptions.desktopSidebar,
      mainContent,
      mobileAudio: shellOptions.mobileAudio,
      mobileBottomNav: shellOptions.mobileBottomNav,
      footer: shellOptions.footer,
      overlays
    });

    if (appState.isFilterPanelOpen) {
      const scrollRegion = Array.from(document.querySelectorAll("[data-filter-scroll-region]"))
        .find((element) => element instanceof HTMLElement && element.offsetParent !== null);
      if (scrollRegion instanceof HTMLElement) {
        scrollRegion.scrollTop = appState.filterPanelScrollTop || 0;
      }
    }

    wireInteractions();
    restorePendingFocus(appState);
  }

  return {
    renderApp
  };
}
