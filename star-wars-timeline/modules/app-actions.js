export function createAppActions({
  appState,
  getAudioController,
  savePreferences,
  applyPreferencesToDocument,
  renderApp,
  buildEntryShareUrl
}) {
  function playUiSound(type = "click") {
    getAudioController().playSound(type);
  }

  async function shareEntry(entryId) {
    const entry = appState.entryMap.get(entryId);
    if (!entry) return;

    const shareUrl = buildEntryShareUrl(entry).toString();
    const shareData = {
      title: entry.title,
      text: `Continue here in Star Wars: Chronicles: ${entry.title}`,
      url: shareUrl
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        playUiSound("success");
        return;
      }
    } catch (error) {
      if (error && error.name === "AbortError") {
        return;
      }
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        playUiSound("success");
        window.alert("Share link copied to clipboard.");
        return;
      }
    } catch (error) {
      // Fall through to prompt fallback.
    }

    window.prompt("Copy this entry link:", shareUrl);
  }

  function togglePreference(key) {
    if (!appState.preferences || !(key in appState.preferences)) return;
    if (key === "canonOnly" || key === "legendsIntegration") {
      const continuitySelection = key === "canonOnly";
      appState.preferences.canonOnly = continuitySelection;
      appState.preferences.legendsIntegration = !continuitySelection;
      savePreferences();
      playUiSound("toggle");
      renderApp(appState.timelineData);
      return;
    }
    appState.preferences[key] = !appState.preferences[key];
    savePreferences();
    applyPreferencesToDocument();
    if (key === "audioEnabled") {
      getAudioController().setMusicEnabled(Boolean(appState.preferences[key]), { withFeedback: true });
    }
    if (key === "soundEffectsEnabled") {
      getAudioController().setSoundEnabled(Boolean(appState.preferences[key]), { withFeedback: true });
    } else {
      playUiSound("toggle");
    }
    renderApp(appState.timelineData);
  }

  function setPreferenceValue(key, value) {
    if (!appState.preferences || !(key in appState.preferences)) return;
    appState.preferences[key] = value;
    savePreferences();
    applyPreferencesToDocument();
    playUiSound("toggle");
    renderApp(appState.timelineData);
  }

  return {
    playUiSound,
    shareEntry,
    togglePreference,
    setPreferenceValue
  };
}
