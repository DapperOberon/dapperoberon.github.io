const STORAGE_KEY = 'sw_timeline_ux_metrics_v1';
const MAX_EVENTS = 120;

function safeNow() {
  return Date.now();
}

function defaultState() {
  return {
    sessions: 0,
    lastSessionId: null,
    counters: {
      filterChanges: 0,
      filteredViews: 0,
      continueClicks: 0,
      continueMisses: 0
    },
    funnel: {
      firstSeenAt: null,
      milestones: {}
    },
    lastFilterSignature: '',
    lastOverallProgress: null,
    events: []
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      ...defaultState(),
      ...parsed,
      counters: {
        ...defaultState().counters,
        ...(parsed && parsed.counters ? parsed.counters : {})
      },
      funnel: {
        ...defaultState().funnel,
        ...(parsed && parsed.funnel ? parsed.funnel : {}),
        milestones: {
          ...(parsed && parsed.funnel && parsed.funnel.milestones ? parsed.funnel.milestones : {})
        }
      },
      events: Array.isArray(parsed && parsed.events) ? parsed.events.slice(-MAX_EVENTS) : []
    };
  } catch (e) {
    return defaultState();
  }
}

function persistState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Ignore persistence failures.
  }
}

function pushEvent(state, eventName, payload = {}) {
  state.events.push({
    name: eventName,
    at: safeNow(),
    payload
  });
  if (state.events.length > MAX_EVENTS) {
    state.events.splice(0, state.events.length - MAX_EVENTS);
  }
}

function markFunnelMilestone(state, milestone, overallProgress) {
  if (state.funnel.milestones[milestone]) return;
  state.funnel.milestones[milestone] = safeNow();
  pushEvent(state, 'funnel_milestone', { milestone, overallProgress });
}

export function createTelemetryController() {
  const state = loadState();

  function save() {
    persistState(state);
  }

  function track(eventName, payload = {}) {
    pushEvent(state, eventName, payload);
    save();
  }

  function startSession() {
    const sessionId = `${safeNow()}-${Math.random().toString(36).slice(2, 8)}`;
    state.sessions += 1;
    state.lastSessionId = sessionId;
    pushEvent(state, 'session_start', { sessionId });
    save();
  }

  function trackFilterUsage(filters, activeCount) {
    const signature = JSON.stringify({
      canon: Boolean(filters && filters.canon),
      legends: Boolean(filters && filters.legends),
      type: (filters && filters.type) || 'all',
      progress: (filters && filters.progress) || 'all',
      arc: (filters && filters.arc) || 'all',
      search: (filters && filters.search) || ''
    });

    if (signature === state.lastFilterSignature) return;

    state.lastFilterSignature = signature;
    state.counters.filterChanges += 1;
    if (activeCount > 0) {
      state.counters.filteredViews += 1;
    }

    pushEvent(state, 'filter_change', { activeCount });
    save();
  }

  function trackContinueUsage(foundNext) {
    state.counters.continueClicks += 1;
    if (!foundNext) {
      state.counters.continueMisses += 1;
    }
    pushEvent(state, 'continue_click', { foundNext: Boolean(foundNext) });
    save();
  }

  function trackProgress(stats) {
    const overallProgress = Number(stats && stats.overallProgress);
    if (!Number.isFinite(overallProgress)) return;

    if (!state.funnel.firstSeenAt) {
      state.funnel.firstSeenAt = safeNow();
    }

    if (state.lastOverallProgress !== overallProgress) {
      state.lastOverallProgress = overallProgress;
      pushEvent(state, 'progress_snapshot', { overallProgress });
    }

    if (overallProgress >= 1) markFunnelMilestone(state, 'started', overallProgress);
    if (overallProgress >= 25) markFunnelMilestone(state, 'quarter', overallProgress);
    if (overallProgress >= 50) markFunnelMilestone(state, 'half', overallProgress);
    if (overallProgress >= 75) markFunnelMilestone(state, 'three_quarters', overallProgress);
    if (overallProgress >= 100) markFunnelMilestone(state, 'completed', overallProgress);

    save();
  }

  function getSnapshot() {
    return JSON.parse(JSON.stringify(state));
  }

  return {
    track,
    startSession,
    trackFilterUsage,
    trackContinueUsage,
    trackProgress,
    getSnapshot
  };
}
