export async function loadTimelineData() {
  try {
    const response = await fetch('./timeline-data.json');
    if (!response.ok) {
      throw new Error(`Failed to load timeline data: ${response.status}`);
    }

    const timelineData = await response.json();

    timelineData.forEach((section) => {
      section.entries.forEach((entry) => {
        if (!entry._watchedArray) {
          const watchedCount = entry.watched || 0;
          entry._watchedArray = new Array(entry.episodes).fill(false);
          for (let i = 0; i < Math.min(watchedCount, entry.episodes); i++) {
            entry._watchedArray[i] = true;
          }
        }
      });
    });

    return timelineData;
  } catch (error) {
    console.error('Error loading timeline data:', error);
    return null;
  }
}

export function isShowEntry(entry) {
  return /show|anthology/i.test(entry.type) && entry.episodes > 1;
}

export function getEntryMetaText(entry) {
  const parts = [];

  if (entry.year) {
    parts.push(`${entry.year}`);
  }

  if (entry.releaseYear) {
    let releaseYearText = entry.releaseYear;
    if (isShowEntry(entry) && entry.seasons === 1) {
      const yearRangeMatch = String(entry.releaseYear).match(/^(\d{4})\s*-\s*(\d{4})$/);
      if (yearRangeMatch && yearRangeMatch[1] === yearRangeMatch[2]) {
        releaseYearText = yearRangeMatch[1];
      }
    }
    parts.push(releaseYearText);
  }

  if (isShowEntry(entry) && typeof entry.seasons === 'number') {
    parts.push(`${entry.seasons} Season${entry.seasons === 1 ? '' : 's'}`);
  }

  return parts.join(' • ');
}

export function getEntryMetaDetails(entry) {
  const parts = [];

  if (entry.releaseYear) {
    let releaseYearText = entry.releaseYear;
    if (isShowEntry(entry) && entry.seasons === 1) {
      const yearRangeMatch = String(entry.releaseYear).match(/^(\d{4})\s*-\s*(\d{4})$/);
      if (yearRangeMatch && yearRangeMatch[1] === yearRangeMatch[2]) {
        releaseYearText = yearRangeMatch[1];
      }
    }
    parts.push(releaseYearText);
  }

  if (isShowEntry(entry) && typeof entry.seasons === 'number') {
    parts.push(`${entry.seasons} Season${entry.seasons === 1 ? '' : 's'}`);
  }

  return parts.join(' • ');
}

export function getEntrySearchText(entry) {
  const episodeTitles = Array.isArray(entry.episodeDetails)
    ? entry.episodeDetails.map((ep) => (ep && ep.title ? ep.title : '')).join(' ')
    : '';

  const searchParts = [
    entry.title,
    entry.year,
    entry.type,
    entry.synopsis || '',
    String(entry.episodes),
    String(entry.watched),
    entry.canon ? 'canon official continuity' : 'legends non canon',
    entry.releaseYear || '',
    typeof entry.seasons === 'number' ? `${entry.seasons} season ${entry.seasons} seasons` : '',
    getEntryMetaText(entry),
    episodeTitles
  ];

  return searchParts.join(' ').toLowerCase();
}

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
