import {
  loadTimelineData as loadTimelineDataModule,
  getEntryMetaText as getEntryMetaTextModule,
  getEntryMetaDetails as getEntryMetaDetailsModule,
  getEntrySearchText as getEntrySearchTextModule,
  hexToRgb as hexToRgbModule,
  getMediaTypeInfo as getMediaTypeInfoModule
} from './modules/data.js';
import {
  loadCollapsedEras as loadCollapsedErasModule,
  saveCollapsedEras as saveCollapsedErasModule,
  saveWatchedState as saveWatchedStateModule,
  initializeWatchedState as initializeWatchedStateModule,
  resetAllProgress as resetAllProgressModule
} from './modules/persistence.js';
import {
  calculateStats as calculateStatsModule,
  buildStatSparklines as buildStatSparklinesModule,
  updateStatSparklines as updateStatSparklinesModule,
  updateStatBox as updateStatBoxModule
} from './modules/stats.js';
import { createFilterController } from './modules/filters.js';
import { createModalController } from './modules/modal.js';

// Star Wars Timeline Data - loaded from JSON
let TIMELINE_DATA = [];
let filterController = null;
let modalController = null;

// Load timeline data from JSON file
async function loadTimelineData() {
  const loadedData = await loadTimelineDataModule();
  if (!loadedData) {
    return false;
  }

  TIMELINE_DATA = loadedData;
  return true;
}

function getEntryMetaText(entry) {
  return getEntryMetaTextModule(entry);
}

function getEntryMetaDetails(entry) {
  return getEntryMetaDetailsModule(entry);
}

function getEntrySearchText(entry) {
  return getEntrySearchTextModule(entry);
}

let _flowLineRaf = null;
let _flowScrollRaf = null;
let _flowScrollBound = false;
let _flowTooltip = null;
let _lastFlowDrawTime = 0;
const FLOW_REDRAW_THROTTLE = 150; // Throttle flow line redraws to 150ms

function ensureFlowTooltip() {
  if (_flowTooltip) return _flowTooltip;
  const tooltip = document.createElement('div');
  tooltip.id = 'flow-tooltip';
  tooltip.className = 'flow-tooltip';
  document.body.appendChild(tooltip);
  _flowTooltip = tooltip;
  return tooltip;
}

function showFlowTooltip(text, x, y) {
  const tooltip = ensureFlowTooltip();
  tooltip.textContent = text;
  tooltip.style.left = `${x + 12}px`;
  tooltip.style.top = `${y + 12}px`;
  tooltip.classList.add('visible');
}

function hideFlowTooltip() {
  if (_flowTooltip) {
    _flowTooltip.classList.remove('visible');
  }
}

function updateFlowOffset() {
  const container = document.querySelector('.timeline-container');
  if (!container) return;
  const containerTop = container.getBoundingClientRect().top + window.scrollY;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const viewHeight = window.innerHeight || 1;
  const scrollRange = Math.max(1, container.scrollHeight - viewHeight);
  const scrollProgress = Math.min(1, Math.max(0, (scrollY - containerTop + (viewHeight * 0.2)) / scrollRange));
  const offset = -scrollProgress * 200;

  document.querySelectorAll('.timeline-flow-svg').forEach((svg) => {
    svg.style.setProperty('--flow-offset', `${offset}px`);
  });
}

