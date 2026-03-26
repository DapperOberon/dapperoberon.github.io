import {
  initializeWatchedState,
  resetAllProgress,
  saveWatchedState
} from "./modules/persistence.js";
import { createAudioController } from "./modules/audio.js";
import { STORY_ARC_MATCHERS, getEraAssetPath, slugifyTitle } from "./modules/constants.js";
import {
  applyPreferencesToDocument as applyPreferencesToPage,
  loadPreferences as loadStoredPreferences,
  savePreferences as saveStoredPreferences
} from "./modules/preferences.js";
import {
  cloneFilters,
  countActiveFilters as getActiveFilterCount,
  createDefaultFilters as buildDefaultFilters,
  entryMatchesFilters as matchesEntryFilters,
  getFilteredSections as buildFilteredSections
} from "./modules/filters.js";
import {
  buildEntryShareUrl as createEntryShareUrl,
  getEntryIdFromUrl as readEntryIdFromUrl,
  syncEntryUrl as syncHistoryEntryUrl
} from "./modules/routing.js";
import {
  getEntrySearchText,
  getWatchedCount,
  isComplete,
  isSeriesEntry,
  prepareTimelineData,
  rebuildEntryIndex as buildEntryIndex
} from "./modules/timeline-data.js";
import {
  renderDesktopSection,
  renderMobileSection,
  renderModal
} from "./modules/timeline-renderers.js";
import {
  renderFilterPanel as buildFilterPanel,
  renderPreferencesPanel as buildPreferencesPanel,
  renderStatsPanel as buildStatsPanel
} from "./modules/utility-renderers.js";
import {
  renderDesktopSidebar,
  renderMobileAudioPlayer,
  renderMobileBottomNav,
  renderShellLayout,
  renderStandardFooter,
  renderStandardTopBar
} from "./modules/shell.js";
import { buildRenderShellOptions, renderAppMainContent } from "./modules/app-layout.js";
import { initializeAppInteractions, initializeShellInteractions } from "./modules/app-interactions.js";
import {
  createAudioUiRuntime,
  createViewActions,
  restoreOverlayFocus,
  restorePendingFocus,
  restoreFocusOrigin
} from "./modules/app-runtime.js";
import { attachGlobalKeyHandlers, bootstrapApp, createProgressActions } from "./modules/app-state.js";
import { createAppActions } from "./modules/app-actions.js";
import { getCurrentPage, getFocusableElements, initializeActiveSectionTracking } from "./modules/app-ui-helpers.js";
import { createAppDomain } from "./modules/app-domain.js";
import { createAppRenderer, escapeHtml } from "./modules/app-renderer.js";
import { createInteractionWiring } from "./modules/app-wiring.js";

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
  return loadStoredPreferences({
    storageKey: PREFERENCES_STORAGE_KEY,
    schemaVersion: PREFERENCES_SCHEMA_VERSION
  });
}

function savePreferences() {
  saveStoredPreferences(PREFERENCES_STORAGE_KEY, appState.preferences);
}

function applyPreferencesToDocument() {
  applyPreferencesToPage(appState.preferences);
}

const domain = createAppDomain({
  appState,
  buildDefaultFilters,
  getActiveFilterCount,
  matchesEntryFilters,
  buildFilteredSections,
  createEntryShareUrl,
  syncHistoryEntryUrl,
  readEntryIdFromUrl,
  buildEntryIndex,
  slugifyTitle,
  getEntrySearchText,
  getWatchedCount,
  isComplete,
  storyArcMatchers: STORY_ARC_MATCHERS
});

const renderFilterPanel = () => buildFilterPanel({
  isOpen: appState.isFilterPanelOpen,
  filters: appState.filterDraft,
  eras: domain.getAllEraNames(),
  escapeHtml
});

const renderStatsPanel = () => buildStatsPanel({
  isOpen: appState.isStatsOpen,
  timelineData: appState.timelineData,
  entries: appState.entries,
  escapeHtml
});

const renderPreferencesPanel = () => buildPreferencesPanel({
  isOpen: appState.isPreferencesOpen,
  preferences: appState.preferences,
  escapeHtml
});

let wireInteractions = () => {};

const { renderApp } = createAppRenderer({
  app,
  appState,
  rebuildEntryIndex: domain.rebuildEntryIndex,
  countActiveFilters: domain.countActiveFilters,
  getFilteredSections: domain.getFilteredSections,
  renderFilterPanel,
  renderModal,
  renderDesktopSection,
  renderMobileSection,
  renderStatsPanel,
  renderPreferencesPanel,
  buildRenderShellOptions,
  renderAppMainContent,
  renderShellLayout,
  getEraAssetPath,
  renderStandardTopBar,
  renderDesktopSidebar,
  renderMobileAudioPlayer,
  renderMobileBottomNav,
  renderStandardFooter,
  getModalEntryNavigation: domain.getModalEntryNavigation,
  restorePendingFocus,
  escapeHtmlFn: escapeHtml,
  wireInteractions: () => wireInteractions()
});

let appActions = null;

const viewActions = createViewActions({
  appState,
  renderApp,
  syncEntryUrl: domain.syncEntryUrl,
  getModalEntryNavigation: domain.getModalEntryNavigation,
  cloneFilters,
  playUiSound: (...args) => appActions.playUiSound(...args),
  restoreFocusOrigin
});

const audioUiRuntime = createAudioUiRuntime({
  appState,
  getAudioController,
  savePreferences,
  togglePreference: (...args) => appActions.togglePreference(...args)
});

const progressActions = createProgressActions({
  appState,
  isSeriesEntry,
  saveWatchedState,
  rebuildEntryIndex: domain.rebuildEntryIndex,
  renderApp
});

appActions = createAppActions({
  appState,
  getAudioController,
  savePreferences,
  applyPreferencesToDocument,
  renderApp,
  buildEntryShareUrl: domain.buildEntryShareUrl
});

wireInteractions = createInteractionWiring({
  appState,
  appActions,
  viewActions,
  progressActions,
  audioUiRuntime,
  audioUiUnsubscribeRef,
  initializeShellInteractions,
  initializeAppInteractions,
  createDefaultFilters: domain.createDefaultFilters,
  cloneFilters,
  rebuildEntryIndex: domain.rebuildEntryIndex,
  renderApp,
  initializeActiveSectionTracking: ({ currentPage }) => {
    activeSectionCleanup = initializeActiveSectionTracking({
      activeSectionCleanup,
      currentPage
    });
  },
  restoreOverlayFocus,
  resetAllProgress
});

attachGlobalKeyHandlers({
  appState,
  getFocusableElements,
  viewActions
});

window.addEventListener("popstate", () => {
  if (!appState.timelineData.length) return;
  domain.applyEntryStateFromUrl(renderApp);
});

bootstrapApp({
  app,
  appState,
  fetchUrl: "./data/timeline-data.json",
  prepareTimelineData,
  getAudioController,
  initializeWatchedState,
  rebuildEntryIndex: domain.rebuildEntryIndex,
  loadPreferences,
  applyPreferencesToDocument,
  createDefaultFilters: domain.createDefaultFilters,
  cloneFilters,
  applyEntryStateFromUrl: (options) => domain.applyEntryStateFromUrl(renderApp, options),
  renderApp,
  escapeHtml
});
