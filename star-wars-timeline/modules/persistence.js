export function getLegacyWatchedStorageKey(entry) {
  return 'watched_' + entry.title.replace(/\s+/g, '_');
}

export function getEntryStorageId(entry) {
  if (entry && entry.id) {
    return String(entry.id);
  }

  const firstEpisodeTitle =
    Array.isArray(entry.episodeDetails) && entry.episodeDetails.length > 0 && entry.episodeDetails[0].title
      ? entry.episodeDetails[0].title
      : '';

  const fingerprint = [
    entry.title || '',
    entry.year || '',
    entry.type || '',
    String(entry.episodes || ''),
    entry.releaseYear || '',
    typeof entry.seasons === 'number' ? String(entry.seasons) : '',
    firstEpisodeTitle
  ]
    .join('|')
    .toLowerCase();

  return fingerprint.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

export function getWatchedStorageKey(entry) {
  return 'watched_' + getEntryStorageId(entry);
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
  const legacyKey = getLegacyWatchedStorageKey(entry);
  try {
    localStorage.setItem(key, JSON.stringify(entry._watchedArray));
  } catch (e) {
    // Ignore localStorage write failures
  }
  if (legacyKey !== key) {
    try {
      localStorage.removeItem(legacyKey);
    } catch (e) {
      // Ignore localStorage remove failures
    }
  }
  entry.watched = entry._watchedArray.filter(Boolean).length;
}

export function initializeWatchedState(timelineData, updateEntryUI) {
  timelineData.forEach((section) => {
    section.entries.forEach((entry) => {
      const key = getWatchedStorageKey(entry);
      const legacyKey = getLegacyWatchedStorageKey(entry);
      try {
        let raw = localStorage.getItem(key);
        let loadedFromLegacy = false;
        if (!raw) {
          raw = localStorage.getItem(legacyKey);
          loadedFromLegacy = Boolean(raw);
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
              if (legacyKey !== key) {
                try {
                  localStorage.removeItem(legacyKey);
                } catch (e) {
                  // Ignore localStorage remove failures
                }
              }
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
      const key = getWatchedStorageKey(entry);
      const legacyKey = getLegacyWatchedStorageKey(entry);
      try {
        localStorage.removeItem(key);
      } catch (e) {
        // Ignore localStorage remove failures
      }
      if (legacyKey !== key) {
        try {
          localStorage.removeItem(legacyKey);
        } catch (e) {
          // Ignore localStorage remove failures
        }
      }
      updateEntryUI(sectionIdx, entryIdx);
    });
  });
}
