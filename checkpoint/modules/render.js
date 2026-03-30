function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(dateString) {
  if (!dateString) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(dateString));
}

function formatRelative(dateString) {
  if (!dateString) return "Unknown";
  const diff = Date.now() - new Date(dateString).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "Today";
  if (diff < day * 2) return "Yesterday";
  return `${Math.round(diff / day)}d ago`;
}

function getStorefrontLabel(storefrontDefinitions, storefrontId) {
  return storefrontDefinitions.find((item) => item.id === storefrontId)?.label ?? storefrontId;
}

function getStatusMeta(statusDefinitions, statusId) {
  return statusDefinitions.find((item) => item.id === statusId) ?? statusDefinitions[0];
}

function getGameForEntry(snapshot, entry) {
  return snapshot.catalog.find((item) => item.id === entry.gameId) ?? null;
}

function hasUsableAsset(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPendingMetadata(value) {
  if (typeof value !== "string") return true;
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized.startsWith("unknown ");
}

function renderFallbackArt(title, subtitle = "Manual entry", className = "") {
  return `
    <div class="w-full h-full ${className} bg-[radial-gradient(circle_at_top,#183548_0%,#09111a_45%,#05070b_100%)] flex flex-col justify-end p-5">
      <div class="w-10 h-10 rounded-full border border-primary/30 bg-primary/10 flex items-center justify-center mb-4">
        <span class="material-symbols-outlined text-primary">stadia_controller</span>
      </div>
      <p class="font-label text-[10px] uppercase tracking-[0.28em] text-primary mb-2">${escapeHtml(subtitle)}</p>
      <h3 class="font-headline text-xl font-extrabold tracking-tight text-on-surface">${escapeHtml(title)}</h3>
    </div>
  `;
}

function renderOptionalText(value, fallbackLabel) {
  return isPendingMetadata(value)
    ? `<span class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">${escapeHtml(fallbackLabel)}</span>`
    : `<span class="font-headline font-bold">${escapeHtml(value)}</span>`;
}

function renderPrimaryAction(label, dataAction, extraClasses = "", extraAttributes = "") {
  return `
    <button class="bg-gradient-to-r from-primary to-primary-container text-on-primary font-label font-bold uppercase hover:brightness-110 transition-all shadow-lg shadow-cyan-500/15 ${extraClasses}" data-action="${dataAction}" ${extraAttributes}>
      ${escapeHtml(label)}
    </button>
  `;
}

function renderSecondaryAction(label, dataAction, extraClasses = "", extraAttributes = "") {
  return `
    <button class="border border-primary/20 bg-primary/5 text-primary font-label font-bold uppercase hover:bg-primary/12 transition-all ${extraClasses}" data-action="${dataAction}" ${extraAttributes}>
      ${escapeHtml(label)}
    </button>
  `;
}

function renderMetaChip(label, tone = "neutral") {
  const toneClasses = {
    primary: "bg-primary/10 text-primary border border-primary/20",
    neutral: "bg-black/20 text-zinc-300 border border-outline-variant/20"
  };

  return `
    <span class="px-3 py-1 rounded-full font-label text-[10px] uppercase tracking-[0.18em] ${toneClasses[tone] ?? toneClasses.neutral}">
      ${escapeHtml(label)}
    </span>
  `;
}

function renderSettingsStatCard(label, value, accent, widthClass) {
  return `
    <div class="checkpoint-panel p-6 flex flex-col gap-1 relative overflow-hidden group rounded-xl">
      <span class="font-label text-[10px] text-zinc-500 uppercase tracking-widest">${escapeHtml(label)}</span>
      <div class="flex items-baseline gap-2">
        <span class="font-headline text-3xl font-extrabold text-on-surface">${escapeHtml(value)}</span>
        ${accent ? `<span class="font-label text-xs text-primary">${escapeHtml(accent)}</span>` : ""}
      </div>
      <div class="w-full h-1 bg-zinc-900 mt-2"><div class="h-full bg-primary ${widthClass}"></div></div>
    </div>
  `;
}

function renderSidebar(snapshot) {
  const items = [
    { id: "dashboard", label: "Library", icon: "library_books" },
    { id: "settings", label: "Settings", icon: "settings" }
  ];

  return `
    <header class="fixed top-0 inset-x-0 h-16 checkpoint-topbar z-50">
      <div class="max-w-[1400px] mx-auto h-full px-6 lg:px-8 flex items-center justify-between gap-6">
        <div class="flex items-center gap-8 min-w-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-md bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <span class="material-symbols-outlined text-on-primary">stadia_controller</span>
            </div>
            <div>
              <h2 class="font-headline font-extrabold text-sm tracking-tight text-on-surface">CHECKPOINT</h2>
              <p class="font-label uppercase tracking-[0.22em] text-[10px] text-zinc-500">Personal Game Tracker</p>
            </div>
          </div>
          <nav class="hidden md:flex items-center gap-1">
            ${items.map((item) => {
              const isActive = item.id === "dashboard"
                ? snapshot.currentView === "dashboard" || snapshot.currentView === "details"
                : snapshot.currentView === item.id;

              return `
                <button
                  class="px-4 py-2 rounded-full font-label uppercase tracking-[0.18em] text-[10px] transition-colors ${isActive ? "bg-primary/12 text-primary" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.04]"}"
                  data-action="set-view"
                  data-view="${item.id}"
                >
                  ${item.label}
                </button>
              `;
            }).join("")}
          </nav>
        </div>
        <div class="hidden lg:flex items-center gap-6 text-[10px] font-label uppercase tracking-[0.18em] text-zinc-500">
          <span>${snapshot.dashboardMetrics.totalEntries} tracked</span>
          <span>${snapshot.syncStatus.driveConnected ? "Drive Ready" : snapshot.syncStatus.driveClientConfigured ? "Drive Available" : "Local Only"}</span>
          <span>SteamGrid ${snapshot.syncStatus.steamGridReady ? "Live" : "Stub"}</span>
        </div>
      </div>
    </header>
  `;
}

