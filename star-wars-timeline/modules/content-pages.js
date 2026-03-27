import { calculateStats } from "./stats.js";
import {
  getEraProgress,
  getMediaDistribution,
  getNextObjective
} from "./timeline-data.js";

const guideSidebarLinks = [
  { id: "guide-overview", label: "Overview", icon: "menu_book" },
  { id: "guide-chronology", label: "Chronology", icon: "schedule" },
  { id: "guide-eras", label: "Eras & Types", icon: "account_tree" },
  { id: "guide-progress", label: "Progress", icon: "task_alt" },
  { id: "guide-filters", label: "Filters", icon: "filter_alt" },
  { id: "guide-links", label: "Watch Links", icon: "open_in_new" },
  { id: "guide-special-cases", label: "Special Cases", icon: "alt_route" },
  { id: "guide-faq", label: "FAQ", icon: "help" }
];

const privacySidebarLinks = [
  { id: "privacy-overview", label: "Overview", icon: "policy" },
  { id: "privacy-local-data", label: "Local Data", icon: "database" },
  { id: "privacy-progress", label: "Progress", icon: "task_alt" },
  { id: "privacy-external-links", label: "External Links", icon: "open_in_new" },
  { id: "privacy-no-collection", label: "No Collection", icon: "shield" },
  { id: "privacy-contact", label: "Questions", icon: "help" }
];

const termsSidebarLinks = [
  { id: "terms-overview", label: "Overview", icon: "gavel" },
  { id: "terms-use", label: "Use", icon: "assignment" },
  { id: "terms-external", label: "External Links", icon: "open_in_new" },
  { id: "terms-fan-project", label: "Fan Project", icon: "theaters" },
  { id: "terms-changes", label: "Changes", icon: "update" }
];

const statsSidebarLinks = [
  { id: "stats-overview", label: "Completion", icon: "leaderboard" },
  { id: "stats-era-breakdown", label: "Era Progress", icon: "query_stats" },
  { id: "stats-media-distribution", label: "Formats", icon: "equalizer" },
  { id: "stats-next-objective", label: "Next", icon: "rocket_launch" }
];

const preferencesSidebarLinks = [
  { id: "prefs-temporal", label: "Timeline", icon: "history_toggle_off" },
  { id: "prefs-content", label: "Content", icon: "folder_managed" },
  { id: "prefs-interface", label: "Appearance", icon: "palette" },
  { id: "prefs-system", label: "System", icon: "sync" }
];

