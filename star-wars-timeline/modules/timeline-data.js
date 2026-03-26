import { mediaLabel, slugifyEra } from "./constants.js";

export function normalizePosterPath(path) {
  if (!path) return "";
  return path;
}

function normalizeOptionalText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeOptionalUrl(value) {
  const trimmed = normalizeOptionalText(value);
  if (!trimmed) return "";
  return trimmed;
}

function getEntryTypeValue(entry) {
  return String(entry && entry.type ? entry.type : "");
}

function buildEpisodeCode(title, index) {
  const match = String(title || "").match(/^(S\d+\.E\d+)/i);
  return match ? match[1].toUpperCase() : `Entry ${index + 1}`;
}

export function isShowEntry(entry) {
  return /show|anthology/i.test(getEntryTypeValue(entry)) && Number(entry.episodes || 0) > 1;
}

export function isMovieEntry(entry) {
  return /film|movie/i.test(getEntryTypeValue(entry));
}

export function isAnimatedEntry(entry) {
  return /animated/i.test(getEntryTypeValue(entry));
}

export function isLiveActionEntry(entry) {
  return /live action/i.test(getEntryTypeValue(entry));
}

export function isShortEntry(entry) {
  return /short/i.test(getEntryTypeValue(entry));
}

export function isLegendsEntry(entry) {
  return !Boolean(entry && entry.canon);
}

export function getReleaseYearDisplay(entry) {
  if (!entry || !entry.releaseYear) return "";

  let releaseYearText = String(entry.releaseYear);
  if (isShowEntry(entry) && entry.seasons === 1) {
    const yearRangeMatch = releaseYearText.match(/^(\d{4})\s*-\s*(\d{4})$/);
    if (yearRangeMatch && yearRangeMatch[1] === yearRangeMatch[2]) {
      releaseYearText = yearRangeMatch[1];
    }
  }

  return releaseYearText;
}

export function getEntryMetaText(entry) {
  const parts = [];

  if (entry.year) {
    parts.push(`${entry.year}`);
  }

  const releaseYearText = getReleaseYearDisplay(entry);
  if (releaseYearText) {
    parts.push(releaseYearText);
  }

  if (isShowEntry(entry) && typeof entry.seasons === "number") {
    parts.push(`${entry.seasons} Season${entry.seasons === 1 ? "" : "s"}`);
  }

  return parts.join(" • ");
}

export function getEntryMetaDetails(entry) {
  const parts = [];

  const releaseYearText = getReleaseYearDisplay(entry);
  if (releaseYearText) {
    parts.push(releaseYearText);
  }

  if (isShowEntry(entry) && typeof entry.seasons === "number") {
    parts.push(`${entry.seasons} Season${entry.seasons === 1 ? "" : "s"}`);
  }

  return parts.join(" • ");
}

export function getEntryStoryMeta(entry, fallback = "") {
  const baseText = fallback || entry.mediaLabel || mediaLabel(entry.type);
  return isLegendsEntry(entry) ? `${baseText} • Legends` : baseText;
}

export function getEntryMetaDisplay(entry, fallback = "") {
  const metaText = entry.metaText || getEntryMetaText(entry) || fallback;
  return isLegendsEntry(entry) ? `${metaText} • Legends` : metaText;
}

export function getEntryDisplayYear(entry) {
  return normalizeOptionalText(entry && entry.year);
}

export function getEntrySynopsis(entry) {
  return normalizeOptionalText(entry && entry.synopsis);
}

export function getEntryShortSynopsis(entry, maxLength = 170) {
  const synopsis = getEntrySynopsis(entry);
  if (!synopsis) return "";
  if (synopsis.length <= maxLength) return synopsis;
  return `${synopsis.slice(0, maxLength)}...`;
}

function normalizeEpisodeDetails(entry) {
  if (Array.isArray(entry.episodeDetails) && entry.episodeDetails.length > 0) {
    return entry.episodeDetails.map((episode, index) => ({
      ...episode,
      title: episode && episode.title ? episode.title : `Entry ${index + 1}`,
      time: episode && episode.time ? episode.time : getEntryDisplayYear(entry),
      watchUrl: normalizeOptionalUrl(episode && episode.watchUrl),
      episodeCode: episode && episode.episodeCode ? episode.episodeCode : buildEpisodeCode(episode && episode.title, index)
    }));
  }

  return [{
    title: entry.title,
    time: getEntryDisplayYear(entry),
    watchUrl: normalizeOptionalUrl(entry.watchUrl),
    episodeCode: entry.episodes > 1 ? "Series" : "Feature"
  }];
}

