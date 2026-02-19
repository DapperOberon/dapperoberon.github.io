export function createFilterController({
  getTimelineData,
  getEntrySearchText,
  playSound,
  triggerHaptic,
  updateEraRailVisibility,
  updateWatchModeHighlight,
  scheduleFlowLinesRedraw,
  onFiltersChanged = () => {}
}) {
  const filters = {
    canon: true,
    legends: true,
    search: '',
    type: 'all',
    progress: 'all'
  };

  let filtersPanelListenersBound = false;

  function getActiveFilterCount() {
    let activeCount = 0;
    if (filters.type !== 'all') activeCount += 1;
    if (!(filters.canon && filters.legends)) activeCount += 1;
    if (filters.progress !== 'all') activeCount += 1;
    if (filters.search && filters.search.trim().length > 0) activeCount += 1;
    return activeCount;
  }

  function updateMobileFilterSummary() {
    const countEl = document.getElementById('filters-active-count');
    if (!countEl) return;
    const activeCount = getActiveFilterCount();
    countEl.textContent = activeCount === 0 ? 'All' : `${activeCount} active`;
  }

  function updateFilters() {
    const timelineData = getTimelineData();
    const cards = document.querySelectorAll('.entry-card');
    const entryUpdates = [];
    let visibleCount = 0;

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const sectionIdx = parseInt(card.dataset.section, 10);
      const entryIdx = parseInt(card.dataset.entry, 10);
      const entry = timelineData[sectionIdx].entries[entryIdx];
      const isCanon = card.dataset.canon === 'true';

      let canonMatch = false;
      if (filters.canon && filters.legends) {
        canonMatch = true;
      } else if (filters.canon && isCanon) {
        canonMatch = true;
      } else if (filters.legends && !isCanon) {
        canonMatch = true;
      }

      const searchText = filters.search;
      const searchMatch = !searchText || getEntrySearchText(entry).includes(searchText);

      let typeMatch = true;
      if (filters.type === 'films') {
        typeMatch = entry.type.toLowerCase().includes('film');
      } else if (filters.type === 'shows') {
        typeMatch = entry.episodes > 1 || /show|anthology/i.test(entry.type);
      }

      let progressMatch = true;
      if (filters.progress === 'not-started') {
        progressMatch = entry.watched === 0;
      } else if (filters.progress === 'in-progress') {
        progressMatch = entry.watched > 0 && entry.watched < entry.episodes;
      } else if (filters.progress === 'completed') {
        progressMatch = entry.watched === entry.episodes && entry.episodes > 0;
      }

      const shouldShow = canonMatch && searchMatch && typeMatch && progressMatch;
      const entryNode = card.closest('.timeline-entry');
      entryUpdates.push({ card, entryNode, shouldShow });
      if (shouldShow) visibleCount++;
    }

    entryUpdates.forEach(({ card, entryNode, shouldShow }) => {
      if (shouldShow) {
        card.classList.remove('hidden');
        if (entryNode) entryNode.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
        if (entryNode) entryNode.classList.add('hidden');
      }
    });

    const sections = document.querySelectorAll('.timeline-section');
    const sectionUpdates = [];
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      const visibleEntries = section.querySelectorAll('.timeline-entry:not(.hidden)').length;
      sectionUpdates.push({ section, visible: visibleEntries > 0 });
    }
    sectionUpdates.forEach(({ section, visible }) => {
      section.classList.toggle('hidden', !visible);
    });

    const noResults = document.getElementById('no-results');
    if (noResults) {
      noResults.classList.toggle('hidden', visibleCount > 0);
    }

    updateEraRailVisibility();
    updateWatchModeHighlight();
    scheduleFlowLinesRedraw();
    updateMobileFilterSummary();
    onFiltersChanged({ ...filters }, getActiveFilterCount());
  }

  function syncFilterButtonStates() {
    document.querySelectorAll('[data-canon-filter]').forEach((button) => {
      button.classList.remove('active');
    });

    const canonState = filters.canon && filters.legends
      ? 'all'
      : filters.canon
        ? 'canon'
        : 'legends';
    const canonButton = document.querySelector(`[data-canon-filter="${canonState}"]`);
    if (canonButton) canonButton.classList.add('active');

    document.querySelectorAll('[data-type-filter]').forEach((button) => {
      button.classList.toggle('active', button.dataset.typeFilter === filters.type);
    });

    document.querySelectorAll('[data-progress-filter]').forEach((button) => {
      button.classList.toggle('active', button.dataset.progressFilter === filters.progress);
    });
  }

  function setSearchFilter(value, { syncInput = true } = {}) {
    const text = String(value || '');
    filters.search = text.toLowerCase();
    if (syncInput) {
      const searchInput = document.getElementById('search-input');
      if (searchInput && searchInput.value !== text) {
        searchInput.value = text;
      }
    }
    updateFilters();
  }

  function setCanonFilter(filter) {
    if (filter === 'canon') {
      filters.canon = true;
      filters.legends = false;
    } else if (filter === 'legends') {
      filters.canon = false;
      filters.legends = true;
    } else {
      filters.canon = true;
      filters.legends = true;
    }
    syncFilterButtonStates();
    updateFilters();
  }

  function setTypeFilter(filter) {
    filters.type = filter || 'all';
    syncFilterButtonStates();
    updateFilters();
  }

  function setProgressFilter(filter) {
    filters.progress = filter || 'all';
    syncFilterButtonStates();
    updateFilters();
  }

  function resetFilters({ withFeedback = false } = {}) {
    if (withFeedback) {
      playSound('click');
      triggerHaptic('light');
    }

    filters.canon = true;
    filters.legends = true;
    filters.type = 'all';
    filters.progress = 'all';
    filters.search = '';

    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    syncFilterButtonStates();
    updateFilters();
  }

  function attachFilterHandlers() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        setSearchFilter(e.target.value, { syncInput: false });
      });
    }

    document.querySelectorAll('[data-canon-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        playSound('click');
        triggerHaptic('light');
        setCanonFilter(btn.dataset.canonFilter);
      });
    });

    document.querySelectorAll('[data-type-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        playSound('click');
        triggerHaptic('light');
        setTypeFilter(btn.dataset.typeFilter);
      });
    });

    document.querySelectorAll('[data-progress-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        playSound('click');
        triggerHaptic('light');
        setProgressFilter(btn.dataset.progressFilter);
      });
    });

    updateFilters();
  }

  function initMobileFilterPanel() {
    const toggleBtn = document.getElementById('filters-toggle');
    const panel = document.getElementById('filters-panel');
    if (!toggleBtn || !panel) return;

    const setPanelOpen = (isOpen) => {
      panel.classList.toggle('open', isOpen);
      toggleBtn.setAttribute('aria-expanded', String(isOpen));
      panel.setAttribute('aria-hidden', String(!isOpen));
    };

    setPanelOpen(false);
    updateMobileFilterSummary();

    toggleBtn.addEventListener('click', () => {
      const isOpen = panel.classList.contains('open');
      setPanelOpen(!isOpen);
      playSound('click');
      triggerHaptic('light');
    });

    document.querySelectorAll('.filter-btn').forEach((button) => {
      button.addEventListener('click', () => {
        setPanelOpen(false);
      });
    });

    if (!filtersPanelListenersBound) {
      filtersPanelListenersBound = true;

      document.addEventListener('click', (event) => {
        if (panel.classList.contains('open') && !panel.contains(event.target) && !toggleBtn.contains(event.target)) {
          setPanelOpen(false);
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && panel.classList.contains('open')) {
          setPanelOpen(false);
        }
      });
    }
  }

  function attachStatHandlers() {
    const activateFilter = (filter) => {
      const button = document.querySelector(`[data-progress-filter="${filter}"]`);
      if (button) button.click();
    };

    document.querySelectorAll('.stat-box[data-filter]').forEach((box) => {
      const filter = box.dataset.filter;
      box.addEventListener('click', () => activateFilter(filter));
      box.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          activateFilter(filter);
        }
      });
    });
  }

  return {
    getFilters: () => filters,
    attachFilterHandlers,
    initMobileFilterPanel,
    attachStatHandlers,
    updateFilters,
    setSearchFilter,
    setCanonFilter,
    setTypeFilter,
    setProgressFilter,
    resetFilters
  };
}