function renderStatsPage({
  timelineData = [],
  entries = [],
  escapeHtml
}) {
  const stats = calculateStats(timelineData);
  const eraProgress = getEraProgress(timelineData);
  const media = getMediaDistribution(entries);
  const nextObjective = getNextObjective(entries);

  return `
    <section id="stats-page">
      <div class="relative z-10 pt-12 pb-20 px-4 md:px-8">
        <div class="max-w-[1320px] mx-auto">
          <section class="glass-panel content-page-shell rounded-[2rem] overflow-hidden">
            <header id="stats-overview" class="px-6 py-8 md:px-10 md:py-10 relative scroll-mt-28">
              <div class="absolute inset-0 opacity-70" style="background:
                linear-gradient(135deg, rgba(255,232,31,0.12), transparent 28%),
                radial-gradient(circle at 78% 22%, rgba(61,184,255,0.12), transparent 22%);"></div>
              <div class="relative max-w-3xl">
                <p class="kicker-label">Archive Metrics</p>
                <h1 class="mt-4 font-headline text-4xl md:text-6xl tracking-tight text-white leading-none">Stats</h1>
                <p class="mt-5 text-white/72 font-body leading-relaxed max-w-2xl">
                  A live view of completion, era progress, format mix, and the next unwatched objective in the chronology.
                </p>
              </div>
            </header>

            <section class="hidden md:grid px-6 py-8 md:px-10 md:py-10 grid-cols-1 md:grid-cols-12 gap-6">
              <section class="utility-section md:col-span-4 p-6 flex flex-col items-center justify-center text-center space-y-6">
                <h2 class="font-headline font-bold tracking-widest text-sm uppercase">Completion</h2>
                <div class="relative w-56 h-56 flex items-center justify-center">
                  <svg class="w-full h-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="none" r="45" stroke="rgba(255,255,255,0.05)" stroke-width="8"></circle>
                    <circle cx="50" cy="50" fill="none" r="45" stroke="#75d1ff" stroke-dasharray="282.7" stroke-dashoffset="${(282.7 * (100 - stats.overallProgress)) / 100}" stroke-linecap="round" stroke-width="8"></circle>
                  </svg>
                  <div class="absolute inset-0 flex flex-col items-center justify-center">
                    <span class="font-headline text-5xl font-bold text-white tracking-tighter">${stats.overallProgress}%</span>
                    <span class="font-label text-[10px] text-on-surface-variant uppercase tracking-widest">Complete</span>
                  </div>
                </div>
                <div class="space-y-1">
                  <p class="font-headline text-2xl text-secondary">${stats.watchedEpisodes} / ${stats.totalEpisodes}</p>
                  <p class="font-label text-[11px] text-zinc-500 uppercase tracking-widest">Logged</p>
                </div>
              </section>

              <section id="stats-era-breakdown" class="utility-section md:col-span-8 p-6 space-y-8 scroll-mt-28">
                <div class="flex justify-between items-end">
                  <h2 class="font-headline font-bold tracking-widest text-sm uppercase">Era Progress</h2>
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

              <section id="stats-media-distribution" class="utility-section md:col-span-5 p-6 space-y-10 scroll-mt-28">
                <h2 class="font-headline font-bold tracking-widest text-sm uppercase text-center">Formats</h2>
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

              <section class="utility-section md:col-span-3 p-6 flex flex-col justify-between overflow-hidden relative">
                <div>
                  <h2 class="font-headline font-bold tracking-widest text-sm uppercase mb-8">Completed</h2>
                  <div class="space-y-1">
                    <p class="font-headline text-6xl font-bold text-white">${stats.completedShows}</p>
                    <p class="font-label text-sm text-secondary uppercase tracking-[0.2em]">Completed</p>
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
                <section id="stats-next-objective" class="utility-section md:col-span-4 overflow-hidden group flex flex-col scroll-mt-28">
                  <div class="relative h-48 w-full overflow-hidden">
                    <img class="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" src="${escapeHtml(nextObjective.posterUrl || nextObjective.poster)}" alt="${escapeHtml(nextObjective.title)}">
                    <div class="absolute inset-0 bg-gradient-to-t from-[#1c1b1b] to-transparent"></div>
                    <div class="absolute top-4 left-4">
                      <span class="kicker-label">Next</span>
                    </div>
                  </div>
                  <div class="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      <h2 class="font-label text-xs text-secondary uppercase tracking-widest mb-1">${escapeHtml(nextObjective.era)}</h2>
                      <h3 class="font-headline text-2xl font-bold text-white uppercase leading-none mb-3">${escapeHtml(nextObjective.title)}</h3>
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
            </section>

            <section class="md:hidden px-6 py-8 space-y-6">
              <section class="utility-section p-6 flex flex-col items-center justify-center text-center space-y-6">
                <h2 class="font-headline font-bold tracking-widest text-sm uppercase">Completion</h2>
                <div class="relative w-56 h-56 flex items-center justify-center">
                  <div class="absolute inset-0 rounded-full bg-secondary/8 blur-3xl"></div>
                  <div class="w-full h-full rounded-full circular-progress relative flex items-center justify-center" style="background:conic-gradient(#75d1ff ${stats.overallProgress}%, transparent 0);">
                    <div class="w-[92%] h-[92%] rounded-full bg-surface-container-lowest flex flex-col items-center justify-center">
                      <span class="font-headline text-5xl font-bold text-secondary tracking-tight">${stats.overallProgress}%</span>
                      <span class="font-label text-[10px] uppercase tracking-[0.2em] text-secondary/60 mt-1">Complete</span>
                    </div>
                  </div>
                </div>
                <div class="mt-2">
                  <p class="font-headline text-lg font-bold tracking-widest text-on-surface">${stats.watchedEpisodes} / ${stats.totalEpisodes} LOGGED</p>
                </div>
              </section>

              <section id="stats-era-breakdown" class="utility-section p-6 space-y-6 scroll-mt-28">
                <h2 class="font-headline text-xl font-bold tracking-tight uppercase">Era Progress</h2>
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

              <section id="stats-media-distribution" class="utility-section p-6 space-y-6 scroll-mt-28">
                <h2 class="font-headline text-xl font-bold tracking-tight uppercase">Formats</h2>
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

              <section class="utility-section p-6 scroll-mt-28">
                <h2 class="font-headline text-xl font-bold tracking-tight uppercase">Completed</h2>
                <div class="soft-panel relative p-6 mt-5 rounded-2xl flex items-center justify-between overflow-hidden">
                  <div class="flex flex-col gap-1 z-10">
                    <h3 class="font-headline text-2xl font-black text-on-surface">${stats.completedShows} COMPLETED</h3>
                  </div>
                  <div class="z-10 bg-secondary-container/20 p-3 rounded-full text-secondary">
                    <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">rocket_launch</span>
                  </div>
                </div>
              </section>

              ${nextObjective ? `
                <section id="stats-next-objective" class="utility-section p-6 space-y-5 scroll-mt-28">
                  <h2 class="font-headline text-xl font-bold tracking-tight uppercase">Next</h2>
                  <div class="soft-panel relative rounded-2xl overflow-hidden aspect-video group cursor-pointer shadow-2xl">
                    <img class="w-full h-full object-cover transition duration-700 group-hover:scale-110 grayscale-[0.2]" src="${escapeHtml(nextObjective.posterUrl || nextObjective.poster)}" alt="${escapeHtml(nextObjective.title)}">
                    <div class="absolute inset-0 bg-gradient-to-t from-surface-dim via-surface-dim/40 to-transparent"></div>
                    <div class="absolute inset-0 p-6 flex flex-col justify-end gap-2">
                      <div class="flex items-center gap-2">
                        <span class="px-2 py-0.5 bg-error text-on-error font-label text-[8px] uppercase font-black rounded-sm">${escapeHtml(nextObjective.era)}</span>
                      </div>
                      <h3 class="font-headline text-2xl font-black tracking-tight text-white drop-shadow-md">${escapeHtml(nextObjective.title)}</h3>
                      <p class="font-label text-[10px] text-primary-fixed uppercase tracking-[0.18em]">${escapeHtml(nextObjective.metaDisplay || nextObjective.metaText || nextObjective.storyMeta || "")}</p>
                      <button class="mt-4 cta-primary w-full text-sm" type="button" data-stats-open-entry="${escapeHtml(nextObjective.id)}">
                        OPEN
                        <span class="material-symbols-outlined text-lg">play_arrow</span>
                      </button>
                    </div>
                  </div>
                </section>
              ` : ""}
            </section>
          </section>
        </div>
      </div>
    </section>
  `;
}

