import {
  escapeHtml,
  getGameForEntry,
  getStatusMeta,
  getStorefrontLabel,
  hasUsableAsset,
  renderFallbackArt,
  renderPrimaryAction,
  renderSecondaryAction
} from "./shared.js";

function renderCard(entry, game, storefrontDefinitions, statusDefinitions, cardClass = "") {
  const statusMeta = getStatusMeta(statusDefinitions, entry.status);
  const cardArt = game?.capsuleArt ?? game?.heroArt ?? "";

  return `
    <button class="group text-left ${cardClass}" data-action="select-entry" data-entry-id="${entry.entryId}">
      <div class="relative aspect-[3/4] overflow-hidden rounded-md cover-shadow transition-transform duration-300 group-hover:-translate-y-1 bg-zinc-900">
        ${hasUsableAsset(cardArt)
          ? `<img class="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" src="${escapeHtml(cardArt)}" alt="${escapeHtml(entry.title)} cover art">`
          : `<div class="absolute inset-0">${renderFallbackArt(entry.title, getStorefrontLabel(storefrontDefinitions, entry.storefront), "rounded-md")}</div>`}
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/12 to-transparent"></div>
        <div class="absolute top-3 left-3">
          <span class="bg-black/60 text-zinc-100 px-2 py-1 rounded-md text-[11px] font-label tracking-[0.08em] backdrop-blur-md">${escapeHtml(statusMeta.label)}</span>
        </div>
        <div class="absolute bottom-3 left-3 right-3">
          <p class="font-label text-[11px] tracking-[0.08em] text-primary mb-1">${escapeHtml(getStorefrontLabel(storefrontDefinitions, entry.storefront))}</p>
          <p class="font-headline text-base font-bold text-on-surface leading-tight line-clamp-2">${escapeHtml(entry.title)}</p>
        </div>
      </div>
      <div class="pt-3 px-1">
        <p class="font-body text-xs text-zinc-400 truncate">${escapeHtml(entry.runLabel || "Main Save")}</p>
        <div class="mt-1 flex items-center justify-between gap-3 text-xs font-body text-zinc-500">
          <span>${entry.playtimeHours}h</span>
          <span>${entry.completionPercent}%</span>
        </div>
      </div>
    </button>
  `;
}

function renderMetricPanel(snapshot) {
  return `
    <div class="checkpoint-panel rounded-xl p-6 flex flex-col justify-between gap-6">
      <div class="space-y-2">
        <p class="font-label text-[11px] tracking-[0.08em] text-primary">Library Snapshot</p>
        <h4 class="text-3xl font-headline font-extrabold text-on-surface">${snapshot.dashboardMetrics.totalEntries}</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed">A compact view of the library you are actively shaping.</p>
      </div>
      <div class="space-y-3">
        <div class="flex items-center justify-between text-[11px] font-body text-zinc-500">
          <span>Total Playtime</span>
          <span>${snapshot.dashboardMetrics.totalPlaytime}h</span>
        </div>
        <div class="flex items-center justify-between text-[11px] font-body text-zinc-500">
          <span>Average Completion</span>
          <span>${snapshot.dashboardMetrics.averageCompletion}%</span>
        </div>
      </div>
      ${renderSecondaryAction("Open Settings", "set-view", "w-full py-3 text-xs tracking-[0.12em]", 'data-view="settings"')}
    </div>
  `;
}

function getStatusLabel(status) {
  return {
    all: "All Games",
    playing: "Playing",
    finished: "Finished",
    backlog: "Backlog",
    wishlist: "Wishlist"
  }[status] ?? "Library";
}

function getSortLabel(sortMode) {
  return {
    updated_desc: "Recent",
    title_asc: "Title",
    playtime_desc: "Playtime",
    completion_desc: "Completion"
  }[sortMode] ?? "Recent";
}