export function getEntrySearchText(entry) {
  if (entry && entry.searchText) {
    return String(entry.searchText);
  }

  const episodeTitles = Array.isArray(entry.episodeDetails)
    ? entry.episodeDetails.map((ep) => (ep && ep.title ? ep.title : "")).join(" ")
    : "";

  const searchParts = [
    entry.title,
    getEntryDisplayYear(entry),
    getEntryTypeValue(entry),
    getEntrySynopsis(entry),
    String(entry.episodes),
    String(entry.watched),
    isLegendsEntry(entry) ? "legends non canon" : "canon official continuity",
    entry.releaseYear || "",
    typeof entry.seasons === "number" ? `${entry.seasons} season ${entry.seasons} seasons` : "",
    getEntryMetaText(entry),
    episodeTitles
  ];

  return searchParts.join(" ").toLowerCase();
}

function normalizeEntry(entry, section, sectionIndex, entryIndex) {
  const baseEntry = {
    ...entry,
    id: entry.id || `${sectionIndex}-${entryIndex}`,
    poster: normalizePosterPath(entry.poster),
    posterUrl: normalizePosterPath(entry.poster),
    era: section.era,
    eraColor: section.color,
    sectionIndex,
    entryIndex
  };

  const watchedCount = Number(baseEntry.watched || 0);
  const watchedArray = Array.isArray(baseEntry._watchedArray) && baseEntry._watchedArray.length === baseEntry.episodes
    ? baseEntry._watchedArray.slice()
    : new Array(baseEntry.episodes).fill(false).map((_, index) => index < watchedCount);
  const normalizedEpisodes = normalizeEpisodeDetails(baseEntry);
  const computedWatched = watchedArray.filter(Boolean).length;
  const primaryWatchUrl = normalizeOptionalUrl(baseEntry.watchUrl)
    || (normalizedEpisodes.length === 1 ? normalizedEpisodes[0].watchUrl || "" : "");
  const metaText = getEntryMetaText(baseEntry);
  const metaDetails = getEntryMetaDetails(baseEntry);
  const normalizedMediaLabel = mediaLabel(baseEntry.type);
  const showEntry = isShowEntry(baseEntry);
  const seriesEntry = Number(baseEntry.episodes || 0) > 1;
  const movieEntry = isMovieEntry(baseEntry);
  const animatedEntry = isAnimatedEntry(baseEntry);
  const liveActionEntry = isLiveActionEntry(baseEntry);
  const shortEntry = isShortEntry(baseEntry);
  const legendsEntry = isLegendsEntry(baseEntry);
  const displayYear = getEntryDisplayYear(baseEntry);
  const synopsis = getEntrySynopsis(baseEntry);

  const normalizedEntry = {
    ...baseEntry,
    _watchedArray: watchedArray,
    watched: computedWatched,
    episodeDetails: normalizedEpisodes,
    primaryWatchUrl,
    mediaLabel: normalizedMediaLabel,
    releaseYearDisplay: getReleaseYearDisplay(baseEntry),
    metaText,
    metaDetails,
    displayYear,
    synopsis,
    shortSynopsis: getEntryShortSynopsis(baseEntry),
    infoUrl: normalizeOptionalUrl(baseEntry.wookieepediaUrl),
    continuityLabel: legendsEntry ? "Legends" : "Canon",
    isCanon: !legendsEntry,
    isLegends: legendsEntry,
    isShow: showEntry,
    isSeries: seriesEntry,
    isMovie: movieEntry,
    isAnimated: animatedEntry,
    isLiveAction: liveActionEntry,
    isShort: shortEntry
  };

  return {
    ...normalizedEntry,
    storyMeta: getEntryStoryMeta({
      ...normalizedEntry,
      mediaLabel: normalizedMediaLabel
    }),
    metaDisplay: getEntryMetaDisplay({
      ...normalizedEntry,
      mediaLabel: normalizedMediaLabel,
      metaText
    }),
    searchText: getEntrySearchText({
      ...normalizedEntry,
      metaText
    })
  };
}