function initFlowScrollAnimation() {
  if (_flowScrollBound) return;
  _flowScrollBound = true;
  const onScroll = () => {
    if (_flowScrollRaf) return;
    _flowScrollRaf = requestAnimationFrame(() => {
      _flowScrollRaf = null;
      updateFlowOffset();
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
}

function scheduleFlowLinesRedraw() {
  // Throttle redraws to avoid excessive CPU usage
  const now = Date.now();
  if (now - _lastFlowDrawTime < FLOW_REDRAW_THROTTLE) {
    if (_flowLineRaf) return;
    const remaining = FLOW_REDRAW_THROTTLE - (now - _lastFlowDrawTime);
    _flowLineRaf = setTimeout(() => {
      _flowLineRaf = null;
      _lastFlowDrawTime = Date.now();
      drawTimelineFlowLines();
    }, remaining);
    return;
  }

  if (_flowLineRaf) {
    cancelAnimationFrame(_flowLineRaf);
  }
  _lastFlowDrawTime = now;
  _flowLineRaf = requestAnimationFrame(() => {
    _flowLineRaf = null;
    drawTimelineFlowLines();
  });
}

function drawTimelineFlowLines() {
  // Flow lines disabled for vertical timeline layout - using center line and connectors instead
  const container = document.querySelector('.timeline-container');
  if (!container) return;

  const existingSvg = container.querySelector('.timeline-flow-svg-global');
  if (existingSvg) {
    existingSvg.remove();
  }
  
  updateFlowOffset();
}

function calculateStats() {
  return calculateStatsModule(TIMELINE_DATA);
}

function buildStatSparklines() {
  return buildStatSparklinesModule(TIMELINE_DATA);
}

function updateStatSparklines() {
  return updateStatSparklinesModule(TIMELINE_DATA);
}

function hexToRgb(hex) {
  return hexToRgbModule(hex);
}

function getMediaTypeInfo(type) {
  return getMediaTypeInfoModule(type);
}

function getFilterController() {
  if (!filterController) {
    filterController = createFilterController({
      getTimelineData: () => TIMELINE_DATA,
      getEntrySearchText,
      playSound,
      triggerHaptic,
      updateEraRailVisibility,
      updateWatchModeHighlight,
      scheduleFlowLinesRedraw,
      onFiltersChanged: updateActiveFilterChips
    });
  }
  return filterController;
}

function getModalController() {
  if (!modalController) {
    modalController = createModalController({
      getTimelineData: () => TIMELINE_DATA,
      hexToRgb,
      getEntryMetaText,
      getMediaTypeInfo,
      playSound,
      triggerHaptic,
      saveWatchedState,
      updateEntryUI,
      resetAllProgress: () => resetAllProgressModule(TIMELINE_DATA, updateEntryUI)
    });
  }
  return modalController;
}

function buildStatsCardsMarkup(stats, sparklines, watchedProgressPercent, completedProgressPercent) {
  return `
    <div class="stat-box" data-stat="overall" data-filter="all" role="button" tabindex="0" aria-label="Show all progress">
      <div class="stat-value" data-format="percent" data-target="${stats.overallProgress}">0%</div>
      <div class="stat-label">OVERALL PROGRESS</div>
      ${sparklines.overall}
      <div class="stat-progress">
        <div class="stat-progress-bar" style="width: ${stats.overallProgress}%"></div>
      </div>
    </div>
    <div class="stat-box" data-stat="episodes" data-filter="in-progress" role="button" tabindex="0" aria-label="Filter to in progress entries">
      <div class="stat-value" data-format="number" data-target="${stats.watchedEpisodes}">0</div>
      <div class="stat-label">EPISODES WATCHED</div>
      ${sparklines.watched}
      <div class="stat-progress">
        <div class="stat-progress-bar" style="width: ${watchedProgressPercent}%"></div>
      </div>
    </div>
    <div class="stat-box" data-stat="completed" data-filter="completed" role="button" tabindex="0" aria-label="Filter to completed entries">
      <div class="stat-value" data-format="fraction" data-target="${stats.completedShows}" data-total="${stats.totalShows}">0/${stats.totalShows}</div>
      <div class="stat-label">COMPLETED SHOWS</div>
      ${sparklines.completed}
      <div class="stat-progress">
        <div class="stat-progress-bar" style="width: ${completedProgressPercent}%"></div>
      </div>
    </div>
    <div class="stat-box" data-stat="total" data-filter="not-started" role="button" tabindex="0" aria-label="Filter to not started entries">
      <div class="stat-value" data-format="number" data-target="${stats.totalEpisodes}">0</div>
      <div class="stat-label">TOTAL EPISODES</div>
      ${sparklines.total}
    </div>
  `;
}

function applyProgressFilter(filter) {
  const button = document.querySelector(`[data-progress-filter="${filter}"]`);
  if (button) {
    button.click();
  }
}

function getActiveFilterChipsMarkup(filters) {
  const chips = [];

  if (filters.search && filters.search.trim()) {
    chips.push({ key: 'search', label: `Search: “${filters.search.trim()}”` });
  }

  if (filters.type !== 'all') {
    chips.push({
      key: 'type',
      label: filters.type === 'films' ? 'Type: Films' : 'Type: Shows'
    });
  }

  if (!(filters.canon && filters.legends)) {
    chips.push({
      key: 'canon',
      label: filters.canon ? 'Canon: Canon only' : 'Canon: Legends only'
    });
  }

  if (filters.progress !== 'all') {
    const progressLabelMap = {
      'not-started': 'Progress: Not Started',
      'in-progress': 'Progress: In Progress',
      completed: 'Progress: Completed'
    };
    chips.push({ key: 'progress', label: progressLabelMap[filters.progress] || `Progress: ${filters.progress}` });
  }

  if (filters.arc !== 'all') {
    const arcLabelMap = {
      'clone-wars': 'Arc: Clone Wars',
      mandoverse: 'Arc: Mandoverse',
      'sequel-era': 'Arc: Sequel Era',
      'george-lucas': 'Arc: George Lucas'
    };
    chips.push({ key: 'arc', label: arcLabelMap[filters.arc] || `Arc: ${filters.arc}` });
  }

  return chips;
}

function updateActiveFilterChips(filters) {
  const activeFiltersBar = document.getElementById('active-filters-bar');
  const chipsContainer = document.getElementById('active-filters-chips');
  const clearButton = document.getElementById('clear-filters-btn');
  if (!activeFiltersBar || !chipsContainer || !clearButton) return;

  const chips = getActiveFilterChipsMarkup(filters);
  activeFiltersBar.classList.toggle('hidden', chips.length === 0);
  clearButton.disabled = chips.length === 0;

  if (chips.length === 0) {
    chipsContainer.innerHTML = '';
    return;
  }

  chipsContainer.innerHTML = chips
    .map((chip) => `
      <button type="button" class="active-filter-chip" data-filter-chip="${chip.key}" aria-label="Clear ${chip.label} filter">
        <span>${chip.label}</span>
        <span aria-hidden="true">×</span>
      </button>
    `)
    .join('');
}

function initActiveFilterControls() {
  const chipsContainer = document.getElementById('active-filters-chips');
  const clearButton = document.getElementById('clear-filters-btn');
  if (!chipsContainer || !clearButton) return;

  chipsContainer.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-filter-chip]');
    if (!chip) return;

    const chipType = chip.dataset.filterChip;
    const controller = getFilterController();
    if (chipType === 'search') {
      controller.setSearchFilter('');
    } else if (chipType === 'type') {
      controller.setTypeFilter('all');
    } else if (chipType === 'canon') {
      controller.setCanonFilter('all');
    } else if (chipType === 'progress') {
      controller.setProgressFilter('all');
    } else if (chipType === 'arc') {
      controller.setArcFilter('all');
    }

    playSound('click');
    triggerHaptic('light');
  });

  clearButton.addEventListener('click', () => {
    getFilterController().resetFilters({ withFeedback: true });
  });

  updateActiveFilterChips(getFilterController().getFilters());
}

