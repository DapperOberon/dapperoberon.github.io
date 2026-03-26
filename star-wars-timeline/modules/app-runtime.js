export function restorePendingFocus(appState) {
  if (!appState.pendingFocusTarget) return;
  const target = document.getElementById(appState.pendingFocusTarget.id);
  if (!target) {
    appState.pendingFocusTarget = null;
    return;
  }

  target.focus({ preventScroll: true });
  if (typeof target.setSelectionRange === "function") {
    target.setSelectionRange(
      appState.pendingFocusTarget.selectionStart,
      appState.pendingFocusTarget.selectionEnd
    );
  }
  appState.pendingFocusTarget = null;
}

export function restoreOverlayFocus(appState) {
  if (!appState.pendingOverlayFocusSelector) return;
  const target = document.querySelector(appState.pendingOverlayFocusSelector);
  if (target instanceof HTMLElement) {
    target.focus({ preventScroll: true });
  }
  appState.pendingOverlayFocusSelector = null;
}

export function restoreFocusOrigin(appState) {
  const selector = appState.lastFocusSelector;
  if (selector) {
    const matches = Array.from(document.querySelectorAll(selector));
    const visibleTarget = matches.find((element) => (
      element instanceof HTMLElement &&
      element.offsetParent !== null
    ));
    if (visibleTarget instanceof HTMLElement) {
      visibleTarget.focus({ preventScroll: true });
      appState.lastFocusOrigin = null;
      appState.lastFocusSelector = null;
      return;
    }
  }

  const target = appState.lastFocusOrigin;
  if (target instanceof HTMLElement && document.contains(target)) {
    target.focus({ preventScroll: true });
  }
  appState.lastFocusOrigin = null;
  appState.lastFocusSelector = null;
}

export function createViewActions({
  appState,
  renderApp,
  syncEntryUrl,
  getModalEntryNavigation,
  cloneFilters,
  playUiSound,
  restoreFocusOrigin
}) {
  function clearOverlaysForPageChange() {
    appState.activeEntryId = null;
    appState.isFilterPanelOpen = false;
    appState.pendingOverlayFocusSelector = null;
    syncEntryUrl(null, { mode: "push" });
  }

  function openModal(entryId) {
    appState.lastFocusOrigin = document.activeElement;
    appState.lastFocusSelector = `[data-entry-id="${CSS.escape(String(entryId))}"]`;
    appState.activeEntryId = entryId;
    appState.pendingOverlayFocusSelector = "#entry-modal button[data-close-modal='true']";
    const entry = appState.entryMap.get(entryId);
    if (entry) {
      syncEntryUrl(entry, { mode: "push" });
    }
    renderApp(appState.timelineData);
  }

  function navigateModalEntry(direction) {
    const activeEntry = appState.entryMap.get(appState.activeEntryId);
    if (!activeEntry) return;

    const modalNav = getModalEntryNavigation(activeEntry.id);
    const targetEntry = direction === "previous" ? modalNav.previous : modalNav.next;
    if (!targetEntry) return;

    playUiSound("click");
    appState.activeEntryId = targetEntry.id;
    appState.pendingOverlayFocusSelector = "#entry-modal button[data-close-modal='true']";
    syncEntryUrl(targetEntry, { mode: "push" });
    renderApp(appState.timelineData);
  }

  function closeModal() {
    appState.activeEntryId = null;
    syncEntryUrl(null, { mode: "push" });
    renderApp(appState.timelineData);
    restoreFocusOrigin(appState);
  }

  function openStats() {
    clearOverlaysForPageChange();
    appState.isStatsOpen = true;
    appState.isPreferencesOpen = false;
    renderApp(appState.timelineData);
  }

  function closeStats(shouldRender = true) {
    appState.isStatsOpen = false;
    if (shouldRender) {
      renderApp(appState.timelineData);
    }
  }

  function openPreferences() {
    clearOverlaysForPageChange();
    appState.isPreferencesOpen = true;
    appState.isStatsOpen = false;
    renderApp(appState.timelineData);
  }

  function closePreferences(shouldRender = true) {
    appState.isPreferencesOpen = false;
    appState.isStatsOpen = false;
    if (shouldRender) {
      renderApp(appState.timelineData);
    }
  }

  function openFilters() {
    appState.lastFocusOrigin = document.activeElement;
    appState.lastFocusSelector = '[data-open-filters="true"]';
    appState.filterDraft = cloneFilters(appState.filters);
    appState.isFilterPanelOpen = true;
    appState.pendingOverlayFocusSelector = "#filter-panel button[data-close-filters='true']";
    renderApp(appState.timelineData);
  }

  function closeFilters() {
    appState.isFilterPanelOpen = false;
    appState.filterDraft = cloneFilters(appState.filters);
    renderApp(appState.timelineData);
    restoreFocusOrigin(appState);
  }

  return {
    openModal,
    navigateModalEntry,
    closeModal,
    openStats,
    closeStats,
    openPreferences,
    closePreferences,
    openFilters,
    closeFilters
  };
}

