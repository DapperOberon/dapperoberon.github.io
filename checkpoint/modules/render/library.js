import {
  escapeHtml,
  formatCurrency,
  getGameForEntry,
  getReleaseState,
  getReleaseStateLabel,
  getStatusMeta,
  getStorefrontLabel,
  hasUsableAsset,
  isUnreleasedGame,
  renderFallbackArt,
  renderPrimaryAction,
  renderSecondaryAction
} from "./shared.js";
import { renderDecisionDetailPage } from "./decision.js";

function findWishlistEntryForDiscoverSelection(snapshot, selectedResult) {
  if (!selectedResult) return null;
  const selectedIgdbId = Number(selectedResult?.igdbId);
  const normalizedSelectedTitle = String(selectedResult?.title || "").trim().toLowerCase();
  const normalizedSelectedStorefront = String(selectedResult?.storefront || snapshot.addForm?.storefront || "").trim().toLowerCase();

  return snapshot.library.find((entry) => {
    if (entry?.status !== "wishlist") return false;
    const game = getGameForEntry(snapshot, entry);
    if (Number.isFinite(selectedIgdbId) && Number(game?.igdbId) === selectedIgdbId) {
      return true;
    }
    const entryTitle = String(entry?.title || "").trim().toLowerCase();
    const entryStorefront = String(entry?.storefront || "").trim().toLowerCase();
    return Boolean(normalizedSelectedTitle)
      && entryTitle === normalizedSelectedTitle
      && (!normalizedSelectedStorefront || entryStorefront === normalizedSelectedStorefront);
  }) ?? null;
}

function renderCard(entry, game, storefrontDefinitions, statusDefinitions, cardClass = "") {
  const statusMeta = getStatusMeta(statusDefinitions, entry.status);
  const cardArt = game?.capsuleArt ?? game?.heroArt ?? "";
  const pricing = game?.pricing ?? {};
  const pricingStatus = String(pricing.status || "unsupported");
  const hasCurrentPrice = Number.isFinite(Number(pricing?.currentBest?.amount));
  const releaseState = getReleaseState(game?.releaseDate);
  const unreleasedWithoutPrice = !hasCurrentPrice && releaseState !== "released";
  const noPriceFallbackLabel = unreleasedWithoutPrice
    ? getReleaseStateLabel(releaseState)
    : ((pricingStatus === "unsupported" || pricingStatus === "no_match") ? "Coming soon" : "N/A");
  const pricingLabel = unreleasedWithoutPrice
    ? getReleaseStateLabel(releaseState)
    : (pricingStatus === "ok"
    ? formatCurrency(pricing?.currentBest?.amount, pricing?.currentBest?.currency || entry?.priceWatch?.currency || "USD")
    : noPriceFallbackLabel);
  const pricingStore = unreleasedWithoutPrice
    ? ""
    : String(pricing?.currentBest?.storeName || "");
  const secondaryMeta = entry.status === "wishlist"
    ? `
      <div class="mt-1 flex items-center justify-between gap-3 text-xs text-zinc-400 leading-4">
        <span class="truncate">${escapeHtml(pricingLabel)}</span>
        <span class="truncate text-right">${escapeHtml(pricingStore)}</span>
      </div>
    `
    : entry.status === "backlog"
      ? `
        <div class="mt-1 flex items-center justify-between gap-3 text-xs text-zinc-400 leading-4">
          <span class="truncate">${escapeHtml(getStorefrontLabel(storefrontDefinitions, entry.storefront))}</span>
          <span class="truncate text-right">${escapeHtml(game?.releaseDate ? String(game.releaseDate).slice(0, 4) : "Backlog")}</span>
        </div>
      `
      : `
        <div class="mt-1 flex items-center justify-between gap-3 text-xs text-zinc-400 leading-4">
          <span class="truncate">${escapeHtml(entry.runLabel || "Main Save")}</span>
          <span class="truncate text-right">${entry.playtimeHours}h · ${entry.completionPercent}%</span>
        </div>
      `;

  return `
    <button class="group text-left min-h-[16rem] w-full self-start flex flex-col ${cardClass}" data-action="select-entry" data-entry-id="${entry.entryId}">
      <div class="relative aspect-[3/4] w-full bg-zinc-900 overflow-hidden rounded-md cover-shadow transition-transform duration-300 group-hover:-translate-y-1">
        ${hasUsableAsset(cardArt)
          ? `<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" src="${escapeHtml(cardArt)}" alt="${escapeHtml(entry.title)} cover art">`
          : renderFallbackArt(entry.title, getStorefrontLabel(storefrontDefinitions, entry.storefront), "text-xs p-3 rounded-md")}
        <div class="absolute top-3 left-3">
          <span class="bg-black/60 text-zinc-100 px-2 py-1 rounded-md text-[11px] font-label tracking-[0.08em] backdrop-blur-md">${escapeHtml(statusMeta.label)}</span>
        </div>
      </div>
      <div class="pt-3 px-1 h-20 flex flex-col">
        <div style="height: 3rem; min-height: 3rem; max-height: 3rem; overflow: hidden;">
          <p class="font-headline font-bold text-sm text-on-surface leading-6 overflow-hidden break-words checkpoint-title-clamp">${escapeHtml(entry.title)}</p>
        </div>
        <div class="mt-auto">
          ${secondaryMeta}
        </div>
      </div>
    </button>
  `;
}

function renderMetricPanel(snapshot) {
  return `
    <div class="checkpoint-subpanel rounded-xl p-6 flex flex-col justify-between gap-6">
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
    completion_desc: "Completion",
    wishlist_priority_desc: "Priority",
    price_asc: "Price",
    discount_desc: "Discount",
    closest_to_target: "Closest to Target",
    next_to_buy: "Next to Buy"
  }[sortMode] ?? "Recent";
}