function renderTopbar(snapshot) {
  const navItems = [
    { label: "All Games", status: "all" },
    { label: "Playing", status: "playing" },
    { label: "Finished", status: "finished" },
    { label: "Archived", status: "archived" }
  ];

  return `
    <div class="fixed top-16 inset-x-0 z-40 checkpoint-topbar">
      <div class="max-w-[1400px] mx-auto px-4 md:px-6 lg:px-8 py-3 md:py-0 md:h-16 flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-6">
        <div class="flex flex-col lg:flex-row lg:items-center gap-3 md:gap-6 min-w-0">
          <nav class="flex items-center gap-1 overflow-x-auto custom-scrollbar">
            ${navItems.map((item) => `
              <button
                class="px-3 py-2 whitespace-nowrap rounded-full font-label uppercase tracking-[0.18em] text-[10px] transition-colors ${snapshot.activeStatus === item.status ? "bg-white/[0.06] text-on-surface" : "text-zinc-500 hover:text-zinc-200"}"
                data-action="filter-status"
                data-status="${item.status}"
              >
                ${item.label}
              </button>
            `).join("")}
          </nav>
          <div class="hidden xl:flex items-center gap-3 text-[10px] font-label uppercase tracking-[0.18em] text-zinc-500">
            <span>${snapshot.dashboardMetrics.playingCount} playing</span>
            <span>${snapshot.dashboardMetrics.finishedCount} finished</span>
            <span>${snapshot.dashboardMetrics.archivedCount} archived</span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <label class="relative group">
            <select
              id="library-sort"
              class="w-full sm:w-auto bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm font-label uppercase tracking-[0.18em] px-4 py-2 rounded-full transition-all text-zinc-200"
            >
              <option value="updated_desc" ${snapshot.sortMode === "updated_desc" ? "selected" : ""}>Recent</option>
              <option value="title_asc" ${snapshot.sortMode === "title_asc" ? "selected" : ""}>Title</option>
              <option value="playtime_desc" ${snapshot.sortMode === "playtime_desc" ? "selected" : ""}>Playtime</option>
              <option value="completion_desc" ${snapshot.sortMode === "completion_desc" ? "selected" : ""}>Completion</option>
            </select>
          </label>
          <label class="relative group flex-1 min-w-[14rem]">
            <input
              id="global-search"
              class="bg-surface-container-low border-none focus:ring-1 focus:ring-primary text-sm font-label tracking-tight px-4 py-2 pl-10 w-full sm:w-64 rounded-full transition-all"
              placeholder="Search titles, runs, studios..."
              type="text"
              value="${escapeHtml(snapshot.searchTerm)}"
            >
            <span class="material-symbols-outlined absolute left-3 top-2.5 text-zinc-500 text-sm">search</span>
          </label>
          <button class="h-10 px-5 flex items-center justify-center gap-2 rounded-full w-full sm:w-auto bg-gradient-to-r from-primary to-primary-container text-on-primary hover:brightness-110 transition-all font-label uppercase tracking-[0.18em] text-[10px] shadow-lg shadow-cyan-500/15" data-action="open-add-modal">
            <span class="material-symbols-outlined text-sm">add</span>
            Add Game
          </button>
        </div>
      </div>
    </div>
  `;
}

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
          <span class="bg-black/60 text-zinc-100 px-2 py-1 rounded-full text-[9px] font-label uppercase tracking-[0.2em] backdrop-blur-md">${escapeHtml(statusMeta.label)}</span>
        </div>
        <div class="absolute bottom-3 left-3 right-3">
          <p class="font-label text-[9px] uppercase tracking-[0.22em] text-primary mb-1">${escapeHtml(getStorefrontLabel(storefrontDefinitions, entry.storefront))}</p>
          <p class="font-headline text-base font-bold text-on-surface leading-tight line-clamp-2">${escapeHtml(entry.title)}</p>
        </div>
      </div>
      <div class="pt-3 px-1">
        <p class="font-label text-[10px] uppercase tracking-[0.18em] text-zinc-400 truncate">${escapeHtml(entry.runLabel || "Main Save")}</p>
        <div class="mt-1 flex items-center justify-between gap-3 text-[10px] font-label uppercase tracking-[0.14em] text-zinc-500">
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
        <p class="font-label uppercase text-[10px] tracking-[0.24em] text-primary">Library Snapshot</p>
        <h4 class="text-3xl font-headline font-extrabold text-on-surface">${snapshot.dashboardMetrics.totalEntries}</h4>
        <p class="text-sm text-on-surface-variant leading-relaxed">A compact view of the library you are actively shaping.</p>
      </div>
      <div class="space-y-3">
        <div class="flex items-center justify-between text-[10px] font-label uppercase tracking-[0.18em] text-zinc-500">
          <span>Total Playtime</span>
          <span>${snapshot.dashboardMetrics.totalPlaytime}h</span>
        </div>
        <div class="flex items-center justify-between text-[10px] font-label uppercase tracking-[0.18em] text-zinc-500">
          <span>Average Completion</span>
          <span>${snapshot.dashboardMetrics.averageCompletion}%</span>
        </div>
      </div>
      ${renderSecondaryAction("Open Settings", "set-view", "w-full py-3 text-xs tracking-[0.18em] rounded-full", 'data-view="settings"')}
    </div>
  `;
}

function getStatusLabel(status) {
  return {
    all: "All Games",
    playing: "Playing",
    finished: "Finished",
    archived: "Archived"
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

function renderLibraryStateBar(snapshot) {
  const hasSearch = Boolean(snapshot.searchTerm.trim());
  const hasScopedView = snapshot.activeStatus !== "all" || hasSearch;
  const totalEntries = snapshot.dashboardMetrics.totalEntries;
  const visibleEntries = snapshot.visibleLibrary.length;

  return `
    <section class="checkpoint-panel rounded-xl px-5 py-4 flex flex-wrap items-center justify-between gap-4">
      <div class="flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-3">
          <span class="font-label text-[10px] uppercase tracking-[0.22em] text-zinc-500">Library / Collection</span>
          <span class="font-label text-[10px] uppercase tracking-[0.3em] text-primary">Library View</span>
          <span class="px-3 py-1 rounded-full bg-primary/10 text-primary font-label text-[10px] uppercase tracking-[0.18em] border border-primary/20">${escapeHtml(getStatusLabel(snapshot.activeStatus))}</span>
          <span class="px-3 py-1 rounded-full bg-black/20 text-zinc-300 font-label text-[10px] uppercase tracking-[0.18em] border border-outline-variant/20">Sort: ${escapeHtml(getSortLabel(snapshot.sortMode))}</span>
        ${hasSearch ? `
            <span class="px-3 py-1 rounded-full bg-black/20 text-zinc-300 font-label text-[10px] uppercase tracking-[0.18em] border border-outline-variant/20">Search: ${escapeHtml(snapshot.searchTerm.trim())}</span>
        ` : ""}
        </div>
        <div class="flex flex-wrap items-center gap-3 text-[10px] font-label uppercase tracking-[0.18em] text-zinc-500">
          <span>${visibleEntries} visible</span>
          <span>${totalEntries} total tracked</span>
          ${hasScopedView ? `<span class="text-primary">Scoped view active</span>` : `<span>Full library view</span>`}
        </div>
        <p class="text-xs text-zinc-500 leading-relaxed">Search looks through titles, run labels, storefronts, notes, and stored metadata.</p>
      </div>
      ${hasScopedView ? `
        ${renderSecondaryAction("Reset To All Games", "clear-library-view", "px-4 py-2 rounded-full text-[10px] tracking-[0.2em]")}
      ` : `
        <p class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">Minimal library focus</p>
      `}
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
    <section class="checkpoint-panel rounded-xl px-8 py-12 flex flex-col items-center justify-center text-center gap-4 min-h-[20rem]">
      <div class="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
        <span class="material-symbols-outlined text-primary">filter_alt_off</span>
      </div>
      <div class="space-y-2 max-w-xl">
        <h2 class="font-headline text-3xl font-extrabold tracking-tight text-on-surface">${escapeHtml(title)}</h2>
        <p class="text-on-surface-variant leading-relaxed">${escapeHtml(body)}</p>
      </div>
      <div class="flex items-center gap-4 pt-2">
        ${renderPrimaryAction("Add Game", "open-add-modal", "px-6 py-3 text-xs tracking-[0.2em] rounded-sm")}
        ${(snapshot.activeStatus !== "all" || hasSearch) ? `
          <button class="px-6 py-3 border border-outline-variant/30 font-label font-bold text-xs uppercase tracking-[0.2em] rounded-sm hover:bg-surface-container-high transition-all" data-action="clear-library-view">
            Reset View
          </button>
        ` : ""}
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
          <span class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500 mt-1">${escapeHtml(subtitle)}</span>
        </div>
        <span class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">${snapshot.visibleLibrary.length} visible</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-8">
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
          <p class="font-label uppercase text-[10px] tracking-[0.22em] text-zinc-500">Home / Library</p>
          <p class="font-label uppercase text-[10px] tracking-[0.28em] text-primary">Your Library</p>
          <h1 class="text-4xl lg:text-5xl font-headline font-extrabold tracking-tight text-on-surface">Track what you are playing, what you finished, and what you parked.</h1>
          <p class="max-w-3xl text-on-surface-variant leading-relaxed">Checkpoint now leans into a cleaner, cover-first library. The current view always matches the data that will export and sync.</p>
        </div>
        <div class="metadata-rule mt-8 pt-5 flex flex-wrap gap-6 text-[10px] font-label uppercase tracking-[0.18em] text-zinc-500">
          <span>${snapshot.dashboardMetrics.playingCount} playing</span>
          <span>${snapshot.dashboardMetrics.finishedCount} finished</span>
          <span>${snapshot.dashboardMetrics.archivedCount} archived</span>
          <span>${snapshot.dashboardMetrics.totalEntries} total entries</span>
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
          <p class="font-label uppercase text-[10px] tracking-[0.24em] text-primary mb-2">${escapeHtml(eyebrow)}</p>
          <h2 class="${headingSize} font-headline font-extrabold tracking-tight text-on-surface">${escapeHtml(title)}</h2>
        </div>
        <button class="text-zinc-500 hover:text-primary transition-colors font-label text-[10px] uppercase tracking-[0.18em]" data-action="filter-status" data-status="${filterStatus}">${escapeHtml(actionLabel)}</button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-x-5 gap-y-8">
        ${entries.length
          ? entries.map((entry) => renderCard(entry, getGameForEntry(snapshot, entry), storefrontDefinitions, statusDefinitions, cardClass)).join("")
          : `<div class="col-span-full text-zinc-500 font-label uppercase tracking-widest text-xs">${escapeHtml(emptyMessage)}</div>`}
      </div>
    </section>
  `;
}

function renderDashboardView(snapshot, storefrontDefinitions, statusDefinitions) {
  const playing = snapshot.visibleLibrary.filter((entry) => entry.status === "playing");
  const finished = snapshot.visibleLibrary.filter((entry) => entry.status === "finished");
  const archived = snapshot.visibleLibrary.filter((entry) => entry.status === "archived");
  const hasSearch = Boolean(snapshot.searchTerm.trim());
  const hasScopedView = snapshot.activeStatus !== "all" || hasSearch;

  if (!snapshot.visibleLibrary.length) {
    return `
      <div class="pt-44 md:pt-36 pb-12 flex-1 overflow-y-auto custom-scrollbar">
        <div class="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-8">
        ${renderLibraryStateBar(snapshot)}
        ${renderLibraryEmptyState(snapshot)}
        </div>
      </div>
    `;
  }

  if (hasScopedView) {
    const title = hasSearch ? "Search Results" : getStatusLabel(snapshot.activeStatus);
    const subtitle = hasSearch
      ? `Filtered through ${getStatusLabel(snapshot.activeStatus).toLowerCase()}`
      : `Focused library view`;

    return `
      <div class="pt-44 md:pt-36 pb-12 flex-1 overflow-y-auto custom-scrollbar">
        <div class="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-8">
          ${renderLibraryStateBar(snapshot)}
          ${renderLibraryFocusSection(snapshot, storefrontDefinitions, statusDefinitions, title, subtitle)}
        </div>
      </div>
    `;
  }

  return `
    <div class="pt-44 md:pt-36 pb-12 flex-1 overflow-y-auto custom-scrollbar">
      <div class="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-10">
        ${renderLibraryStateBar(snapshot)}
        ${renderDashboardHero(snapshot)}
        ${renderDashboardShelf({
          title: "Currently Playing",
          eyebrow: "Now Playing",
          filterStatus: "playing",
          entries: playing,
          emptyMessage: "No active playing entries in the current view.",
          snapshot,
          storefrontDefinitions,
          statusDefinitions
        })}
        ${renderDashboardShelf({
          title: "Finished Runs",
          eyebrow: "Finished Shelf",
          filterStatus: "finished",
          entries: finished,
          emptyMessage: "No finished entries in the current filter.",
          snapshot,
          storefrontDefinitions,
          statusDefinitions
        })}
        ${renderDashboardShelf({
          title: "Archive",
          eyebrow: "Archived Shelf",
          filterStatus: "archived",
          entries: archived,
          emptyMessage: "No archived entries in the current filter.",
          snapshot,
          storefrontDefinitions,
          statusDefinitions
        })}
      </div>
    </div>
  `;
}

function renderDetailHeroSection(activeEntry, game, coverArt, heroBackdropArt, description, storefrontDefinitions, statusDefinitions) {
  return `
    <section class="checkpoint-panel rounded-xl p-8 lg:p-10 overflow-hidden relative">
      ${hasUsableAsset(heroBackdropArt) ? `
        <div class="absolute inset-0 pointer-events-none">
          <img class="w-full h-full object-cover scale-105 opacity-50 blur-[1px]" src="${escapeHtml(heroBackdropArt)}" alt="${escapeHtml(activeEntry.title)} hero backdrop">
          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,12,0.08)_0%,rgba(10,12,14,0.38)_24%,rgba(16,18,20,0.72)_56%,rgba(22,24,26,0.92)_100%)]"></div>
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.12),transparent_38%)]"></div>
        </div>
      ` : ""}
      <div class="relative z-10 grid grid-cols-1 lg:grid-cols-[220px_1fr] xl:grid-cols-[260px_1fr_220px] gap-6 lg:gap-8 items-start">
        <div class="overflow-hidden rounded-md bg-zinc-900 cover-shadow aspect-[3/4] max-w-[260px] mx-auto lg:mx-0">
          ${hasUsableAsset(coverArt)
            ? `<img class="w-full h-full object-cover" src="${escapeHtml(coverArt)}" alt="${escapeHtml(activeEntry.title)} cover art">`
            : renderFallbackArt(activeEntry.title, "Artwork pending", "rounded-md")}
        </div>
        <div class="space-y-5">
          <p class="font-label uppercase text-[10px] tracking-[0.22em] text-zinc-500">Library / Details</p>
          <div class="flex flex-wrap items-center gap-3">
            ${renderMetaChip(getStorefrontLabel(storefrontDefinitions, activeEntry.storefront), "primary")}
            ${renderMetaChip(getStatusMeta(statusDefinitions, activeEntry.status).label)}
            ${renderMetaChip(`${activeEntry.playtimeHours}h logged`)}
          </div>
          <div>
            <h1 class="text-4xl lg:text-5xl font-extrabold font-headline tracking-tight text-on-surface">${escapeHtml(activeEntry.title)}</h1>
            <p class="mt-2 font-label text-[11px] uppercase tracking-[0.22em] text-zinc-500">${escapeHtml(activeEntry.runLabel || "Main Save")}</p>
          </div>
          <p class="max-w-3xl text-on-surface-variant text-base leading-relaxed">
            ${escapeHtml(description || "This entry was added manually and is waiting on fuller metadata.")}
          </p>
          <div class="metadata-rule pt-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 text-sm">
            <div>
              <p class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">Release Date</p>
              <p class="font-headline font-bold text-on-surface">${hasUsableAsset(game?.releaseDate) ? escapeHtml(formatDate(game?.releaseDate)) : "Metadata pending"}</p>
            </div>
            <div>
              <p class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">Platform</p>
              <p class="font-headline font-bold text-on-surface">${game?.platforms?.length ? escapeHtml(game.platforms.join(", ")) : "Platform pending"}</p>
            </div>
            <div>
              <p class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">Developer</p>
              <p class="font-headline font-bold text-on-surface">${!isPendingMetadata(game?.developer) ? escapeHtml(game.developer) : "Metadata pending"}</p>
            </div>
            <div>
              <p class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">Publisher</p>
              <p class="font-headline font-bold text-on-surface">${!isPendingMetadata(game?.publisher) ? escapeHtml(game.publisher) : "Metadata pending"}</p>
            </div>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row xl:flex-col gap-3 lg:col-span-2 xl:col-auto">
          <p class="font-label uppercase text-[10px] tracking-[0.22em] text-zinc-500 mb-1">Quick Actions</p>
          ${renderPrimaryAction("Back to Library", "set-view", "w-full px-5 py-3 tracking-[0.18em] rounded-full text-[10px]", 'data-view="dashboard"')}
          <button class="w-full px-5 py-3 border border-primary/20 bg-primary/5 text-primary hover:bg-primary/12 transition-all rounded-full flex items-center justify-center gap-2 font-label font-bold tracking-[0.18em] uppercase text-[10px]" data-action="open-edit-modal" data-entry-id="${activeEntry.entryId}">
            <span class="material-symbols-outlined text-base">edit</span>
            Edit Entry
          </button>
          ${activeEntry.status === "archived" ? `
            <button class="w-full px-5 py-3 border border-emerald-300/20 text-emerald-100 hover:bg-emerald-400/10 transition-all rounded-full flex items-center justify-center gap-2 font-label font-bold tracking-[0.18em] uppercase text-[10px]" data-action="update-entry-status" data-entry-id="${activeEntry.entryId}" data-status="playing">
              <span class="material-symbols-outlined text-base">restore</span>
              Restore
            </button>
          ` : ""}
          <button class="w-full px-5 py-3 border border-red-400/20 text-red-200 hover:bg-red-400/10 transition-all rounded-full flex items-center justify-center gap-2 font-label font-bold tracking-[0.18em] uppercase text-[10px]" data-action="open-delete-confirm" data-entry-id="${activeEntry.entryId}">
            <span class="material-symbols-outlined text-base">delete</span>
            Delete Entry
          </button>
        </div>
      </div>
    </section>
  `;
}

function renderDetailProgressPanel(snapshot, activeEntry, statusDefinitions) {
  return `
    <div class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
      <div class="flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div class="flex flex-col gap-1">
          <h3 class="font-label text-xs uppercase tracking-[0.3em] text-primary">Current Progress</h3>
          <p class="font-label text-[10px] uppercase tracking-[0.18em] text-zinc-500">Edit tracked run values directly here.</p>
          <p class="text-3xl font-headline font-extrabold tracking-tighter">${activeEntry.completionPercent}% COMPLETE</p>
        </div>
        <div class="text-right shrink-0">
          <p class="font-label text-xs text-zinc-500 uppercase">Last Updated</p>
          <p class="font-body font-bold text-on-surface">${escapeHtml(formatRelative(activeEntry.updatedAt))}</p>
        </div>
      </div>
      <div class="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-cyan-500 to-primary-container shadow-[0_0_15px_rgba(168,232,255,0.5)]" style="width:${activeEntry.completionPercent}%"></div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <label class="space-y-2">
          <span class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">Playtime</span>
          <input id="detail-playtime" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-label text-sm text-on-surface focus:ring-1 focus:ring-primary" type="number" min="0" step="0.5" value="${escapeHtml(snapshot.detailForm.playtimeHours)}">
        </label>
        <label class="space-y-2">
          <span class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">Completion</span>
          <input id="detail-completion" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-label text-sm text-on-surface focus:ring-1 focus:ring-primary" type="number" min="0" max="100" step="1" value="${escapeHtml(snapshot.detailForm.completionPercent)}">
        </label>
        <label class="space-y-2">
          <span class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">Status</span>
          <select id="detail-status" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-label text-sm text-on-surface focus:ring-1 focus:ring-primary appearance-none">
            ${statusDefinitions.map((status) => `
              <option class="bg-surface" value="${status.id}" ${snapshot.detailForm.status === status.id ? "selected" : ""}>${escapeHtml(status.label)}</option>
            `).join("")}
          </select>
        </label>
      </div>
      <div class="flex justify-end">
        <p class="mr-auto text-xs text-zinc-500 self-center">Saves playtime, completion, and status for this run only.</p>
        ${renderPrimaryAction("Save Progress", "save-detail-progress", "px-6 py-3 text-xs tracking-[0.2em] rounded-full")}
      </div>
    </div>
  `;
}

function renderDetailMediaPanel(activeEntry, screenshots) {
  return `
    <div class="flex flex-col gap-6">
      <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 class="font-label text-xs uppercase tracking-[0.4em] text-zinc-400">Media Highlights</h3>
        <div class="flex flex-wrap items-center gap-3">
          <button class="text-zinc-300 font-label text-xs uppercase tracking-widest hover:text-primary transition-colors" data-action="refresh-entry-metadata" data-entry-id="${activeEntry.entryId}">Refresh Metadata</button>
          <button class="text-primary font-label text-xs uppercase tracking-widest hover:underline" data-action="refresh-entry-artwork" data-entry-id="${activeEntry.entryId}">Refresh Assets</button>
        </div>
      </div>
      ${screenshots.length ? `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        ${screenshots.map((shot) => `
            <div class="aspect-video bg-surface-container overflow-hidden rounded-md group cursor-pointer checkpoint-panel">
              <img class="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" src="${escapeHtml(shot)}" alt="${escapeHtml(activeEntry.title)} screenshot">
          </div>
        `).join("")}
        </div>
      ` : `
        <div class="checkpoint-panel rounded-lg px-6 py-8 text-center">
          <p class="font-label text-[10px] uppercase tracking-[0.25em] text-primary mb-2">Media Pending</p>
          <p class="text-on-surface-variant">No screenshots are stored for this entry yet. Manual records can be enriched later without changing the run data.</p>
        </div>
      `}
    </div>
  `;
}

function renderDetailNotesPanel(snapshot) {
  return `
    <div class="flex flex-col gap-6 checkpoint-panel rounded-xl p-6 md:p-8">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="font-label text-xs uppercase tracking-[0.4em] text-zinc-400">Archive Notes</h3>
          <p class="font-label text-[10px] uppercase tracking-[0.18em] text-zinc-500 mt-1">Save reminders, goals, and run-specific context.</p>
        </div>
        ${renderPrimaryAction("Save Notes", "save-detail-notes", "px-5 py-2.5 text-xs tracking-[0.2em] rounded-full")}
      </div>
      <textarea id="detail-notes" class="w-full min-h-40 bg-transparent border-none focus:ring-0 resize-y font-body italic text-on-surface-variant leading-relaxed" placeholder="Track what happened in this run, where you stopped, or what to revisit next.">${escapeHtml(snapshot.detailForm.notes)}</textarea>
    </div>
  `;
}

function renderDetailSidebar(activeEntry, game, heroArt, screenshots, storefrontDefinitions) {
  return `
    <aside class="flex flex-col gap-8">
      <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-8 sticky top-36">
        <div class="flex flex-col gap-5">
          <h4 class="font-label text-xs uppercase tracking-[0.2em] text-primary border-b border-outline-variant/20 pb-4">Library Metadata</h4>
          <div class="flex justify-between items-center"><span class="font-label text-xs text-zinc-500">Storefront</span><span class="font-headline font-bold">${escapeHtml(getStorefrontLabel(storefrontDefinitions, activeEntry.storefront))}</span></div>
          <div class="flex justify-between items-center gap-4"><span class="font-label text-xs text-zinc-500">Developer</span>${renderOptionalText(game?.developer, "Metadata pending")}</div>
          <div class="flex justify-between items-center gap-4"><span class="font-label text-xs text-zinc-500">Publisher</span>${renderOptionalText(game?.publisher, "Metadata pending")}</div>
          <div class="flex justify-between items-center gap-4"><span class="font-label text-xs text-zinc-500">SteamGrid Slug</span>${renderOptionalText(game?.steamGridSlug, "Artwork pending")}</div>
        </div>
        <div class="bg-black/20 p-4 border-l-2 border-primary-container">
          <div class="flex items-center gap-3 mb-2">
            <span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1;">verified</span>
            <span class="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface">Roadmap Status</span>
          </div>
          <p class="font-label text-[9px] text-outline leading-relaxed">${hasUsableAsset(heroArt) || screenshots.length || !isPendingMetadata(game?.developer) ? "METADATA, ARTWORK, AND SYNC FIELDS ARE ALREADY WIRED THROUGH THE APP STATE AND SERVICE ADAPTERS." : "THIS ENTRY IS RUN-READY NOW AND CAN BE ENRICHED WITH ARTWORK OR STORE METADATA LATER."}</p>
        </div>
      </div>
    </aside>
  `;
}

function renderDetailsView(snapshot, storefrontDefinitions, statusDefinitions) {
  const activeEntry = snapshot.activeEntry;
  if (!activeEntry) {
    return `<div class="mt-20 p-10 text-zinc-500">Select a game to open the detail view.</div>`;
  }

  const game = getGameForEntry(snapshot, activeEntry);
  const coverArt = game?.capsuleArt ?? game?.heroArt ?? "";
  const heroBackdropArt = game?.heroArt ?? game?.capsuleArt ?? "";
  const screenshots = Array.isArray(game?.screenshots) ? game.screenshots.filter(hasUsableAsset) : [];
  const description = !isPendingMetadata(game?.description) ? game.description : activeEntry.notes;

  return `
    <div class="pt-44 md:pt-36 pb-12 flex-1 overflow-y-auto custom-scrollbar">
      <div class="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-10">
        ${renderDetailHeroSection(activeEntry, game, coverArt, heroBackdropArt, description, storefrontDefinitions, statusDefinitions)}
        <div class="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 lg:gap-8">
          <div class="flex flex-col gap-8">
            ${renderDetailProgressPanel(snapshot, activeEntry, statusDefinitions)}
            ${renderActionMessage(snapshot.actionState.metadata)}
            ${renderDetailMediaPanel(activeEntry, screenshots)}
            ${renderActionMessage(snapshot.actionState.artwork)}
            ${renderDetailNotesPanel(snapshot)}
          </div>
          ${renderDetailSidebar(activeEntry, game, coverArt, screenshots, storefrontDefinitions)}
        </div>
      </div>
    </div>
  `;
}

function renderSettingsView(snapshot) {
  return `
    <main class="pt-44 md:pt-36 pb-12 flex-1 overflow-y-auto custom-scrollbar">
      <div class="max-w-[1400px] mx-auto px-6 lg:px-8">
      <div class="mb-10">
        <p class="font-label uppercase text-[10px] tracking-[0.22em] text-zinc-500 mb-2">Library / Settings</p>
        <p class="font-label uppercase text-[10px] tracking-[0.28em] text-primary mb-3">Settings</p>
        <h1 class="text-4xl font-headline font-extrabold tracking-tight text-on-surface">Backup, import, and sync configuration.</h1>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        ${renderSettingsStatCard("Ready To Sync", String(snapshot.syncStatus.ready), "ENTRIES", "w-full opacity-80")}
        ${renderSettingsStatCard("Pending Queue", String(snapshot.syncStatus.pending), "ITEMS", "w-2/3")}
        ${renderSettingsStatCard("SteamGrid Adapter", snapshot.syncStatus.steamGridReady ? "Live" : "Stub", "", "w-1/2")}
        ${renderSettingsStatCard("Drive Link", snapshot.syncStatus.driveConnected ? "Connected" : snapshot.syncStatus.driveClientConfigured ? "Ready" : "Setup", "", "w-1/3")}
      </div>
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <section class="xl:col-span-7 flex flex-col gap-8">
          <div>
            <p class="font-label uppercase text-[10px] tracking-[0.22em] text-zinc-500 mb-2">Connections & Roadmap</p>
          </div>
          <div class="checkpoint-panel rounded-xl p-8 flex flex-col gap-6 relative">
            <div class="flex items-center justify-between mb-4">
              <h3 class="font-label uppercase tracking-[0.2em] text-xs font-bold text-primary">Sync Roadmap</h3>
              <span class="material-symbols-outlined text-primary/40 text-sm">cloud_sync</span>
            </div>
            <div class="space-y-4">
              <div class="hud-line py-3 flex items-center justify-between">
                <span class="font-headline font-bold text-on-surface">Google Drive OAuth handshake</span>
                <span class="text-[10px] font-label text-zinc-500 uppercase">services/google-drive.js</span>
              </div>
              <div class="hud-line py-3 flex items-center justify-between">
                <span class="font-headline font-bold text-on-surface">SteamGrid art resolution pipeline</span>
                <span class="text-[10px] font-label text-zinc-500 uppercase">services/steamgrid.js</span>
              </div>
              <div class="hud-line py-3 flex items-center justify-between">
                <span class="font-headline font-bold text-on-surface">Metadata resolver pipeline</span>
                <span class="text-[10px] font-label text-zinc-500 uppercase">services/storefronts.js</span>
              </div>
            </div>
          </div>
          <div class="checkpoint-panel rounded-xl p-8 flex flex-col gap-5">
            <div class="flex flex-col gap-2">
              <h3 class="font-label uppercase tracking-[0.2em] text-xs font-bold text-primary">SteamGrid Proxy</h3>
              <p class="text-on-surface-variant leading-relaxed text-sm">Checkpoint uses a built-in Cloudflare Worker proxy between GitHub Pages and SteamGridDB. The endpoint is configured in the app and shown here as read-only deployment status.</p>
            </div>
            <div class="space-y-2">
              <span class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">Worker URL</span>
              <div class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-label text-sm text-on-surface break-all">
                ${snapshot.serviceConfig.steamGridWorkerUrl
                  ? escapeHtml(snapshot.serviceConfig.steamGridWorkerUrl)
                  : "Not configured"}
              </div>
            </div>
            <div class="flex flex-wrap items-center gap-3 text-xs text-zinc-500 leading-relaxed">
              <span>Deploy the free Cloudflare Worker once, then keep its public URL in checkpoint/config.js.</span>
              <a class="text-primary hover:underline" href="https://developers.cloudflare.com/workers/get-started/guide/" target="_blank" rel="noreferrer">Workers guide</a>
              <span>/</span>
              <a class="text-primary hover:underline" href="https://www.steamgriddb.com/api" target="_blank" rel="noreferrer">SteamGrid docs</a>
            </div>
            <p class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">${snapshot.syncStatus.steamGridReady ? "SteamGrid proxy is connected." : "SteamGrid proxy is not configured."}</p>
          </div>
          <div class="checkpoint-panel rounded-xl p-8 border-l-2 border-primary/20">
            <div class="flex items-center gap-3 mb-6">
              <span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">deployed_code</span>
              <h3 class="font-label uppercase tracking-[0.2em] text-xs font-bold text-on-surface">Implementation Notes</h3>
            </div>
            <p class="text-on-surface-variant leading-relaxed">This settings surface is ready for real service adapters, backup automation, and future sync work without needing a fresh UI rewrite.</p>
          </div>
        </section>
        <section class="xl:col-span-5 flex flex-col gap-8">
          <div>
            <p class="font-label uppercase text-[10px] tracking-[0.22em] text-zinc-500 mb-2">Backup & Restore</p>
          </div>
          <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-6">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 class="font-label uppercase tracking-[0.2em] text-xs font-bold text-primary">Drive Sync</h3>
                <p class="font-label text-[10px] uppercase tracking-[0.18em] text-zinc-500 mt-1">Connect your Google account, then sync the full Checkpoint app state.</p>
              </div>
              ${snapshot.syncStatus.driveConnected
                ? renderPrimaryAction("Sync Now", "mark-all-synced", "w-full sm:w-auto sm:max-w-[10rem] py-3 text-xs tracking-widest rounded-full")
                : renderPrimaryAction("Connect Drive", "connect-google-drive", "w-full sm:w-auto sm:max-w-[11rem] py-3 text-xs tracking-widest rounded-full")}
            </div>
            <div class="flex flex-wrap items-center gap-3 text-xs text-zinc-500 leading-relaxed">
              <span>${snapshot.syncStatus.driveConnected ? "Connected with browser-based Google OAuth." : snapshot.syncStatus.driveClientConfigured ? "OAuth client is configured. Connect when you are ready to sync." : "Add googleDriveClientId to checkpoint/config.js to enable Drive sync."}</span>
              ${snapshot.syncStatus.driveConnected ? `
                ${renderSecondaryAction("Restore From Drive", "restore-google-drive", "px-4 py-2 rounded-full text-[10px] tracking-[0.2em]")}
                ${renderSecondaryAction("Disconnect", "disconnect-google-drive", "px-4 py-2 rounded-full text-[10px] tracking-[0.2em]")}
              ` : ""}
            </div>
            ${snapshot.restorePointMeta ? `
              <div class="rounded-lg border border-primary/15 bg-primary/5 px-4 py-3">
                <p class="font-label text-[10px] uppercase tracking-[0.2em] text-primary mb-2">Local Restore Safety Snapshot</p>
                <div class="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400">
                  <span>Saved ${escapeHtml(formatRelative(snapshot.restorePointMeta.timestamp))} from ${escapeHtml(snapshot.restorePointMeta.source)}</span>
                  ${renderSecondaryAction("Restore Local Snapshot", "restore-local-snapshot", "px-4 py-2 rounded-full text-[10px] tracking-[0.2em]")}
                </div>
              </div>
            ` : `
              <p class="text-xs text-zinc-500 leading-relaxed">Before a Drive restore runs, Checkpoint saves a local restore safety snapshot in this browser so you can roll back quickly.</p>
            `}
            <div class="space-y-3">
              ${renderPreference("Auto-backup on state change", "autoBackup", snapshot.syncPreferences.autoBackup)}
              ${renderPreference("Include artwork payloads", "includeArtwork", snapshot.syncPreferences.includeArtwork)}
              ${renderPreference("Include archive notes", "includeNotes", snapshot.syncPreferences.includeNotes)}
            </div>
            ${renderActionMessage(snapshot.actionState.sync)}
          </div>
          <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 class="font-label uppercase tracking-[0.2em] text-xs font-bold text-primary mb-2">Metadata Refresh</h3>
                <p class="text-on-surface-variant leading-relaxed text-sm">Re-run the IGDB resolver across the current library without touching your run-specific notes or progress.</p>
              </div>
              ${renderPrimaryAction("Refresh Library Metadata", "refresh-library-metadata", "px-5 py-3 text-xs tracking-[0.2em] rounded-full whitespace-nowrap")}
            </div>
            <p class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">Uses the configured Cloudflare Worker proxy and keeps per-run entry data intact while updating catalog metadata.</p>
            ${renderActionMessage(snapshot.actionState.metadata)}
          </div>
          <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 class="font-label uppercase tracking-[0.2em] text-xs font-bold text-primary mb-2">Artwork Refresh</h3>
                <p class="text-on-surface-variant leading-relaxed text-sm">Pull SteamGrid capsule art, hero art, and gallery assets again for the current library.</p>
              </div>
              ${renderPrimaryAction("Refresh Library Art", "refresh-library-artwork", "px-5 py-3 text-xs tracking-[0.2em] rounded-full whitespace-nowrap")}
            </div>
            <p class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">Uses the configured Cloudflare Worker proxy to reach SteamGridDB without exposing secrets in the browser.</p>
            ${renderActionMessage(snapshot.actionState.artwork)}
          </div>
          <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 class="font-label uppercase tracking-[0.2em] text-xs font-bold text-primary mb-2">Local Backup</h3>
                <p class="text-on-surface-variant leading-relaxed text-sm">Download the full persisted Checkpoint state as JSON before import and sync work lands.</p>
              </div>
              ${renderPrimaryAction("Export JSON", "export-json", "px-5 py-3 text-xs tracking-[0.2em] rounded-full whitespace-nowrap")}
            </div>
            <p class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">Includes library, catalog, sync preferences, and persisted UI preferences.</p>
            <p class="text-xs text-zinc-500 leading-relaxed">Use this before large edits or imports so you can roll your local state back quickly.</p>
            ${renderActionMessage(snapshot.actionState.backup)}
          </div>
          <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-5">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 class="font-label uppercase tracking-[0.2em] text-xs font-bold text-primary mb-2">Restore Backup</h3>
                <p class="text-on-surface-variant leading-relaxed text-sm">Import a Checkpoint JSON backup and validate it before restoring it into local storage.</p>
              </div>
              ${renderSecondaryAction("Import JSON", "trigger-import-json", "px-5 py-3 text-xs tracking-[0.2em] rounded-full whitespace-nowrap")}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button class="flex items-center justify-between p-3 rounded ${snapshot.importMode === "replace" ? "bg-surface-container-high border border-primary/20" : "bg-surface-container-low/40 hover:bg-surface-container-high"} transition-colors group" data-action="set-import-mode" data-import-mode="replace">
                <span class="font-label text-xs tracking-widest uppercase ${snapshot.importMode === "replace" ? "text-on-surface" : "text-outline"}">Replace</span>
                <div class="w-4 h-4 rounded-full border ${snapshot.importMode === "replace" ? "border-primary flex items-center justify-center" : "border-outline-variant"}">
                  ${snapshot.importMode === "replace" ? '<div class="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#a8e8ff]"></div>' : ""}
                </div>
              </button>
              <button class="flex items-center justify-between p-3 rounded ${snapshot.importMode === "merge" ? "bg-surface-container-high border border-primary/20" : "bg-surface-container-low/40 hover:bg-surface-container-high"} transition-colors group" data-action="set-import-mode" data-import-mode="merge">
                <span class="font-label text-xs tracking-widest uppercase ${snapshot.importMode === "merge" ? "text-on-surface" : "text-outline"}">Merge</span>
                <div class="w-4 h-4 rounded-full border ${snapshot.importMode === "merge" ? "border-primary flex items-center justify-center" : "border-outline-variant"}">
                  ${snapshot.importMode === "merge" ? '<div class="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#a8e8ff]"></div>' : ""}
                </div>
              </button>
            </div>
            <p class="font-label text-[10px] uppercase tracking-[0.2em] text-zinc-500">${snapshot.importMode === "merge" ? "Merge keeps current sync and UI preferences, and imported entries overwrite matching entry IDs." : "Replace swaps the entire local backup state after validation."}</p>
            <p class="text-xs text-zinc-500 leading-relaxed">${snapshot.importMode === "merge" ? "Choose merge when you want to bring in entries from another backup without discarding the library already on this device." : "Choose replace when the backup file should become the complete new source of truth for this browser."}</p>
            <input id="import-json-input" class="hidden" type="file" accept="application/json,.json">
          </div>
          ${renderSyncHistory(snapshot)}
        </section>
      </div>
      </div>
    </main>
  `;
}

function renderDeleteConfirmModal(snapshot, storefrontDefinitions, statusDefinitions) {
  if (!snapshot.pendingDeleteEntryId) return "";

  const pendingEntry = snapshot.library.find((entry) => entry.entryId === snapshot.pendingDeleteEntryId);
  if (!pendingEntry) return "";

  return `
    <div class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:p-6 bg-black/85 backdrop-blur-sm" data-modal-root="delete-confirm" tabindex="-1">
      <div class="glass-panel w-full max-w-xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto rounded-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.85)] border border-red-400/20 overflow-hidden flex flex-col">
        <div class="p-8 pb-5 flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="w-2 h-2 rounded-full bg-red-300 shadow-[0_0_10px_rgba(252,165,165,0.8)]"></span>
              <span class="font-label uppercase tracking-[0.35em] text-[10px] text-red-300">Delete Confirmation</span>
            </div>
            <h2 class="font-headline text-3xl font-bold tracking-tight text-on-surface">Remove Entry</h2>
          </div>
          <button class="text-outline hover:text-on-surface transition-colors" data-action="close-delete-confirm">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="px-8 pb-6 space-y-5 overflow-y-auto custom-scrollbar">
          <p class="text-on-surface-variant leading-relaxed">
            Delete <span class="text-on-surface font-headline font-bold">${escapeHtml(pendingEntry.title)}</span>
            from your library? This removes the tracked run
            <span class="text-primary font-label uppercase tracking-widest text-xs">${escapeHtml(pendingEntry.runLabel || "Main Save")}</span>
            and cannot be undone yet.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/20 p-4 border-l-2 border-red-300/40">
            <div>
              <p class="font-label text-[9px] uppercase tracking-[0.2em] text-outline">Storefront</p>
              <p class="font-headline text-sm font-bold text-on-surface">${escapeHtml(getStorefrontLabel(storefrontDefinitions, pendingEntry.storefront))}</p>
            </div>
            <div>
              <p class="font-label text-[9px] uppercase tracking-[0.2em] text-outline">Status</p>
              <p class="font-headline text-sm font-bold text-on-surface">${escapeHtml(getStatusMeta(statusDefinitions, pendingEntry.status).label)}</p>
            </div>
            <div>
              <p class="font-label text-[9px] uppercase tracking-[0.2em] text-outline">Entry ID</p>
              <p class="font-headline text-sm font-bold text-primary">${escapeHtml(pendingEntry.entryId)}</p>
            </div>
          </div>
        </div>
        <div class="p-8 bg-black/40 flex items-center justify-between border-t border-outline-variant/10 gap-6 shrink-0">
          <p class="font-label text-[10px] uppercase tracking-[0.2em] text-outline">If this is the final run for this title, its catalog metadata is cleaned up too.</p>
          <div class="flex items-center gap-4">
            <button class="font-label text-xs uppercase tracking-widest text-outline hover:text-on-surface transition-colors" data-action="close-delete-confirm">Cancel</button>
            <button class="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-400 text-white font-label font-bold text-xs uppercase tracking-[0.24em] rounded-sm hover:brightness-110 transition-all" data-action="confirm-delete-entry">
              Delete Entry
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGlobalNotice(snapshot) {
  if (!snapshot.notice) return "";

  const toneClasses = {
    success: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
    error: "border-red-300/30 bg-red-400/10 text-red-100",
    info: "border-primary/30 bg-primary/10 text-on-surface"
  };

  return `
    <div class="fixed bottom-6 right-6 z-[70] max-w-md">
      <div class="glass-panel rounded-xl border px-5 py-4 shadow-[0_20px_48px_rgba(0,0,0,0.45)] ${toneClasses[snapshot.notice.tone] ?? toneClasses.info}">
        <div class="flex items-start gap-4">
          <div class="flex-1">
            <p class="font-label text-[10px] uppercase tracking-[0.25em] opacity-80 mb-1">Checkpoint Status</p>
            <p class="text-sm leading-relaxed">${escapeHtml(snapshot.notice.message)}</p>
          </div>
          <button class="text-current/70 hover:text-current transition-colors" data-action="dismiss-notice" aria-label="Dismiss status message">
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderActionMessage(messageState) {
  if (!messageState) return "";

  const toneClasses = {
    info: "border-primary/20 bg-primary/10 text-on-surface",
    success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
    error: "border-red-300/20 bg-red-400/10 text-red-100"
  };

  return `
    <div class="border rounded-lg px-4 py-3 ${toneClasses[messageState.tone] ?? toneClasses.info}">
      <p class="font-label text-[10px] uppercase tracking-[0.2em]">${escapeHtml(messageState.message)}</p>
    </div>
  `;
}

function captureFocusState(app) {
  const activeElement = document.activeElement;
  if (!activeElement || !app.contains(activeElement) || !activeElement.id) {
    return null;
  }

  return {
    id: activeElement.id,
    selectionStart: typeof activeElement.selectionStart === "number" ? activeElement.selectionStart : null,
    selectionEnd: typeof activeElement.selectionEnd === "number" ? activeElement.selectionEnd : null
  };
}

function restoreFocusState(app, focusState) {
  if (!focusState?.id) return;

  const nextActiveElement = app.querySelector(`#${focusState.id}`);
  if (!nextActiveElement) return;

  nextActiveElement.focus({ preventScroll: true });

  if (
    typeof nextActiveElement.setSelectionRange === "function"
    && typeof focusState.selectionStart === "number"
    && typeof focusState.selectionEnd === "number"
  ) {
    nextActiveElement.setSelectionRange(focusState.selectionStart, focusState.selectionEnd);
  }
}