function renderLibraryStateBar(snapshot, statusDefinitions) {
  const hasSearch = Boolean(snapshot.searchTerm.trim());
  const hasScopedView = snapshot.activeStatus !== "all" || hasSearch;
  const totalEntries = snapshot.dashboardMetrics.totalEntries;
  const visibleEntries = snapshot.visibleLibrary.length;
  const stateSummary = hasSearch
    ? `Showing ${visibleEntries} of ${totalEntries} results for "${snapshot.searchTerm.trim()}"`
    : hasScopedView
      ? `Showing ${visibleEntries} ${getStatusLabel(snapshot.activeStatus).toLowerCase()} entries`
      : `Showing all ${totalEntries} tracked entries`;

  return `
    <section class="checkpoint-panel rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex flex-col gap-2">
        <div class="flex flex-wrap items-center gap-2 text-[11px]">
          <span class="font-label tracking-[0.08em] text-primary">Library</span>
          <span class="text-zinc-600">/</span>
          <span class="font-body text-zinc-300">${escapeHtml(getStatusLabel(snapshot.activeStatus))}</span>
        </div>
        <p class="text-sm text-on-surface-variant leading-relaxed">${escapeHtml(stateSummary)}</p>
      </div>
      <div class="flex items-center gap-3 self-start md:self-auto">
        <label class="flex items-center gap-2">
          <span class="text-xs text-zinc-500">Filter</span>
          <select id="library-status-filter" class="checkpoint-control-select text-sm font-body px-3 py-2 rounded-md transition-all text-zinc-200">
            <option value="all" ${snapshot.activeStatus === "all" ? "selected" : ""}>All Games</option>
            ${statusDefinitions.map((status) => `<option value="${status.id}" ${snapshot.activeStatus === status.id ? "selected" : ""}>${escapeHtml(status.label)}</option>`).join("")}
          </select>
        </label>
        <label class="flex items-center gap-2">
          <span class="text-xs text-zinc-500">Sort</span>
          <select id="library-sort-state" class="checkpoint-control-select text-sm font-body px-3 py-2 rounded-md transition-all text-zinc-200">
            <option value="updated_desc" ${snapshot.sortMode === "updated_desc" ? "selected" : ""}>Recent</option>
            <option value="title_asc" ${snapshot.sortMode === "title_asc" ? "selected" : ""}>Title</option>
            <option value="playtime_desc" ${snapshot.sortMode === "playtime_desc" ? "selected" : ""}>Playtime</option>
            <option value="completion_desc" ${snapshot.sortMode === "completion_desc" ? "selected" : ""}>Completion</option>
          </select>
        </label>
        ${hasScopedView
          ? renderSecondaryAction("Reset View", "clear-library-view", "px-4 py-2 text-[11px] tracking-[0.12em]")
          : ""}
      </div>
    </section>
  `;
}