function getWishlistPriceStatusLabel(value) {
  return {
    "on-sale": "On Sale",
    "full-price": "Full Price",
    "coming-soon": "Coming Soon",
    "no-data": "No Data"
  }[value] ?? "All price states";
}

function renderLibraryStateBar(snapshot, statusDefinitions) {
  if (snapshot.currentView === "wishlist") {
    const totalEntries = snapshot.dashboardMetrics.wishlistCount;
    const visibleEntries = snapshot.visibleLibrary.length;
    const hasSearch = Boolean(snapshot.searchTerm.trim());
    const prioritySummary = snapshot.uiPreferences.wishlistPriorityFilter !== "all"
      ? getWishlistPriorityLabel(snapshot.uiPreferences.wishlistPriorityFilter)
      : "All priorities";
    const intentSummary = snapshot.uiPreferences.wishlistIntentFilter !== "all"
      ? getWishlistIntentLabel(snapshot.uiPreferences.wishlistIntentFilter)
      : "All intents";
    const priceSummary = snapshot.uiPreferences.wishlistPriceStatusFilter !== "all"
      ? getWishlistPriceStatusLabel(snapshot.uiPreferences.wishlistPriceStatusFilter)
      : "All price states";
    const stateSummary = hasSearch
      ? `Showing ${visibleEntries} of ${totalEntries} wishlist matches for "${snapshot.searchTerm.trim()}"`
      : `${visibleEntries} visible · ${prioritySummary} · ${intentSummary} · ${priceSummary}`;

    return `
      <section class="checkpoint-toolbar rounded-xl px-5 py-4">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div class="max-w-2xl space-y-1.5">
            <p class="font-label text-[11px] tracking-[0.08em] text-primary">Planning View</p>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-on-surface-variant leading-relaxed">
              <span>${escapeHtml(stateSummary)}</span>
              <span class="text-zinc-500">${totalEntries} total</span>
            </div>
          </div>
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 xl:min-w-[760px]">
            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-label tracking-[0.08em] text-zinc-500">Priority</span>
              <select id="wishlist-priority-filter" class="checkpoint-control-select text-sm font-body px-3 py-2 rounded-md transition-all text-zinc-200 w-full">
                <option value="all" ${snapshot.uiPreferences.wishlistPriorityFilter === "all" ? "selected" : ""}>All Priorities</option>
                <option value="must-buy" ${snapshot.uiPreferences.wishlistPriorityFilter === "must-buy" ? "selected" : ""}>Must Buy</option>
                <option value="high" ${snapshot.uiPreferences.wishlistPriorityFilter === "high" ? "selected" : ""}>High Priority</option>
                <option value="medium" ${snapshot.uiPreferences.wishlistPriorityFilter === "medium" ? "selected" : ""}>Medium Priority</option>
                <option value="low" ${snapshot.uiPreferences.wishlistPriorityFilter === "low" ? "selected" : ""}>Low Priority</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-label tracking-[0.08em] text-zinc-500">Intent</span>
              <select id="wishlist-intent-filter" class="checkpoint-control-select text-sm font-body px-3 py-2 rounded-md transition-all text-zinc-200 w-full">
                <option value="all" ${snapshot.uiPreferences.wishlistIntentFilter === "all" ? "selected" : ""}>All Intents</option>
                <option value="buy-now" ${snapshot.uiPreferences.wishlistIntentFilter === "buy-now" ? "selected" : ""}>Buy Now</option>
                <option value="wait-sale" ${snapshot.uiPreferences.wishlistIntentFilter === "wait-sale" ? "selected" : ""}>Wait for Sale</option>
                <option value="monitor-release" ${snapshot.uiPreferences.wishlistIntentFilter === "monitor-release" ? "selected" : ""}>Monitor Release</option>
                <option value="research" ${snapshot.uiPreferences.wishlistIntentFilter === "research" ? "selected" : ""}>Research</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-label tracking-[0.08em] text-zinc-500">Price</span>
              <select id="wishlist-price-status-filter" class="checkpoint-control-select text-sm font-body px-3 py-2 rounded-md transition-all text-zinc-200 w-full">
                <option value="all" ${snapshot.uiPreferences.wishlistPriceStatusFilter === "all" ? "selected" : ""}>All Prices</option>
                <option value="on-sale" ${snapshot.uiPreferences.wishlistPriceStatusFilter === "on-sale" ? "selected" : ""}>On Sale</option>
                <option value="full-price" ${snapshot.uiPreferences.wishlistPriceStatusFilter === "full-price" ? "selected" : ""}>Full Price</option>
                <option value="coming-soon" ${snapshot.uiPreferences.wishlistPriceStatusFilter === "coming-soon" ? "selected" : ""}>Coming Soon</option>
                <option value="no-data" ${snapshot.uiPreferences.wishlistPriceStatusFilter === "no-data" ? "selected" : ""}>No Data</option>
              </select>
            </label>
            <label class="flex flex-col gap-1.5">
              <span class="text-[11px] font-label tracking-[0.08em] text-zinc-500">Sort</span>
              <select id="library-sort-state" class="checkpoint-control-select text-sm font-body px-3 py-2 rounded-md transition-all text-zinc-200 w-full">
                <option value="next_to_buy" ${snapshot.sortMode === "next_to_buy" ? "selected" : ""}>Next to Buy</option>
                <option value="wishlist_priority_desc" ${snapshot.sortMode === "wishlist_priority_desc" ? "selected" : ""}>Priority</option>
                <option value="updated_desc" ${snapshot.sortMode === "updated_desc" ? "selected" : ""}>Recent</option>
                <option value="price_asc" ${snapshot.sortMode === "price_asc" ? "selected" : ""}>Lowest Price</option>
                <option value="discount_desc" ${snapshot.sortMode === "discount_desc" ? "selected" : ""}>Biggest Discount</option>
                <option value="closest_to_target" ${snapshot.sortMode === "closest_to_target" ? "selected" : ""}>Closest to Target</option>
              </select>
            </label>
          </div>
        </div>
      </section>
    `;
  }

  const showFilterControl = snapshot.currentView === "dashboard";
  const availableStatuses = snapshot.currentView === "dashboard"
    ? statusDefinitions.filter((status) => status.id !== "wishlist")
    : statusDefinitions;
  const hasSearch = Boolean(snapshot.searchTerm.trim());
  const hasScopedView = snapshot.activeStatus !== "all" || hasSearch;
  const showResetView = hasScopedView && snapshot.currentView !== "wishlist";
  const totalEntries = snapshot.dashboardMetrics.totalEntries;
  const visibleEntries = snapshot.visibleLibrary.length;
  const stateSummary = hasSearch
    ? `Showing ${visibleEntries} of ${totalEntries} results for "${snapshot.searchTerm.trim()}"`
    : hasScopedView
      ? `Showing ${visibleEntries} ${getStatusLabel(snapshot.activeStatus).toLowerCase()} entries`
      : `Showing all ${totalEntries} tracked entries`;

  return `
    <section class="checkpoint-toolbar rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div class="flex flex-col gap-1">
        <p class="font-headline text-base font-bold text-on-surface">${escapeHtml(getStatusLabel(snapshot.activeStatus))}</p>
        <p class="text-sm text-on-surface-variant leading-relaxed">${escapeHtml(stateSummary)}</p>
      </div>
      <div class="flex items-center gap-3 self-start md:self-auto">
        ${showFilterControl
          ? `
            <label class="flex items-center gap-2">
              <span class="text-xs text-zinc-500">Filter</span>
              <select id="library-status-filter" class="checkpoint-control-select text-sm font-body px-3 py-2 rounded-md transition-all text-zinc-200">
                <option value="all" ${snapshot.activeStatus === "all" ? "selected" : ""}>All Games</option>
                ${availableStatuses.map((status) => `<option value="${status.id}" ${snapshot.activeStatus === status.id ? "selected" : ""}>${escapeHtml(status.label)}</option>`).join("")}
              </select>
            </label>
          `
          : ""}
        <label class="flex items-center gap-2">
          <span class="text-xs text-zinc-500">Sort</span>
          <select id="library-sort-state" class="checkpoint-control-select text-sm font-body px-3 py-2 rounded-md transition-all text-zinc-200">
            <option value="updated_desc" ${snapshot.sortMode === "updated_desc" ? "selected" : ""}>Recent</option>
            <option value="title_asc" ${snapshot.sortMode === "title_asc" ? "selected" : ""}>Title</option>
            <option value="playtime_desc" ${snapshot.sortMode === "playtime_desc" ? "selected" : ""}>Playtime</option>
            <option value="completion_desc" ${snapshot.sortMode === "completion_desc" ? "selected" : ""}>Completion</option>
          </select>
        </label>
        ${showResetView
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
      <div class="checkpoint-toolbar rounded-xl p-8">
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

function renderDiscoverSearchPanel(snapshot) {
  return `
    <section class="checkpoint-toolbar rounded-xl p-8">
      <div class="flex flex-col gap-3 mb-5">
        <p class="font-label text-[11px] tracking-[0.08em] text-primary">Discover</p>
        <h1 class="text-4xl lg:text-5xl font-headline font-extrabold tracking-tight text-on-surface">Find games before you track them.</h1>
        <p class="max-w-3xl text-on-surface-variant leading-relaxed">Search IGDB, inspect game metadata, then choose whether to add to wishlist or start tracking in your library.</p>
      </div>
      <div class="space-y-3">
        <div class="flex gap-3">
          <label class="checkpoint-search-shell flex-1 flex items-center rounded-md px-3">
            <span class="material-symbols-outlined text-zinc-500 mr-2 text-base">search</span>
            <input id="discover-search-query" class="checkpoint-search-input add-search-input border-none focus:ring-0 w-full font-body text-sm text-on-surface py-2.5 placeholder:text-zinc-500 rounded-md" placeholder="Search game title..." type="text" value="${escapeHtml(snapshot.addForm.searchQuery)}">
          </label>
          <button class="checkpoint-button checkpoint-button-primary px-5 py-3 font-label font-bold text-xs tracking-[0.08em] rounded-md disabled:opacity-60 disabled:cursor-not-allowed" data-action="search-discover" ${snapshot.addSearchLoading || !snapshot.addForm.searchQuery.trim() ? "disabled" : ""}>${snapshot.addSearchLoading ? "Searching..." : "Search"}</button>
          <button class="checkpoint-button checkpoint-button-secondary px-5 py-3 font-label font-bold text-xs tracking-[0.08em] rounded-md" data-action="load-discover-top-played">Top Played</button>
        </div>
        <p class="text-xs text-zinc-500">${snapshot.addForm.searchQuery.trim() ? "Search auto-runs after a short pause." : "No search yet, showing IGDB trending games right now."}</p>
      </div>
    </section>
  `;
}

function renderDiscoverResultsPanel(snapshot) {
  if (snapshot.addSearchLoading) {
    return `<div class="text-sm text-zinc-300">Searching IGDB and loading media…</div>`;
  }

  if (snapshot.addSearchError) {
    return `<div class="text-sm text-amber-100 border border-amber-300/20 bg-amber-400/10 rounded-md px-4 py-3">${escapeHtml(snapshot.addSearchError)}</div>`;
  }

  if (!snapshot.addSearchResults.length) {
    return `<div class="text-sm text-zinc-500">No discover results yet.</div>`;
  }

  return `
    <div class="grid items-start grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
      ${snapshot.addSearchResults.map((result) => `
        <button class="group text-left min-h-[16rem] w-full self-start flex flex-col" data-action="select-discover-result" data-search-result-id="${escapeHtml(result.id)}">
          <div class="aspect-[3/4] w-full bg-zinc-900 overflow-hidden rounded-md cover-shadow">
            ${hasUsableAsset(result.coverArt || result.steamGridCover)
              ? `<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" src="${escapeHtml(result.coverArt || result.steamGridCover)}" alt="${escapeHtml(result.title)} cover">`
              : renderFallbackArt(result.title, "IGDB result", "text-xs p-3 rounded-md")}
          </div>
          <div class="pt-3 px-1 h-20 flex flex-col justify-start">
            <p class="font-headline font-bold text-sm text-on-surface leading-6 h-12 overflow-hidden break-words checkpoint-title-clamp">${escapeHtml(result.title)}</p>
            <p class="text-xs text-zinc-400 leading-4 mt-auto">${escapeHtml(result.releaseDate ? result.releaseDate.slice(0, 4) : "Year unknown")}</p>
          </div>
        </button>
      `).join("")}
    </div>
  `;
}

function renderDiscoverSelectionPage(snapshot) {
  const selectedResult = snapshot.addForm.selectedSearchResult;
  if (!selectedResult) return "";
  const existingWishlistEntry = findWishlistEntryForDiscoverSelection(snapshot, selectedResult);
  const details = snapshot.discoverEntryDetails ?? selectedResult;
  const pricing = snapshot.discoverEntryPricing ?? null;
  const related = Array.isArray(snapshot.discoverEntryRelated) ? snapshot.discoverEntryRelated : [];
  const links = snapshot.discoverEntryLinks && typeof snapshot.discoverEntryLinks === "object"
    ? snapshot.discoverEntryLinks
    : (details.links && typeof details.links === "object"
      ? details.links
      : { igdb: "", official: "", storefronts: [] });
  const selectedHeroArt = details.heroArt || selectedResult.heroArt || selectedResult.steamGridHero || "";
  const selectedCover = details.coverArt || selectedResult.coverArt || selectedResult.steamGridCover || selectedHeroArt || "";
  return renderDecisionDetailPage({
    idPrefix: "discover",
    title: details.title || "Unknown title",
    releaseDate: details.releaseDate || "",
    genres: Array.isArray(details.genres) ? details.genres : [],
    criticSummary: details.criticSummary || "",
    description: details.description || selectedResult.description || "",
    platforms: Array.isArray(details.platforms) ? details.platforms : [],
    developer: details.developer || "",
    publisher: details.publisher || "",
    coverArt: selectedCover || "",
    heroArt: selectedHeroArt || "",
    screenshots: Array.isArray(details.screenshots) ? details.screenshots.filter(hasUsableAsset).slice(0, 8) : [],
    videos: Array.isArray(details.videos) ? details.videos : [],
    related,
    links,
    pricing,
    loading: snapshot.discoverEntryLoading,
    error: snapshot.discoverEntryError,
    pricingLoading: snapshot.discoverEntryPricingLoading,
    pricingError: snapshot.discoverEntryPricingError,
    heroActionsHtml: `
      ${existingWishlistEntry
        ? `<button class="checkpoint-button checkpoint-button-secondary discover-hero-cta px-5 py-3 text-xs tracking-[0.08em] opacity-70 cursor-default" type="button" disabled aria-disabled="true">Already on Wishlist</button>`
        : `<button class="checkpoint-button checkpoint-button-primary discover-hero-cta px-5 py-3 text-xs tracking-[0.08em]" data-action="discover-add-wishlist">Add to Wishlist</button>`}
      <button class="checkpoint-button checkpoint-button-secondary discover-hero-cta px-5 py-3 text-xs tracking-[0.08em]" data-action="discover-add-library">Add to Library</button>
      ${existingWishlistEntry
        ? `<button class="checkpoint-button checkpoint-button-secondary discover-hero-cta px-5 py-3 text-xs tracking-[0.08em]" data-action="select-entry" data-entry-id="${existingWishlistEntry.entryId}">Open Wishlist Entry</button>`
        : ""}
      <button class="checkpoint-button checkpoint-button-secondary discover-hero-cta px-5 py-3 text-xs tracking-[0.08em]" data-action="clear-discover-selection">Back to Discover Results</button>
    `,
    sideRailTitle: "Game Details",
    sourceLabel: "IGDB"
  });
}

export function renderSidebar(snapshot) {
  const items = [
    { id: "dashboard", label: "Library" },
    { id: "discover", label: "Discover" },
    { id: "wishlist", label: "Wishlist" },
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
                ? (
                  snapshot.currentView === "dashboard"
                  || (
                    snapshot.currentView === "details"
                    && (snapshot.uiPreferences?.lastView === "dashboard" || !snapshot.uiPreferences?.lastView)
                  )
                )
                : item.id === "discover"
                  ? (
                    snapshot.currentView === "discover"
                    || (
                      snapshot.currentView === "details"
                      && snapshot.uiPreferences?.lastView === "discover"
                    )
                  )
                  : item.id === "wishlist"
                    ? (
                      snapshot.currentView === "wishlist"
                      || (
                        snapshot.currentView === "details"
                        && snapshot.uiPreferences?.lastView === "wishlist"
                      )
                    )
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
  const isDiscoverView = snapshot.currentView === "discover";
  const isWishlistView = snapshot.currentView === "wishlist";
  const showStateBar = !isDiscoverView;
  const playing = snapshot.visibleLibrary.filter((entry) => entry.status === "playing");
  const finished = snapshot.visibleLibrary.filter((entry) => entry.status === "finished");
  const backlog = snapshot.visibleLibrary.filter((entry) => entry.status === "backlog");
  const wishlist = snapshot.visibleLibrary.filter((entry) => entry.status === "wishlist");
  const hasSearch = Boolean(snapshot.searchTerm.trim());
  const hasScopedView = !isDiscoverView && (snapshot.activeStatus !== "all" || hasSearch);

  if (!snapshot.visibleLibrary.length && !isDiscoverView) {
    return `
      <div data-surface="library" class="pt-[8.75rem] md:pt-24 pb-12">
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
    const title = isWishlistView
      ? (hasSearch ? "Wishlist Search" : "Wishlist")
      : (isDiscoverView ? (hasSearch ? "Discover Search" : "Discover") : (hasSearch ? "Search Results" : getStatusLabel(snapshot.activeStatus)));
    const subtitle = isWishlistView
      ? "Price-watch and release planning view"
      : (isDiscoverView
        ? "Browse and stage titles to add to your tracked library"
        : (hasSearch ? `Filtered through ${getStatusLabel(snapshot.activeStatus).toLowerCase()}` : "Focused library view"));

    return `
      <div data-surface="library" class="pt-[8.75rem] md:pt-24 pb-12">
        <div class="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-8">
          ${showStateBar ? `<section data-surface-region="library-state-row">${renderLibraryStateBar(snapshot, statusDefinitions)}</section>` : ""}
          <section data-surface-region="library-content">
            ${renderLibraryFocusSection(snapshot, storefrontDefinitions, statusDefinitions, title, subtitle)}
          </section>
        </div>
      </div>
    `;
  }

  return `
    <div data-surface="library" class="pt-[8.75rem] md:pt-24 pb-12">
      <div class="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-10">
        ${showStateBar ? `<section data-surface-region="library-state-row">${renderLibraryStateBar(snapshot, statusDefinitions)}</section>` : ""}
        <section data-surface-region="library-content" class="space-y-10">
          ${isWishlistView
            ? `
              ${renderLibraryFocusSection(snapshot, storefrontDefinitions, statusDefinitions, "Wishlist", "Price-watch and release planning view")}
            `
            : isDiscoverView
              ? `
                ${snapshot.addForm.selectedSearchResult
                  ? renderDiscoverSelectionPage(snapshot)
                  : `${renderDiscoverSearchPanel(snapshot)}${renderDiscoverResultsPanel(snapshot)}`}
              `
              : `
                ${renderDashboardHero(snapshot)}
                ${renderDashboardShelf({ title: "Currently Playing", eyebrow: "Now Playing", filterStatus: "playing", entries: playing, emptyMessage: "No active playing entries in the current view.", snapshot, storefrontDefinitions, statusDefinitions })}
                ${renderDashboardShelf({ title: "Finished Runs", eyebrow: "Finished", filterStatus: "finished", entries: finished, emptyMessage: "No finished entries in the current filter.", snapshot, storefrontDefinitions, statusDefinitions })}
                ${renderDashboardShelf({ title: "Backlog", eyebrow: "Backlog", filterStatus: "backlog", entries: backlog, emptyMessage: "No backlog entries in the current filter.", snapshot, storefrontDefinitions, statusDefinitions })}
              `}
        </section>
      </div>
    </div>
  `;
}
