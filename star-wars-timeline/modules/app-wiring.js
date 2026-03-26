import { hasActiveOverlay, getCurrentPage } from "./app-ui-helpers.js";

export function createInteractionWiring({
  appState,
  appActions,
  viewActions,
  progressActions,
  audioUiRuntime,
  audioUiUnsubscribeRef,
  initializeShellInteractions,
  initializeAppInteractions,
  createDefaultFilters,
  cloneFilters,
  rebuildEntryIndex,
  renderApp,
  initializeActiveSectionTracking,
  restoreOverlayFocus,
  resetAllProgress
}) {
  return function wireInteractions() {
    initializeShellInteractions({
      searchInputValue: appState.searchInputValue,
      onSearchInput: (event) => {
        const nextValue = event.target.value;
        appState.searchInputValue = nextValue;
        appState.filters.search = nextValue.trim().length >= 3 ? nextValue : "";
        appState.pendingFocusTarget = {
          id: "timeline-search-input",
          selectionStart: event.target.selectionStart ?? nextValue.length,
          selectionEnd: event.target.selectionEnd ?? nextValue.length
        };
        renderApp(appState.timelineData);
      },
      onScrollTarget: (targetId) => {
        const target = document.getElementById(targetId);
        if (!target) return;
        appActions.playUiSound("click");
        target.scrollIntoView({
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
          block: "start"
        });
      },
      onNavigatePage: (page) => {
        appActions.playUiSound("click");
        if (page === "stats") {
          viewActions.openStats();
          return;
        }
        if (page === "timeline") {
          viewActions.closeStats(false);
          viewActions.closePreferences(false);
          renderApp(appState.timelineData);
        }
      },
      onOpenStats: () => {
        appActions.playUiSound("click");
        viewActions.openStats();
      },
      onOpenPreferences: () => {
        appActions.playUiSound("click");
        viewActions.openPreferences();
      }
    });

    initializeAppInteractions({
      onOpenModal: (entryId) => {
        appActions.playUiSound("click");
        viewActions.openModal(entryId);
      },
      onCloseModal: () => {
        appActions.playUiSound("click");
        viewActions.closeModal();
      },
      onOpenFilters: () => {
        appActions.playUiSound("click");
        viewActions.openFilters();
      },
      onCloseFilters: () => {
        appActions.playUiSound("click");
        viewActions.closeFilters();
      },
      onToggleFilterEra: (era) => {
        if (!era) return;
        const input = document.querySelector(`[data-filter-era="${CSS.escape(String(era))}"]`);
        if (input instanceof HTMLInputElement && input.checked) {
          appState.filterDraft.eras.add(era);
        } else {
          appState.filterDraft.eras.delete(era);
        }
      },
      onSetFilterType: (type) => {
        appState.filterDraft.type = type;
        appActions.playUiSound("toggle");
        renderApp(appState.timelineData);
      },
      onSetFilterCanon: (canon) => {
        appState.filterDraft.canon = canon;
        appActions.playUiSound("toggle");
        renderApp(appState.timelineData);
      },
      onSetFilterProgress: (progress) => {
        appState.filterDraft.progress = progress;
        appActions.playUiSound("toggle");
        renderApp(appState.timelineData);
      },
      onSetFilterArc: (arc) => {
        appState.filterDraft.arc = arc;
        appActions.playUiSound("toggle");
        renderApp(appState.timelineData);
      },
      onClearFilters: () => {
        appState.filters = createDefaultFilters();
        appState.filterDraft = cloneFilters(appState.filters);
        appState.isFilterPanelOpen = false;
        appActions.playUiSound("toggle");
        renderApp(appState.timelineData);
      },
      onApplyFilters: () => {
        appState.filters = cloneFilters(appState.filterDraft);
        appState.isFilterPanelOpen = false;
        appActions.playUiSound("success");
        renderApp(appState.timelineData);
      },
      onToggleEntry: (entryId) => {
        appActions.playUiSound("toggle");
        progressActions.toggleSingleEntry(entryId);
      },
      onEntryPlay: () => {
        appActions.playUiSound("click");
      },
      onToggleEpisode: (episodeIndex) => {
        appActions.playUiSound("toggle");
        progressActions.toggleEpisode(appState.activeEntryId, episodeIndex);
      },
      onEpisodePlay: () => {
        appActions.playUiSound("click");
      },
      onModalPrimary: () => {
        appActions.playUiSound("success");
        progressActions.advanceEntryProgress(appState.activeEntryId);
      },
      onModalNavigate: (direction) => {
        viewActions.navigateModalEntry(direction);
      },
      onShareEntry: async (entryId) => {
        await appActions.shareEntry(entryId);
      },
      onEntryInfo: () => {
        appActions.playUiSound("click");
      },
      onCloseStats: viewActions.closeStats,
      onClosePreferences: viewActions.closePreferences,
      onStatsOpenEntry: (entryId) => {
        appActions.playUiSound("click");
        viewActions.closeStats(false);
        viewActions.openModal(entryId);
      },
      onTogglePreference: (key) => {
        appActions.togglePreference(key);
      },
      onRangePreference: (key, value) => {
        appActions.setPreferenceValue(key, value);
      },
      onThemePreference: (value) => {
        appActions.setPreferenceValue("interfaceTheme", value);
      },
      onResetProgress: () => {
        const confirmed = window.confirm("Reset all watched progress in Star Wars: Chronicles?");
        if (!confirmed) return;
        resetAllProgress(appState.timelineData, () => {});
        rebuildEntryIndex();
        renderApp(appState.timelineData);
      }
    });

    document.body.classList.toggle("modal-open", hasActiveOverlay(appState));

    audioUiRuntime.initializeAudioUI(audioUiUnsubscribeRef);
    initializeActiveSectionTracking({
      currentPage: getCurrentPage(appState)
    });
    restoreOverlayFocus(appState);
  };
}
