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

  return series
    .map((value, index) => {
      const x = (index / (series.length - 1 || 1)) * (width - padding * 2) + padding;
      const normalized = (value - min) / range;
      const y = height - padding - normalized * (height - padding * 2);
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function buildSparklineSvg(values, maxValue) {
  const path = buildSparklinePath(values, maxValue);
  return `
    <svg class="stat-sparkline" viewBox="0 0 100 24" preserveAspectRatio="none" aria-hidden="true">
      <path class="stat-sparkline-path" d="${path}"></path>
    </svg>
  `;
}

function buildStatSeries(timelineData) {
  const totals = calculateStats(timelineData);
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
  timelineData.forEach((section) => {
    section.entries.forEach((entry) => entries.push(entry));
  });

  if (entries.length === 0) {
    series.overallProgress = [0];
    series.watchedEpisodes = [0];
    series.completedShows = [0];
    series.totalEpisodes = [0];
    return { series, totals };
  }

  entries.forEach((entry) => {
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

export function calculateStats(timelineData) {
  let totalEpisodes = 0;
  let watchedEpisodes = 0;
  let completedShows = 0;
  let totalShows = 0;

  timelineData.forEach((section) => {
    section.entries.forEach((entry) => {
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

export function buildStatSparklines(timelineData) {
  const { series, totals } = buildStatSeries(timelineData);
  return {
    overall: buildSparklineSvg(series.overallProgress, 100),
    watched: buildSparklineSvg(series.watchedEpisodes, Math.max(totals.totalEpisodes, 1)),
    completed: buildSparklineSvg(series.completedShows, Math.max(totals.totalShows, 1)),
    total: buildSparklineSvg(series.totalEpisodes, Math.max(totals.totalEpisodes, 1))
  };
}

export function updateStatSparklines(timelineData) {
  const { series, totals } = buildStatSeries(timelineData);
  const sparklines = {
    overall: buildSparklinePath(series.overallProgress, 100),
    episodes: buildSparklinePath(series.watchedEpisodes, Math.max(totals.totalEpisodes, 1)),
    completed: buildSparklinePath(series.completedShows, Math.max(totals.totalShows, 1)),
    total: buildSparklinePath(series.totalEpisodes, Math.max(totals.totalEpisodes, 1))
  };

  document.querySelectorAll('.stat-box').forEach((box) => {
    const stat = box.dataset.stat;
    const path = box.querySelector('.stat-sparkline-path');
    if (stat && path && sparklines[stat]) {
      path.setAttribute('d', sparklines[stat]);
    }
  });
}

export function updateStatBox(box, value, options = {}) {
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
