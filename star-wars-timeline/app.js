import {
  initializeWatchedState,
  resetAllProgress,
  saveWatchedState
} from "./modules/persistence.js";
import { createAudioController } from "./modules/audio.js";
import { calculateStats } from "./modules/stats.js";
import { getEntrySearchText } from "./modules/data.js";
import {
  renderDesktopSidebar,
  renderMobileAudioPlayer,
  renderMobileBottomNav,
  renderShellLayout,
  renderStandardFooter,
  renderStandardTopBar
} from "./modules/shell.js";
import {
  buildRenderShellOptions,
  renderAppMainContent
} from "./modules/app-layout.js";
import {
  initializeAppInteractions,
  initializeShellInteractions
} from "./modules/app-interactions.js";
import {
  createAudioUiRuntime,
  createViewActions,
  restoreOverlayFocus,
  restorePendingFocus,
  restoreFocusOrigin
} from "./modules/app-runtime.js";
import {
  attachGlobalKeyHandlers,
  bootstrapApp,
  createProgressActions
} from "./modules/app-state.js";

const PREFERENCES_STORAGE_KEY = "sw_redesign_preferences";
const PREFERENCES_SCHEMA_VERSION = 2;

const app = document.getElementById("app");
const appState = {
  timelineData: [],
  entries: [],
  entryMap: new Map(),
  activeEntryId: null,
  isFilterPanelOpen: false,
  isStatsOpen: false,
  isPreferencesOpen: false,
  filters: null,
  filterDraft: null,
  searchInputValue: "",
  pendingFocusTarget: null,
  pendingOverlayFocusSelector: null,
  lastFocusOrigin: null,
  lastFocusSelector: null,
  preferences: null
};
let audioController = null;
let activeSectionCleanup = null;
const audioUiUnsubscribeRef = { current: null };

const ERA_ASSETS = {
  "The High Republic": "./images/eras/high-republic.png",
  "Fall of the Jedi": "./images/eras/fall-of-the-jedi.png",
  "Reign of the Empire": "./images/eras/reign-of-the-empire.png",
  "Age of Rebellion": "./images/eras/age-of-the-rebellion.png",
  "Age of the Rebellion": "./images/eras/age-of-the-rebellion.png",
  "The New Republic": "./images/eras/new-republic.png",
  "Rise of the First Order": "./images/eras/rise-of-the-first-order.png",
  "New Jedi Order": "./images/eras/new-jedi-order.png",
  "Dawn of the Jedi": "./images/eras/dawn-of-the-jedi.png",
  "Old Republic": "./images/eras/old-republic.png",
  "Non-Timeline": "./images/eras/non-timeline.svg"
};

const TYPE_LABELS = [
  [/movie/i, "Movie"],
  [/animated/i, "Animated"],
  [/anthology/i, "Anthology"],
  [/short/i, "Short"],
  [/live/i, "Live Action"],
  [/series|show/i, "Series"]
];

const STORY_ARC_OPTIONS = [
  ["all", "All Arcs"],
  ["clone-wars", "Clone Wars"],
  ["mandoverse", "Mandoverse"],
  ["sequel-era", "Sequel Era"],
  ["george-lucas", "George Lucas"]
];

const STORY_ARC_MATCHERS = {
  "clone-wars": (entry, section) => {
    const title = String(entry.title || "").toLowerCase();
    const era = String((section && section.era) || "").toLowerCase();
    return (
      title.includes("clone wars")
      || title.includes("attack of the clones")
      || title.includes("revenge of the sith")
      || title.includes("bad batch")
      || title.includes("tales of the jedi")
      || title.includes("tales of the underworld")
      || era.includes("fall of the jedi")
    );
  },
  mandoverse: (entry, section) => {
    const title = String(entry.title || "").toLowerCase();
    const era = String((section && section.era) || "").toLowerCase();
    return (
      title.includes("the mandalorian")
      || title.includes("book of boba fett")
      || title.includes("ahsoka")
      || title.includes("skeleton crew")
      || era.includes("new republic")
    );
  },
  "sequel-era": (entry, section) => {
    const title = String(entry.title || "").toLowerCase();
    const era = String((section && section.era) || "").toLowerCase();
    return (
      title.includes("the force awakens")
      || title.includes("the last jedi")
      || title.includes("the rise of skywalker")
      || title.includes("star wars resistance")
      || era.includes("rise of the first order")
    );
  },
  "george-lucas": (entry) => {
    const title = String(entry.title || "");
    const titleLower = title.toLowerCase();
    const isEpisodeOneToSix = /\bepisode\s+(i|ii|iii|iv|v|vi)\b/i.test(title);
    const isTheCloneWars = titleLower.includes("the clone wars") || titleLower.includes("star wars: the clone wars");
    return isEpisodeOneToSix || isTheCloneWars;
  }
};

function normalizePosterPath(path) {
  if (!path) return "";
  return path;
}

function mediaLabel(type) {
  const value = type || "Media";
  for (const [pattern, label] of TYPE_LABELS) {
    if (pattern.test(value)) return label;
  }
  return value;
}

function slugifyEra(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function slugifyTitle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getEraAssetPath(era) {
  return ERA_ASSETS[era] || "";
}

function getDefaultPreferences() {
  return {
    schemaVersion: PREFERENCES_SCHEMA_VERSION,
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

function normalizeContinuityPreferences(preferences) {
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

function getAudioController() {
  if (!audioController) {
    audioController = createAudioController({
      musicDataPath: "./data/music-data.json",
      mediaBasePath: new URL("./", window.location.href).href
    });
  }
  return audioController;
}

function loadPreferences() {
  const defaults = getDefaultPreferences();
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    let migrated = {
      ...defaults,
      ...parsed
    };

    if (!parsed.schemaVersion || Number(parsed.schemaVersion) < PREFERENCES_SCHEMA_VERSION) {
      migrated.canonOnly = false;
      migrated.legendsIntegration = true;
      migrated.schemaVersion = PREFERENCES_SCHEMA_VERSION;
      try {
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(migrated));
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

function savePreferences() {
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(appState.preferences));
  } catch (error) {
    // Ignore localStorage failures for preferences.
  }
}

function applyPreferencesToDocument() {
  if (!appState.preferences) return;

  const root = document.documentElement;
  const body = document.body;
  const scanlineOpacity = Math.max(0, Math.min(100, Number(appState.preferences.scanlineIntensity || 0))) / 100;
  const glowBlur = 10 + Math.round((Math.max(0, Math.min(100, Number(appState.preferences.glowRadius || 0))) / 100) * 26);

  root.style.setProperty("--scanline-opacity", scanlineOpacity.toFixed(2));
  root.style.setProperty("--glow-blur", `${glowBlur}px`);
  body.dataset.interfaceTheme = appState.preferences.interfaceTheme || "sith-dark";
}

function getAllEraNames() {
  return appState.timelineData.map((section) => section.era);
}

function createDefaultFilters() {
  return {
    search: "",
    eras: new Set(getAllEraNames()),
    type: "all",
    canon: "all",
    progress: "all",
    arc: "all"
  };
}

function cloneFilters(filters) {
  return {
    search: filters.search,
    eras: new Set(filters.eras),
    type: filters.type,
    canon: filters.canon,
    progress: filters.progress,
    arc: filters.arc
  };
}

function countActiveFilters(filters) {
  let count = 0;
  if (filters.search.trim()) count += 1;
  if (filters.type !== "all") count += 1;
  if (filters.canon !== "all") count += 1;
  if (filters.progress !== "all") count += 1;
  if (filters.arc !== "all") count += 1;
  if (filters.eras.size !== getAllEraNames().length) count += 1;
  return count;
}

function entryMatchesFilters(entry, filters) {
  if (appState.preferences) {
    if (appState.preferences.canonOnly && !entry.canon) {
      return false;
    }
    if (!appState.preferences.legendsIntegration && !entry.canon) {
      return false;
    }
    if (!appState.preferences.includeAnimatedShorts && /short/i.test(entry.type)) {
      return false;
    }
  }

  const rawSearch = filters.search.trim().toLowerCase();
  const searchText = rawSearch.length >= 3 ? rawSearch : "";
  if (searchText && !getEntrySearchText(entry).includes(searchText)) {
    return false;
  }

  if (!filters.eras.has(entry.era)) {
    return false;
  }

  if (filters.type === "movies" && !/film|movie/i.test(entry.type)) {
    return false;
  }
  if (filters.type === "animated" && !/animated/i.test(entry.type)) {
    return false;
  }
  if (filters.type === "live-action" && !/live action/i.test(entry.type)) {
    return false;
  }

  if (filters.canon === "canon" && !entry.canon) {
    return false;
  }
  if (filters.canon === "legends" && entry.canon) {
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
    const matcher = STORY_ARC_MATCHERS[filters.arc];
    const section = appState.timelineData.find((candidate) => candidate.era === entry.era);
    if (typeof matcher === "function" && !matcher(entry, section)) {
      return false;
    }
  }

  return true;
}

function getFilteredSections() {
  return appState.timelineData
    .map((section) => ({
      ...section,
      entries: section.entries.filter((entry) => entryMatchesFilters(entry, appState.filters))
    }))
    .filter((section) => section.entries.length > 0);
}

function getFilteredEntries() {
  return getFilteredSections().flatMap((section) => section.entries);
}

function getModalEntryNavigation(entryId) {
  const entries = getFilteredEntries();
  const currentIndex = entries.findIndex((entry) => entry.id === entryId);
  if (currentIndex === -1) {
    return {
      previous: null,
      next: null
    };
  }

  return {
    previous: currentIndex > 0 ? entries[currentIndex - 1] : null,
    next: currentIndex < entries.length - 1 ? entries[currentIndex + 1] : null
  };
}

function buildEntryShareUrl(entry) {
  const url = new URL(window.location.href);
  if (!entry || !entry.id) {
    url.searchParams.delete("entry");
    url.searchParams.delete("title");
    return url;
  }

  url.searchParams.set("entry", entry.id);
  url.searchParams.set("title", slugifyTitle(entry.title));
  return url;
}

function syncEntryUrl(entry, { mode = "replace" } = {}) {
  const url = buildEntryShareUrl(entry);
  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  if (mode === "push") {
    window.history.pushState({}, "", nextUrl);
    return;
  }
  window.history.replaceState({}, "", nextUrl);
}

function getEntryIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const entryId = params.get("entry");
  return entryId ? String(entryId).trim() : "";
}

function applyEntryStateFromUrl({ shouldRender = true } = {}) {
  const entryId = getEntryIdFromUrl();
  const nextEntryId = entryId && appState.entryMap.has(entryId) ? entryId : null;
  if (entryId && !nextEntryId) {
    syncEntryUrl(null, { mode: "replace" });
  }
  appState.activeEntryId = nextEntryId;
  if (nextEntryId) {
    appState.pendingOverlayFocusSelector = "#entry-modal button[data-close-modal='true']";
  }
  if (shouldRender) {
    renderApp(appState.timelineData);
  }
}

function getMediaDistribution(entries) {
  return entries.reduce((acc, entry) => {
    if (/film|movie/i.test(entry.type)) {
      acc.movies += 1;
    } else if (/animated/i.test(entry.type)) {
      acc.animated += 1;
    } else if (/live action/i.test(entry.type)) {
      acc.liveAction += 1;
    } else {
      acc.other += 1;
    }
    return acc;
  }, { movies: 0, animated: 0, liveAction: 0, other: 0 });
}

function getEraProgress(sections) {
  return sections.map((section) => {
    const totalEpisodes = section.entries.reduce((sum, entry) => sum + entry.episodes, 0);
    const watchedEpisodes = section.entries.reduce((sum, entry) => sum + getWatchedCount(entry), 0);
    const progress = totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;
    return {
      era: section.era,
      color: section.color,
      progress
    };
  });
}

function getNextObjective(entries) {
  return entries.find((entry) => !isComplete(entry)) || entries[0] || null;
}

function hasActiveOverlay() {
  return Boolean(
    appState.activeEntryId ||
    appState.isFilterPanelOpen
  );
}

function getCurrentPage() {
  if (appState.isPreferencesOpen) return "preferences";
  if (appState.isStatsOpen) return "stats";
  return "timeline";
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function scrollToTargetElement(target) {
  if (!target) return;
  target.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block: "start"
  });
}

function getFocusableElements(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )).filter((element) => !element.hasAttribute("disabled") && !element.getAttribute("aria-hidden"));
}

