import { STORY_ARC_OPTIONS } from "./constants.js";
import { calculateStats } from "./stats.js";
import {
  getEraProgress,
  getMediaDistribution,
  getNextObjective
} from "./timeline-data.js";

export function renderFilterPanel({
  isOpen,
  filters,
  eras,
  escapeHtml
}) {
  if (!isOpen || !filters) return "";

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

export function renderStatsPanel({
  isOpen,
  timelineData,
  entries,
  escapeHtml
}) {
  if (!isOpen) return "";

  const stats = calculateStats(timelineData);
  const eraProgress = getEraProgress(timelineData);
  const media = getMediaDistribution(entries);
  const nextObjective = getNextObjective(entries);

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
                        <div class="absolute bottom-0 w-full ${barClass}" style="height:${Math.max(18, Math.min(100, entries.length ? Math.round((value / entries.length) * 100) : 0))}%;"></div>
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
                    <img class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" src="${escapeHtml(nextObjective.posterUrl || nextObjective.poster)}" alt="${escapeHtml(nextObjective.title)}">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] to-transparent"></div>
                    <div class="absolute top-4 left-4">
                      <span class="kicker-label">Next</span>
                    </div>
                  </div>
                  <div class="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h4 class="font-label text-xs text-secondary uppercase tracking-widest mb-1">${escapeHtml(nextObjective.era)}</h4>
                      <h2 class="font-headline text-2xl font-bold text-white uppercase leading-none mb-3">${escapeHtml(nextObjective.title)}</h2>
                      <p class="font-label text-[10px] text-primary-fixed uppercase tracking-[0.18em] mb-2">${escapeHtml(nextObjective.metaDisplay || nextObjective.metaText || nextObjective.storyMeta || "")}</p>
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
                  <div class="w-full ${fillClass} rounded-t-lg" style="height:${Math.max(18, Math.min(100, entries.length ? Math.round((value / entries.length) * 100) : 0))}%;"></div>
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
                <img class="w-full h-full object-cover transition duration-700 group-hover:scale-110 grayscale-[0.2]" src="${escapeHtml(nextObjective.posterUrl || nextObjective.poster)}" alt="${escapeHtml(nextObjective.title)}">
                <div class="absolute inset-0 bg-gradient-to-t from-surface-dim via-surface-dim/40 to-transparent"></div>
                <div class="absolute inset-0 p-6 flex flex-col justify-end gap-2">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 bg-error text-on-error font-label text-[8px] uppercase font-black rounded-sm">${escapeHtml(nextObjective.era)}</span>
                  </div>
                  <h4 class="font-headline text-2xl font-black tracking-tight text-white drop-shadow-md">${escapeHtml(nextObjective.title)}</h4>
                  <p class="font-label text-[10px] text-primary-fixed uppercase tracking-[0.18em]">${escapeHtml(nextObjective.metaDisplay || nextObjective.metaText || nextObjective.storyMeta || "")}</p>
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

export function renderPreferencesPanel({
  isOpen,
  preferences,
  escapeHtml
}) {
  if (!isOpen || !preferences) return "";

  const prefs = preferences;
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
