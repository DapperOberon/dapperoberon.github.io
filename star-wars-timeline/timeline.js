// Star Wars Timeline Data - loaded from JSON
let TIMELINE_DATA = [];

// Load timeline data from JSON file
async function loadTimelineData() {
  try {
    const response = await fetch('./timeline-data.json');
    if (!response.ok) {
      throw new Error(`Failed to load timeline data: ${response.status}`);
    }
    TIMELINE_DATA = await response.json();
    
    // Initialize _watchedArray for entries based on their watched status from the JSON
    TIMELINE_DATA.forEach(section => {
      section.entries.forEach(entry => {
        // Create initial _watchedArray based on watched count from JSON
        if (!entry._watchedArray) {
          const watchedCount = entry.watched || 0;
          entry._watchedArray = new Array(entry.episodes).fill(false);
          // Mark the first 'watchedCount' episodes as watched by default
          for (let i = 0; i < Math.min(watchedCount, entry.episodes); i++) {
            entry._watchedArray[i] = true;
          }
        }
      });
    });
    
    return true;
  } catch (error) {
    console.error('Error loading timeline data:', error);
    return false;
  }
}

function isShowEntry(entry) {
  return /show|anthology/i.test(entry.type) && entry.episodes > 1;
}

function getEntryMetaText(entry) {
  const parts = [`${entry.year}`];

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

function getEntrySearchText(entry) {
  const episodeTitles = Array.isArray(entry.episodeDetails)
    ? entry.episodeDetails.map(ep => ep && ep.title ? ep.title : '').join(' ')
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

function getLegacyWatchedStorageKey(entry) {
  return 'watched_' + entry.title.replace(/\s+/g, '_');
}

function getEntryStorageId(entry) {
  if (entry && entry.id) {
    return String(entry.id);
  }

  const firstEpisodeTitle = Array.isArray(entry.episodeDetails) && entry.episodeDetails.length > 0 && entry.episodeDetails[0].title
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
  ].join('|').toLowerCase();

  return fingerprint.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function getWatchedStorageKey(entry) {
  return 'watched_' + getEntryStorageId(entry);
}

// saved scroll position while modal is open
let _savedScrollY = 0;
let _currentModalSection = null;
let _currentModalEntry = null;

// Filter state
let filters = {
  canon: true,
  legends: true,
  search: '',
  type: 'all', // 'all', 'films', 'shows'
  progress: 'all' // 'all', 'not-started', 'in-progress', 'completed'
};

let _flowLineRaf = null;
let _flowScrollRaf = null;
let _flowScrollBound = false;
let _flowTooltip = null;

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
  if (_flowLineRaf) {
    cancelAnimationFrame(_flowLineRaf);
  }
  _flowLineRaf = requestAnimationFrame(() => {
    _flowLineRaf = null;
    drawTimelineFlowLines();
  });
}

function drawTimelineFlowLines() {
  const svgNs = 'http://www.w3.org/2000/svg';
  document.querySelectorAll('.timeline-flow-svg').forEach((existingSvg) => existingSvg.remove());

  const container = document.querySelector('.timeline-container');
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const rowTolerance = 8;
  const allRows = [];

  const parseCardEpisodes = (card) => {
    const text = card.querySelector('.entry-episodes')?.textContent || '';
    const match = text.match(/(\d+)\s*\/\s*(\d+)/);
    if (!match) return { watched: 0, total: 0 };
    return { watched: Number(match[1]), total: Number(match[2]) };
  };

  document.querySelectorAll('.entries-grid').forEach((grid) => {
    const cards = Array.from(grid.querySelectorAll('.entry-card')).filter((card) => {
      const style = window.getComputedStyle(card);
      return style.display !== 'none' && card.offsetParent !== null;
    });

    if (cards.length === 0) return;

    cards.sort((a, b) => {
      if (a.offsetTop !== b.offsetTop) return a.offsetTop - b.offsetTop;
      return a.offsetLeft - b.offsetLeft;
    });

    const rows = [];
    let gridMinLeft = Infinity;
    let gridMaxRight = -Infinity;
    cards.forEach((card) => {
      const top = card.offsetTop;
      const bottom = top + card.offsetHeight;
      const left = card.offsetLeft;
      const right = left + card.offsetWidth;
      gridMinLeft = Math.min(gridMinLeft, left);
      gridMaxRight = Math.max(gridMaxRight, right);
      let row = rows.find((candidate) => Math.abs(candidate.top - top) <= rowTolerance);
      if (!row) {
        row = { top, bottom, minLeft: left, maxRight: right, cards: [{ left, right, element: card }] };
        rows.push(row);
      } else {
        row.top = Math.min(row.top, top);
        row.bottom = Math.max(row.bottom, bottom);
        row.minLeft = Math.min(row.minLeft, left);
        row.maxRight = Math.max(row.maxRight, right);
        row.cards.push({ left, right, element: card });
      }
    });

    rows.forEach((row) => {
      row.centerY = (row.top + row.bottom) / 2;
      const sortedCards = (row.cards || []).slice().sort((a, b) => a.left - b.left);
      row.gapCenters = [];
      for (let i = 0; i < sortedCards.length - 1; i++) {
        const currentCard = sortedCards[i];
        const nextCard = sortedCards[i + 1];
        if (nextCard.left > currentCard.right) {
          row.gapCenters.push((currentCard.right + nextCard.left) / 2);
        }
      }

      let totalEpisodes = 0;
      let watchedEpisodes = 0;
      let entryCount = 0;
      (row.cards || []).forEach((cardInfo) => {
        if (!cardInfo.element) return;
        const stats = parseCardEpisodes(cardInfo.element);
        totalEpisodes += stats.total;
        watchedEpisodes += stats.watched;
        entryCount += 1;
      });
      row.totalEpisodes = totalEpisodes;
      row.watchedEpisodes = watchedEpisodes;
      row.entryCount = entryCount;
    });

    const gridRect = grid.getBoundingClientRect();
    const gridOffsetTop = gridRect.top - containerRect.top;
    const gridOffsetLeft = gridRect.left - containerRect.left;

    rows.forEach((row) => {
      allRows.push({
        top: gridOffsetTop + row.top,
        bottom: gridOffsetTop + row.bottom,
        centerY: gridOffsetTop + row.centerY,
        minLeft: gridOffsetLeft + row.minLeft,
        maxRight: gridOffsetLeft + row.maxRight,
        gridMinLeft: gridOffsetLeft + gridMinLeft,
        gridMaxRight: gridOffsetLeft + gridMaxRight,
        gapCenters: (row.gapCenters || []).map((x) => gridOffsetLeft + x),
        totalEpisodes: row.totalEpisodes || 0,
        watchedEpisodes: row.watchedEpisodes || 0,
        entryCount: row.entryCount || 0
      });
    });
  });

  if (allRows.length === 0) return;

  // Find the widest bounds across all rows to use for all rows
  let overallMinLeft = Infinity;
  let overallMaxRight = -Infinity;
  allRows.forEach(row => {
    overallMinLeft = Math.min(overallMinLeft, row.gridMinLeft);
    overallMaxRight = Math.max(overallMaxRight, row.gridMaxRight);
  });

  const headerCenters = Array.from(document.querySelectorAll('.timeline-section h2')).map((header) => {
    const rect = header.getBoundingClientRect();
    return Math.round(rect.top - containerRect.top + (rect.height / 2));
  });

  allRows.sort((a, b) => a.top - b.top);

  const containerWidth = Math.max(1, container.clientWidth);
  const containerHeight = Math.max(1, container.scrollHeight);
  const overflowX = 28;
  const edgeInset = 10;
  const laneLeftX = Math.round((-overflowX) + edgeInset);
  const laneRightX = Math.round(containerWidth + overflowX - edgeInset);
  const rowEdgePadding = 24;
  const flowColor = '#D4AF37';

  const svg = document.createElementNS(svgNs, 'svg');
  svg.setAttribute('class', 'timeline-flow-svg timeline-flow-svg-global');
  svg.setAttribute('viewBox', `${-overflowX} 0 ${containerWidth + (overflowX * 2)} ${containerHeight}`);
  svg.setAttribute('preserveAspectRatio', 'none');

  const getRowBounds = (row) => {
    const left = Math.round(Math.max(laneLeftX, overallMinLeft - rowEdgePadding));
    const right = Math.round(Math.min(laneRightX, overallMaxRight + rowEdgePadding));
    return { left, right };
  };

  const firstBounds = getRowBounds(allRows[0]);
  const lastBounds = getRowBounds(allRows[allRows.length - 1]);
  const startPointY = Math.round(allRows[0].centerY);
  const endPointY = Math.round(allRows[allRows.length - 1].centerY);

  let d = '';
  let previousRow = null;

  allRows.forEach((row, rowIndex) => {
    const rowY = Math.round(row.centerY);
    const rowBounds = getRowBounds(row);

    if (rowIndex === 0) {
      d = `M ${rowBounds.left} ${rowY} L ${rowBounds.right} ${rowY}`;
    } else {
      const gapTop = previousRow.bottom;
      const gapBottom = row.top;
      let gapMiddle = gapBottom > gapTop
        ? Math.round((gapTop + gapBottom) / 2)
        : Math.round(gapTop);

      if (gapBottom > gapTop && headerCenters.length > 0) {
        const headersInGap = headerCenters.filter((y) => y > gapTop && y < gapBottom);
        if (headersInGap.length > 0) {
          gapMiddle = headersInGap.reduce((closest, y) => (
            Math.abs(y - gapMiddle) < Math.abs(closest - gapMiddle) ? y : closest
          ), headersInGap[0]);
        }
      }
      const previousBounds = getRowBounds(previousRow);

      d += ` L ${previousBounds.right} ${gapMiddle}`;
      d += ` L ${rowBounds.left} ${gapMiddle}`;
      d += ` L ${rowBounds.left} ${rowY}`;
      d += ` L ${rowBounds.right} ${rowY}`;
    }

    previousRow = row;
  });

  // Calculate aggregate stats for tooltip
  const totalEps = allRows.reduce((sum, r) => sum + (r.totalEpisodes || 0), 0);
  const watchedEps = allRows.reduce((sum, r) => sum + (r.watchedEpisodes || 0), 0);
  const totalEntries = allRows.reduce((sum, r) => sum + (r.entryCount || 0), 0);
  const overallProgress = totalEps > 0 ? Math.round((watchedEps / totalEps) * 100) : 0;
  const tooltipText = `Episodes: ${totalEps} | Entries: ${totalEntries} | Progress: ${overallProgress}%`;

  const glowPath = document.createElementNS(svgNs, 'path');
  glowPath.setAttribute('d', d);
  glowPath.setAttribute('class', 'timeline-flow-path timeline-flow-path-glow');
  glowPath.setAttribute('stroke', flowColor);
  glowPath.addEventListener('mouseenter', (event) => {
    showFlowTooltip(tooltipText, event.clientX, event.clientY);
  });
  glowPath.addEventListener('mousemove', (event) => {
    showFlowTooltip(tooltipText, event.clientX, event.clientY);
  });
  glowPath.addEventListener('mouseleave', hideFlowTooltip);

  const mainPath = document.createElementNS(svgNs, 'path');
  mainPath.setAttribute('d', d);
  mainPath.setAttribute('class', 'timeline-flow-path');
  mainPath.setAttribute('stroke', flowColor);
  mainPath.addEventListener('mouseenter', (event) => {
    showFlowTooltip(tooltipText, event.clientX, event.clientY);
  });
  mainPath.addEventListener('mousemove', (event) => {
    showFlowTooltip(tooltipText, event.clientX, event.clientY);
  });
  mainPath.addEventListener('mouseleave', hideFlowTooltip);

  const directionPath = document.createElementNS(svgNs, 'path');
  directionPath.setAttribute('d', d);
  directionPath.setAttribute('class', 'timeline-flow-path timeline-flow-path-direction');
  directionPath.setAttribute('stroke', flowColor);

  const pulsePath = document.createElementNS(svgNs, 'path');
  pulsePath.setAttribute('d', d);
  pulsePath.setAttribute('class', 'timeline-flow-path timeline-flow-path-pulse');
  pulsePath.setAttribute('stroke', flowColor);

  svg.appendChild(glowPath);
  svg.appendChild(mainPath);
  svg.appendChild(directionPath);
  svg.appendChild(pulsePath);

  // Build list of path segments with their coordinates and direction
  const pathSegments = [];
  previousRow = null;

  allRows.forEach((row, rowIndex) => {
    const rowY = Math.round(row.centerY);
    const rowBounds = getRowBounds(row);

    if (rowIndex === 0) {
      // First row horizontal segment (left to right)
      const progress = row.totalEpisodes > 0 ? Math.round((row.watchedEpisodes / row.totalEpisodes) * 100) : 0;
      pathSegments.push({
        type: 'horizontal',
        x1: rowBounds.left,
        x2: rowBounds.right,
        y: rowY,
        direction: 'right',
        arrowPositions: row.gapCenters,
        isRowSegment: true,
        totalEpisodes: row.totalEpisodes || 0,
        watchedEpisodes: row.watchedEpisodes || 0,
        entryCount: row.entryCount || 0,
        progress
      });
    } else {
      const gapTop = previousRow.bottom;
      const gapBottom = row.top;
      let gapMiddle = gapBottom > gapTop
        ? Math.round((gapTop + gapBottom) / 2)
        : Math.round(gapTop);

      if (gapBottom > gapTop && headerCenters.length > 0) {
        const headersInGap = headerCenters.filter((y) => y > gapTop && y < gapBottom);
        if (headersInGap.length > 0) {
          gapMiddle = headersInGap.reduce((closest, y) => (
            Math.abs(y - gapMiddle) < Math.abs(closest - gapMiddle) ? y : closest
          ), headersInGap[0]);
        }
      }
      const previousBounds = getRowBounds(previousRow);
      const gapEpisodes = Math.round(((previousRow.totalEpisodes || 0) + (row.totalEpisodes || 0)) / 2);
      const gapWatched = Math.round(((previousRow.watchedEpisodes || 0) + (row.watchedEpisodes || 0)) / 2);
      const gapEntries = Math.round(((previousRow.entryCount || 0) + (row.entryCount || 0)) / 2);
      const gapProgress = gapEpisodes > 0 ? Math.round((gapWatched / gapEpisodes) * 100) : 0;

      // Vertical segment from previous row to gap
      pathSegments.push({
        type: 'vertical',
        x: previousBounds.right,
        y1: previousRow.centerY,
        y2: gapMiddle,
        direction: 'down',
        totalEpisodes: previousRow.totalEpisodes || 0,
        watchedEpisodes: previousRow.watchedEpisodes || 0,
        entryCount: previousRow.entryCount || 0,
        progress: previousRow.totalEpisodes > 0
          ? Math.round((previousRow.watchedEpisodes / previousRow.totalEpisodes) * 100)
          : 0
      });

      // Horizontal segment in gap
      const gapDirection = previousBounds.right > rowBounds.left ? 'left' : 'right';
      const gapArrowPositions = (Array.isArray(previousRow.gapCenters) && previousRow.gapCenters.length > 0)
        ? previousRow.gapCenters
        : row.gapCenters;
      pathSegments.push({
        type: 'horizontal',
        x1: previousBounds.right,
        x2: rowBounds.left,
        y: gapMiddle,
        direction: gapDirection,
        arrowPositions: gapArrowPositions,
        isGapSegment: true,
        totalEpisodes: gapEpisodes,
        watchedEpisodes: gapWatched,
        entryCount: gapEntries,
        progress: gapProgress
      });

      // Vertical segment from gap to current row
      pathSegments.push({
        type: 'vertical',
        x: rowBounds.left,
        y1: gapMiddle,
        y2: rowY,
        direction: 'down',
        totalEpisodes: row.totalEpisodes || 0,
        watchedEpisodes: row.watchedEpisodes || 0,
        entryCount: row.entryCount || 0,
        progress: row.totalEpisodes > 0
          ? Math.round((row.watchedEpisodes / row.totalEpisodes) * 100)
          : 0
      });

      // Current row horizontal segment
      pathSegments.push({
        type: 'horizontal',
        x1: rowBounds.left,
        x2: rowBounds.right,
        y: rowY,
        direction: 'right',
        arrowPositions: row.gapCenters,
        isRowSegment: true,
        totalEpisodes: row.totalEpisodes || 0,
        watchedEpisodes: row.watchedEpisodes || 0,
        entryCount: row.entryCount || 0,
        progress: row.totalEpisodes > 0
          ? Math.round((row.watchedEpisodes / row.totalEpisodes) * 100)
          : 0
      });
    }

    previousRow = row;
  });

  const startGlow = document.createElementNS(svgNs, 'circle');
  startGlow.setAttribute('class', 'timeline-flow-endpoint timeline-flow-endpoint-glow');
  startGlow.setAttribute('cx', String(firstBounds.left));
  startGlow.setAttribute('cy', String(startPointY));
  startGlow.setAttribute('r', '8');
  startGlow.setAttribute('fill', flowColor);

  const endGlow = document.createElementNS(svgNs, 'circle');
  endGlow.setAttribute('class', 'timeline-flow-endpoint timeline-flow-endpoint-glow');
  endGlow.setAttribute('cx', String(lastBounds.right));
  endGlow.setAttribute('cy', String(endPointY));
  endGlow.setAttribute('r', '8');
  endGlow.setAttribute('fill', flowColor);

  const startDot = document.createElementNS(svgNs, 'circle');
  startDot.setAttribute('class', 'timeline-flow-endpoint');
  startDot.setAttribute('cx', String(firstBounds.left));
  startDot.setAttribute('cy', String(startPointY));
  startDot.setAttribute('r', '5');
  startDot.setAttribute('fill', flowColor);

  const endDot = document.createElementNS(svgNs, 'circle');
  endDot.setAttribute('class', 'timeline-flow-endpoint');
  endDot.setAttribute('cx', String(lastBounds.right));
  endDot.setAttribute('cy', String(endPointY));
  endDot.setAttribute('r', '5');
  endDot.setAttribute('fill', flowColor);

  svg.appendChild(startGlow);
  svg.appendChild(endGlow);
  svg.appendChild(startDot);
  svg.appendChild(endDot);
  container.appendChild(svg);

  updateFlowOffset();
}

// Calculate statistics
function calculateStats() {
  let totalEpisodes = 0;
  let watchedEpisodes = 0;
  let completedShows = 0;
  let totalShows = 0;

  TIMELINE_DATA.forEach(section => {
    section.entries.forEach(entry => {
      totalEpisodes += entry.episodes;
      watchedEpisodes += entry.watched;
      totalShows++;
      if (entry.watched === entry.episodes && entry.episodes > 0) {
        completedShows++;
      }
    });
  });

  const overallProgress = totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

  return {
    overallProgress,
    watchedEpisodes,
    completedShows,
    totalShows,
    totalEpisodes
  };
}

function buildStatSeries() {
  const totals = calculateStats();
  const series = {
    overallProgress: [],
    watchedEpisodes: [],
    completedShows: [],
    totalEpisodes: []
  };

  let cumulativeWatched = 0;
  let cumulativeEpisodes = 0;
  let cumulativeCompleted = 0;

  const entries = [];
  TIMELINE_DATA.forEach(section => {
    section.entries.forEach(entry => entries.push(entry));
  });

  if (entries.length === 0) {
    series.overallProgress = [0];
    series.watchedEpisodes = [0];
    series.completedShows = [0];
    series.totalEpisodes = [0];
    return { series, totals };
  }

  entries.forEach(entry => {
    cumulativeEpisodes += entry.episodes;
    cumulativeWatched += entry.watched;
    if (entry.episodes > 0 && entry.watched === entry.episodes) {
      cumulativeCompleted += 1;
    }
    const overall = cumulativeEpisodes > 0 ? (cumulativeWatched / cumulativeEpisodes) * 100 : 0;
    series.overallProgress.push(overall);
    series.watchedEpisodes.push(cumulativeWatched);
    series.completedShows.push(cumulativeCompleted);
    series.totalEpisodes.push(cumulativeEpisodes);
  });

  return { series, totals };
}

function downsampleSeries(values, maxPoints = 12) {
  if (values.length <= maxPoints) return values;
  const sampled = [];
  const step = (values.length - 1) / (maxPoints - 1);
  for (let i = 0; i < maxPoints; i++) {
    const idx = Math.round(i * step);
    sampled.push(values[idx]);
  }
  return sampled;
}

function buildSparklinePath(values, maxValue) {
  const width = 100;
  const height = 24;
  const padding = 2;
  const series = downsampleSeries(values);
  const max = maxValue || Math.max(...series, 1);
  const min = 0;
  const range = Math.max(max - min, 1);

  return series.map((value, index) => {
    const x = (index / (series.length - 1 || 1)) * (width - padding * 2) + padding;
    const normalized = (value - min) / range;
    const y = height - padding - normalized * (height - padding * 2);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');
}

function buildSparklineSvg(values, maxValue) {
  const path = buildSparklinePath(values, maxValue);
  return `
    <svg class="stat-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
      <path class="stat-sparkline-path" d="${path}"></path>
    </svg>
  `;
}

function buildStatSparklines() {
  const { series, totals } = buildStatSeries();
  return {
    overall: buildSparklineSvg(series.overallProgress, 100),
    watched: buildSparklineSvg(series.watchedEpisodes, Math.max(totals.totalEpisodes, 1)),
    completed: buildSparklineSvg(series.completedShows, Math.max(totals.totalShows, 1)),
    total: buildSparklineSvg(series.totalEpisodes, Math.max(totals.totalEpisodes, 1))
  };
}

function updateStatSparklines() {
  const { series, totals } = buildStatSeries();
  const sparklines = {
    overall: buildSparklinePath(series.overallProgress, 100),
    episodes: buildSparklinePath(series.watchedEpisodes, Math.max(totals.totalEpisodes, 1)),
    completed: buildSparklinePath(series.completedShows, Math.max(totals.totalShows, 1)),
    total: buildSparklinePath(series.totalEpisodes, Math.max(totals.totalEpisodes, 1))
  };

  document.querySelectorAll('.stat-box').forEach(box => {
    const stat = box.dataset.stat;
    const path = box.querySelector('.stat-sparkline-path');
    if (stat && path && sparklines[stat]) {
      path.setAttribute('d', sparklines[stat]);
    }
  });
}

function animateStatValue(el, target, format, total) {
  const start = Number(el.dataset.current || 0);
  const end = Number(target || 0);
  const duration = 700;
  const startTime = performance.now();

  const formatValue = (value) => {
    const rounded = Math.round(value);
    if (format === 'percent') return `${rounded}%`;
    if (format === 'fraction') return `${rounded}/${total || 0}`;
    return `${rounded}`;
  };

  const step = (now) => {
    const elapsed = Math.min(now - startTime, duration);
    const progress = elapsed / duration;
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = start + (end - start) * eased;
    el.textContent = formatValue(current);
    if (elapsed < duration) {
      requestAnimationFrame(step);
    } else {
      el.textContent = formatValue(end);
      el.dataset.current = String(end);
    }
  };

  requestAnimationFrame(step);
}

// Convert hex color to RGB values for CSS rgba()
function hexToRgb(hex) {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Handle shorthand hex  
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `${r}, ${g}, ${b}`;
}

// Get media type color and icon
function getMediaTypeInfo(type) {
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

// Render the timeline
function render() {
  const app = document.getElementById('app');
  const stats = calculateStats();
  const sparklines = buildStatSparklines();
  
  app.innerHTML = `
    <a href="#main-content" class="skip-link">Skip to main content</a>
    <header class="site-hero">
      <div class="header-container">
        <div class="hero-title">
          <h1><span class="hero-strong">GALACTIC</span> <span class="hero-accent">ARCHIVE</span></h1>
          <p class="hero-sub">A comprehensive chronological guide to the Star Wars universe. Track your progress across the stars.</p>
        </div>
      </div>
      
      <!-- Statistics Section -->
      <div class="stats-container">
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
            <div class="stat-progress-bar" style="width: ${(stats.watchedEpisodes / stats.totalEpisodes * 100)}%"></div>
          </div>
        </div>
        <div class="stat-box" data-stat="completed" data-filter="completed" role="button" tabindex="0" aria-label="Filter to completed entries">
          <div class="stat-value" data-format="fraction" data-target="${stats.completedShows}" data-total="${stats.totalShows}">0/${stats.totalShows}</div>
          <div class="stat-label">COMPLETED SHOWS</div>
          ${sparklines.completed}
          <div class="stat-progress">
            <div class="stat-progress-bar" style="width: ${(stats.completedShows / stats.totalShows * 100)}%"></div>
          </div>
        </div>
        <div class="stat-box" data-stat="total" data-filter="not-started" role="button" tabindex="0" aria-label="Filter to not started entries">
          <div class="stat-value" data-format="number" data-target="${stats.totalEpisodes}">0</div>
          <div class="stat-label">TOTAL EPISODES</div>
          ${sparklines.total}
        </div>
      </div>

      <div class="interaction-toggles" aria-label="Interaction settings">
        <label class="toggle">
          <input type="checkbox" id="sound-toggle" aria-label="Toggle sound effects" />
          <span class="toggle-track"></span>
          <span class="toggle-label">Sound FX</span>
        </label>
      </div>
      
      <!-- Search and Filters -->
      <div class="filters-container">
        <div class="search-wrapper">
          <svg class="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18 18l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <input type="text" id="search-input" class="search-input" placeholder="Search by title, year, or type..." />
        </div>
      </div>
      
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
      </div>
    </header>

    <main class="timeline-container" id="main-content" tabindex="-1">
      <div id="no-results" style="display: none; text-align: center; padding: 2rem; color: var(--text-secondary); grid-column: 1 / -1;">
        <p>No entries match the selected filters.</p>
      </div>

      ${TIMELINE_DATA.map((section, idx) => {
        const itemCount = section.entries.length;
        const itemLabel = `${itemCount} item${itemCount === 1 ? '' : 's'}`;
        const sectionColorRgb = hexToRgb(section.color);
        return `
        <section class="timeline-section" style="--section-color: ${section.color}; --section-color-rgb: ${sectionColorRgb};">
          <h2><span class="era-title">${section.era}</span> <span class="era-count">${itemLabel}</span></h2>
          <div class="entries-grid">
            ${section.entries.map((entry, entryIdx) => {
              const progress = entry.episodes > 0 ? Math.round((entry.watched / entry.episodes) * 100) : 0;
              const isMovie = /film/i.test(entry.type) && entry.episodes === 1;
              const entryMetaText = getEntryMetaText(entry);
              const mediaTypeInfo = getMediaTypeInfo(entry.type);
              return `
                <div class="entry-card" data-canon="${entry.canon}" data-section="${idx}" data-entry="${entryIdx}">
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
                    <p class="entry-meta">${entryMetaText}</p>
                    <div class="entry-row">
                      <p class="entry-episodes">${entry.watched}/${entry.episodes} watched</p>
                      ${isMovie ? `<label class="card-checkbox-inline" title="Mark as watched"><input type="checkbox" class="card-movie-checkbox" data-section="${idx}" data-entry="${entryIdx}" /><span class="card-checkbox-box"></span></label>` : ''}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </section>
      `;
      }).join('')}
    </main>

    <footer>
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
        <p>© 2026 DapperOberon. Star Wars is a trademark of Lucasfilm Ltd.</p>
        <button id="reset-progress-btn" title="Reset all watched progress">Reset Progress</button>
      </div>
    </footer>
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
  attachStatHandlers();
  initSoundToggle();
  attachEntryHandlers();
  attachImageLoaders(); // Add blur-up image loading effect
  attachResetButton();
  scheduleFlowLinesRedraw();
  initFlowScrollAnimation();
}

// Filter handlers
function attachFilterHandlers() {
  // Search input
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      filters.search = e.target.value.toLowerCase();
      updateFilters();
    });
  }
  
  // Canon/Legends filters
  document.querySelectorAll('[data-canon-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      triggerHaptic('light');
      document.querySelectorAll('[data-canon-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.canonFilter;
      if (filter === 'all') {
        filters.canon = true;
        filters.legends = true;
      } else if (filter === 'canon') {
        filters.canon = true;
        filters.legends = false;
      } else if (filter === 'legends') {
        filters.canon = false;
        filters.legends = true;
      }
      updateFilters();
    });
  });
  
  // Type filters
  document.querySelectorAll('[data-type-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      triggerHaptic('light');
      document.querySelectorAll('[data-type-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filters.type = btn.dataset.typeFilter;
      updateFilters();
    });
  });
  
  // Progress filters
  document.querySelectorAll('[data-progress-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      playSound('click');
      triggerHaptic('light');
      document.querySelectorAll('[data-progress-filter]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filters.progress = btn.dataset.progressFilter;
      updateFilters();
    });
  });
  
  // initial filter pass
  updateFilters();
}