function setActiveScrollTarget(targetId) {
  document.querySelectorAll("[data-scroll-target]").forEach((button) => {
    button.classList.toggle("is-active", button.getAttribute("data-scroll-target") === targetId);
  });
}

function initializeActiveSectionTracking() {
  if (activeSectionCleanup) {
    activeSectionCleanup();
    activeSectionCleanup = null;
  }

  const currentPage = getCurrentPage();
  const isMobile = window.innerWidth < 768;
  let targetIds = [];

  if (currentPage === "preferences") {
    targetIds = ["prefs-temporal", "prefs-content", "prefs-interface", "prefs-system"];
  } else if (currentPage === "stats") {
    targetIds = ["stats-overview", "stats-era-breakdown", "stats-media-distribution", "stats-next-objective"];
  } else {
    targetIds = Array.from(document.querySelectorAll("[data-scroll-target]"))
      .map((button) => button.getAttribute("data-scroll-target"))
      .filter((id) => id && (isMobile ? id.startsWith("mobile-era-") : id.startsWith("era-")));
  }

  const sections = targetIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (sections.length === 0) return;

  let ticking = false;

  const updateActiveSection = () => {
    ticking = false;

    const focusLine = window.innerHeight * (isMobile ? 0.28 : 0.33);
    const orderedSections = sections
      .map((section) => ({ section, rect: section.getBoundingClientRect() }))
      .sort((a, b) => a.rect.top - b.rect.top);

    const crossedSections = orderedSections.filter(({ rect }) => rect.top <= focusLine);
    const activeSection = crossedSections.length > 0
      ? crossedSections[crossedSections.length - 1].section
      : orderedSections[0].section;

    if (activeSection) {
      setActiveScrollTarget(activeSection.id);
    }
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateActiveSection);
  };

  updateActiveSection();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
  activeSectionCleanup = () => {
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", requestUpdate);
  };
}

function flattenSections(sections) {
  return sections.flatMap((section, sectionIndex) =>
    section.entries.map((entry, entryIndex) => ({
      ...entry,
      id: entry.id || `${sectionIndex}-${entryIndex}`,
      poster: normalizePosterPath(entry.poster),
      era: section.era,
      eraColor: section.color,
      sectionIndex,
      entryIndex
    }))
  );
}

function normalizeSections(sections) {
  return sections.map((section, sectionIndex) => ({
    ...section,
    sectionIndex,
    anchorId: `era-${slugifyEra(section.era)}`,
    entries: section.entries.map((entry, entryIndex) => ({
      ...entry,
      id: entry.id || `${sectionIndex}-${entryIndex}`,
      poster: normalizePosterPath(entry.poster),
      era: section.era,
      eraColor: section.color,
      sectionIndex,
      entryIndex
    }))
  }));
}

function prepareTimelineData(sections) {
  return normalizeSections(sections).map((section) => ({
    ...section,
    entries: section.entries.map((entry) => {
      const watchedCount = Number(entry.watched || 0);
      const watchedArray = Array.isArray(entry._watchedArray) && entry._watchedArray.length === entry.episodes
        ? entry._watchedArray.slice()
        : new Array(entry.episodes).fill(false).map((_, index) => index < watchedCount);

      return {
        ...entry,
        _watchedArray: watchedArray,
        watched: watchedArray.filter(Boolean).length
      };
    })
  }));
}