function getNextUnwatchedVisibleCard() {
  const cards = Array.from(document.querySelectorAll('.entry-card'));
  const visibleCards = cards.filter((card) => !card.classList.contains('hidden') && card.offsetParent !== null);

  for (let i = 0; i < visibleCards.length; i++) {
    const card = visibleCards[i];
    const sectionIdx = Number(card.dataset.section);
    const entryIdx = Number(card.dataset.entry);
    const entry = TIMELINE_DATA[sectionIdx].entries[entryIdx];
    const watchedCount = Array.isArray(entry._watchedArray) ? entry._watchedArray.filter(Boolean).length : entry.watched;
    const isComplete = entry.episodes > 0 ? watchedCount >= entry.episodes : watchedCount > 0;
    if (!isComplete) {
      return card;
    }
  }

  return null;
}

function scrollToNextUnwatchedEntry() {
  const nextCard = getNextUnwatchedVisibleCard();
  if (!nextCard) {
    showToast('All visible entries are completed.', 'info');
    playSound('click');
    triggerHaptic('light');
    return;
  }

  const section = nextCard.closest('.timeline-section');
  if (section && section.classList.contains('collapsed')) {
    section.classList.remove('collapsed');
    const eraId = section.dataset.era;
    const toggleButton = document.querySelector(`[data-era-toggle="${eraId}"]`);
    if (toggleButton) {
      toggleButton.setAttribute('aria-expanded', 'true');
      toggleButton.textContent = 'Collapse';
    }
    const collapsedEras = loadCollapsedEras();
    collapsedEras.delete(eraId);
    saveCollapsedEras(collapsedEras);
  }

  const timelineEntry = nextCard.closest('.timeline-entry') || nextCard;
  timelineEntry.scrollIntoView({ behavior: 'smooth', block: 'center' });
  window.setTimeout(() => {
    nextCard.focus({ preventScroll: true });
  }, 220);

  playSound('click');
  triggerHaptic('light');
}

function initContinueWhereLeftOffButton() {
  const continueButton = document.getElementById('continue-where-left-off');
  if (!continueButton) return;

  continueButton.addEventListener('click', () => {
    scrollToNextUnwatchedEntry();
  });
}

function renderHeader(stats) {
  return `
    <header class="site-hero">
      <div class="header-container">
        <div class="hero-title">
          <h1 data-text="GALACTIC ARCHIVE"><span class="hero-strong">GALACTIC</span> <span class="hero-accent">ARCHIVE</span></h1>
          <p class="hero-sub">A comprehensive chronological guide to the Star Wars universe. Track your progress across the stars.</p>
        </div>
      </div>
      
      <div class="header-controls-row">
        <div class="header-utility-row" aria-label="Quick progress and actions">
          <button id="stats-drawer-toggle" class="stats-drawer-toggle" type="button" aria-expanded="false" aria-controls="stats-drawer">
            Stats
          </button>
          <button id="continue-where-left-off" class="stats-mini-pill stats-mini-pill--cta" type="button" aria-label="Continue where you left off">
            Continue Where I Left Off
          </button>
          <div class="stats-mini-summary" aria-live="polite" aria-label="Quick progress summary">
            <button id="stats-mini-overall" class="stats-mini-pill" type="button" aria-label="Open stats panel">
              ${stats.overallProgress}% overall
            </button>
            <button id="stats-mini-watched" class="stats-mini-pill" type="button" aria-label="Filter timeline to in progress entries">
              ${stats.watchedEpisodes} watched
            </button>
          </div>
        </div>

        <div class="interaction-toggles" aria-label="Interaction settings">
          <label class="toggle">
            <input type="checkbox" id="sound-toggle" aria-label="Toggle sound effects" />
            <span class="toggle-track"></span>
            <span class="toggle-label">Sound FX</span>
          </label>
          <label class="toggle">
            <input type="checkbox" id="watch-mode-toggle" aria-label="Toggle watch order mode" />
            <span class="toggle-track"></span>
            <span class="toggle-label">Watch Mode</span>
          </label>
        </div>
      </div>
      
      <div class="filters-container">
        <div class="search-wrapper">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <input type="text" id="search-input" class="search-input" placeholder="Search by title, year, or type..." />
        </div>
        <button id="filters-toggle" class="filters-toggle" type="button" aria-expanded="false" aria-controls="filters-panel">
          <span>Filters</span>
          <span id="filters-active-count" class="filters-toggle-count">All</span>
        </button>
      </div>

      <div id="active-filters-bar" class="active-filters hidden" aria-live="polite">
        <div id="active-filters-chips" class="active-filters-chips"></div>
        <button id="clear-filters-btn" class="active-filters-clear" type="button">Clear all filters</button>
      </div>
      
      <div class="filters-panel" id="filters-panel">
        <div class="filters-row">
          <div class="filter-group filter-group-type">
            <span class="filter-group-label">Type:</span>
            <button class="filter-btn active" data-type-filter="all">All</button>
            <button class="filter-btn" data-type-filter="films">Films</button>
            <button class="filter-btn" data-type-filter="shows">Shows</button>
          </div>
          
          <div class="filter-group filter-group-canon">
            <span class="filter-group-label">Canon:</span>
            <button class="filter-btn active" data-canon-filter="all">All</button>
            <button class="filter-btn" data-canon-filter="canon">Canon</button>
            <button class="filter-btn" data-canon-filter="legends">Legends</button>
          </div>
          
          <div class="filter-group filter-group-progress">
            <span class="filter-group-label">Progress:</span>
            <button class="filter-btn active" data-progress-filter="all">All</button>
            <button class="filter-btn" data-progress-filter="not-started">Not Started</button>
            <button class="filter-btn" data-progress-filter="in-progress">In Progress</button>
            <button class="filter-btn" data-progress-filter="completed">Completed</button>
          </div>

          <div class="filter-group filter-group-arc">
            <span class="filter-group-label">Story Arc:</span>
            <button class="filter-btn active" data-arc-filter="all">All</button>
            <button class="filter-btn" data-arc-filter="clone-wars">Clone Wars Arc</button>
            <button class="filter-btn" data-arc-filter="mandoverse">Mandoverse Arc</button>
            <button class="filter-btn" data-arc-filter="sequel-era">Sequel-Era Arc</button>
            <button class="filter-btn" data-arc-filter="george-lucas">George Lucas Arc</button>
          </div>
        </div>
      </div>
    </header>
  `;
}

