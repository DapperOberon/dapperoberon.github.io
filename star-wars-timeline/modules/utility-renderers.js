import { STORY_ARC_OPTIONS } from "./constants.js";

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
          <div class="flex-1 overflow-y-auto p-8 space-y-10" data-filter-scroll-region="desktop">
            <section class="filter-block p-6">
              <label class="text-[10px] font-label font-bold uppercase tracking-[0.3em] text-neutral-500 mb-6 block">Eras</label>
              <div class="grid grid-cols-1 gap-3">
                ${eras.map((era) => `
                  <button class="filter-option flex items-center justify-between min-h-14 px-4 ${filters.eras.has(era) ? "is-active text-primary-fixed border-primary-fixed/40" : "text-neutral-300 border-white/5"} border text-left transition-all" type="button" data-filter-era="${escapeHtml(era)}">
                    <span class="text-[10px] font-label font-bold uppercase tracking-wider">${escapeHtml(era)}</span>
                    <span class="material-symbols-outlined text-base ${filters.eras.has(era) ? "opacity-100" : "opacity-35"}" style="font-variation-settings: 'FILL' ${filters.eras.has(era) ? 1 : 0};">check_circle</span>
                  </button>
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
                  <button class="filter-option flex flex-col items-center justify-center gap-2 p-4 ${filters.type === value ? "is-active text-primary-fixed border-primary-fixed/40" : "text-neutral-300 border-white/5"} border transition-all" type="button" data-filter-type="${value}">
                    <span class="material-symbols-outlined">${icon}</span>
                    <span class="text-[9px] font-label font-bold uppercase tracking-widest">${label}</span>
                  </button>
                `).join("")}
                <button class="filter-option col-span-3 flex items-center justify-center min-h-14 px-4 ${filters.type === "all" ? "is-active text-primary-fixed border-primary-fixed/40" : "text-neutral-300 border-white/5"} border text-center text-[10px] font-label font-bold uppercase tracking-wider transition-all" type="button" data-filter-type="all">All Formats</button>
              </div>
            </section>
            <div class="grid grid-cols-2 gap-8">
              <section class="filter-block p-6">
                <label class="text-[10px] font-label font-bold uppercase tracking-[0.3em] text-neutral-500 mb-6 block">Continuity</label>
                <div class="grid grid-cols-1 gap-3">
                  ${["all", "canon", "legends"].map((value) => `
                    <button class="filter-option flex items-center justify-center min-h-14 px-4 ${filters.canon === value ? "is-active text-primary-fixed border-primary-fixed/40" : "text-neutral-300 border-white/5"} border text-center text-[10px] font-label font-bold uppercase tracking-wider transition-all" type="button" data-filter-canon="${value}">
                      ${value === "all" ? "All" : value}
                    </button>
                  `).join("")}
                </div>
              </section>
              <section class="filter-block p-6">
                <label class="text-[10px] font-label font-bold uppercase tracking-[0.3em] text-neutral-500 mb-6 block">Status</label>
                <div class="grid grid-cols-1 gap-3">
                  ${[
                    ["all", "Show All"],
                    ["unwatched", "Unwatched"],
                    ["in-progress", "In Progress"],
                    ["watched", "Watched"]
                  ].map(([value, label]) => `
                    <button class="filter-option flex items-center justify-center min-h-14 px-4 ${filters.progress === value ? "is-active text-primary-fixed border-primary-fixed/40" : "text-neutral-300 border-white/5"} border text-center text-[10px] font-label font-bold uppercase tracking-wider transition-all" type="button" data-filter-progress="${value}">
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
                  <button class="filter-option flex items-center justify-center min-h-14 px-4 ${filters.arc === value ? "is-active text-primary-fixed border-primary-fixed/40" : "text-neutral-300 border-white/5"} border text-center text-[10px] font-label font-bold uppercase tracking-wider transition-all ${value === "all" ? "col-span-2" : ""}" type="button" data-filter-arc="${value}">
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

      <div class="md:hidden fixed inset-0 z-50 flex flex-col glass-panel rounded-none">
        <header class="flex items-center justify-between px-6 pt-12 pb-6">
            <div class="space-y-1">
              <h1 class="font-headline font-bold text-2xl tracking-[0.2em] text-on-surface">FILTERS</h1>
            </div>
          <button class="w-12 h-12 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface active:scale-95 transition-transform" type="button" data-close-filters="true">
            <span class="material-symbols-outlined">close</span>
          </button>
        </header>
        <main class="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar space-y-10" data-filter-scroll-region="mobile">
          <section class="space-y-4">
            <h2 class="font-label text-[10px] font-bold tracking-[0.15em] text-secondary uppercase opacity-60">Eras</h2>
            <div class="grid gap-3">
              ${eras.map((era) => `
                <label class="filter-option flex items-center justify-between min-h-14 px-4 ${filters.eras.has(era) ? "is-active text-primary-fixed border-primary-fixed/40" : "text-neutral-300 border-white/5"} border group cursor-pointer transition-colors" data-filter-era-label="${escapeHtml(era)}">
                  <span class="text-[10px] font-label font-bold uppercase tracking-wider ${filters.eras.has(era) ? "text-primary-fixed" : "text-neutral-300"}" data-filter-era-text="${escapeHtml(era)}">${escapeHtml(era)}</span>
                  <span class="w-5 h-5 rounded-md border flex items-center justify-center transition-all ${filters.eras.has(era) ? "border-primary-fixed/70 bg-primary-fixed text-black" : "border-white/10 bg-surface-container-low text-transparent"}" data-filter-era-indicator="${escapeHtml(era)}">
                    <span class="material-symbols-outlined text-[14px] leading-none">check</span>
                  </span>
                  <input class="sr-only" type="checkbox" data-filter-era="${escapeHtml(era)}" ${filters.eras.has(era) ? "checked" : ""}>
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
                <button class="filter-option flex flex-col items-center justify-center aspect-square ${filters.type === value ? "is-active text-primary-fixed border-primary-fixed/40" : "text-neutral-300 border-white/5"} border rounded-2xl active:scale-95 transition-all" type="button" data-filter-type="${value}">
                  <span class="material-symbols-outlined text-3xl mb-2" style="font-variation-settings: 'FILL' ${filters.type === value ? 1 : 0};">${icon}</span>
                  <span class="font-label text-[10px] font-bold uppercase tracking-wider">${label}</span>
                </button>
              `).join("")}
              <button class="filter-option col-span-3 flex items-center justify-center min-h-14 px-4 ${filters.type === "all" ? "is-active text-primary-fixed border-primary-fixed/40" : "text-neutral-300 border-white/5"} border text-center text-[10px] font-label font-bold uppercase tracking-wider transition-all" type="button" data-filter-type="all">All Formats</button>
            </div>
          </section>
          <section class="space-y-6 pb-44">
            <div class="space-y-4">
              <h2 class="font-label text-[10px] font-bold tracking-[0.15em] text-secondary uppercase opacity-60">Continuity</h2>
              <div class="grid grid-cols-3 gap-3">
                ${["all", "canon", "legends"].map((value) => `
                  <button class="filter-option flex items-center justify-center min-h-14 px-4 ${filters.canon === value ? "is-active text-primary-fixed border-primary-fixed/40" : "text-neutral-300 border-white/5"} border text-center text-[10px] font-label font-bold uppercase tracking-wider transition-all" type="button" data-filter-canon="${value}">
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
                  <button class="filter-option flex items-center justify-center min-h-14 px-4 ${filters.progress === value ? "is-active text-primary-fixed border-primary-fixed/40" : "text-neutral-300 border-white/5"} border text-center text-[10px] font-label font-bold uppercase tracking-wider transition-all" type="button" data-filter-progress="${value}">
                    ${label}
                  </button>
                `).join("")}
              </div>
            </div>
            <div class="space-y-4">
              <h2 class="font-label text-[10px] font-bold tracking-[0.15em] text-secondary uppercase opacity-60">Story Arc</h2>
              <div class="grid grid-cols-2 gap-3">
                ${STORY_ARC_OPTIONS.map(([value, label]) => `
                  <button class="filter-option flex items-center justify-center min-h-14 px-4 ${filters.arc === value ? "is-active text-primary-fixed border-primary-fixed/40" : "text-neutral-300 border-white/5"} border text-center text-[10px] font-label font-bold uppercase tracking-wider transition-all ${value === "all" ? "col-span-2" : ""}" type="button" data-filter-arc="${value}">
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
