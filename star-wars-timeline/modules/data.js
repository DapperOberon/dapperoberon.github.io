import {
  getEntryDisplayYear,
  getEntryMetaDetails,
  getEntryMetaDisplay,
  getEntryMetaText,
  getEntryShortSynopsis,
  getEntrySearchText,
  getEntryStoryMeta,
  isShowEntry,
  normalizeOptionalUrl,
  normalizePosterPath,
  prepareTimelineData
} from "./timeline-data.js";

export async function loadTimelineData() {
  try {
    const response = await fetch("./data/timeline-data.json");
    if (!response.ok) {
      throw new Error(`Failed to load timeline data: ${response.status}`);
    }

    return prepareTimelineData(await response.json());
  } catch (error) {
    console.error("Error loading timeline data:", error);
    return null;
  }
}

export {
  getEntryDisplayYear,
  getEntryMetaDetails,
  getEntryMetaDisplay,
  getEntryMetaText,
  getEntryShortSynopsis,
  getEntrySearchText,
  getEntryStoryMeta,
  isShowEntry,
  normalizeOptionalUrl,
  normalizePosterPath
};

export function hexToRgb(hex) {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;

  const r = parseInt(expanded.substring(0, 2), 16);
  const g = parseInt(expanded.substring(2, 4), 16);
  const b = parseInt(expanded.substring(4, 6), 16);

  return `${r}, ${g}, ${b}`;
}

export function getMediaTypeInfo(type) {
  const typeMap = {
    'Live Action Film': { color: 'var(--type-film)', icon: '🎬', label: 'Film' },
    'Live Action Show': { color: 'var(--type-show)', icon: '📺', label: 'Live Action Show' },
    'Live Action TV Film': { color: 'var(--type-film)', icon: '🎬', label: 'TV Film' },
    'Animated Film': { color: 'var(--type-animated)', icon: '🎨', label: 'Animated Film' },
    'Animated Show': { color: 'var(--type-animated)', icon: '🎨', label: 'Animated Show' },
    'Animated Anthology': { color: 'var(--type-anthology)', icon: '✨', label: 'Anthology' }
  };

  return typeMap[type] || { color: 'var(--text-secondary)', icon: '📀', label: 'Media' };
}
