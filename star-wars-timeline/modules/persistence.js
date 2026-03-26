import { getEntryLegacyFingerprintParts } from "./timeline-data.js";

export function getLegacyWatchedStorageKey(entry) {
  return 'watched_' + entry.title.replace(/\s+/g, '_');
}

const THEME_STORAGE_KEY = 'sw_theme';
const DEFAULT_THEME_ID = 'modern-starwars';

function getLegacyFingerprintStorageId(entry) {
  const fingerprint = getEntryLegacyFingerprintParts(entry)
    .join('|')
    .toLowerCase();

  return fingerprint.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function getLegacyFingerprintWatchedStorageKey(entry) {
  return 'watched_' + getLegacyFingerprintStorageId(entry);
}

export function normalizeEntryId(id) {
  return String(id || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getEntryStorageId(entry) {
  const explicitId = entry && entry.id ? normalizeEntryId(entry.id) : '';
  if (explicitId) {
    return explicitId;
  }

  const titleFallback = normalizeEntryId(entry && entry.title ? entry.title.replace(/\s+/g, '-') : '');
  if (titleFallback) {
    return `legacy-${titleFallback}`;
  }

  return 'legacy-entry';
}

export function getWatchedStorageKey(entry) {
  return 'watched_' + getEntryStorageId(entry);
}

function getEntryLegacySlugStorageKeys(entry) {
  const candidates = [];

  const rawCandidates = [
    entry && entry.previousId,
    ...(Array.isArray(entry && entry.previousIds) ? entry.previousIds : []),
    ...(Array.isArray(entry && entry.storageLegacyIds) ? entry.storageLegacyIds : []),
    ...(Array.isArray(entry && entry.storageMigrationIds) ? entry.storageMigrationIds : [])
  ];

  rawCandidates.forEach((candidate) => {
    const normalized = normalizeEntryId(candidate);
    if (normalized) {
      candidates.push(`watched_${normalized}`);
    }
  });

  return Array.from(new Set(candidates));
}

function getWatchedStorageKeysToCheck(entry) {
  return Array.from(new Set([
    getWatchedStorageKey(entry),
    ...getEntryLegacySlugStorageKeys(entry),
    getLegacyWatchedStorageKey(entry),
    getLegacyFingerprintWatchedStorageKey(entry)
  ]));
}

function removeWatchedStorageKeys(keys) {
  keys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore localStorage remove failures
    }
  });
}

export function loadCollapsedEras() {
  try {
    const raw = localStorage.getItem('sw_collapsed_eras');
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (e) {
    return new Set();
  }
}

export function saveCollapsedEras(set) {
  try {
    localStorage.setItem('sw_collapsed_eras', JSON.stringify(Array.from(set)));
  } catch (e) {
    // Ignore localStorage write failures
  }
}

export function saveWatchedState(entry) {
  const key = getWatchedStorageKey(entry);
  const staleKeys = getWatchedStorageKeysToCheck(entry).filter((candidate) => candidate !== key);
  try {
    localStorage.setItem(key, JSON.stringify(entry._watchedArray));
  } catch (e) {
    // Ignore localStorage write failures
  }
  removeWatchedStorageKeys(staleKeys);
  entry.watched = entry._watchedArray.filter(Boolean).length;
}

export function initializeWatchedState(timelineData, updateEntryUI) {
  timelineData.forEach((section) => {
    section.entries.forEach((entry) => {
      const key = getWatchedStorageKey(entry);
      const candidateKeys = getWatchedStorageKeysToCheck(entry);
      try {
        let raw = null;
        let loadedFromLegacy = false;
        let sourceKey = "";

        for (const candidateKey of candidateKeys) {
          raw = localStorage.getItem(candidateKey);
          if (raw) {
            sourceKey = candidateKey;
            loadedFromLegacy = candidateKey !== key;
            break;
          }
        }

        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr) && arr.length === entry.episodes) {
            entry._watchedArray = arr;
            entry.watched = arr.filter(Boolean).length;
            if (loadedFromLegacy) {
              try {
                localStorage.setItem(key, JSON.stringify(arr));
              } catch (e) {
                // Ignore localStorage write failures
              }
              removeWatchedStorageKeys(candidateKeys.filter((candidate) => candidate !== key && candidate === sourceKey));
            }
            return;
          }
        }
      } catch (e) {
        // Ignore parse and localStorage failures
      }

      if (Array.isArray(entry._watchedArray) && entry._watchedArray.length === entry.episodes) {
        entry.watched = entry._watchedArray.filter(Boolean).length;
        return;
      }

      entry._watchedArray = new Array(entry.episodes).fill(false);
      entry.watched = entry.watched || 0;
    });
  });

  timelineData.forEach((section, sectionIdx) => {
    section.entries.forEach((entry, entryIdx) => {
      updateEntryUI(sectionIdx, entryIdx);
    });
  });
}

export function resetAllProgress(timelineData, updateEntryUI) {
  timelineData.forEach((section, sectionIdx) => {
    section.entries.forEach((entry, entryIdx) => {
      entry._watchedArray = new Array(entry.episodes).fill(false);
      entry.watched = 0;
      removeWatchedStorageKeys(getWatchedStorageKeysToCheck(entry));
      updateEntryUI(sectionIdx, entryIdx);
    });
  });
}

export function getDefaultThemeId() {
  return DEFAULT_THEME_ID;
}

export function loadThemePreference(validThemeIds = []) {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_THEME_ID;
    }

    const normalized = String(raw).trim().toLowerCase();
    if (Array.isArray(validThemeIds) && validThemeIds.length > 0 && !validThemeIds.includes(normalized)) {
      return DEFAULT_THEME_ID;
    }

    return normalized || DEFAULT_THEME_ID;
  } catch (e) {
    return DEFAULT_THEME_ID;
  }
}

export function saveThemePreference(themeId) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, String(themeId || DEFAULT_THEME_ID));
  } catch (e) {
    // Ignore localStorage write failures
  }
}
