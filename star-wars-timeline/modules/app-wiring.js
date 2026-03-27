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
  function getVisibleFilterScrollRegion() {
    return Array.from(document.querySelectorAll("[data-filter-scroll-region]"))
      .find((element) => element instanceof HTMLElement && element.offsetParent !== null) || null;
  }

  function preserveFilterPanelScroll() {
    const scrollRegion = getVisibleFilterScrollRegion();
    appState.filterPanelScrollTop = scrollRegion instanceof HTMLElement ? scrollRegion.scrollTop : 0;
  }

  function syncFilterDraftUi() {
    document.querySelectorAll("[data-filter-era]").forEach((control) => {
      const era = control.getAttribute("data-filter-era");
      if (!era) return;
      const isActive = appState.filterDraft.eras.has(era);

      if (control instanceof HTMLInputElement) {
        control.checked = isActive;
        const label = document.querySelector(`[data-filter-era-label="${CSS.escape(era)}"]`);
        if (label) {
          label.classList.remove(
            "is-active",
            "text-primary-fixed",
            "border-primary-fixed/40",
            "text-neutral-300",
            "border-white/5"
          );
          label.classList.add(...(isActive
            ? ["is-active", "text-primary-fixed", "border-primary-fixed/40"]
            : ["text-neutral-300", "border-white/5"]));
        }

        const text = document.querySelector(`[data-filter-era-text="${CSS.escape(era)}"]`);
        if (text) {
          text.classList.remove("text-primary-fixed", "text-neutral-300");
          text.classList.add(isActive ? "text-primary-fixed" : "text-neutral-300");
        }

        const indicator = document.querySelector(`[data-filter-era-indicator="${CSS.escape(era)}"]`);
        if (indicator) {
          indicator.classList.remove(
            "border-primary-fixed/70",
            "bg-primary-fixed",
            "text-black",
            "border-white/10",
            "bg-surface-container-low",
            "text-transparent"
          );
          indicator.classList.add(...(isActive
            ? ["border-primary-fixed/70", "bg-primary-fixed", "text-black"]
            : ["border-white/10", "bg-surface-container-low", "text-transparent"]));
        }
        return;
      }

      control.classList.remove(
        "is-active",
        "text-primary-fixed",
        "border-primary-fixed/40",
        "text-neutral-300",
        "border-white/5"
      );
      control.classList.add(...(isActive
        ? ["is-active", "text-primary-fixed", "border-primary-fixed/40"]
        : ["text-neutral-300", "border-white/5"]));

      const icon = control.querySelector(".material-symbols-outlined");
      if (icon) {
        icon.classList.toggle("opacity-100", isActive);
        icon.classList.toggle("opacity-35", !isActive);
        icon.setAttribute("style", `font-variation-settings: 'FILL' ${isActive ? 1 : 0};`);
      }
    });

    document.querySelectorAll("[data-filter-type]").forEach((button) => {
      const value = button.getAttribute("data-filter-type");
      if (!value) return;
      const isActive = value === appState.filterDraft.type;

      button.classList.remove(
        "is-active",
        "text-primary-fixed",
        "border-primary-fixed/40",
        "text-neutral-300",
        "border-white/5",
        "bg-primary-fixed",
        "text-on-primary-fixed",
        "shadow-[0_0_20px_rgba(251,228,25,0.2)]",
        "bg-surface-container-high",
        "text-on-surface",
        "opacity-40",
        "filter-segment"
      );

      if (button.classList.contains("aspect-square")) {
        button.classList.add(...(isActive
          ? ["is-active", "text-primary-fixed", "border-primary-fixed/40"]
          : ["text-neutral-300", "border-white/5"]));
        return;
      }

      if (button.classList.contains("is-filter-chip")) {
        button.classList.add(...(isActive ? ["is-active", "text-primary-fixed"] : ["text-neutral-300"]));
        return;
      }

      button.classList.add(...(isActive
        ? ["is-active", "text-primary-fixed", "border-primary-fixed/40"]
        : ["text-neutral-300", "border-white/5"]));
    });

    [["[data-filter-canon]", appState.filterDraft.canon], ["[data-filter-progress]", appState.filterDraft.progress], ["[data-filter-arc]", appState.filterDraft.arc]].forEach(([selector, currentValue]) => {
      document.querySelectorAll(selector).forEach((button) => {
        const attributeName = selector.slice(1, -1);
        const value = button.getAttribute(attributeName);
        if (!value) return;
        const isActive = value === currentValue;

        button.classList.remove(
          "is-active",
          "text-primary-fixed",
          "border-primary-fixed/40",
          "text-neutral-300",
          "border-white/5",
          "text-on-surface",
          "opacity-40",
          "filter-segment"
        );

        if (button.classList.contains("filter-option")) {
          button.classList.add(...(isActive
            ? ["is-active", "text-primary-fixed", "border-primary-fixed/40"]
            : ["text-neutral-300", "border-white/5"]));
          return;
        }

        button.classList.add(...(isActive ? ["is-active", "text-primary-fixed"] : ["text-on-surface", "opacity-40"]));
      });
    });
  }

  return function wireInteractions() {
    initializeShellInteractions({
      onSearchInput: (event) => {
        const nextValue = event.target.value;
        appState.searchInputValue = nextValue;
        appState.filters.search = nextValue.trim().length >= 3 ? nextValue : "";
        appState.pendingFocusTarget = {
          id: event.target.id,
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
        if (!page) return;
        if (page === "stats") {
          viewActions.openStats();
          return;
        }
        if (page === "preferences") {
          viewActions.openPreferences();
          return;
        }
        viewActions.openPage(page);
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
      onToggleFilterEra: (era, checked) => {
        if (!era) return;
        const isChecked = typeof checked === "boolean" ? checked : !appState.filterDraft.eras.has(era);
        if (isChecked) {
          appState.filterDraft.eras.add(era);
        } else {
          appState.filterDraft.eras.delete(era);
        }
        appActions.playUiSound("toggle");
        syncFilterDraftUi();
      },
      onSetFilterType: (type) => {
        preserveFilterPanelScroll();
        appState.filterDraft.type = type;
        appActions.playUiSound("toggle");
        syncFilterDraftUi();
      },
      onSetFilterCanon: (canon) => {
        preserveFilterPanelScroll();
        appState.filterDraft.canon = canon;
        appActions.playUiSound("toggle");
        syncFilterDraftUi();
      },
      onSetFilterProgress: (progress) => {
        preserveFilterPanelScroll();
        appState.filterDraft.progress = progress;
        appActions.playUiSound("toggle");
        syncFilterDraftUi();
      },
      onSetFilterArc: (arc) => {
        preserveFilterPanelScroll();
        appState.filterDraft.arc = arc;
        appActions.playUiSound("toggle");
        syncFilterDraftUi();
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