function rebuildEntryIndex() {
  const entryMap = new Map();
  const entries = [];

  appState.timelineData.forEach((section) => {
    section.entries.forEach((entry) => {
      entry.watched = Array.isArray(entry._watchedArray) ? entry._watchedArray.filter(Boolean).length : Number(entry.watched || 0);
      entryMap.set(entry.id, entry);
      entries.push(entry);
    });
  });

  appState.entryMap = entryMap;
  appState.entries = entries;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function entryMeta(entry) {
  if (entry.episodes <= 1) {
    return mediaLabel(entry.type);
  }
  return `${entry.episodes} Episodes`;
}

function getWatchedCount(entry) {
  return Array.isArray(entry._watchedArray)
    ? entry._watchedArray.filter(Boolean).length
    : Number(entry.watched || 0);
}

function isSeriesEntry(entry) {
  return entry.episodes > 1;
}

function isComplete(entry) {
  return entry.episodes > 0 && getWatchedCount(entry) >= entry.episodes;
}

function getTimelineEntryLabel(entry) {
  const watchedCount = getWatchedCount(entry);
  if (isComplete(entry)) return "Watched";
  if (watchedCount > 0) return "Continue Watching";
  return isSeriesEntry(entry) ? "See Details" : "Start Watching";
}

function getModalPrimaryLabel(entry) {
  const watchedCount = getWatchedCount(entry);
  if (isComplete(entry)) return "Watched";
  if (watchedCount > 0) return "Continue Watching";
  return "Start Watching";
}

function getEntryPlayUrl(entry) {
  if (!entry) return "";
  if (entry.watchUrl) return entry.watchUrl;
  if (Array.isArray(entry.episodeDetails) && entry.episodeDetails.length === 1) {
    return entry.episodeDetails[0].watchUrl || "";
  }
  return "";
}

function entryEpisodes(entry) {
  if (Array.isArray(entry.episodeDetails) && entry.episodeDetails.length > 0) {
    return entry.episodeDetails;
  }
  return [{
    title: entry.title,
    time: entry.year,
    episodeCode: entry.episodes > 1 ? "Series" : "Feature"
  }];
}

function buildEpisodeCode(title, index) {
  const match = String(title || "").match(/^(S\d+\.E\d+)/i);
  return match ? match[1].toUpperCase() : `Entry ${index + 1}`;
}

function renderDesktopEpisodeItem(episode, index, nextIndex, watchedCount) {
  const watched = Array.isArray(watchedCount)
    ? Boolean(watchedCount[index])
    : index < watchedCount;
  const isNext = nextIndex >= 0 && index === nextIndex;
  const playAction = episode.watchUrl
    ? `
        <a class="icon-button w-10 h-10 material-symbols-outlined ${isNext ? "text-primary-fixed" : "text-slate-400 hover:text-primary-fixed"} transition-colors" href="${escapeHtml(episode.watchUrl)}" target="_blank" rel="noopener noreferrer" data-episode-play="${index}" aria-label="Watch ${escapeHtml(episode.title)}">play_circle</a>
      `
    : `
        <span class="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container-high text-slate-500 font-label text-[10px] uppercase tracking-[0.18em]" aria-label="Unavailable">
          <span class="material-symbols-outlined text-sm" aria-hidden="true">block</span>
          <span>Unavailable</span>
        </span>
      `;
  const cardClass = isNext
    ? "bg-white/[0.06] ring-1 ring-primary-fixed/45 shadow-[0_0_24px_rgba(251,228,25,0.12)]"
    : watched
      ? "bg-surface-container-low/80 hover:bg-surface-container-high ring-1 ring-white/5"
      : "bg-surface-container-low/70 hover:bg-surface-container-high ring-1 ring-white/5 opacity-70 hover:opacity-100";
  const codeTone = isNext ? "text-primary-fixed animate-pulse" : "text-secondary";

  return `
    <div class="group flex items-center justify-between px-5 py-4 rounded-lg ${cardClass} transition-all">
      <div class="flex items-center space-x-5 min-w-0">
        <button class="w-7 h-7 border ${watched ? "border-primary-fixed bg-primary-fixed" : isNext ? "border-primary-fixed/50 bg-primary-fixed/10" : "border-slate-700"} rounded-md flex items-center justify-center transition-colors" type="button" data-episode-toggle="${index}">
          <span class="material-symbols-outlined text-on-primary-fixed text-sm font-bold ${watched ? "opacity-100" : "opacity-0"}">check</span>
        </button>
        <div class="flex flex-col min-w-0">
          <span class="text-[10px] font-label ${codeTone} uppercase tracking-[0.18em]">${isNext ? "Next Episode" : escapeHtml(buildEpisodeCode(episode.title, index))}</span>
          <span class="font-headline text-[1.05rem] text-white group-hover:text-primary-fixed transition-colors truncate">${escapeHtml(episode.title)}</span>
        </div>
      </div>
      <div class="flex items-center space-x-6 flex-shrink-0">
        <div class="text-right">
          <span class="block text-[10px] font-label text-slate-500 uppercase tracking-[0.2em]">Timestamp</span>
          <span class="text-sm font-headline text-slate-300">${escapeHtml(episode.time || "")}</span>
        </div>
        ${playAction}
      </div>
    </div>
  `;
}

function renderMobileEpisodeItem(episode, index, nextIndex, watchedCount, poster) {
  const watched = Array.isArray(watchedCount)
    ? Boolean(watchedCount[index])
    : index < watchedCount;
  const isNext = nextIndex >= 0 && index === nextIndex;
  const actionIcon = watched ? "check_circle" : "bookmark_add";
  const playSurface = episode.watchUrl
    ? `
        <a class="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-highest group/play" href="${escapeHtml(episode.watchUrl)}" target="_blank" rel="noopener noreferrer" data-episode-play="${index}" aria-label="Watch ${escapeHtml(episode.title)}">
          <img class="w-full h-full object-cover opacity-60" src="${escapeHtml(poster)}" alt="${escapeHtml(episode.title)}">
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-2xl group-active:scale-125 group-hover/play:scale-110 transition-transform" style="font-variation-settings: 'FILL' 1;">play_circle</span>
          </div>
        </a>
      `
    : `
        <div class="flex-shrink-0">
          <span class="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container-high text-slate-500 font-label text-[10px] uppercase tracking-[0.18em]" aria-label="Unavailable">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">block</span>
            <span>Unavailable</span>
          </span>
        </div>
      `;
  return `
    <div class="glass-card rounded-xl p-4 flex items-center gap-4 active:bg-white/5 transition-colors group">
      ${playSurface}
      <div class="flex-grow min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <span class="text-[10px] font-label font-bold ${isNext ? "text-primary-fixed" : "text-secondary"} tracking-tight uppercase">${escapeHtml(buildEpisodeCode(episode.title, index))}</span>
          <span class="w-1 h-1 bg-outline-variant rounded-full"></span>
          <span class="text-[10px] font-label text-on-surface-variant font-medium tracking-widest">${escapeHtml(episode.time || "")}</span>
        </div>
        <h4 class="text-sm font-headline font-bold text-white truncate">${escapeHtml(episode.title)}</h4>
      </div>
      <button class="p-2 ${watched ? "text-primary-fixed" : "text-on-surface-variant hover:text-primary-fixed"} transition-colors" type="button" aria-label="${watched ? "Watched" : "Save"} ${escapeHtml(episode.title)}" data-episode-toggle="${index}">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${watched ? 1 : 0};">${actionIcon}</span>
      </button>
    </div>
  `;
}

function renderModal(entry) {
  if (!entry) return "";

  const episodes = entryEpisodes(entry);
  const modalNav = getModalEntryNavigation(entry.id);
  const watchedStates = Array.isArray(entry._watchedArray) && entry._watchedArray.length === entry.episodes
    ? entry._watchedArray.slice()
    : new Array(episodes.length).fill(false).map((_, index) => index < Math.max(0, Math.min(getWatchedCount(entry), episodes.length)));
  const watchedCount = watchedStates.filter(Boolean).length;
  const rawNextIndex = watchedStates.findIndex((watched) => !watched);
  const nextIndex = rawNextIndex >= 0 ? rawNextIndex : -1;
  const watchedSummary = `${watchedCount}/${episodes.length} Watched`;
  const metaLine = entry.episodes > 1
    ? `${entry.episodes} Episodes • ${mediaLabel(entry.type)}`
    : mediaLabel(entry.type);
  const mobileStoryMeta = entry.canon ? entryMeta(entry) : `${entryMeta(entry)} • Legends`;
  const infoAction = entry.wookieepediaUrl
    ? `
      <a class="ghost-button px-5 py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2" href="${escapeHtml(entry.wookieepediaUrl)}" target="_blank" rel="noopener noreferrer" data-entry-info="${escapeHtml(entry.id)}">
        <span class="material-symbols-outlined text-sm">info</span>
        Info
      </a>
    `
    : "";
  const mobileInfoAction = entry.wookieepediaUrl
    ? `
      <a class="ghost-button px-4 py-4 text-[10px] font-label font-bold uppercase tracking-[0.2em] inline-flex items-center justify-center" href="${escapeHtml(entry.wookieepediaUrl)}" target="_blank" rel="noopener noreferrer" data-entry-info="${escapeHtml(entry.id)}" aria-label="Open ${escapeHtml(entry.title)} on Wookieepedia">
        <span class="material-symbols-outlined text-sm">info</span>
      </a>
    `
    : "";

  return `
    <div id="entry-modal" class="fixed inset-0 z-[90]" aria-hidden="false" role="dialog" aria-modal="true" aria-labelledby="entry-modal-title">
      <div class="hidden md:block fixed inset-0 pt-24 px-4 pb-4 lg:pl-[19rem]">
        <div class="absolute inset-0 bg-surface-container-lowest/90 backdrop-blur-md modal-close-surface" data-close-modal="true"></div>
        <div class="relative w-full h-full glass-panel rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          <button class="absolute top-5 right-5 z-20 w-12 h-12 rounded-full bg-surface-container-highest/80 flex items-center justify-center hover:bg-primary-fixed hover:text-on-primary-fixed transition-all" type="button" data-close-modal="true" aria-label="Close details">
            <span class="material-symbols-outlined">close</span>
          </button>
          <header class="relative flex-shrink-0">
            <div class="absolute inset-0 z-0">
              <img class="w-full h-full object-cover opacity-40" src="${escapeHtml(entry.poster)}" alt="${escapeHtml(entry.title)}">
              <div class="absolute inset-0 scrim-bottom"></div>
              <div class="absolute inset-0 bg-gradient-to-r from-black/60 via-black/15 to-black/45"></div>
            </div>
            <div class="relative z-10 p-8 md:p-12 lg:px-14 flex flex-col md:flex-row gap-8 lg:gap-10 items-end min-h-[21rem]">
              <div class="w-40 md:w-56 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-2 ring-primary-fixed/20 flex-shrink-0">
                <img class="w-full h-full object-cover" src="${escapeHtml(entry.poster)}" alt="${escapeHtml(entry.title)} poster">
              </div>
              <div class="flex-grow space-y-5 max-w-4xl">
                <div class="flex items-center gap-3 mb-1 flex-wrap">
                  <span class="kicker-label">${escapeHtml(entry.era)}</span>
                  <span class="story-meta text-secondary">${escapeHtml(metaLine)}</span>
                </div>
                <h2 id="entry-modal-title" class="max-w-4xl text-4xl md:text-6xl xl:text-7xl font-headline font-bold text-white tracking-tighter uppercase leading-[0.95]">${escapeHtml(entry.title)}</h2>
                <p class="max-w-2xl text-slate-300 font-body text-sm md:text-lg leading-relaxed opacity-90">${escapeHtml(entry.synopsis || "Entry synopsis coming soon.")}</p>
                <div class="flex items-center gap-6 pt-3 flex-wrap">
                  <button class="cta-primary px-7" type="button" data-modal-primary>
                    ${getModalPrimaryLabel(entry)}
                  </button>
                  <button class="ghost-button px-5 py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em]" type="button" data-share-entry="${escapeHtml(entry.id)}">
                    <span class="material-symbols-outlined text-sm">share</span>
                    Share
                  </button>
                  ${infoAction}
                  <div class="flex items-center space-x-2 text-slate-300">
                    <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">visibility</span>
                    <span class="text-sm font-headline tracking-wide">${escapeHtml(watchedSummary)}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main class="flex-grow overflow-y-auto px-8 md:px-12 lg:px-14 pb-12">
            <div class="flex items-center justify-between sticky top-0 z-20 py-6 bg-[linear-gradient(to_bottom,rgba(22,22,22,0.96),rgba(22,22,22,0.84),transparent)] backdrop-blur-sm">
              <h3 class="font-headline text-lg uppercase tracking-[0.18em] text-[#75d1ff]">Episodes</h3>
              <div class="flex items-center space-x-4">
                <div class="h-1 w-24 bg-surface-container-highest rounded-full overflow-hidden">
                  <div class="h-full" style="width:${episodes.length ? Math.round((watchedCount / episodes.length) * 100) : 0}%; background:#fbe419; box-shadow:0 0 8px rgba(251,228,25,0.5);"></div>
                </div>
                <span class="text-[10px] font-label text-white uppercase tracking-[0.2em]">${escapeHtml(watchedSummary)}</span>
              </div>
            </div>
            <div class="space-y-2.5">
              ${episodes.map((episode, index) => renderDesktopEpisodeItem(episode, index, nextIndex, watchedStates)).join("")}
            </div>
            <div class="pt-8 flex items-center justify-between gap-4">
              <button class="ghost-button inline-flex items-center justify-center gap-2 px-5 py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em] ${modalNav.previous ? "" : "opacity-35 pointer-events-none"}" type="button" ${modalNav.previous ? `data-modal-nav="previous"` : "disabled"}>
                <span class="material-symbols-outlined text-sm">west</span>
                ${modalNav.previous ? `Previous: ${escapeHtml(modalNav.previous.title)}` : "Start of Timeline"}
              </button>
              <button class="ghost-button inline-flex items-center justify-center gap-2 px-5 py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em] ${modalNav.next ? "" : "opacity-35 pointer-events-none"}" type="button" ${modalNav.next ? `data-modal-nav="next"` : "disabled"}>
                ${modalNav.next ? `Next: ${escapeHtml(modalNav.next.title)}` : "End of Timeline"}
                <span class="material-symbols-outlined text-sm">east</span>
              </button>
            </div>
          </main>
        </div>
      </div>

      <div class="md:hidden fixed inset-0 bg-background overflow-y-auto">
        <main class="relative pt-0 pb-10 min-h-screen bg-surface overflow-x-hidden">
          <section class="relative h-[486px] w-full overflow-hidden">
            <div class="absolute inset-0 z-0">
              <img class="w-full h-full object-cover scale-105" src="${escapeHtml(entry.poster)}" alt="${escapeHtml(entry.title)}">
              <div class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
              <div class="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-transparent"></div>
            </div>
            <button class="absolute top-20 right-6 z-20 w-10 h-10 rounded-full glass-card flex items-center justify-center text-on-surface active:scale-90 transition-transform" type="button" data-close-modal="true" aria-label="Close details">
              <span class="material-symbols-outlined">close</span>
            </button>
            <div class="absolute bottom-0 left-0 w-full p-6 z-10 space-y-4">
              <div class="space-y-1">
                <span class="font-label text-xs uppercase tracking-[0.22em] text-[#FFE81F] font-bold">${escapeHtml(entry.era)}</span>
                <h2 class="font-headline text-4xl font-black text-white leading-none tracking-tight max-w-[18rem]">${escapeHtml(entry.title)}</h2>
              </div>
              <div class="flex items-center gap-3 text-xs font-label text-on-surface-variant tracking-wider flex-wrap">
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm text-secondary" style="font-variation-settings: 'FILL' 1;">visibility</span>
                  ${escapeHtml(watchedSummary)}
                </span>
                <span class="w-1 h-1 bg-outline-variant rounded-full"></span>
                <span>${escapeHtml(mobileStoryMeta)}</span>
              </div>
              <p class="text-on-surface-variant text-sm leading-relaxed max-w-md line-clamp-3 font-light">${escapeHtml(entry.synopsis || "Entry synopsis coming soon.")}</p>
              <div class="pt-2">
                <div class="flex gap-3">
                  <button class="flex-1 w-full py-4 bg-primary-fixed text-on-primary-fixed font-headline font-bold rounded-full flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,228,25,0.3)] active:scale-[0.98] transition-all" type="button" data-modal-primary>
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                    ${getModalPrimaryLabel(entry).toUpperCase()}
                  </button>
                  <button class="ghost-button px-4 py-4 text-[10px] font-label font-bold uppercase tracking-[0.2em]" type="button" data-share-entry="${escapeHtml(entry.id)}" aria-label="Share ${escapeHtml(entry.title)}">
                    <span class="material-symbols-outlined text-sm">share</span>
                  </button>
                  ${mobileInfoAction}
                </div>
              </div>
            </div>
          </section>
          <section class="px-6 space-y-6 mt-4">
            <div class="flex items-center justify-between">
              <h3 class="font-headline text-lg font-bold tracking-widest uppercase text-white">Episodes</h3>
              <span class="story-meta">${escapeHtml(watchedSummary)}</span>
            </div>
            <div class="space-y-3 pb-4">
              ${episodes.map((episode, index) => renderMobileEpisodeItem(episode, index, nextIndex, watchedStates, entry.poster)).join("")}
            </div>
            <div class="grid grid-cols-2 gap-3 pb-6">
              <button class="ghost-button inline-flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em] ${modalNav.previous ? "" : "opacity-35 pointer-events-none"}" type="button" ${modalNav.previous ? `data-modal-nav="previous"` : "disabled"}>
                <span class="material-symbols-outlined text-sm">west</span>
                Prev
              </button>
              <button class="ghost-button inline-flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em] ${modalNav.next ? "" : "opacity-35 pointer-events-none"}" type="button" ${modalNav.next ? `data-modal-nav="next"` : "disabled"}>
                Next
                <span class="material-symbols-outlined text-sm">east</span>
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  `;
}

function renderDesktopEntry(entry, index) {
  const reverse = index % 2 === 1;
  const watchedCount = getWatchedCount(entry);
  const playUrl = getEntryPlayUrl(entry);
  const nodeBorder = watchedCount > 0 ? "border-secondary" : "border-primary-fixed";
  const nodeCore = watchedCount > 0 ? "bg-secondary" : "bg-primary-fixed";
  const yearTone = watchedCount > 0 ? "text-secondary" : "text-primary-fixed";
  const watchLabel = getTimelineEntryLabel(entry);
  const watchIcon = isSeriesEntry(entry)
    ? (isComplete(entry) ? "check_circle" : "visibility")
    : (isComplete(entry) ? "check_circle" : "visibility");
  const watchButton = isComplete(entry)
    ? "bg-primary-fixed/90 text-on-primary-fixed"
    : "bg-background/80 text-white";
  const synopsis = entry.synopsis ? escapeHtml(entry.synopsis.slice(0, 170)) : "";
  const storyMeta = entry.canon ? mediaLabel(entry.type) : `${mediaLabel(entry.type)} • Legends`;

  return `
    <article class="relative flex flex-col md:${reverse ? "flex-row-reverse" : "flex-row"} items-center justify-between group gap-8 md:gap-0 cursor-pointer" data-era="${escapeHtml(entry.era)}" data-entry-id="${escapeHtml(entry.id)}" tabindex="0"${entry.anchorId ? ` id="${escapeHtml(entry.anchorId)}"` : ""}>
      <div class="absolute left-0 md:left-1/2 -translate-x-1/2 w-10 h-10 bg-background border-2 ${nodeBorder} rounded-full z-10 flex items-center justify-center ${entry.watched > 0 ? "" : "shadow-[0_0_15px_rgba(251,228,25,0.4)]"}">
        <div class="w-2 h-2 ${nodeCore} rounded-full ${entry.watched > 0 ? "" : "animate-pulse"}"></div>
      </div>
      <div class="md:w-[45%] pl-12 md:pl-0 ${reverse ? "" : "md:text-right"}">
        <div class="inline-flex items-center gap-3 mb-3 ${reverse ? "" : "md:ml-auto md:justify-end"}">
          <span class="${yearTone} font-headline font-bold text-2xl tracking-tighter block">${escapeHtml(entry.year)}</span>
          <span class="story-meta hidden md:inline-flex items-center gap-2">
            <span class="story-meta-dot"></span>
            <span>${escapeHtml(storyMeta)}</span>
          </span>
        </div>
        <h3 class="text-xl xl:text-[1.65rem] font-headline font-bold text-white uppercase tracking-tight leading-none">${escapeHtml(entry.title)}</h3>
        ${synopsis ? `<p class="text-on-surface-variant text-sm mt-3 leading-relaxed max-w-md ${reverse ? "" : "ml-auto"}">${synopsis}${entry.synopsis.length > 170 ? "..." : ""}</p>` : ""}
      </div>
      <div class="hidden md:block w-[45%]">
        <div class="relative overflow-hidden group/card bg-surface-container-low aspect-video shadow-2xl">
          <img class="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110 grayscale-[0.5] group-hover/card:grayscale-0" src="${escapeHtml(entry.poster)}" alt="${escapeHtml(entry.title)}"/>
          <div class="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent"></div>
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-fixed/80 via-primary-fixed/20 to-transparent"></div>
          <div class="absolute top-4 left-4">
            <span class="story-meta bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-full text-white/68">${escapeHtml(entryMeta(entry))}</span>
          </div>
          <div class="absolute bottom-4 ${reverse ? "left-4" : "right-4"} flex items-center gap-3">
          ${playUrl && !isSeriesEntry(entry) ? `
            <a class="ghost-button inline-flex items-center gap-2 px-4 py-2 rounded-full" href="${escapeHtml(playUrl)}" target="_blank" rel="noopener noreferrer" data-entry-play="${escapeHtml(entry.id)}" aria-label="Watch ${escapeHtml(entry.title)}">
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
              <span class="text-[10px] font-label uppercase tracking-widest">Play</span>
            </a>
          ` : ""}
          <button class="desktop-media-button flex items-center gap-2 ${watchButton} backdrop-blur-md px-4 py-2 rounded-full transition-all" type="button" ${isSeriesEntry(entry) ? `data-open-modal="${escapeHtml(entry.id)}"` : `data-toggle-entry="${escapeHtml(entry.id)}"`}>
            <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">${watchIcon}</span>
            <span class="text-[10px] font-label uppercase tracking-widest ${watchedCount > 0 ? "font-bold" : ""}">${watchLabel}</span>
          </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderDesktopSection(section, startIndex) {
  const eraAsset = getEraAssetPath(section.era);
  return `
    <div class="relative" id="${escapeHtml(section.anchorId)}">
      <div class="absolute left-1/2 -translate-x-1/2 -top-12 w-3 h-3 rounded-full shadow-[0_0_15px_currentColor]" style="color:${escapeHtml(section.color)}; background:${escapeHtml(section.color)};"></div>
      <h3 class="text-center font-headline font-bold text-3xl uppercase tracking-[0.2em] mb-24 relative z-20 bg-background inline-flex items-center gap-4 left-1/2 -translate-x-1/2 px-8" style="color:${escapeHtml(section.color)};">
        ${eraAsset ? `<img class="era-logo era-logo--heading" src="${escapeHtml(eraAsset)}" alt="" aria-hidden="true">` : ""}
        <span>${escapeHtml(section.era)}</span>
      </h3>
      <div class="space-y-24">
        ${section.entries.map((entry, index) => renderDesktopEntry(entry, startIndex + index)).join("")}
      </div>
    </div>
  `;
}

function renderMobileSection(section) {
  const eraAsset = getEraAssetPath(section.era);
  return `
    <section class="mb-16 relative" id="mobile-era-${section.sectionIndex}">
      <div class="flex items-center gap-4 mb-8 -ml-4">
        <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(251,228,25,0.25)]" style="background:${escapeHtml(section.color)};">
          ${eraAsset ? `<img class="era-logo era-logo--mobile" src="${escapeHtml(eraAsset)}" alt="" aria-hidden="true">` : ""}
        </div>
        <h3 class="font-headline font-bold text-lg tracking-widest uppercase" style="color:${escapeHtml(section.color)};">${escapeHtml(section.era)}</h3>
      </div>
      <div class="space-y-8 pl-8 relative">
        ${section.entries.map(renderMobileEntry).join("")}
      </div>
    </section>
  `;
}

function renderMobileEntry(entry) {
  const checked = getWatchedCount(entry) > 0;
  const series = isSeriesEntry(entry);
  const playUrl = getEntryPlayUrl(entry);
  const storyMeta = entry.canon ? entry.year : `${entry.year} • Legends`;
  return `
    <article class="relative cursor-pointer" data-era="${escapeHtml(entry.era)}" data-entry-id="${escapeHtml(entry.id)}" tabindex="0">
      <div class="absolute -left-[37px] top-6 w-3 h-3 rounded-full ${checked ? "bg-secondary/55 shadow-[0_0_10px_rgba(117,209,255,0.25)]" : "bg-primary-container shadow-[0_0_10px_#fbe419]"}"></div>
      <div class="bg-surface-container-low rounded-[1.25rem] overflow-hidden shadow-2xl group active:scale-[0.98] transition-transform duration-200">
        <div class="h-44 relative">
          <img class="w-full h-full object-cover" src="${escapeHtml(entry.poster)}" alt="${escapeHtml(entry.title)}"/>
          <div class="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-fixed/80 via-primary-fixed/20 to-transparent"></div>
          <div class="absolute top-3 right-3">
            <div class="story-meta bg-black/55 backdrop-blur-md px-2.5 py-1 rounded-full text-[#75d1ff]">${escapeHtml(mediaLabel(entry.type))}</div>
          </div>
        </div>
        <div class="p-5">
          <div class="flex justify-between items-start mb-2 gap-3">
            <div>
              <h4 class="font-headline font-bold text-lg leading-tight mb-1">${escapeHtml(entry.title)}</h4>
              <div class="flex items-center gap-2 opacity-60">
                <span class="story-meta">${escapeHtml(storyMeta)}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
            ${playUrl && !series ? `
              <a class="icon-button w-10 h-10 text-primary-fixed/85 flex items-center justify-center" href="${escapeHtml(playUrl)}" target="_blank" rel="noopener noreferrer" data-entry-play="${escapeHtml(entry.id)}" aria-label="Watch ${escapeHtml(entry.title)}">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
              </a>
            ` : ""}
            <button class="icon-button w-10 h-10 ${checked ? "text-primary-container bg-primary-container/10" : "text-outline"} flex items-center justify-center" type="button" ${series ? `data-open-modal="${escapeHtml(entry.id)}"` : `data-toggle-entry="${escapeHtml(entry.id)}"`}>
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${checked ? 1 : 0};">${series ? "visibility" : (checked ? "check_box" : "check_box_outline_blank")}</span>
            </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderFilterPanel() {
  if (!appState.isFilterPanelOpen || !appState.filterDraft) return "";

  const filters = appState.filterDraft;
  const eras = getAllEraNames();

  return `
    <div id="filter-panel" class="fixed inset-0 z-[130]" aria-hidden="false" role="dialog" aria-modal="true" aria-labelledby="filter-panel-title">
      <div class="hidden md:flex fixed inset-0 justify-end pointer-events-none">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" data-close-filters="true"></div>
        <div class="filter-sheet w-full max-w-md h-screen pointer-events-auto relative flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.8)]">
          <div class="p-8">
            <div class="flex items-center justify-between mb-2">
              <h2 id="filter-panel-title" class="text-3xl font-headline font-bold tracking-tighter text-white uppercase">Filters</h2>
              <button class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest transition-colors" type="button" data-close-filters="true">
                <span class="material-symbols-outlined text-neutral-400">close</span>
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-8 space-y-10">
            <section class="filter-block p-6">
              <label class="text-[10px] font-label font-bold uppercase tracking-[0.3em] text-neutral-500 mb-6 block">Eras</label>
              <div class="space-y-3">
                ${eras.map((era) => `
                  <label class="filter-option flex items-center group cursor-pointer px-4 py-3">
                    <input class="hidden peer" type="checkbox" data-filter-era="${escapeHtml(era)}" ${filters.eras.has(era) ? "checked" : ""}>
                    <div class="w-5 h-5 border-2 border-outline-variant/60 rounded-sm flex items-center justify-center peer-checked:bg-primary-fixed peer-checked:border-primary-fixed transition-all mr-4 group-hover:border-secondary">
                      <span class="material-symbols-outlined text-on-primary-fixed text-sm font-bold opacity-0 peer-checked:opacity-100">check</span>
                    </div>
                    <span class="font-headline uppercase tracking-widest text-sm text-neutral-400 peer-checked:text-primary-fixed transition-colors">${escapeHtml(era)}</span>
                  </label>
                `).join("")}
              </div>
            </section>
            <section class="filter-block p-6">
              <label class="text-[10px] font-label font-bold uppercase tracking-[0.3em] text-neutral-500 mb-6 block">Transmission Format</label>
              <div class="grid grid-cols-3 gap-3">
                ${[
                  ["movies", "movie", "Movies"],
                  ["animated", "animation", "Animated"],
                  ["live-action", "live_tv", "Live Action"]
                ].map(([value, icon, label]) => `
                  <button class="filter-option flex flex-col items-center justify-center gap-2 p-4 ${filters.type === value ? "bg-primary-fixed text-on-primary-fixed glow-yellow" : "text-neutral-400"} transition-all" type="button" data-filter-type="${value}">
                    <span class="material-symbols-outlined">${icon}</span>
                    <span class="text-[9px] font-label font-bold uppercase tracking-widest">${label}</span>
                  </button>
                `).join("")}
              </div>
              <button class="filter-link-button mt-4 text-[10px] font-label uppercase tracking-widest" type="button" data-filter-type="all">All Formats</button>
            </section>
            <div class="grid grid-cols-2 gap-8">
              <section class="filter-block p-6">
                <label class="text-[10px] font-label font-bold uppercase tracking-[0.3em] text-neutral-500 mb-6 block">Continuity</label>
                <div class="filter-segment flex flex-col gap-1 p-1.5">
                  ${["all", "canon", "legends"].map((value) => `
                    <button class="filter-segment-button w-full py-3 px-4 text-center text-[10px] font-label uppercase tracking-widest ${filters.canon === value ? "is-active text-secondary glow-blue" : "text-neutral-500"} transition-all" type="button" data-filter-canon="${value}">
                      ${value === "all" ? "All" : value}
                    </button>
                  `).join("")}
                </div>
              </section>
              <section class="filter-block p-6">
                <label class="text-[10px] font-label font-bold uppercase tracking-[0.3em] text-neutral-500 mb-6 block">Status</label>
                <div class="filter-segment flex flex-col gap-1 p-1.5">
                  ${[
                    ["all", "Show All"],
                    ["unwatched", "Unwatched"],
                    ["in-progress", "In Progress"],
                    ["watched", "Watched"]
                  ].map(([value, label]) => `
                    <button class="filter-segment-button w-full py-3 px-4 text-center text-[10px] font-label uppercase tracking-widest ${filters.progress === value ? "is-active text-primary-fixed" : "text-neutral-500"} transition-all" type="button" data-filter-progress="${value}">
                      ${label}
                    </button>
                  `).join("")}
                </div>
              </section>
            </div>
            <section class="filter-block p-6">
              <label class="text-[10px] font-label font-bold uppercase tracking-[0.3em] text-neutral-500 mb-6 block">Story Arc</label>
              <div class="grid grid-cols-2 gap-3">
                ${STORY_ARC_OPTIONS.map(([value, label]) => `
                  <button class="filter-segment-button py-3 px-4 text-center text-[10px] font-label uppercase tracking-widest ${filters.arc === value ? "is-active text-primary-fixed" : "text-neutral-500"} transition-all ${value === "all" ? "col-span-2" : ""}" type="button" data-filter-arc="${value}">
                    ${label}
                  </button>
                `).join("")}
              </div>
            </section>
          </div>
          <div class="p-8 bg-surface-container-low/35 backdrop-blur-md grid grid-cols-2 gap-4">
            <button class="filter-link-button py-4 text-[10px] font-headline font-bold uppercase tracking-[0.2em]" type="button" data-clear-filters="true">Clear All</button>
            <button class="cta-primary w-full py-4 text-[10px]" type="button" data-apply-filters="true">Apply Filters</button>
          </div>
        </div>
      </div>

      <div class="md:hidden fixed inset-0 z-50 flex flex-col glass-panel">
        <header class="flex items-center justify-between px-6 pt-12 pb-6">
            <div class="space-y-1">
              <h1 class="font-headline font-bold text-2xl tracking-[0.2em] text-on-surface">FILTERS</h1>
            </div>
          <button class="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface active:scale-95 transition-transform" type="button" data-close-filters="true">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>
        <main class="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-10">
          <section class="space-y-4">
            <h2 class="font-label text-[10px] font-bold tracking-[0.15em] text-secondary uppercase opacity-60">Eras</h2>
            <div class="grid gap-3">
              ${eras.map((era) => `
                <label class="filter-option flex items-center justify-between p-4 group cursor-pointer active:bg-surface-container-high transition-colors">
                  <span class="font-body text-sm font-medium ${filters.eras.has(era) ? "text-primary-fixed drop-shadow-[0_0_8px_rgba(251,228,25,0.3)]" : ""}">${escapeHtml(era)}</span>
                  <input class="w-5 h-5 rounded border-outline-variant bg-surface-container-lowest text-primary-fixed focus:ring-primary-fixed focus:ring-offset-surface cursor-pointer" type="checkbox" data-filter-era="${escapeHtml(era)}" ${filters.eras.has(era) ? "checked" : ""}>
                </label>
              `).join("")}
            </div>
          </section>
          <section class="space-y-4">
            <h2 class="font-label text-[10px] font-bold tracking-[0.15em] text-secondary uppercase opacity-60">Media Format</h2>
            <div class="grid grid-cols-3 gap-3">
              ${[
                ["movies", "movie", "Movies"],
                ["animated", "animation", "Animated"],
                ["live-action", "live_tv", "Live Action"]
              ].map(([value, icon, label]) => `
                <button class="filter-option flex flex-col items-center justify-center aspect-square ${filters.type === value ? "bg-primary-fixed text-on-primary-fixed shadow-[0_0_20px_rgba(251,228,25,0.2)]" : "bg-surface-container-high text-on-surface"} rounded-2xl active:scale-95 transition-all" type="button" data-filter-type="${value}">
                  <span class="material-symbols-outlined text-3xl mb-2" style="font-variation-settings: 'FILL' ${filters.type === value ? 1 : 0};">${icon}</span>
                  <span class="font-label text-[10px] font-bold uppercase tracking-wider">${label}</span>
                </button>
              `).join("")}
            </div>
            <button class="filter-link-button text-on-surface/50 font-label text-[10px] font-bold tracking-[0.2em] uppercase" type="button" data-filter-type="all">All Formats</button>
          </section>
          <section class="space-y-6 pb-32">
            <div class="space-y-4">
              <h2 class="font-label text-[10px] font-bold tracking-[0.15em] text-secondary uppercase opacity-60">Continuity</h2>
              <div class="filter-segment flex p-1">
                ${["all", "canon", "legends"].map((value) => `
                  <button class="filter-segment-button flex-1 py-3 text-xs font-bold font-label uppercase tracking-widest ${filters.canon === value ? "is-active text-primary-fixed" : "text-on-surface opacity-40"}" type="button" data-filter-canon="${value}">
                    ${value === "all" ? "All" : value}
                  </button>
                `).join("")}
              </div>
            </div>
            <div class="space-y-4">
              <h2 class="font-label text-[10px] font-bold tracking-[0.15em] text-secondary uppercase opacity-60">Viewing State</h2>
              <div class="grid grid-cols-2 gap-3">
                ${[
                  ["all", "Show All"],
                  ["unwatched", "Unwatched"],
                  ["in-progress", "In Progress"],
                  ["watched", "Watched"]
                ].map(([value, label]) => `
                  <button class="filter-segment-button py-3 text-xs font-bold font-label uppercase tracking-widest ${filters.progress === value ? "is-active text-primary-fixed" : "text-on-surface opacity-40 filter-segment"}" type="button" data-filter-progress="${value}">
                    ${label}
                  </button>
                `).join("")}
              </div>
            </div>
            <div class="space-y-4">
              <h2 class="font-label text-[10px] font-bold tracking-[0.15em] text-secondary uppercase opacity-60">Story Arc</h2>
              <div class="grid grid-cols-2 gap-3">
                ${STORY_ARC_OPTIONS.map(([value, label]) => `
                  <button class="filter-segment-button py-3 text-xs font-bold font-label uppercase tracking-widest ${filters.arc === value ? "is-active text-primary-fixed" : "text-on-surface opacity-40 filter-segment"} ${value === "all" ? "col-span-2" : ""}" type="button" data-filter-arc="${value}">
                    ${label}
                  </button>
                `).join("")}
              </div>
            </div>
          </section>
        </main>
        <footer class="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-surface-dim via-surface-dim to-transparent pt-12">
          <div class="flex flex-col gap-4">
            <button class="cta-primary w-full py-5 text-sm" type="button" data-apply-filters="true">Apply Filters</button>
            <button class="w-full py-2 text-on-surface/50 font-label text-[10px] font-bold tracking-[0.2em] uppercase hover:text-on-surface transition-colors" type="button" data-clear-filters="true">Clear All</button>
          </div>
        </footer>
      </div>
    </div>
  `;
}

function renderStatsPanel() {
  if (!appState.isStatsOpen) return "";

  const stats = calculateStats(appState.timelineData);
  const eraProgress = getEraProgress(appState.timelineData);
  const media = getMediaDistribution(appState.entries);
  const nextObjective = getNextObjective(appState.entries);

  return `
    <section id="stats-page">
      <div class="hidden md:block px-8 md:px-16 py-16 relative">
        <div class="relative max-w-[1320px] mx-auto glass-panel overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(117,209,255,0.08),transparent_35%),radial-gradient(circle_at_75%_15%,rgba(251,228,25,0.04),transparent_20%)] pointer-events-none"></div>
          <main class="relative">
            <div class="absolute inset-0 scanline-overlay opacity-30 pointer-events-none"></div>
            <header class="relative z-10 p-8 mb-8">
              <div class="space-y-1">
                <h1 class="text-4xl font-headline font-bold text-white tracking-tight">WATCHLIST STATUS</h1>
              </div>
            </header>
            <div class="relative z-10 p-8 grid grid-cols-1 md:grid-cols-12 gap-6">
              <section id="stats-overview" class="utility-section md:col-span-4 p-6 flex flex-col items-center justify-center text-center space-y-6">
                <h3 class="font-headline font-bold tracking-widest text-sm uppercase">Completion</h3>
                <div class="relative w-56 h-56 flex items-center justify-center">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="none" r="45" stroke="rgba(255,255,255,0.05)" stroke-width="8"></circle>
                    <circle cx="50" cy="50" fill="none" r="45" stroke="#fbe419" stroke-dasharray="282.7" stroke-dashoffset="${(282.7 * (100 - stats.overallProgress)) / 100}" stroke-linecap="round" stroke-width="8"></circle>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="font-headline text-5xl font-bold text-white tracking-tighter">${stats.overallProgress}%</span>
                    <span class="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">Complete</span>
                  </div>
                </div>
                <div class="space-y-1">
                  <p class="font-headline text-2xl text-primary-fixed">${stats.watchedEpisodes} / ${stats.totalEpisodes}</p>
                  <p class="font-label text-[11px] text-zinc-500 uppercase tracking-widest">Logged</p>
                </div>
              </section>
              <section id="stats-era-breakdown" class="utility-section md:col-span-8 p-6 space-y-8">
                <div class="flex justify-between items-end">
                  <h3 class="font-headline font-bold tracking-widest text-sm uppercase">Era Progress</h3>
                </div>
                <div class="space-y-6">
                  ${eraProgress.map((item) => `
                    <div class="space-y-2">
                      <div class="flex justify-between items-center text-[11px] font-label tracking-widest uppercase">
                        <span class="text-white">${escapeHtml(item.era)}</span>
                        <span class="text-zinc-400">${item.progress}%</span>
                      </div>
                      <div class="h-1.5 w-full bg-white/5 overflow-hidden">
                        <div class="h-full" style="width:${item.progress}%; background:${escapeHtml(item.color)}; box-shadow:0 0 8px ${escapeHtml(item.color)}40;"></div>
                      </div>
                    </div>
                  `).join("")}
                </div>
              </section>
              <section id="stats-media-distribution" class="utility-section md:col-span-5 p-6 space-y-10">
                <h3 class="font-headline font-bold tracking-widest text-sm uppercase text-center">Formats</h3>
                <div class="flex justify-around items-end">
                  ${[
                    ["Movies", media.movies, "bg-primary-fixed/40"],
                    ["Animated", media.animated, "bg-secondary"],
                    ["Live Action", media.liveAction, "bg-tertiary-fixed/70"]
                  ].map(([label, value, barClass]) => `
                    <div class="flex flex-col items-center space-y-4">
                      <div class="w-12 bg-surface-container-highest/80 h-32 relative group overflow-hidden rounded-t-[1rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                        <div class="absolute bottom-0 w-full ${barClass}" style="height:${Math.max(18, Math.min(100, appState.entries.length ? Math.round((value / appState.entries.length) * 100) : 0))}%;"></div>
                      </div>
                      <span class="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">${label}</span>
                    </div>
                  `).join("")}
                </div>
                <div class="pt-6 grid grid-cols-3 gap-4 text-center">
                  <div><p class="font-headline text-lg font-bold text-white">${media.movies}</p><p class="font-label text-[9px] text-zinc-500 uppercase">Movies</p></div>
                  <div><p class="font-headline text-lg font-bold text-white">${media.animated}</p><p class="font-label text-[9px] text-zinc-500 uppercase">Animated</p></div>
                  <div><p class="font-headline text-lg font-bold text-white">${media.liveAction}</p><p class="font-label text-[9px] text-zinc-500 uppercase">Live Action</p></div>
                </div>
              </section>
              <section id="stats-completed-series" class="utility-section md:col-span-3 p-6 flex flex-col justify-between overflow-hidden relative">
                <div>
                  <h3 class="font-headline font-bold tracking-widest text-sm uppercase mb-8">Completed</h3>
                  <div class="space-y-1">
                    <p class="font-headline text-6xl font-bold text-white">${stats.completedShows}</p>
                    <p class="font-label text-sm text-primary-fixed uppercase tracking-[0.2em]">Completed</p>
                  </div>
                </div>
                <div class="mt-8">
                  <div class="flex items-center space-x-2 text-zinc-500">
                    <span class="material-symbols-outlined text-xs">info</span>
                    <span class="text-[10px] font-label uppercase">${stats.totalShows} entries</span>
                  </div>
                </div>
                <div class="absolute bottom-0 right-0 w-24 h-24 opacity-10 bg-gradient-to-tl from-secondary to-transparent rounded-tl-full"></div>
              </section>
              ${nextObjective ? `
                <section id="stats-next-objective" class="utility-section md:col-span-4 overflow-hidden group flex flex-col">
                  <div class="relative h-48 w-full overflow-hidden">
                    <img class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" src="${escapeHtml(nextObjective.poster)}" alt="${escapeHtml(nextObjective.title)}">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] to-transparent"></div>
                    <div class="absolute top-4 left-4">
                      <span class="kicker-label">Next</span>
                    </div>
                  </div>
                  <div class="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 class="font-label text-xs text-secondary uppercase tracking-widest mb-1">${escapeHtml(nextObjective.era)}</h4>
                      <h2 class="font-headline text-2xl font-bold text-white uppercase leading-none mb-3">${escapeHtml(nextObjective.title)}</h2>
                      <p class="font-body text-sm text-on-surface-variant line-clamp-2 italic">${escapeHtml(nextObjective.synopsis || "Continue through the chronology.")}</p>
                    </div>
                    <button class="mt-6 w-full py-3 bg-primary-fixed text-on-primary-fixed font-label text-xs font-bold uppercase tracking-[0.2em] rounded-full hover:bg-primary-fixed-dim transition-colors flex items-center justify-center space-x-2" type="button" data-stats-open-entry="${escapeHtml(nextObjective.id)}">
                      <span>Open</span>
                      <span class="material-symbols-outlined text-sm">play_arrow</span>
                    </button>
                  </div>
                </section>
              ` : ""}
            </div>
          </main>
        </div>
      </div>
      <div class="md:hidden bg-background min-h-screen">
        <div class="fixed inset-0 scanline-overlay opacity-20 pointer-events-none"></div>
        <main class="pt-24 pb-52 px-4 flex flex-col gap-10 max-w-lg mx-auto relative">
          <section class="flex items-center justify-between">
            <div class="space-y-1">
              <h1 class="font-headline uppercase tracking-[0.14em] text-xl text-[#FFE81F] font-bold">Archive Status</h1>
            </div>
            <div class="utility-page-marker">
              <span class="material-symbols-outlined">leaderboard</span>
            </div>
          </section>
          <section class="utility-mobile-section">
            <div class="flex items-center gap-2"><div class="w-1 h-6 bg-primary-fixed"></div><h2 class="font-headline text-xl font-bold tracking-tight uppercase">COMPLETION</h2></div>
            <div class="flex flex-col items-center justify-center text-center py-2">
            <div class="relative w-56 h-56 flex items-center justify-center">
              <div class="absolute inset-0 rounded-full bg-primary-fixed/5 blur-3xl"></div>
              <div class="w-full h-full rounded-full circular-progress relative flex items-center justify-center" style="background:conic-gradient(#fbe419 ${stats.overallProgress}%, transparent 0);">
                <div class="w-[92%] h-[92%] rounded-full bg-surface-container-lowest flex flex-col items-center justify-center">
                  <span class="font-headline text-5xl font-bold text-primary-fixed tracking-tight">${stats.overallProgress}%</span>
                  <span class="font-label text-[10px] uppercase tracking-[0.2em] text-secondary/60 mt-1">Complete</span>
                </div>
              </div>
            </div>
            <div class="mt-8">
              <h2 class="font-headline text-lg font-bold tracking-widest text-on-surface">${stats.watchedEpisodes} / ${stats.totalEpisodes} LOGGED</h2>
            </div>
            </div>
          </section>
          <section class="utility-mobile-section">
            <div class="flex items-center gap-2"><div class="w-1 h-6 bg-secondary"></div><h2 class="font-headline text-xl font-bold tracking-tight uppercase">ERA PROGRESS</h2></div>
            <div class="space-y-6">
              ${eraProgress.map((item) => `
                <div class="space-y-2">
                  <div class="flex justify-between items-end">
                    <span class="font-label text-[10px] uppercase tracking-wider text-on-surface/80">${escapeHtml(item.era)}</span>
                    <span class="font-headline text-sm font-bold" style="color:${escapeHtml(item.color)};">${item.progress}%</span>
                  </div>
                  <div class="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
                    <div class="h-full rounded-full" style="width:${item.progress}%; background:${escapeHtml(item.color)};"></div>
                  </div>
                </div>
              `).join("")}
            </div>
          </section>
          <section class="utility-mobile-section">
            <div class="flex items-center gap-2"><div class="w-1 h-6 bg-on-surface"></div><h2 class="font-headline text-xl font-bold tracking-tight uppercase">FORMATS</h2></div>
            <div class="grid grid-cols-3 gap-4">
            ${[
              ["Movies", media.movies, "bg-primary-fixed/40"],
              ["Animated", media.animated, "bg-secondary"],
              ["Live Action", media.liveAction, "bg-primary-fixed/20"]
            ].map(([label, value, fillClass]) => `
              <div class="soft-panel aspect-[3/4] rounded-xl flex flex-col items-center justify-end p-4">
                <div class="w-full bg-surface-container-highest rounded-t-lg relative flex items-end overflow-hidden flex-1 mb-3">
                  <div class="w-full ${fillClass} rounded-t-lg" style="height:${Math.max(18, Math.min(100, appState.entries.length ? Math.round((value / appState.entries.length) * 100) : 0))}%;"></div>
                </div>
                <span class="font-headline text-xl font-black text-on-surface">${value}</span>
                <span class="font-label text-[9px] uppercase tracking-widest text-secondary mt-1">${label}</span>
              </div>
            `).join("")}
            </div>
          </section>
          <section class="utility-mobile-section">
            <div class="flex items-center gap-2"><div class="w-1 h-6 bg-primary-fixed"></div><h2 class="font-headline text-xl font-bold tracking-tight uppercase">COMPLETED</h2></div>
            <div class="soft-panel relative p-6 rounded-2xl flex items-center justify-between overflow-hidden">
              <div class="flex flex-col gap-1 z-10">
                <h4 class="font-headline text-2xl font-black text-on-surface">${stats.completedShows} COMPLETED</h4>
              </div>
              <div class="z-10 bg-secondary-container/20 p-3 rounded-full text-secondary">
                <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">rocket_launch</span>
              </div>
            </div>
          </section>
          ${nextObjective ? `
            <section class="utility-mobile-section">
              <div class="flex items-center gap-2"><div class="w-1 h-6 bg-secondary"></div><h2 class="font-headline text-xl font-bold tracking-tight uppercase">NEXT</h2></div>
              <div class="soft-panel relative rounded-2xl overflow-hidden aspect-video group cursor-pointer shadow-2xl">
                <img class="w-full h-full object-cover transition duration-700 group-hover:scale-110 grayscale-[0.2]" src="${escapeHtml(nextObjective.poster)}" alt="${escapeHtml(nextObjective.title)}">
                <div class="absolute inset-0 bg-gradient-to-t from-surface-dim via-surface-dim/40 to-transparent"></div>
                <div class="absolute inset-0 p-6 flex flex-col justify-end gap-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 bg-error text-on-error font-label text-[8px] uppercase font-black rounded-sm">${escapeHtml(nextObjective.era)}</span>
                  </div>
                  <h4 class="font-headline text-2xl font-black tracking-tight text-white drop-shadow-md">${escapeHtml(nextObjective.title)}</h4>
                  <button class="mt-4 cta-primary w-full text-sm" type="button" data-stats-open-entry="${escapeHtml(nextObjective.id)}">
                    OPEN
                    <span class="material-symbols-outlined text-lg">play_arrow</span>
                  </button>
                </div>
              </div>
            </section>
          ` : ""}
        </main>
      </div>
    </section>
  `;
}

function renderPreferencesPanel() {
  if (!appState.isPreferencesOpen || !appState.preferences) return "";

  const prefs = appState.preferences;
  return `
    <section id="preferences-page">
      <div class="hidden md:block px-8 md:px-16 py-16 relative">
        <div class="relative max-w-[1320px] mx-auto glass-panel overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(117,209,255,0.08),transparent_35%),radial-gradient(circle_at_75%_15%,rgba(251,228,25,0.04),transparent_20%)] pointer-events-none"></div>
          <header class="p-8">
            <div class="space-y-1">
              <h1 class="text-4xl font-headline font-bold text-white tracking-tight">ARCHIVE SETTINGS</h1>
            </div>
          </header>
          <div class="p-8 grid grid-cols-1 xl:grid-cols-2 gap-6 z-10">
            <section id="prefs-temporal" class="utility-section p-6 flex flex-col gap-6">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary-fixed">history_toggle_off</span>
                <h2 class="font-headline font-bold tracking-widest text-sm uppercase">Timeline</h2>
              </div>
              <div class="space-y-6">
                ${[
                  ["displayBbyAbyDates", "BBY / ABY Dates", "Use galactic calendar dating."],
                  ["standardHoursRuntime", "Runtime Units", "Show standard runtime units."],
                  ["chronologicalSortLock", "Chronology Lock", "Keep the timeline fixed."]
                ].map(([key, label, sub]) => `
                  <button class="flex justify-between items-center group cursor-pointer text-left w-full" type="button" data-pref-toggle="${key}">
                    <div class="space-y-0.5">
                      <label class="text-sm font-headline text-on-surface">${label}</label>
                      <p class="text-[11px] text-on-surface-variant font-body">${sub}</p>
                    </div>
                    <div class="toggle-shell w-10 h-5 ${prefs[key] ? "bg-primary-fixed/20" : "bg-surface-container-highest"} flex items-center px-1 justify-${prefs[key] ? "end" : "start"}">
                      <div class="w-3 h-3 ${prefs[key] ? "bg-primary-fixed shadow-[0_0_8px_#fbe419]" : "bg-outline"} rounded-full"></div>
                    </div>
                  </button>
                `).join("")}
              </div>
            </section>
            <section id="prefs-content" class="utility-section p-6 flex flex-col gap-6">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-secondary">folder_managed</span>
                <h2 class="font-headline font-bold tracking-widest text-sm uppercase">Content</h2>
              </div>
              <div class="space-y-4">
                ${[
                  ["canonOnly", "Canon Only", "Canon records only"],
                  ["legendsIntegration", "Legends Integration", "Include legends entries"]
                ].map(([key, label, sub]) => `
                  <button class="soft-panel p-3 ${prefs[key] ? "text-secondary" : ""} flex items-center gap-4 cursor-pointer hover:bg-secondary/5 transition-colors text-left w-full rounded-xl" type="button" data-pref-toggle="${key}">
                    <div class="w-4 h-4 rounded-full ${prefs[key] ? "shadow-[inset_0_0_0_2px_rgba(117,209,255,0.9)]" : "shadow-[inset_0_0_0_2px_rgba(205,199,171,0.3)]"} flex items-center justify-center p-0.5">
                      ${prefs[key] ? `<div class="w-full h-full bg-secondary rounded-full"></div>` : ""}
                    </div>
                    <div class="flex flex-col">
                      <span class="text-sm font-headline">${label}</span>
                      <span class="text-[10px] text-on-surface-variant uppercase tracking-tighter">${sub}</span>
                    </div>
                  </button>
                `).join("")}
                <button class="flex items-center justify-between pt-4 text-left w-full" type="button" data-pref-toggle="includeAnimatedShorts">
                  <span class="text-sm font-headline">Include Animated Shorts</span>
                  <div class="toggle-shell w-8 h-4 ${prefs.includeAnimatedShorts ? "bg-primary-fixed/50" : "bg-surface-container-highest"} rounded-none"></div>
                </button>
              </div>
            </section>
            <section id="prefs-interface" class="utility-section p-6 flex flex-col gap-6">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-outline">palette</span>
                <h2 class="font-headline font-bold tracking-widest text-sm uppercase">Appearance</h2>
              </div>
              <div class="space-y-6">
                <div class="space-y-3">
                  <div class="flex justify-between"><label class="text-[11px] font-label uppercase tracking-widest">Scanline Intensity</label><span class="text-[11px] font-headline text-secondary">${prefs.scanlineIntensity}%</span></div>
                  <input class="w-full pref-range" type="range" min="0" max="100" step="1" value="${prefs.scanlineIntensity}" data-pref-range="scanlineIntensity">
                </div>
                <div class="space-y-3">
                  <div class="flex justify-between"><label class="text-[11px] font-label uppercase tracking-widest">Glow Radius</label><span class="text-[11px] font-headline text-secondary">${prefs.glowRadius}%</span></div>
                  <input class="w-full pref-range" type="range" min="0" max="100" step="1" value="${prefs.glowRadius}" data-pref-range="glowRadius">
                </div>
                <div class="grid grid-cols-2 gap-2 pt-2">
                  <button class="control-pill py-3 text-[10px] font-headline tracking-[0.2em] uppercase ${prefs.interfaceTheme === "jedi-light" ? "is-active font-bold" : "text-on-surface hover:bg-tertiary/10 hover:text-tertiary"} transition-all" type="button" data-pref-theme="jedi-light">Jedi Light</button>
                  <button class="control-pill py-3 text-[10px] font-headline tracking-[0.2em] uppercase ${prefs.interfaceTheme === "sith-dark" ? "is-active font-bold" : "text-on-surface"} transition-all" type="button" data-pref-theme="sith-dark">Sith Dark</button>
                </div>
              </div>
            </section>
            <section class="utility-section p-6 flex flex-col gap-6">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-secondary">music_note</span>
                <h2 class="font-headline font-bold tracking-widest text-sm uppercase">Audio</h2>
              </div>
              <div class="space-y-6">
                <button class="flex justify-between items-center group cursor-pointer text-left w-full" type="button" data-pref-toggle="audioEnabled">
                  <div class="space-y-0.5">
                      <label class="text-sm font-headline text-on-surface">Background Music</label>
                      <p class="text-[11px] text-on-surface-variant font-body">Continuous playback across the archive.</p>
                  </div>
                  <label class="settings-switch" aria-label="Toggle background music">
                    <input id="settings-music-toggle" type="checkbox" ${prefs.audioEnabled ? "checked" : ""} />
                    <span class="settings-switch-track"></span>
                  </label>
                </button>
                <button class="flex justify-between items-center group cursor-pointer text-left w-full" type="button" data-pref-toggle="soundEffectsEnabled">
                  <div class="space-y-0.5">
                      <label class="text-sm font-headline text-on-surface">Sound Effects</label>
                      <p class="text-[11px] text-on-surface-variant font-body">Interface tones for clicks, toggles, and playback actions.</p>
                  </div>
                  <label class="settings-switch" aria-label="Toggle sound effects">
                    <input type="checkbox" ${prefs.soundEffectsEnabled ? "checked" : ""} />
                    <span class="settings-switch-track"></span>
                  </label>
                </button>
                <div class="space-y-3">
                  <div class="flex justify-between">
                    <label class="text-[11px] font-label uppercase tracking-widest">Volume</label>
                    <span class="text-[11px] font-headline text-secondary" id="settings-volume-icon">🔊</span>
                  </div>
                  <input id="settings-music-volume" class="w-full pref-range" type="range" min="0" max="100" step="1" value="18" aria-label="Music volume">
                </div>
                <div class="soft-panel flex items-center justify-between px-4 py-3 rounded-xl">
                  <div>
                    <span class="block text-[10px] font-label uppercase tracking-[0.2em] text-white/40">Now Playing</span>
                    <span class="block text-sm font-headline text-white/90" id="preferences-current-track">Music Off</span>
                  </div>
                  <button id="preferences-next-track" class="ghost-button px-4 py-2 font-label text-[10px] uppercase tracking-[0.2em]" type="button">Next Track</button>
                </div>
              </div>
            </section>
            <section id="prefs-system" class="utility-section xl:col-span-2 p-8 flex flex-col md:flex-row gap-8 items-center justify-between relative">
              <div class="flex items-center gap-6">
                <div class="relative h-24 w-24 flex items-center justify-center">
                  <svg class="absolute inset-0 w-full h-full -rotate-90">
                    <circle class="text-surface-container-highest" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" stroke-width="2"></circle>
                    <circle class="text-secondary" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" stroke-dasharray="251.2" stroke-dashoffset="${251.2 - (251.2 * prefs.glowRadius) / 100}" stroke-width="2"></circle>
                  </svg>
                  <div class="flex flex-col items-center">
                    <span class="text-xl font-headline font-bold text-secondary">${prefs.glowRadius}%</span>
                    <span class="text-[8px] font-label uppercase tracking-widest text-outline">Glow</span>
                  </div>
                </div>
                <div class="space-y-1">
                  <div class="flex items-center gap-2 text-on-surface">
                    <span class="material-symbols-outlined text-secondary text-sm">sync</span>
                    <h3 class="font-headline font-bold tracking-widest uppercase text-sm">System</h3>
                  </div>
                  <p class="text-xs text-on-surface-variant font-body">Theme: <span class="text-primary-fixed">${prefs.interfaceTheme === "sith-dark" ? "Sith Dark" : "Jedi Light"}</span></p>
                  <p class="text-xs text-on-surface-variant font-body">Glow Radius: <span class="text-secondary">${prefs.glowRadius}%</span></p>
                </div>
              </div>
              <div class="flex gap-4">
                <button class="ghost-button px-8 py-4 text-on-surface font-headline font-bold tracking-[0.2em] uppercase" type="button" data-reset-progress="true">RESET PROGRESS</button>
                <button class="px-12 py-4 bg-primary-fixed text-on-primary-fixed font-headline font-bold tracking-[0.3em] uppercase glow-yellow group" type="button" data-nav-page="timeline">
                  <div class="flex items-center gap-3"><span>CONFIRM</span><span class="material-symbols-outlined">check</span></div>
                </button>
              </div>
            </section>
          </div>
        </div>
      </div>
      <div class="md:hidden bg-background min-h-screen">
        <main class="pt-24 pb-52 px-4 max-w-lg mx-auto space-y-8">
          <section class="flex items-center justify-between">
            <div class="space-y-1">
              <h1 class="font-headline uppercase tracking-[0.14em] text-xl text-[#FFE81F] font-bold">Archive Settings</h1>
            </div>
            <div class="utility-page-marker text-primary-fixed">
              <span class="material-symbols-outlined">tune</span>
            </div>
          </section>
          <section class="space-y-6">
            <div class="flex items-center gap-2"><div class="w-1 h-6 bg-primary-fixed"></div><h2 class="font-headline text-xl font-bold tracking-tight uppercase">TIMELINE</h2></div>
            <div class="space-y-4">
              ${[
                ["displayBbyAbyDates", "Dating", "BBY / ABY Dates"],
                ["standardHoursRuntime", "Runtime", "Runtime Units"],
                ["chronologicalSortLock", "Order", "Chronology Lock"]
              ].map(([key, overline, label]) => `
                <button class="utility-mobile-row text-left" type="button" data-pref-toggle="${key}">
                  <div><p class="font-label uppercase text-[10px] tracking-widest text-on-surface-variant mb-1">${overline}</p><p class="font-headline font-medium">${label}</p></div>
                  <span class="toggle-shell relative inline-flex h-6 w-11 items-center bg-surface-container-highest"><span class="${prefs[key] ? "translate-x-6 bg-primary-fixed glow-yellow" : "translate-x-1 bg-on-surface-variant"} inline-block h-4 w-4 transform rounded-full transition"></span></span>
                </button>
              `).join("")}
            </div>
          </section>
          <section class="space-y-6">
            <div class="flex items-center gap-2"><div class="w-1 h-6 bg-secondary"></div><h2 class="font-headline text-xl font-bold tracking-tight uppercase">CONTENT</h2></div>
            <div class="grid grid-cols-2 gap-3">
              ${[
                ["canonOnly", "verified", "Canon Only"],
                ["legendsIntegration", "auto_stories", "Legends Integration"]
              ].map(([key, icon, label]) => `
                <button class="control-pill soft-panel p-4 rounded-lg ${prefs[key] ? "is-active glow-yellow text-primary-fixed opacity-100" : "opacity-60 text-on-surface"} flex flex-col items-center justify-center text-center gap-2" type="button" data-pref-toggle="${key}">
                  <span class="material-symbols-outlined ${prefs[key] ? "" : "text-on-surface-variant"}" style="font-variation-settings: 'FILL' ${prefs[key] ? 1 : 0};">${icon}</span>
                  <p class="font-label uppercase text-[10px] tracking-widest font-bold">${label}</p>
                </button>
              `).join("")}
            </div>
            <button class="utility-mobile-row text-left" type="button" data-pref-toggle="includeAnimatedShorts">
              <div><p class="font-headline font-medium">Include Animated Shorts</p><p class="font-label text-[10px] text-on-surface-variant mt-1">Shorts and side stories</p></div>
              <span class="toggle-shell relative inline-flex h-6 w-11 items-center bg-surface-container-highest"><span class="${prefs.includeAnimatedShorts ? "translate-x-6 bg-primary-fixed glow-yellow" : "translate-x-1 bg-on-surface-variant"} inline-block h-4 w-4 transform rounded-full transition"></span></span>
            </button>
          </section>
          <section class="space-y-6">
            <div class="flex items-center gap-2"><div class="w-1 h-6 bg-on-surface"></div><h2 class="font-headline text-xl font-bold tracking-tight uppercase">APPEARANCE</h2></div>
            <div class="utility-mobile-section">
              <div class="space-y-3">
                <div class="flex justify-between items-center"><label class="font-label uppercase text-[10px] tracking-widest text-on-surface-variant">Scanline Intensity</label><span class="font-headline text-xs text-secondary">${prefs.scanlineIntensity}%</span></div>
                <input class="w-full pref-range" max="100" min="0" type="range" value="${prefs.scanlineIntensity}" data-pref-range="scanlineIntensity"/>
              </div>
              <div class="space-y-3">
                <div class="flex justify-between items-center"><label class="font-label uppercase text-[10px] tracking-widest text-on-surface-variant">Glow Radius</label><span class="font-headline text-xs text-secondary">${prefs.glowRadius}%</span></div>
                <input class="w-full pref-range" max="100" min="0" type="range" value="${prefs.glowRadius}" data-pref-range="glowRadius"/>
              </div>
              <div class="pt-4 flex gap-4">
                <button class="control-pill flex-1 py-3 px-4 ${prefs.interfaceTheme === "jedi-light" ? "is-active text-secondary" : "text-secondary"} font-label uppercase text-[10px] tracking-widest font-bold flex items-center justify-center gap-2" type="button" data-pref-theme="jedi-light"><span class="material-symbols-outlined text-sm">light_mode</span>Jedi Light</button>
                <button class="control-pill flex-1 py-3 px-4 ${prefs.interfaceTheme === "sith-dark" ? "is-active text-primary-fixed glow-yellow" : "text-on-surface"} font-label uppercase text-[10px] tracking-widest font-bold flex items-center justify-center gap-2" type="button" data-pref-theme="sith-dark"><span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">dark_mode</span>Sith Dark</button>
              </div>
            </div>
          </section>
          <section class="space-y-6">
            <div class="flex items-center gap-2"><div class="w-1 h-6 bg-secondary"></div><h2 class="font-headline text-xl font-bold tracking-tight uppercase">AUDIO</h2></div>
            <div class="utility-mobile-section !gap-5">
              <button class="utility-mobile-row text-left" type="button" data-mobile-audio-toggle="true">
                <div><p class="font-headline font-medium">Background Music</p><p class="font-label text-[10px] text-on-surface-variant mt-1">Continuous playback across the archive</p></div>
                <span class="toggle-shell relative inline-flex h-6 w-11 items-center bg-surface-container-highest"><span class="${prefs.audioEnabled ? "translate-x-6 bg-primary-fixed glow-yellow" : "translate-x-1 bg-on-surface-variant"} inline-block h-4 w-4 transform rounded-full transition"></span></span>
              </button>
              <button class="utility-mobile-row text-left" type="button" data-pref-toggle="soundEffectsEnabled">
                <div><p class="font-headline font-medium">Sound Effects</p><p class="font-label text-[10px] text-on-surface-variant mt-1">Interface tones for archive actions</p></div>
                <span class="toggle-shell relative inline-flex h-6 w-11 items-center bg-surface-container-highest"><span class="${prefs.soundEffectsEnabled ? "translate-x-6 bg-primary-fixed glow-yellow" : "translate-x-1 bg-on-surface-variant"} inline-block h-4 w-4 transform rounded-full transition"></span></span>
              </button>
              <div class="space-y-3 utility-mobile-subsection">
                <div class="flex justify-between items-center"><label class="font-label uppercase text-[10px] tracking-widest text-on-surface-variant">Volume</label><span class="font-headline text-xs text-secondary" data-mobile-volume-icon="true">🔊</span></div>
                <input class="w-full pref-range" max="100" min="0" type="range" value="18" aria-label="Music volume" data-mobile-music-volume="true" />
              </div>
              <div class="utility-mobile-subsection flex items-center justify-between gap-4">
                <div>
                  <p class="font-label uppercase text-[10px] tracking-widest text-on-surface-variant">Now Playing</p>
                  <p class="font-headline text-sm mt-1" data-mobile-current-track="true">Music Off</p>
                </div>
                <button class="cta-primary px-4 py-3 text-[10px]" type="button" data-mobile-next-track="true">Next</button>
              </div>
            </div>
          </section>
          <section class="space-y-6 pb-20">
            <div class="flex items-center gap-2"><div class="w-1 h-6 bg-error"></div><h2 class="font-headline text-xl font-bold tracking-tight uppercase">SYSTEM</h2></div>
            <div class="relative h-24 bg-surface-container-low rounded-lg overflow-hidden flex items-center px-6">
              <div class="absolute inset-0 bg-gradient-to-r from-primary-fixed/20 to-transparent" style="width:${prefs.glowRadius}%"></div>
              <div class="relative z-10 flex w-full justify-between items-end">
                <div><p class="font-headline text-4xl font-bold text-primary-fixed italic tracking-tighter">${prefs.glowRadius}%</p><p class="font-label uppercase text-[10px] tracking-widest text-on-surface-variant">Glow Radius</p></div>
                <div class="text-right"><p class="font-label text-[10px] text-on-surface-variant">Theme</p><p class="font-headline text-xs uppercase tracking-tight">${prefs.interfaceTheme === "sith-dark" ? "Sith Dark" : "Jedi Light"}</p></div>
              </div>
            </div>
            <button class="w-full py-5 rounded-lg bg-primary-fixed text-on-primary-fixed font-headline font-extrabold tracking-widest uppercase text-sm hover:opacity-90 active:scale-[0.98] transition-all glow-yellow" type="button" data-reset-progress="true">RESET PROGRESS</button>
          </section>
        </main>
      </div>
    </section>
  `;
}

function renderApp(sections) {
  rebuildEntryIndex();
  const normalizedSections = sections;
  const flatEntries = appState.entries;
  const stats = calculateStats(normalizedSections);
  const currentPage = getCurrentPage();
  const heroEntry = flatEntries.find((entry) => !isComplete(entry)) || flatEntries[0];
  const activeEntry = appState.entryMap.get(appState.activeEntryId) || null;
  const filteredSections = getFilteredSections();
  const filteredEntries = filteredSections.flatMap((section) => section.entries);
  const activeFilterCount = countActiveFilters(appState.filters);
  const shellOptions = buildRenderShellOptions({
    currentPage,
    activeEntry,
    isFilterPanelOpen: appState.isFilterPanelOpen,
    normalizedSections,
    searchInputValue: appState.searchInputValue,
    escapeHtml,
    getEraAssetPath,
    renderStandardTopBar,
    renderDesktopSidebar,
    renderMobileAudioPlayer,
    renderMobileBottomNav,
    renderStandardFooter
  });
  const overlays = `
    ${renderFilterPanel()}
    ${renderModal(activeEntry)}
  `;
  const mainContent = renderAppMainContent({
    currentPage,
    heroEntry,
    flatEntries,
    stats,
    activeFilterCount,
    filteredEntries,
    filteredSections,
    normalizedSections,
    escapeHtml,
    renderDesktopSection,
    renderMobileSection,
    renderStatsPanel,
    renderPreferencesPanel
  });

  app.innerHTML = renderShellLayout({
    topBar: shellOptions.topBar,
    desktopSidebar: shellOptions.desktopSidebar,
    mainContent,
    mobileAudio: shellOptions.mobileAudio,
    mobileBottomNav: shellOptions.mobileBottomNav,
    footer: shellOptions.footer,
    overlays
  });

  wireInteractions();
  restorePendingFocus(appState);
}

const viewActions = createViewActions({
  appState,
  renderApp,
  syncEntryUrl,
  getModalEntryNavigation,
  cloneFilters,
  playUiSound,
  restoreFocusOrigin
});

const audioUiRuntime = createAudioUiRuntime({
  appState,
  getAudioController,
  savePreferences,
  togglePreference
});

const progressActions = createProgressActions({
  appState,
  isSeriesEntry,
  saveWatchedState,
  rebuildEntryIndex,
  renderApp
});

function wireInteractions() {
  initializeShellInteractions({
    searchInputValue: appState.searchInputValue,
    onSearchInput: (event) => {
      const nextValue = event.target.value;
      appState.searchInputValue = nextValue;
      appState.filters.search = nextValue.trim().length >= 3 ? nextValue : "";
      appState.pendingFocusTarget = {
        id: "timeline-search-input",
        selectionStart: event.target.selectionStart ?? nextValue.length,
        selectionEnd: event.target.selectionEnd ?? nextValue.length
      };
      renderApp(appState.timelineData);
    },
    onScrollTarget: (targetId) => {
      const target = document.getElementById(targetId);
      if (!target) return;
      playUiSound("click");
      scrollToTargetElement(target);
    },
    onNavigatePage: (page) => {
      playUiSound("click");
      if (page === "stats") {
        viewActions.openStats();
        return;
      }
      if (page === "timeline") {
        viewActions.closeStats(false);
        viewActions.closePreferences(false);
        renderApp(appState.timelineData);
      }
    },
    onOpenStats: () => {
      playUiSound("click");
      viewActions.openStats();
    },
    onOpenPreferences: () => {
      playUiSound("click");
      viewActions.openPreferences();
    }
  });

  initializeAppInteractions({
    onOpenModal: (entryId) => {
      playUiSound("click");
      viewActions.openModal(entryId);
    },
    onCloseModal: () => {
      playUiSound("click");
      viewActions.closeModal();
    },
    onOpenFilters: () => {
      playUiSound("click");
      viewActions.openFilters();
    },
    onCloseFilters: () => {
      playUiSound("click");
      viewActions.closeFilters();
    },
    onToggleFilterEra: (era) => {
      if (!era) return;
      const input = document.querySelector(`[data-filter-era="${CSS.escape(String(era))}"]`);
      if (input instanceof HTMLInputElement && input.checked) {
        appState.filterDraft.eras.add(era);
      } else {
        appState.filterDraft.eras.delete(era);
      }
    },
    onSetFilterType: (type) => {
      appState.filterDraft.type = type;
      playUiSound("toggle");
      renderApp(appState.timelineData);
    },
    onSetFilterCanon: (canon) => {
      appState.filterDraft.canon = canon;
      playUiSound("toggle");
      renderApp(appState.timelineData);
    },
    onSetFilterProgress: (progress) => {
      appState.filterDraft.progress = progress;
      playUiSound("toggle");
      renderApp(appState.timelineData);
    },
    onSetFilterArc: (arc) => {
      appState.filterDraft.arc = arc;
      playUiSound("toggle");
      renderApp(appState.timelineData);
    },
    onClearFilters: () => {
      appState.filters = createDefaultFilters();
      appState.filterDraft = cloneFilters(appState.filters);
      appState.isFilterPanelOpen = false;
      playUiSound("toggle");
      renderApp(appState.timelineData);
    },
    onApplyFilters: () => {
      appState.filters = cloneFilters(appState.filterDraft);
      appState.isFilterPanelOpen = false;
      playUiSound("success");
      renderApp(appState.timelineData);
    },
    onToggleEntry: (entryId) => {
      playUiSound("toggle");
      progressActions.toggleSingleEntry(entryId);
    },
    onEntryPlay: () => {
      playUiSound("click");
    },
    onToggleEpisode: (episodeIndex) => {
      playUiSound("toggle");
      progressActions.toggleEpisode(appState.activeEntryId, episodeIndex);
    },
    onEpisodePlay: () => {
      playUiSound("click");
    },
    onModalPrimary: () => {
      playUiSound("success");
      progressActions.advanceEntryProgress(appState.activeEntryId);
    },
    onModalNavigate: (direction) => {
      viewActions.navigateModalEntry(direction);
    },
    onShareEntry: async (entryId) => {
      await shareEntry(entryId);
    },
    onEntryInfo: () => {
      playUiSound("click");
    },
    onCloseStats: viewActions.closeStats,
    onClosePreferences: viewActions.closePreferences,
    onStatsOpenEntry: (entryId) => {
      playUiSound("click");
      viewActions.closeStats(false);
      viewActions.openModal(entryId);
    },
    onTogglePreference: (key) => {
      togglePreference(key);
    },
    onRangePreference: (key, value) => {
      setPreferenceValue(key, value);
    },
    onThemePreference: (value) => {
      setPreferenceValue("interfaceTheme", value);
    },
    onResetProgress: () => {
      const confirmed = window.confirm("Reset all watched progress in Star Wars: Chronicles?");
      if (!confirmed) return;
      resetAllProgress(appState.timelineData, () => {});
      rebuildEntryIndex();
      renderApp(appState.timelineData);
    }
  });

  document.body.classList.toggle("modal-open", hasActiveOverlay());

  audioUiRuntime.initializeAudioUI(audioUiUnsubscribeRef);
  initializeActiveSectionTracking();
  restoreOverlayFocus(appState);
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

function playUiSound(type = "click") {
  getAudioController().playSound(type);
}

attachGlobalKeyHandlers({
  appState,
  getFocusableElements,
  viewActions
});

window.addEventListener("popstate", () => {
  if (!appState.timelineData.length) return;
  applyEntryStateFromUrl();
});

bootstrapApp({
  app,
  appState,
  fetchUrl: "./data/timeline-data.json",
  prepareTimelineData,
  getAudioController,
  initializeWatchedState,
  rebuildEntryIndex,
  loadPreferences,
  applyPreferencesToDocument,
  createDefaultFilters,
  cloneFilters,
  applyEntryStateFromUrl,
  renderApp,
  escapeHtml
});