function renderPreferencesPage({
  preferences,
  escapeHtml
}) {
  if (!preferences) return "";

  const prefs = preferences;

  return `
    <section id="preferences-page">
      <div class="relative z-10 pt-12 pb-20 px-4 md:px-8">
        <div class="max-w-[1320px] mx-auto">
          <section class="glass-panel content-page-shell rounded-[2rem] overflow-hidden">
            <header id="prefs-overview" class="px-6 py-8 md:px-10 md:py-10 relative scroll-mt-28">
              <div class="absolute inset-0 opacity-70" style="background:
                linear-gradient(135deg, rgba(255,232,31,0.12), transparent 28%),
                radial-gradient(circle at 78% 22%, rgba(61,184,255,0.12), transparent 22%);"></div>
              <div class="relative max-w-3xl">
                <p class="kicker-label">Archive Controls</p>
                <h1 class="mt-4 font-headline text-4xl md:text-6xl tracking-tight text-white leading-none">Settings</h1>
                <p class="mt-5 text-white/72 font-body leading-relaxed max-w-2xl">
                  Tune chronology display, content rules, appearance, and audio behavior across the archive.
                </p>
              </div>
            </header>

            <section class="hidden md:grid px-6 py-8 md:px-10 md:py-10 grid-cols-1 xl:grid-cols-2 gap-6">
              <section id="prefs-temporal" class="utility-section p-6 flex flex-col gap-6 scroll-mt-28">
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

              <section id="prefs-content" class="utility-section p-6 flex flex-col gap-6 scroll-mt-28">
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

              <section id="prefs-interface" class="utility-section p-6 flex flex-col gap-6 scroll-mt-28">
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

              <section id="prefs-system" class="utility-section xl:col-span-2 p-8 flex flex-col md:flex-row gap-8 items-center justify-between relative scroll-mt-28">
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
                      <h2 class="font-headline font-bold tracking-widest uppercase text-sm">System</h2>
                    </div>
                      <p class="text-xs text-on-surface-variant font-body">Theme: <span class="text-secondary">${prefs.interfaceTheme === "sith-dark" ? "Sith Dark" : "Jedi Light"}</span></p>
                    <p class="text-xs text-on-surface-variant font-body">Glow Radius: <span class="text-secondary">${prefs.glowRadius}%</span></p>
                  </div>
                </div>
                <div class="flex gap-4">
                  <button class="ghost-button px-8 py-4 text-on-surface font-headline font-bold tracking-[0.2em] uppercase" type="button" data-reset-progress="true">RESET PROGRESS</button>
                  <button class="px-12 py-4 bg-primary-fixed text-on-primary-fixed font-headline font-bold tracking-[0.3em] uppercase group" type="button" data-nav-page="timeline">
                    <div class="flex items-center gap-3"><span>CONFIRM</span><span class="material-symbols-outlined">check</span></div>
                  </button>
                </div>
              </section>
            </section>

            <section class="md:hidden px-6 py-8 space-y-6">
              <section id="prefs-temporal" class="utility-section p-6 space-y-6 scroll-mt-28">
                <h2 class="font-headline text-xl font-bold tracking-tight uppercase">Timeline</h2>
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

              <section id="prefs-content" class="utility-section p-6 space-y-6 scroll-mt-28">
                <h2 class="font-headline text-xl font-bold tracking-tight uppercase">Content</h2>
                <div class="grid grid-cols-2 gap-3">
                  ${[
                    ["canonOnly", "verified", "Canon Only"],
                    ["legendsIntegration", "auto_stories", "Legends Integration"]
                  ].map(([key, icon, label]) => `
                    <button class="control-pill soft-panel p-4 rounded-lg ${prefs[key] ? "is-active text-primary-fixed opacity-100" : "opacity-60 text-on-surface"} flex flex-col items-center justify-center text-center gap-2" type="button" data-pref-toggle="${key}">
                      <span class="material-symbols-outlined ${prefs[key] ? "" : "text-on-surface-variant"}" style="font-variation-settings: 'FILL' ${prefs[key] ? 1 : 0};">${icon}</span>
                      <p class="font-label uppercase text-[10px] tracking-widest font-bold">${label}</p>
                    </button>
                  `).join("")}
                </div>
                <button class="utility-mobile-row text-left" type="button" data-pref-toggle="includeAnimatedShorts">
                  <div><p class="font-headline font-medium">Include Animated Shorts</p><p class="font-label text-[10px] text-on-surface-variant mt-1">Shorts and side stories</p></div>
                  <span class="toggle-shell relative inline-flex h-6 w-11 items-center bg-surface-container-highest"><span class="${prefs.includeAnimatedShorts ? "translate-x-6 bg-primary-fixed" : "translate-x-1 bg-on-surface-variant"} inline-block h-4 w-4 transform rounded-full transition"></span></span>
                </button>
              </section>

              <section id="prefs-interface" class="utility-section p-6 space-y-6 scroll-mt-28">
                <h2 class="font-headline text-xl font-bold tracking-tight uppercase">Appearance</h2>
                <div class="space-y-5">
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
                    <button class="control-pill flex-1 py-3 px-4 ${prefs.interfaceTheme === "sith-dark" ? "is-active text-primary-fixed" : "text-on-surface"} font-label uppercase text-[10px] tracking-widest font-bold flex items-center justify-center gap-2" type="button" data-pref-theme="sith-dark"><span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">dark_mode</span>Sith Dark</button>
                  </div>
                </div>
              </section>

              <section class="utility-section p-6 space-y-6">
                <h2 class="font-headline text-xl font-bold tracking-tight uppercase">Audio</h2>
                <div class="space-y-5">
                  <button class="utility-mobile-row text-left" type="button" data-mobile-audio-toggle="true">
                    <div><p class="font-headline font-medium">Background Music</p><p class="font-label text-[10px] text-on-surface-variant mt-1">Continuous playback across the archive</p></div>
                    <span class="toggle-shell relative inline-flex h-6 w-11 items-center bg-surface-container-highest"><span class="${prefs.audioEnabled ? "translate-x-6 bg-primary-fixed" : "translate-x-1 bg-on-surface-variant"} inline-block h-4 w-4 transform rounded-full transition"></span></span>
                  </button>
                  <button class="utility-mobile-row text-left" type="button" data-pref-toggle="soundEffectsEnabled">
                    <div><p class="font-headline font-medium">Sound Effects</p><p class="font-label text-[10px] text-on-surface-variant mt-1">Interface tones for archive actions</p></div>
                    <span class="toggle-shell relative inline-flex h-6 w-11 items-center bg-surface-container-highest"><span class="${prefs.soundEffectsEnabled ? "translate-x-6 bg-primary-fixed" : "translate-x-1 bg-on-surface-variant"} inline-block h-4 w-4 transform rounded-full transition"></span></span>
                  </button>
                  <div class="utility-mobile-subsection space-y-3">
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

              <section id="prefs-system" class="utility-section p-6 space-y-6 scroll-mt-28">
                <h2 class="font-headline text-xl font-bold tracking-tight uppercase">System</h2>
                <div class="relative h-24 bg-surface-container-low rounded-lg overflow-hidden flex items-center px-6">
                  <div class="absolute inset-0 bg-gradient-to-r from-secondary/20 to-transparent" style="width:${prefs.glowRadius}%"></div>
                  <div class="relative z-10 flex w-full justify-between items-end">
                    <div><p class="font-headline text-4xl font-bold text-secondary italic tracking-tighter">${prefs.glowRadius}%</p><p class="font-label uppercase text-[10px] tracking-widest text-on-surface-variant">Glow Radius</p></div>
                    <div class="text-right"><p class="font-label text-[10px] text-on-surface-variant">Theme</p><p class="font-headline text-xs uppercase tracking-tight">${prefs.interfaceTheme === "sith-dark" ? "Sith Dark" : "Jedi Light"}</p></div>
                  </div>
                </div>
                <button class="w-full py-5 rounded-lg bg-primary-fixed text-on-primary-fixed font-headline font-extrabold tracking-widest uppercase text-sm hover:opacity-90 active:scale-[0.98] transition-all" type="button" data-reset-progress="true">RESET PROGRESS</button>
              </section>
            </section>
          </section>
        </div>
      </div>
    </section>
  `;
}