export function flattenSections(sections) {
  return sections.flatMap((section, sectionIndex) =>
    section.entries.map((entry, entryIndex) => normalizeEntry(entry, section, sectionIndex, entryIndex))
  );
}

export function normalizeSections(sections) {
  return sections.map((section, sectionIndex) => ({
    ...section,
    sectionIndex,
    anchorId: `era-${slugifyEra(section.era)}`,
    entries: section.entries.map((entry, entryIndex) => normalizeEntry(entry, section, sectionIndex, entryIndex))
  }));
}

export function prepareTimelineData(sections) {
  return normalizeSections(sections);
}

export function rebuildEntryIndex(timelineData) {
  const entryMap = new Map();
  const entries = [];

  timelineData.forEach((section) => {
    section.entries.forEach((entry) => {
      entry.watched = Array.isArray(entry._watchedArray) ? entry._watchedArray.filter(Boolean).length : Number(entry.watched || 0);
      entryMap.set(entry.id, entry);
      entries.push(entry);
    });
  });

  return {
    entryMap,
    entries
  };
}

export function getWatchedCount(entry) {
  return Array.isArray(entry._watchedArray)
    ? entry._watchedArray.filter(Boolean).length
    : Number(entry.watched || 0);
}

export function isSeriesEntry(entry) {
  if (typeof entry.isSeries === "boolean") {
    return entry.isSeries;
  }
  return entry.episodes > 1;
}

export function isComplete(entry) {
  return entry.episodes > 0 && getWatchedCount(entry) >= entry.episodes;
}

export function getEntryPlayUrl(entry) {
  if (!entry) return "";
  if (entry.primaryWatchUrl) return entry.primaryWatchUrl;
  if (entry.watchUrl) return normalizeOptionalUrl(entry.watchUrl);
  if (Array.isArray(entry.episodeDetails) && entry.episodeDetails.length === 1) {
    return normalizeOptionalUrl(entry.episodeDetails[0].watchUrl);
  }
  return "";
}

export function entryEpisodes(entry) {
  if (Array.isArray(entry.episodeDetails) && entry.episodeDetails.length > 0) {
    return entry.episodeDetails;
  }
  return normalizeEpisodeDetails(entry);
}

export function getMediaDistribution(entries) {
  return entries.reduce((acc, entry) => {
    if (typeof entry.isMovie === "boolean" ? entry.isMovie : isMovieEntry(entry)) {
      acc.movies += 1;
    } else if (typeof entry.isAnimated === "boolean" ? entry.isAnimated : isAnimatedEntry(entry)) {
      acc.animated += 1;
    } else if (typeof entry.isLiveAction === "boolean" ? entry.isLiveAction : isLiveActionEntry(entry)) {
      acc.liveAction += 1;
    } else {
      acc.other += 1;
    }
    return acc;
  }, { movies: 0, animated: 0, liveAction: 0, other: 0 });
}

export function getEraProgress(sections, getWatchedCountForEntry = getWatchedCount) {
  return sections.map((section) => {
    const totalEpisodes = section.entries.reduce((sum, entry) => sum + entry.episodes, 0);
    const watchedEpisodes = section.entries.reduce((sum, entry) => sum + getWatchedCountForEntry(entry), 0);
    const progress = totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;
    return {
      era: section.era,
      color: section.color,
      progress
    };
  });
}

export function getNextObjective(entries, isCompleteEntry = isComplete) {
  return entries.find((entry) => !isCompleteEntry(entry)) || entries[0] || null;
}

export function getEntryLegacyFingerprintParts(entry) {
  const episodes = entryEpisodes(entry);
  const firstEpisodeTitle = episodes.length > 0 && episodes[0].title ? episodes[0].title : "";

  return [
    entry.title || "",
    entry.year || "",
    getEntryTypeValue(entry),
    String(entry.episodes || ""),
    entry.releaseYear || "",
    typeof entry.seasons === "number" ? String(entry.seasons) : "",
    firstEpisodeTitle
  ];
}