function attachStatHandlers() {
  const activateFilter = (filter) => {
    const button = document.querySelector(`[data-progress-filter="${filter}"]`);
    if (button) button.click();
  };

  document.querySelectorAll('.stat-box[data-filter]').forEach(box => {
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

let soundEnabled = false;
let audioContext = null;

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
  let visibleCount = 0;
  
  document.querySelectorAll('.entry-card').forEach(card => {
    const sectionIdx = parseInt(card.dataset.section);
    const entryIdx = parseInt(card.dataset.entry);
    const entry = TIMELINE_DATA[sectionIdx].entries[entryIdx];
    const isCanon = card.dataset.canon === 'true';
    
    // Canon/Legends filter
    let canonMatch = false;
    if (filters.canon && filters.legends) {
      canonMatch = true;
    } else if (filters.canon && isCanon) {
      canonMatch = true;
    } else if (filters.legends && !isCanon) {
      canonMatch = true;
    }
    
    // Search filter
    const searchText = filters.search;
    const searchMatch = !searchText || getEntrySearchText(entry).includes(searchText);
    
    // Type filter
    let typeMatch = true;
    if (filters.type === 'films') {
      typeMatch = entry.type.toLowerCase().includes('film');
    } else if (filters.type === 'shows') {
      typeMatch = entry.type.toLowerCase().includes('show');
    }
    
    // Progress filter
    let progressMatch = true;
    if (filters.progress === 'not-started') {
      progressMatch = entry.watched === 0;
    } else if (filters.progress === 'in-progress') {
      progressMatch = entry.watched > 0 && entry.watched < entry.episodes;
    } else if (filters.progress === 'completed') {
      progressMatch = entry.watched === entry.episodes && entry.episodes > 0;
    }
    
    if (canonMatch && searchMatch && typeMatch && progressMatch) {
      card.style.display = '';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  
  // Hide sections with no visible entries and center short rows
  document.querySelectorAll('.timeline-section').forEach(section => {
    const visibleCards = section.querySelectorAll('.entry-card:not([style*="display: none"])').length;
    section.style.display = visibleCards === 0 ? 'none' : '';
  });
  
  const noResults = document.getElementById('no-results');
  if (noResults) {
    noResults.style.display = visibleCount === 0 ? 'block' : 'none';
  }

  scheduleFlowLinesRedraw();
}

// Watched state and modal helpers
function initializeWatchedState() {
  TIMELINE_DATA.forEach(section => {
    section.entries.forEach(entry => {
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
              try { localStorage.setItem(key, JSON.stringify(arr)); } catch (e) {}
              if (legacyKey !== key) {
                try { localStorage.removeItem(legacyKey); } catch (e) {}
              }
            }
            return;
          }
        }
      } catch (e) {}
      // If the author supplied a prefilled _watchedArray in the data, use it
      if (Array.isArray(entry._watchedArray) && entry._watchedArray.length === entry.episodes) {
        entry.watched = entry._watchedArray.filter(Boolean).length;
        return;
      }
      entry._watchedArray = new Array(entry.episodes).fill(false);
      entry.watched = entry.watched || 0;
    });
  });
  // update UI counts
  TIMELINE_DATA.forEach((section, sidx) => {
    section.entries.forEach((entry, eidx) => updateEntryUI(sidx, eidx));
  });
}

function attachEntryHandlers() {
  document.querySelectorAll('.entry-card').forEach(card => {
    card.addEventListener('click', () => {
      const s = Number(card.dataset.section);
      const e = Number(card.dataset.entry);
      openModal(s, e);
    });

    // movie checkbox handling: stop propagation on input and label, and update watched state
    const cb = card.querySelector('.card-movie-checkbox');
    if (cb) {
      cb.addEventListener('click', (ev) => ev.stopPropagation());
      const label = card.querySelector('.card-checkbox-inline');
      if (label) label.addEventListener('click', (ev) => ev.stopPropagation());
      cb.addEventListener('change', () => {
        playSound(cb.checked ? 'success' : 'click');
        triggerHaptic(cb.checked ? 'success' : 'light');
        const s = Number(cb.dataset.section);
        const e = Number(cb.dataset.entry);
        const entry = TIMELINE_DATA[s].entries[e];
        entry._watchedArray = entry._watchedArray || new Array(entry.episodes).fill(false);
        entry._watchedArray[0] = cb.checked;
        saveWatchedState(entry);
        updateEntryUI(s, e);
        showToast(`${entry.title}: ${cb.checked ? 'Marked as watched' : 'Marked as unwatched'}`, 'info');
      });
    }
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
  const resetBtn = document.getElementById('reset-progress-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      playSound('click');
      triggerHaptic('light');
      openResetDialog();
    });
  }
}

function resetAllProgress() {
  TIMELINE_DATA.forEach((section, sectionIdx) => {
    section.entries.forEach((entry, entryIdx) => {
      entry._watchedArray = new Array(entry.episodes).fill(false);
      entry.watched = 0;
      const key = getWatchedStorageKey(entry);
      const legacyKey = getLegacyWatchedStorageKey(entry);
      try { localStorage.removeItem(key); } catch (e) {}
      if (legacyKey !== key) {
        try { localStorage.removeItem(legacyKey); } catch (e) {}
      }
      updateEntryUI(sectionIdx, entryIdx);
    });
  });
}

function openResetDialog() {
  const resetDialog = document.getElementById('reset-dialog');
  if (!resetDialog) return;

  resetDialog.innerHTML = `
    <div class="reset-dialog-backdrop"></div>
    <div class="reset-dialog-content" role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title" aria-describedby="reset-dialog-description">
      <h2 id="reset-dialog-title">Reset progress?</h2>
      <p id="reset-dialog-description">This will clear all watched progress across the timeline. This action cannot be undone.</p>
      <div class="reset-dialog-actions">
        <button type="button" class="modal-close-btn" id="reset-dialog-cancel">Cancel</button>
        <button type="button" class="modal-primary-btn" id="reset-dialog-confirm">Reset Progress</button>
      </div>
    </div>
  `;

  resetDialog.classList.remove('hidden');
  resetDialog.setAttribute('aria-hidden', 'false');

  const cancelBtn = resetDialog.querySelector('#reset-dialog-cancel');
  const confirmBtn = resetDialog.querySelector('#reset-dialog-confirm');
  const backdrop = resetDialog.querySelector('.reset-dialog-backdrop');

  const closeOnEscape = (event) => {
    if (event.key === 'Escape') {
      closeResetDialog();
    }
  };

  const handleClose = () => {
    document.removeEventListener('keydown', closeOnEscape);
    closeResetDialog();
  };

  if (cancelBtn) cancelBtn.addEventListener('click', handleClose);
  if (backdrop) backdrop.addEventListener('click', handleClose);
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      playSound('success');
      triggerHaptic('success');
      resetAllProgress();
      handleClose();
      showToast('All watched progress has been reset.', 'success');
    });
    confirmBtn.focus();
  }

  document.addEventListener('keydown', closeOnEscape);
}