export function createAudioUiRuntime({
  appState,
  getAudioController,
  savePreferences,
  togglePreference,
  onTrackSync
}) {
  function syncMobileAudioMeta(volume = getAudioController().getMusicVolume()) {
    const mobileVolumeIcon = document.querySelector("[data-mobile-volume-icon]");
    if (mobileVolumeIcon) {
      if (volume <= 0.001) {
        mobileVolumeIcon.textContent = "🔇";
      } else if (volume < 0.5) {
        mobileVolumeIcon.textContent = "🔉";
      } else {
        mobileVolumeIcon.textContent = "🔊";
      }
    }
  }

  function syncMiniAudioUI(state = {
    musicEnabled: getAudioController().getMusicEnabled(),
    currentTrackTitle: getAudioController().getCurrentTrackTitle()
  }) {
    const title = document.getElementById("mobile-music-pill-title");
    const toggle = document.getElementById("mobile-music-pill-toggle");

    if (title) {
      title.textContent = state.currentTrackTitle;
    }

    if (toggle) {
      toggle.textContent = state.musicEnabled ? "⏸" : "▶";
      toggle.setAttribute("aria-pressed", String(state.musicEnabled));
    }
  }

  function syncAllAudioUi(state = {
    musicEnabled: getAudioController().getMusicEnabled(),
    musicVolume: getAudioController().getMusicVolume(),
    currentTrackTitle: getAudioController().getCurrentTrackTitle()
  }) {
    const preferencesTrack = document.getElementById("preferences-current-track");
    const mobileTrack = document.querySelector("[data-mobile-current-track]");
    const mobileVolume = document.querySelector("[data-mobile-music-volume]");

    if (preferencesTrack) {
      preferencesTrack.textContent = state.currentTrackTitle;
    }
    if (mobileTrack) {
      mobileTrack.textContent = state.currentTrackTitle;
    }
    if (mobileVolume) {
      mobileVolume.value = String(Math.round(Math.max(0, Math.min(1, state.musicVolume)) * 100));
    }

    syncMiniAudioUI(state);
    syncMobileAudioMeta(state.musicVolume);
    if (typeof onTrackSync === "function") {
      onTrackSync(state);
    }
  }

  function initializeAudioUI(audioUiUnsubscribeRef) {
    const controller = getAudioController();
    controller.initMusicToggle();
    controller.setSoundEnabled(Boolean(appState.preferences.soundEffectsEnabled), { withFeedback: false, persist: false });

    if (audioUiUnsubscribeRef.current) {
      audioUiUnsubscribeRef.current();
      audioUiUnsubscribeRef.current = null;
    }

    const storedMusicEnabled = controller.getMusicEnabled();
    const storedSoundEnabled = controller.getSoundEnabled();
    appState.preferences.audioEnabled = storedMusicEnabled;
    appState.preferences.soundEffectsEnabled = storedSoundEnabled;
    syncAllAudioUi({
      musicEnabled: controller.getMusicEnabled(),
      musicVolume: controller.getMusicVolume(),
      currentTrackTitle: controller.getCurrentTrackTitle()
    });
    audioUiUnsubscribeRef.current = controller.subscribe((state) => {
      appState.preferences.audioEnabled = state.musicEnabled;
      syncAllAudioUi(state);
    });

    const nextTrackButton = document.getElementById("preferences-next-track");
    if (nextTrackButton) {
      nextTrackButton.addEventListener("click", () => {
        controller.nextTrack({ withFeedback: true });
      });
    }

    const mobileVolume = document.querySelector("[data-mobile-music-volume]");
    if (mobileVolume) {
      const volume = Math.round(Math.max(0, Math.min(1, controller.getMusicVolume())) * 100);
      mobileVolume.value = String(volume);
      mobileVolume.addEventListener("input", () => {
        controller.setMusicVolume(Number(mobileVolume.value) / 100);
      });
    }

    const mobileToggle = document.querySelector("[data-mobile-audio-toggle]");
    if (mobileToggle) {
      mobileToggle.addEventListener("click", () => {
        togglePreference("audioEnabled");
      });
    }

    const mobileNextTrack = document.querySelector("[data-mobile-next-track]");
    if (mobileNextTrack) {
      mobileNextTrack.addEventListener("click", () => {
        controller.nextTrack({ withFeedback: true });
      });
    }

    const mobileMiniToggle = document.getElementById("mobile-music-pill-toggle");
    if (mobileMiniToggle) {
      mobileMiniToggle.addEventListener("click", () => {
        const enabled = controller.getMusicEnabled();
        controller.setMusicEnabled(!enabled, { withFeedback: true });
        appState.preferences.audioEnabled = !enabled;
        savePreferences();
      });
    }

    const mobileMiniNext = document.getElementById("mobile-music-pill-next");
    if (mobileMiniNext) {
      mobileMiniNext.addEventListener("click", () => {
        controller.nextTrack({ withFeedback: true });
      });
    }
  }

  return {
    initializeAudioUI,
    syncAllAudioUi
  };
}