const contentPages = {
  stats: {
    title: "Stats Sections",
    subtitle: "Jump to Section",
    sidebarLinks: statsSidebarLinks,
    render: renderStatsPage
  },
  preferences: {
    title: "Settings Sections",
    subtitle: "Jump to Section",
    sidebarLinks: preferencesSidebarLinks,
    render: renderPreferencesPage
  },
  guide: {
    title: "Guide Sections",
    subtitle: "Jump to Section",
    sidebarLinks: guideSidebarLinks,
    content: `
      <section class="relative z-10 pt-12 pb-20 px-4 md:px-8">
        <div class="max-w-[1320px] mx-auto">
          <section class="glass-panel content-page-shell rounded-[2rem] overflow-hidden">
            <header id="guide-overview" class="px-6 py-8 md:px-10 md:py-10 relative scroll-mt-28">
              <div class="absolute inset-0 opacity-70" style="background:
                linear-gradient(135deg, rgba(255,232,31,0.12), transparent 28%),
                radial-gradient(circle at 78% 22%, rgba(61,184,255,0.12), transparent 22%);"></div>
              <div class="relative max-w-3xl">
                <p class="kicker-label">Archive Guide</p>
                <h1 class="mt-4 font-headline text-4xl md:text-6xl tracking-tight text-white leading-none">How Star Wars: Chronicles Works</h1>
                <p class="mt-5 text-white/72 font-body leading-relaxed max-w-2xl">
                  The guide for browsing the archive, understanding chronology, tracking progress,
                  and using watch and reference tools across the site.
                </p>
              </div>
            </header>

            <section class="px-6 py-8 md:px-10 md:py-10 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <section class="utility-section p-6 md:p-7 scroll-mt-28">
                <p class="hud-label">Scope</p>
                <h2 class="mt-3 font-headline text-2xl text-white tracking-tight">What This Guide Covers</h2>
                <p class="mt-4 text-white/70 leading-relaxed">
                  This page explains the live rules of the archive: chronology, split placements,
                  watched progress, filters, preferences, watch links, and special-case entries.
                </p>
              </section>

              <section class="utility-section p-6 md:p-7 scroll-mt-28">
                <p class="hud-label">Quick Start</p>
                <ul class="mt-4 space-y-3 text-white/70 leading-relaxed">
                  <li>Browse by era, then open an entry for episode-level detail.</li>
                  <li>Use watched toggles and episode checkboxes to build persistent progress.</li>
                  <li>Filter by era, format, continuity, story arc, or watch status.</li>
                  <li>Use Watch for the best destination and Info for Wookieepedia context.</li>
                </ul>
              </section>
            </section>

            <section class="px-6 pb-8 md:px-10 md:pb-10 grid gap-6">
              <section id="guide-chronology" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Chronology</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">How the Chronology Works</h2>
                <div class="mt-5 grid gap-5 md:grid-cols-2 text-white/70 leading-relaxed">
                  <div>
                    <p>
                      The app follows a fixed chronological order built from <code>timeline-data.json</code>.
                      That order is the product contract, so sorting is intentionally removed. The timeline is
                      built to answer “what comes next in-universe?”
                    </p>
                    <p class="mt-4">
                      Dates are displayed in BBY and ABY. BBY means “Before the Battle of Yavin,” and ABY means
                      “After the Battle of Yavin.” Those labels anchor films, shows, anthology shorts,
                      and non-timeline material into one readable archive.
                    </p>
                  </div>
                  <div>
                    <p>
                      Some titles appear multiple times because the chronology slices them by where their events
                      belong, not by how a streaming service groups them. That is especially common with anthology
                      projects such as <em>Tales of the Jedi</em>, <em>Tales of the Empire</em>, and
                      <em>Tales of the Underworld</em>.
                    </p>
                    <p class="mt-4">
                      Split placement also shows up when a long-running series crosses era boundaries.
                      Each slice represents the same production title at the point where those episodes
                      belong in the larger chronology.
                    </p>
                  </div>
                </div>
              </section>

              <section id="guide-eras" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Era Structure</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">Eras and Entry Types</h2>
                <div class="mt-5 grid gap-6 md:grid-cols-3 text-white/70 leading-relaxed">
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Galactic Eras</h3>
                    <p class="mt-3">
                      The main rail groups the archive into major eras such as The High Republic, Fall of the Jedi,
                      Reign of the Empire, and Rise of the First Order.
                      The desktop rail highlights the active era as you move through the chronology.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Entry Types</h3>
                    <p class="mt-3">
                      Entries can represent films, full series, chronology slices of a larger series, anthology
                      segments, or non-timeline material.
                      When platform packaging matters, the app treats the watchable distribution unit as primary.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Canon and Legends</h3>
                    <p class="mt-3">
                      The archive supports both canon and selected Legends material. Preferences and filters let you
                      browse canon-only or with Legends integrated, but those modes are mutually exclusive.
                    </p>
                  </div>
                </div>
              </section>

              <section id="guide-progress" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Watching</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">Watching and Progress</h2>
                <div class="mt-5 grid gap-6 md:grid-cols-[1.1fr_0.9fr] text-white/70 leading-relaxed">
                  <div>
                    <p>
                      Single-entry titles can be marked watched directly. Series and anthology entries open into the
                      modal, where each episode can be tracked individually.
                      Progress is stored locally, so your archive state survives reloads on the same browser.
                    </p>
                    <p class="mt-4">
                      The primary CTA reflects real state:
                      <span class="text-white">Start Watching</span> for untouched films,
                      <span class="text-white">See Details</span> for untouched series,
                      <span class="text-white">Continue Watching</span> for partial progress,
                      and <span class="text-white">Watched</span> for completed entries.
                    </p>
                    <p class="mt-4">
                      Modal previous and next navigation follows the current filtered chronology,
                      so modal browsing stays consistent with the timeline you are looking at.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Persistence Rules</h3>
                    <ul class="mt-4 space-y-3">
                      <li>Watched state is stored locally in the browser.</li>
                      <li>Series progress is stored episode by episode, not only as a simple count.</li>
                      <li>Reloading restores progress, stats, and preference choices.</li>
                      <li>Deep-linked modal URLs reopen the selected entry on load.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section id="guide-filters" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Controls</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">Search, Filters, and Preferences</h2>
                <div class="mt-5 grid gap-6 md:grid-cols-2 text-white/70 leading-relaxed">
                  <div>
                    <p>
                      Search works across titles, entry metadata, and episode titles. Filters let you narrow the
                      archive by era, format, continuity, progress state, and major story-arc groupings such as
                      Clone Wars, Mandoverse, Sequel Era, and George Lucas.
                    </p>
                    <p class="mt-4">
                      Preferences control continuity, shorts inclusion, appearance, and audio.
                      The archive keeps chronology fixed, but still lets you tune how the experience feels.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Useful Notes</h3>
                    <ul class="mt-4 space-y-3">
                      <li>Canon Only and Legends Integration are exclusive choices.</li>
                      <li>Reduced-motion behavior follows the browser’s <code>prefers-reduced-motion</code> setting.</li>
                      <li>Mobile and desktop filters follow the same logic, even though the surfaces differ.</li>
                      <li>Stats and preferences are full pages on desktop.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section id="guide-links" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">External Destinations</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">Watch Links and References</h2>
                <div class="mt-5 grid gap-6 md:grid-cols-2 text-white/70 leading-relaxed">
                  <div>
                    <p>
                      Each watchable item can carry a <code>watchUrl</code>. That field is platform-agnostic, so it
                      can point to Disney+, YouTube, or another supported destination.
                      The app treats it as the best available watch link for that entry or episode row.
                    </p>
                    <p class="mt-4">
                      The modal <span class="text-white">Info</span> action opens the matching Wookieepedia article
                      for the current entry. Share links use the unique entry id plus a readable title slug,
                      so split entries stay unambiguous even when the same production appears more than once.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">What If No Link Exists?</h3>
                    <p class="mt-3">
                      If a specific episode has no watch destination, the modal shows a muted
                      <span class="text-white">Unavailable</span> state instead of a fake play control. This keeps
                      real links clearly actionable and avoids implying that every row launches playback.
                    </p>
                  </div>
                </div>
              </section>

              <section id="guide-special-cases" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Edge Cases</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">Special Cases and Data Rules</h2>
                <div class="mt-5 grid gap-5 md:grid-cols-2 text-white/70 leading-relaxed">
                  <div>
                    <p>
                      Some streaming services package material differently than the chronology does. When that
                      happens, the archive follows the watchable distribution unit where necessary. For example,
                      <em>Ewoks</em> season 2 follows the aired paired-episode structure instead of a more granular
                      segment split because that is how the available platform packaging works.
                    </p>
                    <p class="mt-4">
                      The 2003 <em>Clone Wars</em> micro-series is another special case: Disney+ exposes it as two
                      volumes, while the chronology tracks individual chapters.
                      Timestamp guidance helps map chronology rows back to the best available watch destination.
                    </p>
                  </div>
                  <div>
                    <p>
                      Non-timeline material like <em>Star Wars: Visions</em> is intentionally separated into its own
                      area so it stays available without pretending it belongs inside the main canon/Legends timeline.
                    </p>
                    <p class="mt-4">
                      Anthology projects may also be split across multiple eras because the episodes themselves belong
                      in different historical windows.
                      The archive is designed to represent that chronology honestly instead of flattening it.
                    </p>
                  </div>
                </div>
              </section>

              <section id="guide-faq" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">FAQ</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">Frequently Asked Questions</h2>
                <div class="mt-5 grid gap-5 text-white/70 leading-relaxed">
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Why does the same show appear more than once?</h3>
                    <p class="mt-3">
                      Because the chronology is organized by when events happen, not only by release packaging.
                      Split entries show the parts of a title where they belong in-universe.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Why can’t I sort the archive?</h3>
                    <p class="mt-3">
                      Sorting was intentionally removed. The archive treats chronology as the core product behavior,
                      so the app always preserves the current in-universe order.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Why does one entry say Watch and another say Details?</h3>
                    <p class="mt-3">
                      Films and one-off items can often launch directly. Series usually open the modal first so you
                      can see episode-level progress, watch links, and chronology context before picking an episode.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Why do some watch links leave the app?</h3>
                    <p class="mt-3">
                      The archive does not host playback. It points to the best available external destination for
                      that item, whether that is Disney+, YouTube, or another source carried in the data.
                    </p>
                  </div>
                </div>
              </section>
            </section>
          </section>
        </div>
      </section>
    `
  },
  privacy: {
    title: "Privacy Sections",
    subtitle: "Jump to Section",
    sidebarLinks: privacySidebarLinks,
    content: `
      <section class="relative z-10 pt-12 pb-20 px-4 md:px-8">
        <div class="max-w-[1320px] mx-auto">
          <section class="glass-panel content-page-shell rounded-[2rem] overflow-hidden">
            <header id="privacy-overview" class="px-6 py-8 md:px-10 md:py-10 relative scroll-mt-28">
              <div class="absolute inset-0 opacity-70" style="background:
                linear-gradient(135deg, rgba(255,232,31,0.12), transparent 28%),
                radial-gradient(circle at 78% 22%, rgba(61,184,255,0.12), transparent 22%);"></div>
              <div class="relative max-w-3xl">
                <p class="kicker-label">Policy Archive</p>
                <h1 class="mt-4 font-headline text-4xl md:text-6xl tracking-tight text-white leading-none">Privacy</h1>
                <p class="mt-5 text-white/72 font-body leading-relaxed max-w-2xl">
                  How Star Wars: Chronicles handles local data, preferences, audio settings,
                  and external destinations.
                </p>
              </div>
            </header>

            <section class="px-6 py-8 md:px-10 md:py-10 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <section class="utility-section p-6 md:p-7 scroll-mt-28">
                <p class="hud-label">Overview</p>
                <h2 class="mt-3 font-headline text-2xl text-white tracking-tight">What This Page Covers</h2>
                <p class="mt-4 text-white/70 leading-relaxed">
                  This page explains what the site stores in your browser, what it does not collect,
                  and what happens when you open third-party watch and reference links.
                </p>
              </section>

              <section class="utility-section p-6 md:p-7 scroll-mt-28">
                <p class="hud-label">At a Glance</p>
                <ul class="mt-4 space-y-3 text-white/70 leading-relaxed">
                  <li>Progress and preferences are primarily stored locally in your browser.</li>
                  <li>External watch and reference links open on third-party sites.</li>
                  <li>The site does not require an account to browse the archive.</li>
                  <li>Clearing local browser data can reset saved archive state.</li>
                </ul>
              </section>
            </section>

            <section class="px-6 pb-8 md:px-10 md:pb-10 grid gap-6">
              <section id="privacy-local-data" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Browser Storage</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">What Is Stored Locally</h2>
                <div class="mt-5 grid gap-6 md:grid-cols-2 text-white/70 leading-relaxed">
                  <div>
                    <p>
                      Star Wars: Chronicles stores core app state in your browser so the archive can remember where
                      you left off. That includes watched progress, episode-level series progress, interface
                      preferences, continuity choices, and some audio settings.
                    </p>
                    <p class="mt-4">
                      This information is mainly stored through browser <code>localStorage</code>. It is used to
                      restore your archive state after reloads and does not require creating an account.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Examples of Local State</h3>
                    <ul class="mt-4 space-y-3">
                      <li>Watched status for films and one-off entries</li>
                      <li>Episode-by-episode progress for series</li>
                      <li>Collapsed era state</li>
                      <li>Continuity, shorts, theme, and audio preferences</li>
                      <li>Music enabled, sound effects enabled, and music volume</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section id="privacy-progress" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Archive State</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">How Progress and Preferences Persist</h2>
                <div class="mt-5 grid gap-6 md:grid-cols-[1.1fr_0.9fr] text-white/70 leading-relaxed">
                  <div>
                    <p>
                      Progress persistence is designed to keep your archive useful between sessions on the same
                      browser. If you mark a film watched, check series episodes, change continuity mode, or adjust
                      audio settings, those choices are meant to remain in place when you come back later.
                    </p>
                    <p class="mt-4">
                      If you clear browser storage, switch browsers, or use private browsing modes that discard
                      storage, your saved state may reset. The site does not promise cross-device sync.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">What Persistence Does Not Mean</h3>
                    <ul class="mt-4 space-y-3">
                      <li>No account-based cloud save is provided.</li>
                      <li>No server-side profile is required to use the archive.</li>
                      <li>No guarantee is made that third-party browsers or extensions will preserve local state.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section id="privacy-external-links" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Third-Party Destinations</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">Watch Links and External References</h2>
                <div class="mt-5 grid gap-6 md:grid-cols-2 text-white/70 leading-relaxed">
                  <div>
                    <p>
                      The archive includes external watch destinations through the <code>watchUrl</code> field and
                      reference destinations through Wookieepedia links. These are convenience links only. When you
                      open them, you leave this site and enter a third-party service.
                    </p>
                    <p class="mt-4">
                      External services such as Disney+, YouTube, or Wookieepedia may apply their own cookies,
                      tracking, sign-in requirements, and privacy policies. Their behavior is not controlled by
                      Star Wars: Chronicles.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Share and Clipboard</h3>
                    <p class="mt-3">
                      The site can generate share links for entries. Depending on your browser, that may use the
                      native share sheet, the clipboard, or a manual copy prompt. Those actions use browser features
                      available on your device at the time you share.
                    </p>
                  </div>
                </div>
              </section>

              <section id="privacy-no-collection" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Limits</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">What This Site Does Not Collect</h2>
                <div class="mt-5 grid gap-5 md:grid-cols-2 text-white/70 leading-relaxed">
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">No Required Account</h3>
                    <p class="mt-3">
                      You do not need to create an account to browse the archive, mark progress, or use the main
                      product features.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">No Payment Data</h3>
                    <p class="mt-3">
                      The site does not process purchases or request payment information for its core archive behavior.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">No Hosted Playback</h3>
                    <p class="mt-3">
                      The site does not host the media itself. It links outward to the best available destination for
                      the item you selected.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">No Promise of Third-Party Privacy</h3>
                    <p class="mt-3">
                      Once you leave the site for an external destination, that service’s own privacy and tracking
                      behavior applies.
                    </p>
                  </div>
                </div>
              </section>

              <section id="privacy-contact" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Questions</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">Questions or Updates</h2>
                <p class="mt-5 text-white/70 leading-relaxed max-w-3xl">
                  If this privacy page changes, the current published version of the page should be treated as the
                  active explanation of site behavior. For support or issue reporting, use the project’s GitHub
                  issues page linked in the footer.
                </p>
              </section>
            </section>
          </section>
        </div>
      </section>
    `
  },
  terms: {
    title: "Terms Sections",
    subtitle: "Jump to Section",
    sidebarLinks: termsSidebarLinks,
    content: `
      <section class="relative z-10 pt-12 pb-20 px-4 md:px-8">
        <div class="max-w-[1320px] mx-auto">
          <section class="glass-panel content-page-shell rounded-[2rem] overflow-hidden">
            <header id="terms-overview" class="px-6 py-8 md:px-10 md:py-10 relative scroll-mt-28">
              <div class="absolute inset-0 opacity-70" style="background:
                linear-gradient(135deg, rgba(255,232,31,0.12), transparent 28%),
                radial-gradient(circle at 78% 22%, rgba(61,184,255,0.12), transparent 22%);"></div>
              <div class="relative max-w-3xl">
                <p class="kicker-label">Usage Terms</p>
                <h1 class="mt-4 font-headline text-4xl md:text-6xl tracking-tight text-white leading-none">Terms</h1>
                <p class="mt-5 text-white/72 font-body leading-relaxed max-w-2xl">
                  The basic usage expectations, disclaimers, and external-link terms for Star Wars: Chronicles.
                </p>
              </div>
            </header>

            <section class="px-6 py-8 md:px-10 md:py-10 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <section class="utility-section p-6 md:p-7 scroll-mt-28">
                <p class="hud-label">Overview</p>
                <h2 class="mt-3 font-headline text-2xl text-white tracking-tight">What These Terms Cover</h2>
                <p class="mt-4 text-white/70 leading-relaxed">
                  These terms explain the basic expectations for using the site, how external destinations are
                  presented, and the fan-project context of the archive.
                </p>
              </section>

              <section class="utility-section p-6 md:p-7 scroll-mt-28">
                <p class="hud-label">At a Glance</p>
                <ul class="mt-4 space-y-3 text-white/70 leading-relaxed">
                  <li>Use the archive lawfully and respectfully.</li>
                  <li>External watch and reference links are provided as convenience links.</li>
                  <li>The site is a fan project and does not claim ownership of Star Wars rights.</li>
                  <li>Terms may change as the project evolves.</li>
                </ul>
              </section>
            </section>

            <section class="px-6 pb-8 md:px-10 md:pb-10 grid gap-6">
              <section id="terms-use" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Use of the Site</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">Acceptable Use</h2>
                <div class="mt-5 grid gap-6 md:grid-cols-[1.1fr_0.9fr] text-white/70 leading-relaxed">
                  <div>
                    <p>
                      Star Wars: Chronicles is intended to help users browse Star Wars media in chronological order,
                      track viewing progress, and open external watch or reference destinations. You may use the site
                      for personal browsing and archive reference purposes.
                    </p>
                    <p class="mt-4">
                      You should not use the site in a way that interferes with its operation, attempts to damage the
                      project, abuses the external-link features, or misrepresents the site as an official Lucasfilm
                      or Disney product.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">In Short</h3>
                    <ul class="mt-4 space-y-3">
                      <li>Use the archive responsibly.</li>
                      <li>Do not attempt to disrupt the site or related services.</li>
                      <li>Do not present the project as an official Star Wars service.</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section id="terms-external" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Third-Party Services</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">External Destination Disclaimer</h2>
                <div class="mt-5 grid gap-6 md:grid-cols-2 text-white/70 leading-relaxed">
                  <div>
                    <p>
                      The site may link to third-party destinations such as Disney+, YouTube, GitHub, and Wookieepedia.
                      Those links are provided for convenience and context. Opening one means you are leaving this site
                      and entering a separate service with its own terms, privacy practices, and availability rules.
                    </p>
                    <p class="mt-4">
                      Star Wars: Chronicles does not control the content, uptime, account requirements, or regional
                      availability of those external destinations.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">No Playback Guarantee</h3>
                    <p class="mt-3">
                      Watch links are offered on a best-available basis. A linked title may move, require a subscription,
                      become unavailable, or behave differently depending on region or platform.
                    </p>
                  </div>
                </div>
              </section>

              <section id="terms-fan-project" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Project Context</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">Fan Project and Rights Notice</h2>
                <div class="mt-5 grid gap-5 md:grid-cols-2 text-white/70 leading-relaxed">
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Fan-Made Archive</h3>
                    <p class="mt-3">
                      This site is a fan-made chronology and reference project. It is not presented as an official
                      Lucasfilm, Disney, Disney+, or Wookieepedia product.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Rights and Ownership</h3>
                    <p class="mt-3">
                      Star Wars names, characters, series, films, logos, and related intellectual property remain the
                      property of their respective rights holders.
                    </p>
                  </div>
                </div>
              </section>

              <section id="terms-changes" class="utility-section p-6 md:p-8 scroll-mt-28">
                <p class="hud-label">Updates</p>
                <h2 class="mt-3 font-headline text-3xl text-white tracking-tight">Changes to the Site or Terms</h2>
                <div class="mt-5 grid gap-6 md:grid-cols-[1.1fr_0.9fr] text-white/70 leading-relaxed">
                  <div>
                    <p>
                      The archive, its data, available links, and these terms may change over time as the project is
                      refined. The currently published version of this page should be treated as the active version of
                      the site’s usage terms.
                    </p>
                    <p class="mt-4">
                      Features may be added, removed, or adjusted as the product matures, especially where external
                      platform behavior changes.
                    </p>
                  </div>
                  <div class="soft-panel p-5 rounded-[1.5rem]">
                    <h3 class="text-white font-semibold font-headline text-xl tracking-tight">Support</h3>
                    <p class="mt-3">
                      For bug reports, link problems, or product feedback, use the GitHub issues page linked in the footer.
                    </p>
                  </div>
                </div>
              </section>
            </section>
          </section>
        </div>
      </section>
    `
  }
};

export function isContentPage(page) {
  return Boolean(contentPages[page]);
}

export function getContentPage(page) {
  return contentPages[page] || null;
}

export function renderContentPage(page, context = {}) {
  const definition = getContentPage(page);
  if (!definition) return "";

  if (typeof definition.render === "function") {
    return definition.render(context);
  }

  return definition.content || "";
}