function getFocusableElements(container) {
  if (!container) return [];

  return Array.from(container.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )).filter((element) => !element.hasAttribute("hidden"));
}

function trapTabKey(container, event) {
  const focusableElements = getFocusableElements(container);
  if (!focusableElements.length) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement;

  if (event.shiftKey && activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
}

function applyOverlayFocus(app, snapshot, previousSnapshot) {
  if (snapshot.isAddModalOpen && !previousSnapshot?.isAddModalOpen) {
    app.querySelector("#add-title")?.focus({ preventScroll: true });
    return;
  }

  if (snapshot.pendingDeleteEntryId && !previousSnapshot?.pendingDeleteEntryId) {
    app.querySelector("[data-action='close-delete-confirm']")?.focus({ preventScroll: true });
  }
}

function renderSyncHistory(snapshot) {
  if (!snapshot.syncHistory?.length) return "";

  return `
    <div class="glass-panel p-8 rounded-xl flex flex-col gap-5">
      <div>
        <h3 class="font-label uppercase tracking-[0.2em] text-xs font-bold text-primary mb-2">Recent Sync Results</h3>
        <p class="text-on-surface-variant leading-relaxed text-sm">A short local trail of the latest sync attempts.</p>
      </div>
      <div class="space-y-3">
        ${snapshot.syncHistory.map((item) => `
          <div class="rounded-lg border ${item.ok ? "border-emerald-300/15 bg-emerald-400/5" : "border-red-300/15 bg-red-400/5"} px-4 py-3">
            <div class="flex items-center justify-between gap-4 mb-2">
              <p class="font-label text-[10px] uppercase tracking-[0.2em] ${item.ok ? "text-emerald-200" : "text-red-200"}">
                ${escapeHtml(item.mode)} ${item.ok ? "sync complete" : "sync issue"}
              </p>
              <p class="font-label text-[10px] uppercase tracking-[0.2em] text-outline">${escapeHtml(formatRelative(item.timestamp))}</p>
            </div>
            <p class="text-sm leading-relaxed text-on-surface">${escapeHtml(item.message)}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderPreference(label, key, enabled) {
  return `
    <button class="flex items-center justify-between p-3 rounded bg-surface-container-low/40 hover:bg-surface-container-high transition-colors group w-full text-left" data-action="toggle-preference" data-key="${key}">
      <span class="font-label text-xs tracking-widest uppercase ${enabled ? "text-on-surface" : "text-outline"}">${escapeHtml(label)}</span>
      <div class="w-4 h-4 rounded-full border ${enabled ? "border-primary flex items-center justify-center" : "border-outline-variant"}">
        ${enabled ? '<div class="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#a8e8ff]"></div>' : ""}
      </div>
    </button>
  `;
}

function renderAddModal(snapshot, statusDefinitions, storefrontDefinitions) {
  if (!snapshot.isAddModalOpen) return "";
  const isEditing = Boolean(snapshot.editingEntryId);
  const duplicateEntry = snapshot.addFormValidation.duplicateEntry;
  const hasErrors = snapshot.addFormValidation.errors.length > 0;
  const feedbackToneClasses = {
    info: "border-primary/20 bg-primary/10 text-on-surface",
    error: "border-red-300/20 bg-red-400/10 text-red-100",
    success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
  };

  return `
    <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 bg-black/80 backdrop-blur-sm" data-modal-root="add-entry" tabindex="-1">
      <div class="glass-panel w-full max-w-3xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto rounded-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-outline-variant/10 overflow-hidden flex flex-col">
        <div class="p-8 pb-4 flex justify-between items-start shrink-0">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_#00d4ff]"></span>
              <span class="font-label uppercase tracking-[0.4em] text-[10px] text-primary">${isEditing ? "Entry Revision Protocol" : "Entry Upload Protocol"}</span>
            </div>
            <h2 class="font-headline text-3xl font-bold tracking-tight text-on-surface">Checkpoint</h2>
          </div>
          <button class="text-outline hover:text-on-surface transition-colors" data-action="close-add-modal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="px-8 py-4 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-y-auto custom-scrollbar">
          <div class="lg:col-span-7 space-y-6">
            <div class="space-y-2">
              <label class="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Archive Search</label>
              <div class="hud-line flex items-center px-2 py-3 bg-surface-container-low/40 ${hasErrors && !snapshot.addForm.title.trim() ? "border-red-300/30" : ""}">
                <span class="material-symbols-outlined text-outline mr-3">search</span>
                <input id="add-title" class="bg-transparent border-none focus:ring-0 w-full font-label text-sm tracking-wider placeholder:text-outline/40" placeholder="QUERY TITLE..." type="text" value="${escapeHtml(snapshot.addForm.title)}">
              </div>
            </div>
            <div class="space-y-3">
              <label class="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Suggested Matches</label>
              <div class="space-y-2">
                ${snapshot.suggestions.length ? snapshot.suggestions.map((item) => `
                  <button class="flex items-center p-3 bg-surface-container-high/50 hover:bg-primary/5 cursor-pointer rounded transition-all group w-full text-left" data-action="select-suggestion" data-catalog-id="${item.id}">
                    <div class="w-12 h-16 bg-zinc-800 rounded mr-4 overflow-hidden flex-shrink-0">
                      ${hasUsableAsset(item.capsuleArt)
                        ? `<img class="w-full h-full object-cover" src="${escapeHtml(item.capsuleArt)}" alt="${escapeHtml(item.title)} suggestion art">`
                        : renderFallbackArt(item.title, "Catalog match", "text-xs p-3")}
                    </div>
                    <div class="flex-grow">
                      <p class="font-headline font-bold text-sm">${escapeHtml(item.title)}</p>
                      <p class="font-label text-[10px] text-outline uppercase tracking-tight">${escapeHtml(isPendingMetadata(item.developer) ? "Metadata pending" : item.developer)}${hasUsableAsset(item.releaseDate) ? ` // ${escapeHtml(item.releaseDate.slice(0, 4))}` : ""}</p>
                    </div>
                    <span class="material-symbols-outlined text-primary ${snapshot.addForm.selectedCatalogId === item.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity">check_circle</span>
                  </button>
                `).join("") : `
                  <div class="p-4 bg-surface-container-high/50 rounded text-outline text-xs font-label uppercase tracking-widest">No local match. Commit to create a manual entry.</div>
                `}
              </div>
            </div>
          </div>
          <div class="lg:col-span-5 space-y-6">
            <div class="space-y-2">
              <label class="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Portal Source</label>
              <div class="hud-line bg-surface-container-low/40 ${hasErrors ? "border-red-300/20" : ""}">
                <select id="add-storefront" class="bg-transparent border-none focus:ring-0 w-full font-label text-sm tracking-wider text-on-surface py-3 appearance-none">
                  ${storefrontDefinitions.map((item) => `
                    <option class="bg-surface" value="${item.id}" ${snapshot.addForm.storefront === item.id ? "selected" : ""}>${escapeHtml(item.label)}</option>
                  `).join("")}
                </select>
              </div>
            </div>
            <div class="space-y-2">
              <label class="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Run Label</label>
              <div class="hud-line flex items-center px-2 py-3 bg-surface-container-low/40">
                <span class="material-symbols-outlined text-outline mr-3">bookmark</span>
                <input id="add-run-label" class="bg-transparent border-none focus:ring-0 w-full font-label text-sm tracking-wider placeholder:text-outline/40" placeholder="MAIN SAVE..." type="text" value="${escapeHtml(snapshot.addForm.runLabel || "Main Save")}">
              </div>
            </div>
            ${duplicateEntry ? `
              <div class="border border-amber-300/20 bg-amber-400/10 px-4 py-3 rounded-lg">
                <p class="font-label text-[10px] uppercase tracking-[0.2em] text-amber-100 mb-1">Duplicate Warning</p>
                <p class="text-xs leading-relaxed text-amber-50">
                  A matching run already exists for ${escapeHtml(duplicateEntry.title)} on ${escapeHtml(getStorefrontLabel(storefrontDefinitions, duplicateEntry.storefront))} with the label ${escapeHtml(duplicateEntry.runLabel || "Main Save")}. Saving will create another tracked entry.
                </p>
              </div>
            ` : ""}
            <div class="space-y-4">
              <label class="font-label text-[10px] uppercase tracking-widest text-outline ml-1">System Status</label>
              <div class="grid grid-cols-1 gap-2">
                ${statusDefinitions.map((status) => `
                  <button class="flex items-center justify-between p-3 rounded ${snapshot.addForm.status === status.id ? "bg-surface-container-high" : "bg-surface-container-low/40 hover:bg-surface-container-high"} transition-colors group" data-action="pick-form-status" data-status="${status.id}">
                    <span class="font-label text-xs tracking-widest uppercase ${snapshot.addForm.status === status.id ? "text-on-surface" : "text-outline"}">${escapeHtml(status.label)}</span>
                    <div class="w-4 h-4 rounded-full border ${snapshot.addForm.status === status.id ? "border-primary flex items-center justify-center" : "border-outline-variant"}">
                      ${snapshot.addForm.status === status.id ? '<div class="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_#a8e8ff]"></div>' : ""}
                    </div>
                  </button>
                `).join("")}
              </div>
            </div>
            <div class="space-y-2">
              <label class="font-label text-[10px] uppercase tracking-widest text-outline ml-1">Notes</label>
              <div class="hud-line bg-surface-container-low/40 px-2">
                <textarea id="add-notes" class="bg-transparent border-none focus:ring-0 w-full font-label text-sm tracking-wider text-on-surface py-3 min-h-24 resize-none" placeholder="OPTIONAL NOTES...">${escapeHtml(snapshot.addForm.notes)}</textarea>
              </div>
            </div>
            ${snapshot.addFormValidation.errors.length ? `
              <div class="border border-red-300/20 bg-red-400/10 p-4 rounded-lg">
                <div class="flex items-center gap-3 mb-2">
                  <span class="material-symbols-outlined text-red-200 text-sm" style="font-variation-settings: 'FILL' 1;">error</span>
                  <span class="font-label text-[10px] uppercase tracking-[0.2em] text-red-100">Required Fixes</span>
                </div>
                <div class="space-y-1 text-xs text-red-50">
                  ${snapshot.addFormValidation.errors.map((error) => `<p>${escapeHtml(error)}</p>`).join("")}
                </div>
              </div>
            ` : ""}
            ${snapshot.addFormFeedback ? `
              <div class="border p-4 rounded-lg ${feedbackToneClasses[snapshot.addFormFeedback.tone] ?? feedbackToneClasses.info}">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">${snapshot.addFormFeedback.tone === "error" ? "error" : "info"}</span>
                  <p class="font-label text-[10px] uppercase tracking-[0.2em]">${escapeHtml(snapshot.addFormFeedback.message)}</p>
                </div>
              </div>
            ` : ""}
            <div class="bg-black/20 p-4 border-l-2 ${hasErrors ? "border-red-300/40" : "border-primary-container"}">
              <div class="flex items-center gap-3 mb-2">
                <span class="material-symbols-outlined ${hasErrors ? "text-red-200" : "text-primary"} text-sm" style="font-variation-settings: 'FILL' 1;">${hasErrors ? "gpp_bad" : "verified"}</span>
                <span class="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface">Integrity Check: ${hasErrors ? "Blocked" : "Passed"}</span>
              </div>
              <p class="font-label text-[9px] text-outline leading-relaxed">${hasErrors ? "TITLE, STOREFRONT, AND STATUS MUST BE VALID BEFORE CHECKPOINT CAN SAVE THIS ENTRY." : "COMMITTING HERE CREATES A LOCAL ENTRY, RESOLVES PLACEHOLDER METADATA, AND MARKS IT READY FOR FUTURE SYNC."}</p>
            </div>
          </div>
        </div>
        <div class="p-8 bg-black/40 flex items-center justify-between border-t border-outline-variant/10 shrink-0">
          <div class="flex items-center gap-8">
            <div>
              <p class="font-label text-[9px] uppercase tracking-[0.2em] text-outline">Target ID</p>
              <p class="font-headline text-sm font-bold text-primary">${isEditing ? escapeHtml(snapshot.editingEntryId) : `CP-${escapeHtml((snapshot.addForm.title || "ENTRY").slice(0, 8).toUpperCase())}`}</p>
            </div>
            <div>
              <p class="font-label text-[9px] uppercase tracking-[0.2em] text-outline">Entry Type</p>
              <p class="font-headline text-sm font-bold text-on-surface">${escapeHtml(snapshot.addForm.status)}</p>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <button class="font-label text-xs uppercase tracking-widest text-outline hover:text-on-surface transition-colors" data-action="close-add-modal">Abort</button>
            <button class="px-8 py-3 bg-gradient-to-r from-primary to-primary-container text-on-primary font-label font-bold text-xs uppercase tracking-[0.24em] rounded-sm hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed" data-action="commit-entry" ${snapshot.isAddFormSubmitting ? "disabled" : ""}>
              ${snapshot.isAddFormSubmitting ? "Saving..." : isEditing ? "Save Entry" : "Commit Data"}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function createAppRenderer({ app, store, statusDefinitions, storefrontDefinitions }) {
  let previousSnapshot = null;

  function bindEvents() {
    const snapshot = store.getSnapshot();

    app.onkeydown = (event) => {
      if (event.key === "Escape") {
        if (snapshot.isAddModalOpen) {
          event.preventDefault();
          store.closeAddModal();
          return;
        }

        if (snapshot.pendingDeleteEntryId) {
          event.preventDefault();
          store.closeDeleteConfirm();
          return;
        }

        if (snapshot.notice) {
          event.preventDefault();
          store.dismissNotice();
        }
      }

      if (event.key === "Tab") {
        if (snapshot.isAddModalOpen) {
          trapTabKey(app.querySelector("[data-modal-root='add-entry']"), event);
          return;
        }

        if (snapshot.pendingDeleteEntryId) {
          trapTabKey(app.querySelector("[data-modal-root='delete-confirm']"), event);
        }
      }
    };

    app.querySelectorAll("[data-action='set-view']").forEach((element) => {
      element.addEventListener("click", () => {
        store.setView(element.dataset.view);
      });
    });

    app.querySelectorAll("[data-action='filter-status']").forEach((element) => {
      element.addEventListener("click", () => {
        store.setActiveStatus(element.dataset.status);
      });
    });

    app.querySelectorAll("[data-action='clear-library-view']").forEach((element) => {
      element.addEventListener("click", () => {
        store.clearLibraryView();
      });
    });

    app.querySelectorAll("[data-action='select-entry']").forEach((element) => {
      element.addEventListener("click", () => {
        store.openEntryDetails(element.dataset.entryId);
      });
    });

    app.querySelectorAll("[data-action='open-add-modal']").forEach((element) => {
      element.addEventListener("click", () => {
        store.openAddModal();
      });
    });

    app.querySelectorAll("[data-action='open-edit-modal']").forEach((element) => {
      element.addEventListener("click", () => {
        store.openEditModal(element.dataset.entryId);
      });
    });

    app.querySelectorAll("[data-action='open-delete-confirm']").forEach((element) => {
      element.addEventListener("click", () => {
        store.openDeleteConfirm(element.dataset.entryId);
      });
    });

    app.querySelectorAll("[data-action='close-add-modal']").forEach((element) => {
      element.addEventListener("click", () => {
        store.closeAddModal();
      });
    });

    app.querySelectorAll("[data-action='close-delete-confirm']").forEach((element) => {
      element.addEventListener("click", () => {
        store.closeDeleteConfirm();
      });
    });

    app.querySelectorAll("[data-action='dismiss-notice']").forEach((element) => {
      element.addEventListener("click", () => {
        store.dismissNotice();
      });
    });

    app.querySelectorAll("[data-action='pick-form-status']").forEach((element) => {
      element.addEventListener("click", () => {
        store.updateAddForm({ status: element.dataset.status });
      });
    });

    app.querySelectorAll("[data-action='select-suggestion']").forEach((element) => {
      element.addEventListener("click", async () => {
        await store.selectCatalogSuggestion(element.dataset.catalogId);
      });
    });

    app.querySelectorAll("[data-action='toggle-preference']").forEach((element) => {
      element.addEventListener("click", () => {
        store.togglePreference(element.dataset.key);
      });
    });

    app.querySelectorAll("[data-action='mark-all-synced']").forEach((element) => {
      element.addEventListener("click", async () => {
        await store.markAllSynced();
      });
    });

    app.querySelectorAll("[data-action='connect-google-drive']").forEach((element) => {
      element.addEventListener("click", async () => {
        await store.connectGoogleDrive();
      });
    });

    app.querySelectorAll("[data-action='disconnect-google-drive']").forEach((element) => {
      element.addEventListener("click", () => {
        store.disconnectGoogleDrive();
      });
    });

    app.querySelectorAll("[data-action='restore-google-drive']").forEach((element) => {
      element.addEventListener("click", async () => {
        await store.restoreFromGoogleDrive();
      });
    });

    app.querySelectorAll("[data-action='restore-local-snapshot']").forEach((element) => {
      element.addEventListener("click", () => {
        store.restoreLocalSafetySnapshot();
      });
    });

    app.querySelectorAll("[data-action='refresh-library-artwork']").forEach((element) => {
      element.addEventListener("click", async () => {
        await store.refreshLibraryArtwork();
      });
    });

    app.querySelectorAll("[data-action='refresh-library-metadata']").forEach((element) => {
      element.addEventListener("click", async () => {
        await store.refreshLibraryMetadata();
      });
    });

    app.querySelectorAll("[data-action='refresh-entry-artwork']").forEach((element) => {
      element.addEventListener("click", async () => {
        await store.refreshArtworkForEntry(element.dataset.entryId);
      });
    });

    app.querySelectorAll("[data-action='refresh-entry-metadata']").forEach((element) => {
      element.addEventListener("click", async () => {
        await store.refreshMetadataForEntry(element.dataset.entryId);
      });
    });

    app.querySelectorAll("[data-action='export-json']").forEach((element) => {
      element.addEventListener("click", () => {
        const backup = store.exportLibraryBackup();
        if (!backup) return;

        const blob = new Blob([backup.content], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = backup.filename;
        document.body.append(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      });
    });

    app.querySelectorAll("[data-action='trigger-import-json']").forEach((element) => {
      element.addEventListener("click", () => {
        app.querySelector("#import-json-input")?.click();
      });
    });

    app.querySelectorAll("[data-action='set-import-mode']").forEach((element) => {
      element.addEventListener("click", () => {
        store.setImportMode(element.dataset.importMode);
      });
    });

    app.querySelectorAll("[data-action='commit-entry']").forEach((element) => {
      element.addEventListener("click", async () => {
        await store.commitEntry();
      });
    });

    app.querySelectorAll("[data-action='confirm-delete-entry']").forEach((element) => {
      element.addEventListener("click", () => {
        store.confirmDeleteEntry();
      });
    });

    app.querySelectorAll("[data-action='save-detail-notes']").forEach((element) => {
      element.addEventListener("click", () => {
        store.saveDetailNotes();
      });
    });

    app.querySelectorAll("[data-action='save-detail-progress']").forEach((element) => {
      element.addEventListener("click", () => {
        store.saveDetailProgress();
      });
    });

    app.querySelectorAll("[data-action='update-entry-status']").forEach((element) => {
      element.addEventListener("click", () => {
        store.updateEntryStatus(element.dataset.entryId, element.dataset.status);
      });
    });

    const searchInput = app.querySelector("#global-search");
    if (searchInput) {
      searchInput.addEventListener("input", (event) => {
        store.setSearchTerm(event.target.value);
      });
    }

    const sortSelect = app.querySelector("#library-sort");
    if (sortSelect) {
      sortSelect.addEventListener("change", (event) => {
        store.setSortMode(event.target.value);
      });
    }

    const addTitle = app.querySelector("#add-title");
    if (addTitle) {
      addTitle.addEventListener("input", (event) => {
        store.updateAddForm({
          title: event.target.value,
          selectedCatalogId: null
        });
      });
    }

    const addStorefront = app.querySelector("#add-storefront");
    if (addStorefront) {
      addStorefront.addEventListener("change", (event) => {
        store.updateAddForm({ storefront: event.target.value });
      });
    }

    const addRunLabel = app.querySelector("#add-run-label");
    if (addRunLabel) {
      addRunLabel.addEventListener("input", (event) => {
        store.updateAddForm({ runLabel: event.target.value });
      });
    }

    const addNotes = app.querySelector("#add-notes");
    if (addNotes) {
      addNotes.addEventListener("input", (event) => {
        store.updateAddForm({ notes: event.target.value });
      });
    }

    const detailNotes = app.querySelector("#detail-notes");
    if (detailNotes) {
      detailNotes.addEventListener("input", (event) => {
        store.updateDetailForm({ notes: event.target.value });
      });
    }

    const detailPlaytime = app.querySelector("#detail-playtime");
    if (detailPlaytime) {
      detailPlaytime.addEventListener("input", (event) => {
        store.updateDetailForm({ playtimeHours: event.target.value });
      });
    }

    const detailCompletion = app.querySelector("#detail-completion");
    if (detailCompletion) {
      detailCompletion.addEventListener("input", (event) => {
        store.updateDetailForm({ completionPercent: event.target.value });
      });
    }

    const detailStatus = app.querySelector("#detail-status");
    if (detailStatus) {
      detailStatus.addEventListener("change", (event) => {
        store.updateDetailForm({ status: event.target.value });
      });
    }

    const importInput = app.querySelector("#import-json-input");
    if (importInput) {
      importInput.addEventListener("change", async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const content = await file.text();
        store.importLibraryBackup(content, file.name);
        event.target.value = "";
      });
    }
  }

  function renderView(snapshot) {
    if (snapshot.currentView === "details") {
      return renderDetailsView(snapshot, storefrontDefinitions, statusDefinitions);
    }
    if (snapshot.currentView === "settings") {
      return renderSettingsView(snapshot);
    }
    return renderDashboardView(snapshot, storefrontDefinitions, statusDefinitions);
  }

  function render() {
    const snapshot = store.getSnapshot();
    const focusState = captureFocusState(app);
    app.innerHTML = `
      ${renderSidebar(snapshot)}
      <main class="h-screen flex flex-col overflow-hidden bg-background">
        ${renderTopbar(snapshot)}
        ${renderView(snapshot)}
      </main>
      ${renderGlobalNotice(snapshot)}
      ${renderAddModal(snapshot, statusDefinitions, storefrontDefinitions)}
      ${renderDeleteConfirmModal(snapshot, storefrontDefinitions, statusDefinitions)}
    `;
    bindEvents();
    if (snapshot.isAddModalOpen || snapshot.pendingDeleteEntryId) {
      applyOverlayFocus(app, snapshot, previousSnapshot);
    } else {
      restoreFocusState(app, focusState);
    }
    previousSnapshot = snapshot;
  }

  return { render };
}