function closeResetDialog() {
  const resetDialog = document.getElementById('reset-dialog');
  if (!resetDialog) return;
  resetDialog.classList.add('hidden');
  resetDialog.setAttribute('aria-hidden', 'true');
}

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.textContent = message;

  toastContainer.appendChild(toast);

  const existingToasts = toastContainer.querySelectorAll('.toast');
  if (existingToasts.length > 4) {
    existingToasts[0].remove();
  }

  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 220);
  }, 2600);
}

function isShowCompleted(entry) {
  if (!entry || entry.episodes <= 1 || !Array.isArray(entry._watchedArray)) return false;
  return entry._watchedArray.every(Boolean);
}

function saveWatchedState(entry) {
  const key = getWatchedStorageKey(entry);
  const legacyKey = getLegacyWatchedStorageKey(entry);
  try { localStorage.setItem(key, JSON.stringify(entry._watchedArray)); } catch (e) {}
  if (legacyKey !== key) {
    try { localStorage.removeItem(legacyKey); } catch (e) {}
  }
  entry.watched = entry._watchedArray.filter(Boolean).length;
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
  const episodesText = card.querySelector('.entry-episodes'); if (episodesText) episodesText.textContent = `${watchedCount}/${entry.episodes} watched`;
  const movieCheckbox = card.querySelector('.card-movie-checkbox');
  if (movieCheckbox) {
    movieCheckbox.checked = Array.isArray(entry._watchedArray) ? Boolean(entry._watchedArray[0]) : Boolean(entry.watched);
  }
  
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

    updateStatSparklines();
  });
}