function renderStatsDrawer(statsCardsMarkup) {
  return `
    <div id="stats-drawer" class="stats-drawer hidden" aria-hidden="true">
      <button class="stats-drawer-backdrop" type="button" aria-label="Close stats panel"></button>
      <aside class="stats-drawer-panel" role="dialog" aria-modal="true" aria-labelledby="stats-drawer-title">
        <div class="stats-drawer-header">
          <h2 id="stats-drawer-title">Viewing Stats</h2>
          <button id="stats-drawer-close" class="stats-drawer-close" type="button" aria-label="Close stats panel">✕</button>
        </div>
        <div class="stats-container stats-container--drawer">
          ${statsCardsMarkup}
        </div>
      </aside>
    </div>
  `;
}

function renderTimelineRail() {
  return `
    <nav class="timeline-rail" aria-label="Era navigation">
      <div class="timeline-rail-inner">
        ${TIMELINE_DATA.map((section, idx) => `
          <button class="rail-marker" data-era-target="era-${idx}" style="--rail-color: ${section.color};" aria-label="Jump to ${section.era}">
            <span class="rail-dot"></span>
            <span class="rail-label">${section.era}</span>
          </button>
        `).join('')}
      </div>
    </nav>
  `;
}

function renderEntryCard(entry, sectionIdx, entryIdx) {
  const progress = entry.episodes > 0 ? Math.round((entry.watched / entry.episodes) * 100) : 0;
  const isSingleItemEntry = entry.episodes === 1;
  const singleEpisodeTitle = Array.isArray(entry.episodeDetails)
    && entry.episodeDetails[0]
    && entry.episodeDetails[0].title
    ? entry.episodeDetails[0].title
    : '';
  const singleEpisodeTime = Array.isArray(entry.episodeDetails)
    && entry.episodeDetails[0]
    && entry.episodeDetails[0].time
    ? String(entry.episodeDetails[0].time).trim()
    : '';
  const showSingleEpisodeChecklist = isSingleItemEntry && !/film/i.test(entry.type) && Boolean(singleEpisodeTitle);
  const entryMetaDetails = getEntryMetaDetails(entry);
  const mediaTypeInfo = getMediaTypeInfo(entry.type);
  const alignClass = entryIdx % 2 === 0 ? 'timeline-entry--left' : 'timeline-entry--right';

  return `
    <div class="timeline-entry ${alignClass}">
      <div class="timeline-year">${entry.year}</div>
      <div class="timeline-connector"></div>
      <div class="timeline-dot"></div>
      <div class="entry-card" data-canon="${entry.canon}" data-section="${sectionIdx}" data-entry="${entryIdx}" role="button" tabindex="0" aria-label="Open details for ${entry.title}">
        <div class="entry-poster">
          <img src="${entry.poster}" alt="${entry.title}" loading="lazy" />
          <span class="entry-badge ${entry.canon ? 'canon' : 'legends'}">
            ${entry.canon ? 'Canon' : 'Legends'}
          </span>
          <span class="media-type-badge" style="--media-color: ${mediaTypeInfo.color};" title="${entry.type}">
            <span class="media-type-icon">${mediaTypeInfo.icon}</span>
            <span class="media-type-label">${mediaTypeInfo.label}</span>
          </span>
          ${entry.synopsis ? `<div class="synopsis-preview"><p>${entry.synopsis}</p></div>` : ''}
          <div class="entry-overlay">
            <div class="progress-ring">
              <svg viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="3" />
                <circle class="progress-circle" cx="50" cy="50" r="45" fill="none" stroke="var(--section-color)" stroke-width="3" 
                      stroke-dasharray="${progress * 2.827}, 282.7" stroke-dashoffset="0" 
                        style="transition: stroke-dasharray 0.3s ease;" />
              </svg>
              <span class="progress-text">${progress}%</span>
            </div>
            <p class="lore-label">Click to view details</p>
          </div>
        </div>
        <div class="entry-content">
          <h3>${entry.title}</h3>
          ${entryMetaDetails ? `<p class="entry-meta">${entryMetaDetails}</p>` : ''}
          ${showSingleEpisodeChecklist ? `
            <div class="entry-single-episode-checklist">
              <label class="entry-quick-check entry-quick-check--single" title="Mark episode as watched">
                <input type="checkbox" class="card-single-episode-checkbox" data-section="${sectionIdx}" data-entry="${entryIdx}" aria-label="Mark ${singleEpisodeTitle} as watched" ${entry.watched > 0 ? 'checked' : ''} />
                <span class="entry-quick-check-content">
                  <span class="entry-quick-check-title">${singleEpisodeTitle}</span>
                  ${singleEpisodeTime ? `<span class="entry-quick-check-time">${singleEpisodeTime}</span>` : ''}
                </span>
                <span class="entry-quick-check-state" data-watch-state>${entry.watched > 0 ? 'Watched' : 'Not Watched'}</span>
              </label>
            </div>
          ` : ''}
          ${isSingleItemEntry && !showSingleEpisodeChecklist ? `
            <div class="entry-single-episode-checklist">
              <label class="card-checkbox-inline entry-quick-check entry-quick-check--movie" title="Mark movie as watched">
                <input type="checkbox" class="card-movie-checkbox" data-section="${sectionIdx}" data-entry="${entryIdx}" aria-label="Mark ${entry.title} as watched" ${entry.watched > 0 ? 'checked' : ''} />
                <span class="entry-quick-check-content">
                  <span class="entry-quick-check-title">Movie</span>
                  <span class="entry-quick-check-subtitle">Mark as Watched</span>
                </span>
                <span class="entry-quick-check-state" data-watch-state>${entry.watched > 0 ? 'Watched' : 'Not Watched'}</span>
              </label>
            </div>
          ` : ''}
          <div class="entry-row">
            <p class="entry-episodes">${entry.watched}/${entry.episodes} Watched</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEraSection(section, idx) {
  const itemCount = section.entries.length;
  const itemLabel = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
  const sectionColorRgb = hexToRgb(section.color);

  return `
    <section class="timeline-section" id="era-${idx}" data-era="${idx}" style="--section-color: ${section.color}; --section-color-rgb: ${sectionColorRgb};">
      <h2>
        <span class="era-title">${section.era}</span>
        <span class="era-count">${itemLabel}</span>
        <button class="era-toggle" data-era-toggle="${idx}" aria-expanded="true" aria-controls="era-content-${idx}">Collapse</button>
      </h2>
      <div class="entries-grid era-content" id="era-content-${idx}">
        <div class="timeline-center-line"></div>
        ${section.entries.map((entry, entryIdx) => renderEntryCard(entry, idx, entryIdx)).join('')}
      </div>
    </section>
  `;
}

function renderMainContent() {
  return `
    <main class="timeline-container" id="main-content" tabindex="-1">
      <div id="no-results" class="hidden">
        <p>No entries match the selected filters.</p>
      </div>

      ${TIMELINE_DATA.map((section, idx) => renderEraSection(section, idx)).join('')}
    </main>
  `;
}

function renderFooter() {
  return `
    <footer>
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <p>© 2026 DapperOberon. Star Wars is a trademark of Lucasfilm Ltd.</p>
        <button id="reset-progress-btn" title="Reset all watched progress">Reset Progress</button>
      </div>
    </footer>
  `;
}

// Render the timeline
function render() {
  const app = document.getElementById('app');
  const stats = calculateStats();
  const sparklines = buildStatSparklines();
  const watchedProgressPercent = stats.totalEpisodes > 0 ? (stats.watchedEpisodes / stats.totalEpisodes * 100) : 0;
  const completedProgressPercent = stats.totalShows > 0 ? (stats.completedShows / stats.totalShows * 100) : 0;
  const statsCardsMarkup = buildStatsCardsMarkup(stats, sparklines, watchedProgressPercent, completedProgressPercent);
  
  app.innerHTML = `
    <a href="#main-content" class="skip-link">Skip to main content</a>
    ${renderHeader(stats)}
    ${renderStatsDrawer(statsCardsMarkup)}
    ${renderTimelineRail()}
    ${renderMainContent()}
    ${renderFooter()}
  `;

  // ensure a modal container exists in the document body
  if (!document.getElementById('modal')) {
    const modalDiv = document.createElement('div');
    modalDiv.id = 'modal';
    modalDiv.className = 'modal hidden';
    modalDiv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(modalDiv);
  }

  if (!document.getElementById('reset-dialog')) {
    const resetDialogDiv = document.createElement('div');
    resetDialogDiv.id = 'reset-dialog';
    resetDialogDiv.className = 'reset-dialog hidden';
    resetDialogDiv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(resetDialogDiv);
  }

  if (!document.getElementById('toast-container')) {
    const toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastContainer);
  }

  // initialize watched arrays and attach click handlers
  initializeWatchedState();
  attachFilterHandlers();
  initMobileFilterPanel();
  initActiveFilterControls();
  attachStatHandlers();
  initStatsDrawer();
  initContinueWhereLeftOffButton();
  initSoundToggle();
  initWatchModeToggle();
  initEraToggles();
  initEraRail();
  attachEntryHandlers();
  attachImageLoaders(); // Add blur-up image loading effect
  attachResetButton();
  scheduleFlowLinesRedraw();
  initFlowScrollAnimation();
  updateWatchModeHighlight();
  updateEraRailVisibility();
}

// Filter handlers
function attachFilterHandlers() {
  getFilterController().attachFilterHandlers();
}

function initMobileFilterPanel() {
  getFilterController().initMobileFilterPanel();
}

function attachStatHandlers() {
  getFilterController().attachStatHandlers();
}

let soundEnabled = false;
let audioContext = null;
let watchModeEnabled = false;
let eraObserver = null;
let eraRailScrollBound = false;
let eraRailScrollRaf = null;
let statsDrawerEscapeBound = false;

function loadCollapsedEras() {
  return loadCollapsedErasModule();
}

function saveCollapsedEras(set) {
  saveCollapsedErasModule(set);
}

function initSoundToggle() {
  const toggle = document.getElementById('sound-toggle');
  if (!toggle) return;
  const stored = localStorage.getItem('sw_sound_enabled');
  soundEnabled = stored === 'true';
  toggle.checked = soundEnabled;
  toggle.addEventListener('change', () => {
    soundEnabled = toggle.checked;
    localStorage.setItem('sw_sound_enabled', String(soundEnabled));
    playSound('toggle');
    triggerHaptic('light');
  });
}

function initWatchModeToggle() {
  const toggle = document.getElementById('watch-mode-toggle');
  if (!toggle) return;
  const stored = localStorage.getItem('sw_watch_mode_enabled');
  watchModeEnabled = stored === 'true';
  toggle.checked = watchModeEnabled;
  toggle.addEventListener('change', () => {
    watchModeEnabled = toggle.checked;
    localStorage.setItem('sw_watch_mode_enabled', String(watchModeEnabled));
    playSound('toggle');
    triggerHaptic('light');
    updateWatchModeHighlight();
  });
}

function initStatsDrawer() {
  const toggleButton = document.getElementById('stats-drawer-toggle');
  const quickOverall = document.getElementById('stats-mini-overall');
  const quickWatched = document.getElementById('stats-mini-watched');
  const drawer = document.getElementById('stats-drawer');
  const closeButton = document.getElementById('stats-drawer-close');
  const backdrop = drawer ? drawer.querySelector('.stats-drawer-backdrop') : null;
  if (!toggleButton || !drawer || !closeButton || !backdrop) return;

  const setDrawerOpen = (isOpen, { manageFocus = true } = {}) => {
    drawer.classList.toggle('hidden', !isOpen);
    drawer.classList.toggle('open', isOpen);
    drawer.setAttribute('aria-hidden', String(!isOpen));
    toggleButton.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('stats-drawer-open', isOpen);
    if (!manageFocus) return;
    if (isOpen) {
      closeButton.focus();
    } else {
      toggleButton.focus();
    }
  };

  const closeDrawer = ({ feedback = true, manageFocus = true } = {}) => {
    if (!drawer.classList.contains('open')) return;
    setDrawerOpen(false, { manageFocus });
    if (feedback) {
      playSound('click');
      triggerHaptic('light');
    }
  };

  setDrawerOpen(false, { manageFocus: false });

  toggleButton.addEventListener('click', () => {
    const willOpen = !drawer.classList.contains('open');
    setDrawerOpen(willOpen, { manageFocus: false });
    playSound('click');
    triggerHaptic('light');
  });

  closeButton.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', () => closeDrawer({ manageFocus: false }));

  if (quickOverall) {
    quickOverall.addEventListener('click', () => {
      setDrawerOpen(true, { manageFocus: false });
      playSound('click');
      triggerHaptic('light');
    });
  }

  if (quickWatched) {
    quickWatched.addEventListener('click', () => {
      applyProgressFilter('in-progress');
      playSound('click');
      triggerHaptic('light');
    });
  }

  if (!statsDrawerEscapeBound) {
    statsDrawerEscapeBound = true;
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Escape') return;
      const activeDrawer = document.getElementById('stats-drawer');
      if (activeDrawer && activeDrawer.classList.contains('open')) {
        closeDrawer({ feedback: false, manageFocus: false });
      }
    });
  }
}

function initEraToggles() {
  const collapsed = loadCollapsedEras();
  document.querySelectorAll('.era-toggle').forEach((button) => {
    const eraId = button.dataset.eraToggle;
    const section = document.querySelector(`.timeline-section[data-era="${eraId}"]`);
    if (!section) return;
    if (collapsed.has(eraId)) {
      section.classList.add('collapsed');
      button.setAttribute('aria-expanded', 'false');
      button.textContent = 'Expand';
    }

    button.addEventListener('click', () => {
      const isCollapsed = section.classList.toggle('collapsed');
      button.setAttribute('aria-expanded', String(!isCollapsed));
      button.textContent = isCollapsed ? 'Expand' : 'Collapse';
      if (isCollapsed) {
        collapsed.add(eraId);
      } else {
        collapsed.delete(eraId);
      }
      saveCollapsedEras(collapsed);
    });
  });
}

function initEraRail() {
  document.querySelectorAll('.rail-marker').forEach((marker) => {
    marker.addEventListener('click', () => {
      if (marker.classList.contains('disabled')) return;
      const targetId = marker.dataset.eraTarget;
      const section = document.getElementById(targetId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  if (eraObserver) {
    eraObserver.disconnect();
  }

  const markers = Array.from(document.querySelectorAll('.rail-marker'));
  eraObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const eraId = entry.target.getAttribute('id');
      markers.forEach((marker) => {
        marker.classList.toggle('active', marker.dataset.eraTarget === eraId);
      });
    });
  }, { rootMargin: '-30% 0px -60% 0px', threshold: 0.1 });

  document.querySelectorAll('.timeline-section').forEach((section) => {
    eraObserver.observe(section);
  });

  initEraRailVisibilityTracking();
  syncEraRailViewportVisibility();
}

function initEraRailVisibilityTracking() {
  if (eraRailScrollBound) return;
  eraRailScrollBound = true;

  const onViewportChange = () => {
    if (eraRailScrollRaf) return;
    eraRailScrollRaf = requestAnimationFrame(() => {
      eraRailScrollRaf = null;
      syncEraRailViewportVisibility();
    });
  };

  window.addEventListener('scroll', onViewportChange, { passive: true });
  window.addEventListener('resize', onViewportChange);
  window.addEventListener('orientationchange', onViewportChange);
}

function syncEraRailViewportVisibility() {
  const rail = document.querySelector('.timeline-rail');
  const timelineContainer = document.querySelector('.timeline-container');
  if (!rail || !timelineContainer) return;

  const isDesktop = window.matchMedia('(min-width: 1024px)').matches;

  if (!isDesktop) {
    rail.classList.add('is-visible');
    return;
  }

  const rect = timelineContainer.getBoundingClientRect();
  const hasTimelineFullyEnteredView = rect.top <= 0;
  const minimumVisibleHeight = Math.max(320, window.innerHeight * 0.35);
  const shouldShow = hasTimelineFullyEnteredView && rect.bottom >= minimumVisibleHeight;
  rail.classList.toggle('is-visible', shouldShow);
}

function updateEraRailVisibility() {
  document.querySelectorAll('.rail-marker').forEach((marker) => {
    const targetId = marker.dataset.eraTarget;
    const section = document.getElementById(targetId);
    const isHidden = section ? section.classList.contains('hidden') : true;
    marker.classList.toggle('disabled', isHidden);
    marker.setAttribute('aria-disabled', String(isHidden));
    marker.tabIndex = isHidden ? -1 : 0;
  });
}

function updateWatchModeHighlight() {
  const cards = Array.from(document.querySelectorAll('.entry-card'));
  cards.forEach((card) => {
    card.classList.remove('watch-next', 'watch-dim');
  });

  if (!watchModeEnabled) return;

  const visibleCards = cards.filter((card) => !card.classList.contains('hidden') && card.offsetParent !== null);
  const nextCard = getNextUnwatchedVisibleCard();

  if (!nextCard) return;

  visibleCards.forEach((card) => {
    if (card === nextCard) {
      card.classList.add('watch-next');
    } else {
      card.classList.add('watch-dim');
    }
  });
}

function playSound(type) {
  if (!soundEnabled) return;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  if (!audioContext) {
    audioContext = new AudioCtx();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }

  const now = audioContext.currentTime;
  const gain = audioContext.createGain();
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
  gain.connect(audioContext.destination);

  const playTone = (frequency, start, duration) => {
    const osc = audioContext.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, start);
    osc.connect(gain);
    osc.start(start);
    osc.stop(start + duration);
  };

  if (type === 'success') {
    playTone(640, now, 0.12);
    playTone(880, now + 0.12, 0.12);
  } else if (type === 'toggle') {
    playTone(520, now, 0.12);
  } else {
    playTone(420, now, 0.1);
  }
}

function triggerHaptic(level) {
  if (!navigator.vibrate) return;
  if (window.matchMedia && !window.matchMedia('(pointer: coarse)').matches) return;
  const patterns = {
    light: 8,
    success: [12, 20, 12]
  };
  navigator.vibrate(patterns[level] || 10);
}

function updateFilters() {
  getFilterController().updateFilters();
}

// Watched state and modal helpers
function initializeWatchedState() {
  initializeWatchedStateModule(TIMELINE_DATA, updateEntryUI);
}

function attachEntryHandlers() {
  const timelineContainer = document.querySelector('.timeline-container');
  if (!timelineContainer) return;

  const openCardModal = (card) => {
    const sectionIdx = Number(card.dataset.section);
    const entryIdx = Number(card.dataset.entry);
    openModal(sectionIdx, entryIdx);
  };

  const handleSingleCheckboxChange = (checkboxEl) => {
    playSound(checkboxEl.checked ? 'success' : 'click');
    triggerHaptic(checkboxEl.checked ? 'success' : 'light');
    const sectionIdx = Number(checkboxEl.dataset.section);
    const entryIdx = Number(checkboxEl.dataset.entry);
    const entry = TIMELINE_DATA[sectionIdx].entries[entryIdx];
    entry._watchedArray = entry._watchedArray || new Array(entry.episodes).fill(false);
    entry._watchedArray[0] = checkboxEl.checked;
    saveWatchedState(entry);
    updateEntryUI(sectionIdx, entryIdx);
    showToast(`${entry.title}: ${checkboxEl.checked ? 'Marked as Watched' : 'Marked as Unwatched'}`, 'info');
  };

  timelineContainer.addEventListener('click', (event) => {
    if (event.target.closest('.card-movie-checkbox, .card-single-episode-checkbox, label, button, a, select, textarea, input')) {
      return;
    }

    const card = event.target.closest('.entry-card');
    if (!card) return;
    openCardModal(card);
  });

  timelineContainer.addEventListener('keydown', (event) => {
    if (event.target.closest('input, button, a, select, textarea')) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const card = event.target.closest('.entry-card');
    if (!card) return;

    event.preventDefault();
    openCardModal(card);
  });

  timelineContainer.addEventListener('change', (event) => {
    const checkbox = event.target.closest('.card-movie-checkbox, .card-single-episode-checkbox');
    if (!checkbox) return;
    handleSingleCheckboxChange(checkbox);
  });
}

function attachImageLoaders() {
  // Progressive blur-up image loading effect
  document.querySelectorAll('.entry-poster img').forEach(img => {
    if (img.complete && img.naturalWidth > 0) {
      // Image already loaded (cached)
      img.classList.add('loaded');
    } else {
      // Image still loading
      img.addEventListener('load', () => {
        img.classList.add('loaded');
      }, { once: true });
      
      // Fallback in case load event doesn't fire
      img.addEventListener('error', () => {
        img.classList.add('loaded');
      }, { once: true });
    }
  });
}

function attachResetButton() {
  getModalController().attachResetButton();
}

function resetAllProgress() {
  resetAllProgressModule(TIMELINE_DATA, updateEntryUI);
}

function openResetDialog() {
  getModalController().openResetDialog();
}

function closeResetDialog() {
  getModalController().closeResetDialog();
}

function showToast(message, type = 'info') {
  getModalController().showToast(message, type);
}

function saveWatchedState(entry) {
  saveWatchedStateModule(entry);
}

function updateCardQuickCheckState(card, isWatched) {
  card.querySelectorAll('.entry-quick-check').forEach(control => {
    control.classList.toggle('is-watched', isWatched);
  });
  card.querySelectorAll('[data-watch-state]').forEach(stateEl => {
    stateEl.textContent = isWatched ? 'Watched' : 'Not Watched';
    stateEl.classList.toggle('is-watched', isWatched);
  });
}

function updateEntryUI(sectionIdx, entryIdx) {
  const entry = TIMELINE_DATA[sectionIdx].entries[entryIdx];
  const selector = `.entry-card[data-section="${sectionIdx}"][data-entry="${entryIdx}"]`;
  const card = document.querySelector(selector);
  if (!card) return;
  const watchedCount = entry._watchedArray ? entry._watchedArray.filter(Boolean).length : entry.watched;
  const progress = entry.episodes > 0 ? Math.round((watchedCount / entry.episodes) * 100) : 0;
  const progressText = card.querySelector('.progress-text'); if (progressText) progressText.textContent = progress + '%';
  const progressCircle = card.querySelector('.progress-circle'); if (progressCircle) progressCircle.setAttribute('stroke-dasharray', `${progress * 2.827}, 282.7`);
  const episodesText = card.querySelector('.entry-episodes'); if (episodesText) episodesText.textContent = `${watchedCount}/${entry.episodes} Watched`;
  const movieCheckbox = card.querySelector('.card-movie-checkbox');
  if (movieCheckbox) {
    movieCheckbox.checked = Array.isArray(entry._watchedArray) ? Boolean(entry._watchedArray[0]) : Boolean(entry.watched);
  }
  const singleEpisodeCheckbox = card.querySelector('.card-single-episode-checkbox');
  if (singleEpisodeCheckbox) {
    singleEpisodeCheckbox.checked = Array.isArray(entry._watchedArray) ? Boolean(entry._watchedArray[0]) : Boolean(entry.watched);
  }
  const singleItemWatched = Array.isArray(entry._watchedArray) ? Boolean(entry._watchedArray[0]) : Boolean(entry.watched);
  updateCardQuickCheckState(card, singleItemWatched);

  updateWatchModeHighlight();
  
  // Update stats in header
  updateStats();
}

let statsUpdateQueued = false;

function updateStats() {
  if (statsUpdateQueued) return;
  statsUpdateQueued = true;
  requestAnimationFrame(() => {
    statsUpdateQueued = false;
    const stats = calculateStats();
    const statBoxes = document.querySelectorAll('.stat-box');

    updateStatBox(statBoxes[0], stats.overallProgress, {
      format: 'percent',
      progress: stats.overallProgress
    });

    updateStatBox(statBoxes[1], stats.watchedEpisodes, {
      format: 'number',
      progress: stats.totalEpisodes > 0 ? (stats.watchedEpisodes / stats.totalEpisodes * 100) : 0
    });

    updateStatBox(statBoxes[2], stats.completedShows, {
      format: 'fraction',
      total: stats.totalShows,
      progress: stats.totalShows > 0 ? (stats.completedShows / stats.totalShows * 100) : 0
    });

    updateStatBox(statBoxes[3], stats.totalEpisodes, {
      format: 'number'
    });

    const miniOverall = document.getElementById('stats-mini-overall');
    if (miniOverall) {
      miniOverall.textContent = `${stats.overallProgress}% overall`;
    }
    const miniWatched = document.getElementById('stats-mini-watched');
    if (miniWatched) {
      miniWatched.textContent = `${stats.watchedEpisodes} watched`;
    }

    updateStatSparklines();
  });
}

function updateStatBox(box, value, options = {}) {
  return updateStatBoxModule(box, value, options);
}

function openModal(sectionIdx, entryIdx) {
  getModalController().openModal(sectionIdx, entryIdx);
}

function closeModal() {
  getModalController().closeModal();
}

// Set CSS viewport height variable for mobile (fixes 100vh issues on iOS)
function setVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', () => {
  setVh();
  syncEraRailViewportVisibility();
  scheduleFlowLinesRedraw();
});

window.addEventListener('orientationchange', () => {
  setVh();
  syncEraRailViewportVisibility();
  scheduleFlowLinesRedraw();
});

// Setup Intersection Observer for optimal rendering of off-screen cards
function setupIntersectionObserver() {
  // Check if Intersection Observer is supported
  if (!('IntersectionObserver' in window)) {
    // Fallback: add all cards to viewport for older browsers
    document.querySelectorAll('.entry-card').forEach(card => {
      card.classList.add('in-viewport');
    });
    return;
  }

  // Create observer with root margin to load cards slightly before they're visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-viewport');
      } else {
        entry.target.classList.remove('in-viewport');
      }
    });
  }, {
    root: null,
    rootMargin: '50px', // Start loading 50px before card enters viewport
    threshold: 0 // Fire as soon as any part is visible
  });

  // Observe all entry cards
  document.querySelectorAll('.entry-card').forEach(card => {
    observer.observe(card);
  });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  setVh();
  
  // Load timeline data from JSON before rendering
  const loaded = await loadTimelineData();
  if (loaded) {
    render();
    setupIntersectionObserver();
  } else {
    // Show error message if data fails to load
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<div style="color: white; text-align: center; padding: 2rem;">Failed to load timeline data. Please refresh the page.</div>';
    }
  }
});
