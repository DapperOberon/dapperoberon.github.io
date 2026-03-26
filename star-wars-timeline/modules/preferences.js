export function getDefaultPreferences(schemaVersion) {
  return {
    schemaVersion,
    displayBbyAbyDates: true,
    standardHoursRuntime: false,
    chronologicalSortLock: true,
    canonOnly: false,
    legendsIntegration: true,
    includeAnimatedShorts: true,
    audioEnabled: true,
    soundEffectsEnabled: false,
    scanlineIntensity: 30,
    glowRadius: 65,
    interfaceTheme: "sith-dark"
  };
}

export function normalizeContinuityPreferences(preferences) {
  const normalized = {
    ...preferences
  };

  if (normalized.canonOnly) {
    normalized.legendsIntegration = false;
  } else {
    normalized.legendsIntegration = true;
  }

  return normalized;
}

export function loadPreferences({
  storageKey,
  schemaVersion,
  defaults = getDefaultPreferences(schemaVersion),
  storage = window.localStorage
}) {
  try {
    const raw = storage.getItem(storageKey);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    let migrated = {
      ...defaults,
      ...parsed
    };

    if (!parsed.schemaVersion || Number(parsed.schemaVersion) < schemaVersion) {
      migrated.canonOnly = false;
      migrated.legendsIntegration = true;
      migrated.schemaVersion = schemaVersion;
      try {
        storage.setItem(storageKey, JSON.stringify(migrated));
      } catch (error) {
        // Ignore localStorage failures during migration.
      }
    }

    migrated = normalizeContinuityPreferences(migrated);

    return {
      ...migrated
    };
  } catch (error) {
    return defaults;
  }
}

export function savePreferences(storageKey, preferences, storage = window.localStorage) {
  try {
    storage.setItem(storageKey, JSON.stringify(preferences));
  } catch (error) {
    // Ignore localStorage failures for preferences.
  }
}

export function applyPreferencesToDocument(
  preferences,
  root = document.documentElement,
  body = document.body
) {
  if (!preferences) return;

  const scanlineOpacity = Math.max(0, Math.min(100, Number(preferences.scanlineIntensity || 0))) / 100;
  const glowBlur = 10 + Math.round((Math.max(0, Math.min(100, Number(preferences.glowRadius || 0))) / 100) * 26);

  root.style.setProperty("--scanline-opacity", scanlineOpacity.toFixed(2));
  root.style.setProperty("--glow-blur", `${glowBlur}px`);
  body.dataset.interfaceTheme = preferences.interfaceTheme || "sith-dark";
}