function updateStatBox(box, value, options = {}) {
  if (!box) return;
  const valueEl = box.querySelector('.stat-value');
  const progressBar = box.querySelector('.stat-progress-bar');
  const previous = valueEl ? Number(valueEl.dataset.current || 0) : 0;
  const changed = Number.isFinite(previous) ? previous !== value : true;

  if (valueEl) {
    valueEl.dataset.target = String(value);
    animateStatValue(valueEl, value, options.format, options.total);
  }

  if (progressBar && typeof options.progress === 'number') {
    progressBar.style.width = `${options.progress}%`;
  }

  if (changed) {
    box.classList.remove('pulse');
    void box.offsetWidth;
    box.classList.add('pulse');
  }
}

function openModal(sectionIdx, entryIdx) {
  // store indices for closeModal to use
  _currentModalSection = sectionIdx;
  _currentModalEntry = entryIdx;
  const entry = TIMELINE_DATA[sectionIdx].entries[entryIdx];
  const section = TIMELINE_DATA[sectionIdx];
  const sectionColor = section.color;
  const sectionColorRgb = hexToRgb(sectionColor);
  const modal = document.getElementById('modal');
  const arr = entry._watchedArray || new Array(entry.episodes).fill(false);
  const watchedCount = arr.filter(Boolean).length;
  const progress = entry.episodes > 0 ? Math.round((watchedCount / entry.episodes) * 100) : 0;

  let episodesHTML = '';
  for (let i = 0; i < entry.episodes; i++) {
    const checked = arr[i] ? 'checked' : '';
    const episodeTitle = (entry.episodeDetails && entry.episodeDetails[i] && entry.episodeDetails[i].title) || '';
    const episodeTime = (entry.episodeDetails && entry.episodeDetails[i] && entry.episodeDetails[i].time) || '';
    const episodeTimeText = String(episodeTime).trim() || '—';
    episodesHTML += `
      <div class="episode-item">
        <label>
          <input type="checkbox" data-ep="${i}" ${checked} />
          <span class="episode-title">${episodeTitle}</span>
          <span class="episode-time">${episodeTimeText}</span>
        </label>
      </div>
    `;
  }

  const synopsis = entry.synopsis || '';
  const showEpisodes = entry.episodes > 1; // Only show episodes for series/shows
  const progressPercent = entry.episodes > 0 ? Math.round((watchedCount / entry.episodes) * 100) : 0;
  const episodeCountText = showEpisodes ? `${watchedCount}/${entry.episodes} watched (${progressPercent}%)` : '';
  const entryMetaText = getEntryMetaText(entry);
  const mediaTypeInfo = getMediaTypeInfo(entry.type);

  const modalHTML = `
    <div class="modal-backdrop">
      <div class="modal-backdrop-image" style="background-image: url('${entry.poster}');"></div>
    </div>
    <div class="modal-content" style="--section-color: ${sectionColor}; --section-color-rgb: ${sectionColorRgb};">
      <button class="modal-close" aria-label="Close">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <div class="modal-left"><img src="${entry.poster}" alt="${entry.title}"/></div>
      <div class="modal-right">
        <h2>${entry.title}</h2>
        <div class="modal-meta">
          <span class="modal-meta-text">${mediaTypeInfo.label} • ${entryMetaText}</span>
          <span class="modal-badge ${entry.canon ? 'canon' : 'legends'}">${entry.canon ? 'CANON' : 'LEGENDS'}</span>
        </div>
        ${synopsis ? `<p class="modal-synopsis">${synopsis}</p>` : ''}
        ${showEpisodes ? `
          <div class="modal-episodes">
            <div class="modal-episodes-header">
              <span class="modal-episodes-title">Episodes</span>
              <span id="modal-episode-count" class="modal-episodes-count">${episodeCountText}</span>
            </div>
            <div class="episode-list-wrapper"><div class="episode-list">${episodesHTML}</div></div>
          </div>
        ` : ''}
        <div class="modal-actions">
          ${showEpisodes ? `<button class="modal-primary-btn" id="mark-all-watched">Mark All Watched</button>` : ''}
          <button class="modal-close-btn">Close</button>
        </div>
      </div>
    </div>
  `;
  
  modal.innerHTML = modalHTML;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');

  // Apply blur-up loading effect to modal image
  const modalImg = modal.querySelector('.modal-left img');
  if (modalImg) {
    if (modalImg.complete && modalImg.naturalWidth > 0) {
      modalImg.classList.add('loaded');
    } else {
      modalImg.addEventListener('load', () => {
        modalImg.classList.add('loaded');
      }, { once: true });
      modalImg.addEventListener('error', () => {
        modalImg.classList.add('loaded');
      }, { once: true });
    }
  }

  // lock background scrolling: save scroll position and fix body
  _savedScrollY = window.scrollY || window.pageYOffset || 0;
  document.body.style.top = `-${_savedScrollY}px`;
  document.body.classList.add('modal-open');

  modal.querySelector('.modal-close').addEventListener('click', () => {
    playSound('click');
    triggerHaptic('light');
    closeModal();
  });
  modal.querySelector('.modal-close-btn').addEventListener('click', () => {
    playSound('click');
    triggerHaptic('light');
    closeModal();
  });
  modal.querySelector('.modal-backdrop').addEventListener('click', () => {
    playSound('click');
    triggerHaptic('light');
    closeModal();
  });

  const updateModalCount = () => {
    const updatedCount = entry._watchedArray.filter(Boolean).length;
    const percent = entry.episodes > 0 ? Math.round((updatedCount / entry.episodes) * 100) : 0;
    const countEl = modal.querySelector('#modal-episode-count');
    if (countEl) {
      countEl.textContent = `${updatedCount}/${entry.episodes} watched (${percent}%)`;
    }
    
    // Update button text based on state
    const markAllBtn = modal.querySelector('#mark-all-watched');
    if (markAllBtn) {
      const allChecked = entry._watchedArray.every(Boolean);
      markAllBtn.textContent = allChecked ? 'Unmark All' : 'Mark All Watched';
    }
  };

  const markAllBtn = modal.querySelector('#mark-all-watched');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', () => {
      playSound('success');
      triggerHaptic('success');
      const wasCompleted = isShowCompleted(entry);
      const allChecked = entry._watchedArray.every(Boolean);
      const newState = !allChecked;
      
      entry._watchedArray = new Array(entry.episodes).fill(newState);
      modal.querySelectorAll('.episode-item input[type="checkbox"]').forEach((cb, idx) => {
        cb.checked = newState;
        entry._watchedArray[idx] = newState;
      });
      saveWatchedState(entry);
      updateEntryUI(sectionIdx, entryIdx);
      updateModalCount();
      showToast(`${entry.title}: ${newState ? 'Marked all as watched' : 'Cleared watched status'}`, 'success');
      if (!wasCompleted && isShowCompleted(entry)) {
        showToast(`${entry.title} completed!`, 'success');
      }
    });
    
    // Set initial button text
    updateModalCount();
  }

  // Handle checkboxes for series/shows
  const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach(cb => {
    cb.addEventListener('change', () => {
      playSound(cb.checked ? 'success' : 'click');
      triggerHaptic(cb.checked ? 'success' : 'light');
      const wasCompleted = isShowCompleted(entry);
      const idx = Number(cb.dataset.ep);
      entry._watchedArray[idx] = cb.checked;
      saveWatchedState(entry);
      updateEntryUI(sectionIdx, entryIdx);
      // Update the modal episode count
      updateModalCount();
      if (!wasCompleted && isShowCompleted(entry)) {
        showToast(`${entry.title} completed!`, 'success');
      }
    });
  });
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (!modal || modal.classList.contains('hidden')) return;
  
  const scrollY = _savedScrollY || 0;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  
  document.body.classList.remove('modal-open');
  document.body.style.top = '';
  window.scrollTo(0, scrollY);
  _savedScrollY = 0;
  
  // update card UI to reflect any watched changes
  if (_currentModalSection !== null && _currentModalEntry !== null) {
    updateEntryUI(_currentModalSection, _currentModalEntry);
  }
}

// Set CSS viewport height variable for mobile (fixes 100vh issues on iOS)
function setVh() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', () => {
  setVh();
  scheduleFlowLinesRedraw();
});

window.addEventListener('orientationchange', () => {
  setVh();
  scheduleFlowLinesRedraw();
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  setVh();
  
  // Load timeline data from JSON before rendering
  const loaded = await loadTimelineData();
  if (loaded) {
    render();
  } else {
    // Show error message if data fails to load
    const app = document.getElementById('app');
    if (app) {
      app.innerHTML = '<div style="color: white; text-align: center; padding: 2rem;">Failed to load timeline data. Please refresh the page.</div>';
    }
  }
});
