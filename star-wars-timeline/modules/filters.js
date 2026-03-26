import {
  isAnimatedEntry,
  isLegendsEntry,
  isLiveActionEntry,
  isMovieEntry,
  isShortEntry
} from "./timeline-data.js";

export function createDefaultFilters(eraNames) {
  return {
    search: "",
    eras: new Set(eraNames),
    type: "all",
    canon: "all",
    progress: "all",
    arc: "all"
  };
}

export function cloneFilters(filters) {
  return {
    search: filters.search,
    eras: new Set(filters.eras),
    type: filters.type,
    canon: filters.canon,
    progress: filters.progress,
    arc: filters.arc
  };
}

export function countActiveFilters(filters, allEraNames) {
  let count = 0;
  if (filters.search.trim()) count += 1;
  if (filters.type !== "all") count += 1;
  if (filters.canon !== "all") count += 1;
  if (filters.progress !== "all") count += 1;
  if (filters.arc !== "all") count += 1;
  if (filters.eras.size !== allEraNames.length) count += 1;
  return count;
}

export function entryMatchesFilters({
  entry,
  filters,
  preferences,
  timelineData,
  getEntrySearchText,
  getWatchedCount,
  isComplete,
  storyArcMatchers
}) {
  const isLegends = typeof entry.isLegends === "boolean" ? entry.isLegends : isLegendsEntry(entry);

  if (preferences) {
    if (preferences.canonOnly && isLegends) {
      return false;
    }
    if (!preferences.legendsIntegration && isLegends) {
      return false;
    }
    if (!preferences.includeAnimatedShorts && (typeof entry.isShort === "boolean" ? entry.isShort : isShortEntry(entry))) {
      return false;
    }
  }

  const rawSearch = filters.search.trim().toLowerCase();
  const searchText = rawSearch.length >= 3 ? rawSearch : "";
  const normalizedSearchText = String(entry.searchText || getEntrySearchText(entry));
  if (searchText && !normalizedSearchText.includes(searchText)) {
    return false;
  }

  if (!filters.eras.has(entry.era)) {
    return false;
  }

  if (filters.type === "movies" && !(typeof entry.isMovie === "boolean" ? entry.isMovie : isMovieEntry(entry))) {
    return false;
  }
  if (filters.type === "animated" && !(typeof entry.isAnimated === "boolean" ? entry.isAnimated : isAnimatedEntry(entry))) {
    return false;
  }
  if (filters.type === "live-action" && !(typeof entry.isLiveAction === "boolean" ? entry.isLiveAction : isLiveActionEntry(entry))) {
    return false;
  }

  if (filters.canon === "canon" && isLegends) {
    return false;
  }
  if (filters.canon === "legends" && !isLegends) {
    return false;
  }

  const watchedCount = getWatchedCount(entry);
  if (filters.progress === "unwatched" && watchedCount !== 0) {
    return false;
  }
  if (filters.progress === "in-progress" && !(watchedCount > 0 && watchedCount < entry.episodes)) {
    return false;
  }
  if (filters.progress === "watched" && !isComplete(entry)) {
    return false;
  }

  if (filters.arc !== "all") {
    const matcher = storyArcMatchers[filters.arc];
    const section = timelineData.find((candidate) => candidate.era === entry.era);
    if (typeof matcher === "function" && !matcher(entry, section)) {
      return false;
    }
  }

  return true;
}

export function getFilteredSections(timelineData, filterEntry) {
  return timelineData
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) => filterEntry(entry))
    }))
    .filter((section) => section.entries.length > 0);
}