function renderLibraryEmptyState(snapshot) {
  const hasSearch = Boolean(snapshot.searchTerm.trim());
  const title = hasSearch ? "No matching entries" : `No ${getStatusLabel(snapshot.activeStatus).toLowerCase()} right now`;
  const body = hasSearch
    ? `No entry matches "${snapshot.searchTerm.trim()}". Try a broader title, storefront, or run label.`
    : snapshot.activeStatus === "all"
      ? "Your library is empty. Add a game to start tracking runs."
      : `There are no ${getStatusLabel(snapshot.activeStatus).toLowerCase()} entries in the current library.`;

  return `
    <section class="checkpoint-panel rounded-xl px-8 py-10 min-h-[20rem]">
      <div class="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-8 items-center">
        <div class="mx-auto md:mx-0 w-full max-w-[180px] aspect-[3/4] overflow-hidden rounded-md bg-zinc-900 cover-shadow">
          ${renderFallbackArt(hasSearch ? "No Match" : "Your Library", hasSearch ? "Try another title" : "Start tracking", "rounded-md")}
        </div>
        <div class="flex flex-col items-center md:items-start justify-center text-center md:text-left gap-4">
          <div class="space-y-2 max-w-xl">
            <h2 class="font-headline text-3xl font-extrabold tracking-tight text-on-surface">${escapeHtml(title)}</h2>
            <p class="text-on-surface-variant leading-relaxed">${escapeHtml(body)}</p>
          </div>
          <div class="flex items-center gap-4 pt-2">
            ${renderPrimaryAction("Add Game", "open-add-modal", "px-6 py-3 text-xs tracking-[0.2em] rounded-sm")}
            ${(snapshot.activeStatus !== "all" || hasSearch)
              ? `<button class="px-6 py-3 border border-outline-variant/30 font-label font-bold text-xs tracking-[0.08em] rounded-sm hover:bg-surface-container-high transition-all" data-action="clear-library-view">Reset View</button>`
              : ""}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderLibraryFocusSection(snapshot, storefrontDefinitions, statusDefinitions, title, subtitle) {
  return `
    <section>
      <div class="flex items-center justify-between mb-6 border-b border-outline-variant/20 pb-4">
        <div class="flex items-center gap-4">
        <h2 class="text-2xl font-headline font-extrabold tracking-tight text-on-surface">${escapeHtml(title)}</h2>
          <span class="font-body text-sm text-zinc-500 mt-1">${escapeHtml(subtitle)}</span>
        </div>
        <span class="font-body text-sm text-zinc-500">${snapshot.visibleLibrary.length} visible</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
        ${snapshot.visibleLibrary.map((entry) => renderCard(entry, getGameForEntry(snapshot, entry), storefrontDefinitions, statusDefinitions, "min-h-[16rem]")).join("")}
      </div>
    </section>
  `;
}

function renderDashboardHero(snapshot) {
  return `
    <section class="grid grid-cols-1 xl:grid-cols-[1.5fr_320px] gap-6 lg:gap-8">
      <div class="checkpoint-panel rounded-xl p-8">
        <div class="flex flex-col gap-3">
          <p class="font-label text-[11px] tracking-[0.08em] text-primary">Your Library</p>
          <h1 class="text-4xl lg:text-5xl font-headline font-extrabold tracking-tight text-on-surface">Track what you are playing, what you finished, and what is queued next.</h1>
          <p class="max-w-3xl text-on-surface-variant leading-relaxed">A cleaner, cover-first view of your active runs.</p>
        </div>
        <div class="metadata-rule mt-8 pt-5 flex flex-wrap gap-6 text-sm font-body text-zinc-500">
          <span>${snapshot.dashboardMetrics.playingCount} playing</span>
          <span>${snapshot.dashboardMetrics.finishedCount} finished</span>
          <span>${snapshot.dashboardMetrics.backlogCount} backlog</span>
          <span>${snapshot.dashboardMetrics.wishlistCount} wishlist</span>
          <span>${snapshot.dashboardMetrics.totalEntries} total</span>
        </div>
      </div>
      ${renderMetricPanel(snapshot)}
    </section>
  `;
}

function renderDashboardShelf({ title, eyebrow, filterStatus, entries, emptyMessage, snapshot, storefrontDefinitions, statusDefinitions }) {
  const headingSize = filterStatus === "playing" ? "text-3xl" : "text-2xl";
  const sectionClasses = filterStatus === "playing"
    ? "flex items-end justify-between mb-6"
    : "flex items-end justify-between mb-6 border-b border-outline-variant/20 pb-4";
  const cardClass = filterStatus === "playing" ? "" : "min-h-[16rem]";
  const actionLabel = filterStatus === "playing" ? "View Only Playing" : `View ${title}`;

  return `
    <section>
      <div class="${sectionClasses}">
        <div>
          <p class="font-label text-[11px] tracking-[0.08em] text-primary mb-2">${escapeHtml(eyebrow)}</p>
          <h2 class="${headingSize} font-headline font-extrabold tracking-tight text-on-surface">${escapeHtml(title)}</h2>
        </div>
        <button class="text-zinc-500 hover:text-primary transition-colors font-body text-sm" data-action="filter-status" data-status="${filterStatus}">${escapeHtml(actionLabel)}</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
        ${entries.length
          ? entries.map((entry) => renderCard(entry, getGameForEntry(snapshot, entry), storefrontDefinitions, statusDefinitions, cardClass)).join("")
          : `<div class="col-span-full text-zinc-500 font-body text-sm">${escapeHtml(emptyMessage)}</div>`}
      </div>
    </section>
  `;
}

export function renderSidebar(snapshot) {
  const items = [
    { id: "dashboard", label: "Library" },
    { id: "settings", label: "Settings" }
  ];

  const showLibraryControls = true;

  return `
    <header class="fixed top-0 inset-x-0 ${showLibraryControls ? "h-[7.5rem] md:h-16" : "h-16"} checkpoint-topbar z-50">
      <div class="max-w-[1400px] mx-auto h-full px-6 lg:px-8 flex ${showLibraryControls ? "flex-col md:flex-row" : "flex-row"} items-start md:items-center justify-between gap-3 md:gap-6 py-3 md:py-0">
        <div class="flex items-center gap-8 min-w-0 w-full md:w-auto">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <span class="material-symbols-outlined text-on-primary">stadia_controller</span>
            </div>
            <div>
              <h2 class="font-headline font-extrabold text-sm tracking-tight text-on-surface">CHECKPOINT</h2>
              <p class="font-body text-xs text-zinc-500">Personal game tracker</p>
            </div>
          </div>
          <nav class="hidden md:flex items-center gap-1">
            ${items.map((item) => {
              const isActive = item.id === "dashboard"
                ? snapshot.currentView === "dashboard" || snapshot.currentView === "details"
                : snapshot.currentView === item.id;
              return `<button class="px-4 py-2 rounded-md font-label tracking-[0.08em] text-[11px] transition-colors ${isActive ? "bg-primary/10 text-primary" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"}" data-action="set-view" data-view="${item.id}">${item.label}</button>`;
            }).join("")}
          </nav>
        </div>
        ${showLibraryControls ? `
          <div class="flex items-center gap-3 w-full md:w-auto">
            <label class="relative group checkpoint-search-shell flex-1 min-w-[12rem] rounded-md">
              <input id="global-search" class="checkpoint-search-input px-4 py-2.5 pl-10 w-full sm:w-72 rounded-md" placeholder="Search titles, runs, studios..." type="text" value="${escapeHtml(snapshot.searchTerm)}">
              <span class="material-symbols-outlined absolute left-3 top-2.5 text-zinc-500 text-sm">search</span>
            </label>
            <button class="checkpoint-button checkpoint-button-primary h-10 px-5 flex items-center justify-center gap-2 rounded-md w-auto font-label tracking-[0.08em] text-[11px] whitespace-nowrap" data-action="open-add-modal">
              <span class="material-symbols-outlined text-sm">add</span>
              Add Game
            </button>
          </div>
        ` : ""}
      </div>
    </header>
  `;
}

export function renderTopbar(snapshot) {
  void snapshot;
  return "";
}

export function renderDashboardView(snapshot, storefrontDefinitions, statusDefinitions) {
  const playing = snapshot.visibleLibrary.filter((entry) => entry.status === "playing");
  const finished = snapshot.visibleLibrary.filter((entry) => entry.status === "finished");
  const backlog = snapshot.visibleLibrary.filter((entry) => entry.status === "backlog");
  const wishlist = snapshot.visibleLibrary.filter((entry) => entry.status === "wishlist");
  const hasSearch = Boolean(snapshot.searchTerm.trim());
  const hasScopedView = snapshot.activeStatus !== "all" || hasSearch;

  if (!snapshot.visibleLibrary.length) {
    return `
      <div data-scroll-root="dashboard" data-surface="library" class="pt-[8.75rem] md:pt-24 pb-12 flex-1 overflow-y-auto custom-scrollbar">
        <div class="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-8">
          <section data-surface-region="library-state-row">
            ${renderLibraryStateBar(snapshot, statusDefinitions)}
          </section>
          <section data-surface-region="library-content">
            ${renderLibraryEmptyState(snapshot)}
          </section>
        </div>
      </div>
    `;
  }

  if (hasScopedView) {
    const title = hasSearch ? "Search Results" : getStatusLabel(snapshot.activeStatus);
    const subtitle = hasSearch ? `Filtered through ${getStatusLabel(snapshot.activeStatus).toLowerCase()}` : "Focused library view";

    return `
      <div data-scroll-root="dashboard" data-surface="library" class="pt-[8.75rem] md:pt-24 pb-12 flex-1 overflow-y-auto custom-scrollbar">
        <div class="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-8">
          <section data-surface-region="library-state-row">
            ${renderLibraryStateBar(snapshot, statusDefinitions)}
          </section>
          <section data-surface-region="library-content">
            ${renderLibraryFocusSection(snapshot, storefrontDefinitions, statusDefinitions, title, subtitle)}
          </section>
        </div>
      </div>
    `;
  }

  return `
    <div data-scroll-root="dashboard" data-surface="library" class="pt-[8.75rem] md:pt-24 pb-12 flex-1 overflow-y-auto custom-scrollbar">
      <div class="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-10">
        <section data-surface-region="library-state-row">
          ${renderLibraryStateBar(snapshot, statusDefinitions)}
        </section>
        <section data-surface-region="library-content" class="space-y-10">
          ${renderDashboardHero(snapshot)}
          ${renderDashboardShelf({ title: "Currently Playing", eyebrow: "Now Playing", filterStatus: "playing", entries: playing, emptyMessage: "No active playing entries in the current view.", snapshot, storefrontDefinitions, statusDefinitions })}
          ${renderDashboardShelf({ title: "Finished Runs", eyebrow: "Finished", filterStatus: "finished", entries: finished, emptyMessage: "No finished entries in the current filter.", snapshot, storefrontDefinitions, statusDefinitions })}
          ${renderDashboardShelf({ title: "Backlog", eyebrow: "Backlog", filterStatus: "backlog", entries: backlog, emptyMessage: "No backlog entries in the current filter.", snapshot, storefrontDefinitions, statusDefinitions })}
          ${renderDashboardShelf({ title: "Wishlist", eyebrow: "Wishlist", filterStatus: "wishlist", entries: wishlist, emptyMessage: "No wishlist entries in the current filter.", snapshot, storefrontDefinitions, statusDefinitions })}
        </section>
      </div>
    </div>
  `;
}
