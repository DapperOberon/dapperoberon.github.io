import {
  escapeHtml,
  formatCurrency,
  getGameForEntry,
  getStatusMeta,
  getStorefrontLabel,
  hasUsableAsset,
  isUnreleasedGame,
  renderFallbackArt,
  renderPrimaryAction,
  renderSecondaryAction
} from "./shared.js";

function renderInlineSpinner(label = "Loading") {
  return `
    <span class="inline-flex items-center gap-2 text-sm text-zinc-400">
      <span class="checkpoint-spinner" aria-hidden="true"></span>
      <span>${escapeHtml(label)}</span>
    </span>
  `;
}

function getYouTubeVideoId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      return parsed.pathname.replace("/", "").trim();
    }

    if (host.includes("youtube.com")) {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v")?.trim() || "";
      }

      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/embed/")[1]?.split("/")[0]?.trim() || "";
      }

      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/shorts/")[1]?.split("/")[0]?.trim() || "";
      }
    }
  } catch {
    return "";
  }

  return "";
}

function getVideoThumbnailUrl(video) {
  const explicit = String(video?.thumbnail || video?.previewImage || video?.coverArt || "").trim();
  if (hasUsableAsset(explicit)) return explicit;

  const embedId = getYouTubeVideoId(video?.embedUrl);
  const watchId = getYouTubeVideoId(video?.url);
  const videoId = embedId || watchId;
  if (!videoId) return "";

  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function renderSkeletonBlock(heightClass = "h-4", widthClass = "w-full") {
  return `<span class="checkpoint-skeleton ${heightClass} ${widthClass} rounded-md block"></span>`;
}

function renderCard(entry, game, storefrontDefinitions, statusDefinitions, cardClass = "") {
  const statusMeta = getStatusMeta(statusDefinitions, entry.status);
  const cardArt = game?.capsuleArt ?? game?.heroArt ?? "";
  const pricing = game?.pricing ?? {};
  const pricingStatus = String(pricing.status || "unsupported");
  const hasCurrentPrice = Number.isFinite(Number(pricing?.currentBest?.amount));
  const unreleasedWithoutPrice = !hasCurrentPrice && isUnreleasedGame(game?.releaseDate);
  const noPriceFallbackLabel = unreleasedWithoutPrice
    ? "TBD"
    : ((pricingStatus === "unsupported" || pricingStatus === "no_match") ? "Coming soon" : "N/A");
  const pricingLabel = unreleasedWithoutPrice
    ? "TBD"
    : (pricingStatus === "ok"
    ? formatCurrency(pricing?.currentBest?.amount, pricing?.currentBest?.currency || entry?.priceWatch?.currency || "USD")
    : noPriceFallbackLabel);
  const pricingStore = unreleasedWithoutPrice
    ? "Release pending"
    : String(pricing?.currentBest?.storeName || (noPriceFallbackLabel === "Coming soon" ? "Release pending" : ""));

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
        ${(entry.status === "wishlist" || entry.status === "backlog")
          ? (entry.status === "wishlist"
            ? `
              <p class="font-body text-xs text-zinc-500 truncate">Wishlist item</p>
              <div class="mt-1 flex items-center justify-between gap-3 text-xs font-body text-zinc-400">
                <span>${escapeHtml(pricingLabel)}</span>
                <span>${escapeHtml(pricingStore || pricingStatus.replace("_", " "))}</span>
              </div>
            `
            : `<p class="font-body text-xs text-zinc-500 truncate">Backlog item</p>`)
          : `
            <p class="font-body text-xs text-zinc-400 truncate">${escapeHtml(entry.runLabel || "Main Save")}</p>
            <div class="mt-1 flex items-center justify-between gap-3 text-xs font-body text-zinc-500">
              <span>${entry.playtimeHours}h</span>
              <span>${entry.completionPercent}%</span>
            </div>
          `}
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
    <section class="checkpoint-panel rounded-xl px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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

function renderDiscoverSearchPanel(snapshot) {
  return `
    <section class="checkpoint-panel rounded-xl p-8">
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
    return `<div class="text-sm text-zinc-300">Searching IGDB and resolving SteamGrid covers...</div>`;
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
            ${hasUsableAsset(result.steamGridCover || result.coverArt)
              ? `<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" src="${escapeHtml(result.steamGridCover || result.coverArt)}" alt="${escapeHtml(result.title)} cover">`
              : renderFallbackArt(result.title, "SteamGrid pending", "text-xs p-3 rounded-md")}
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
  const details = snapshot.discoverEntryDetails ?? selectedResult;
  const pricing = snapshot.discoverEntryPricing ?? null;
  const related = Array.isArray(snapshot.discoverEntryRelated) ? snapshot.discoverEntryRelated : [];
  const links = snapshot.discoverEntryLinks && typeof snapshot.discoverEntryLinks === "object"
    ? snapshot.discoverEntryLinks
    : (details.links && typeof details.links === "object"
      ? details.links
      : { igdb: "", official: "", storefronts: [] });
  const selectedHeroArt = selectedResult.steamGridHero || details.heroArt || selectedResult.heroArt || "";
  const selectedCover = selectedResult.steamGridCover || details.coverArt || selectedResult.coverArt || selectedHeroArt || "";
  const heroBackdrop = selectedHeroArt || selectedCover || "";
  const screenshots = Array.isArray(details.screenshots) ? details.screenshots.filter(hasUsableAsset).slice(0, 8) : [];
  const videos = Array.isArray(details.videos) ? details.videos : [];
  const pricingRows = Array.isArray(pricing?.storeRows) ? pricing.storeRows : [];
  const pricingStatus = String(pricing?.status || "unsupported");
  const currentBest = pricing?.currentBest ?? {};
  const currentBestAmount = Number(currentBest.amount);
  const currentBestLabel = Number.isFinite(currentBestAmount)
    ? formatCurrency(currentBestAmount, currentBest.currency || "USD")
    : (pricingStatus === "ok" ? "No current price" : "Price unavailable");
  const currentBestStore = String(currentBest.storeName || "");
  const lastChecked = pricing?.lastCheckedAt ? String(pricing.lastCheckedAt) : "";
  const releaseYear = details.releaseDate ? String(details.releaseDate).slice(0, 4) : "TBD";
  const isUnreleased = !details.releaseDate || new Date(details.releaseDate).getTime() > Date.now();
  const releaseState = isUnreleased ? "Upcoming" : "Released";
  const hasLinks = Boolean(links.igdb || links.official || (Array.isArray(links.storefronts) && links.storefronts.length));
  const normalizedRows = pricingRows
    .map((row) => ({
      storeName: String(row?.storeName || "Store"),
      amountLabel: Number.isFinite(Number(row?.amount))
        ? formatCurrency(Number(row.amount), String(row?.currency || "USD"))
        : "N/A",
      discountLabel: Number.isFinite(Number(row?.discountPercent))
        ? `${Math.round(Number(row.discountPercent))}%`
        : "—",
      url: String(row?.url || "")
    }))
    .slice(0, 12);

  return `
    <section id="discover-overview" class="checkpoint-panel rounded-xl p-8 lg:p-10 overflow-hidden relative">
      ${hasUsableAsset(heroBackdrop) ? `
        <div class="absolute inset-0 pointer-events-none">
          <img class="w-full h-full object-cover scale-105 opacity-45 blur-[1px] saturate-110 contrast-110" src="${escapeHtml(heroBackdrop)}" alt="${escapeHtml(selectedResult.title || "Game")} hero backdrop">
          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,11,0.16)_0%,rgba(10,12,14,0.42)_24%,rgba(14,16,18,0.72)_56%,rgba(18,20,22,0.9)_100%)]"></div>
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.14),transparent_36%)]"></div>
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.36),transparent_58%)]"></div>
        </div>
      ` : ""}
      <div class="relative z-10 discover-hero-grid items-start">
        <div class="discover-hero-cover overflow-hidden rounded-md bg-zinc-900 cover-shadow aspect-[3/4] max-w-[280px] mx-auto lg:mx-0">
          ${hasUsableAsset(selectedCover)
            ? `<img class="w-full h-full object-cover" src="${escapeHtml(selectedCover)}" alt="${escapeHtml(selectedResult.title)} cover">`
            : renderFallbackArt(selectedResult.title || "Unknown title", "SteamGrid pending", "rounded-md")}
        </div>
        <div class="discover-hero-main space-y-5 rounded-md bg-black/42 px-5 py-6">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-1 rounded-md font-label text-[11px] tracking-[0.08em] bg-primary/12 text-primary">${escapeHtml(releaseState)}</span>
            <span class="px-2.5 py-1 rounded-md font-label text-[11px] tracking-[0.08em] bg-black/25 text-zinc-300">${escapeHtml(releaseYear)}</span>
            ${Array.isArray(details.genres) && details.genres.length
              ? `<span class="px-2.5 py-1 rounded-md font-label text-[11px] tracking-[0.08em] bg-black/25 text-zinc-300">${escapeHtml(details.genres[0])} focus</span>`
              : ""}
          </div>
          <div>
            <h2 class="text-4xl lg:text-5xl font-extrabold font-headline tracking-tight text-on-surface">${escapeHtml(details.title || "Unknown title")}</h2>
            <p class="mt-2 text-sm text-zinc-400">${escapeHtml(details.releaseDate || "Release date unknown")}</p>
          </div>
          <p class="max-w-3xl text-on-surface-variant text-base leading-relaxed">${escapeHtml(details.criticSummary || details.description || selectedResult.description || "Live metadata and pricing are loaded lazily so this page stays fast.")}</p>
          <div class="metadata-rule pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <div>
              <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Platforms</p>
              <p class="font-headline font-bold text-on-surface">${details.platforms?.length ? escapeHtml(details.platforms.join(", ")) : "Unknown"}</p>
            </div>
            <div>
              <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Quick Price</p>
              <p class="font-headline font-bold text-on-surface">${escapeHtml(currentBestLabel)}${currentBestStore ? ` · ${escapeHtml(currentBestStore)}` : ""}</p>
            </div>
          </div>
          ${(snapshot.discoverEntryLoading || snapshot.discoverEntryPricingLoading)
            ? `<div>${renderInlineSpinner("Loading richer details and pricing snapshot...")}</div>`
            : ""}
          ${snapshot.discoverEntryError
            ? `<p class="text-sm text-amber-200 bg-amber-500/10 rounded-md px-3 py-2">${escapeHtml(snapshot.discoverEntryError)}</p>`
            : ""}
          ${snapshot.discoverEntryPricingError
            ? `<p class="text-sm text-amber-200 bg-amber-500/10 rounded-md px-3 py-2">${escapeHtml(snapshot.discoverEntryPricingError)}</p>`
            : ""}
        </div>
        <aside class="discover-hero-rail flex flex-col sm:flex-row xl:flex-col gap-3 rounded-md bg-black/46 px-4 py-4">
          <button class="checkpoint-button checkpoint-button-primary discover-hero-cta px-5 py-3 text-xs tracking-[0.08em]" data-action="discover-add-wishlist">Add to Wishlist</button>
          <button class="checkpoint-button checkpoint-button-secondary discover-hero-cta px-5 py-3 text-xs tracking-[0.08em]" data-action="discover-add-library">Add to Library</button>
          <button class="checkpoint-button checkpoint-button-secondary discover-hero-cta px-5 py-3 text-xs tracking-[0.08em]" data-action="clear-discover-selection">Back to Discover Results</button>
        </aside>
      </div>
    </section>
    <section data-surface-region="details-local-nav" class="checkpoint-panel rounded-xl px-4 py-3">
      <nav class="flex items-center gap-1 overflow-x-auto custom-scrollbar">
        <a href="#discover-overview" class="px-3 py-2 whitespace-nowrap rounded-md font-label tracking-[0.08em] text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors">Overview</a>
        <a href="#discover-price" class="px-3 py-2 whitespace-nowrap rounded-md font-label tracking-[0.08em] text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors">Price</a>
        <a href="#discover-details" class="px-3 py-2 whitespace-nowrap rounded-md font-label tracking-[0.08em] text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors">Details</a>
        <a href="#discover-media" class="px-3 py-2 whitespace-nowrap rounded-md font-label tracking-[0.08em] text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors">Media</a>
        <a href="#discover-related" class="px-3 py-2 whitespace-nowrap rounded-md font-label tracking-[0.08em] text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors">Related</a>
      </nav>
    </section>
    <section class="discover-detail-shell grid grid-cols-1 gap-6 lg:gap-8">
      <div class="space-y-6">
        <section id="discover-price" class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-4">
          <h3 class="font-label text-sm tracking-[0.08em] text-primary">Price Snapshot</h3>
          ${snapshot.discoverEntryPricingLoading
            ? `
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="space-y-2">
                  <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Current Best</p>
                  ${renderSkeletonBlock("h-6", "w-28")}
                </div>
                <div class="space-y-2">
                  <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Store</p>
                  ${renderSkeletonBlock("h-6", "w-36")}
                </div>
                <div class="space-y-2">
                  <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Last Checked</p>
                  ${renderSkeletonBlock("h-5", "w-40")}
                </div>
              </div>
            `
            : `
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Current Best</p>
                  <p class="font-headline font-bold text-on-surface">${escapeHtml(currentBestLabel)}</p>
                </div>
                <div>
                  <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Store</p>
                  <p class="font-headline font-bold text-on-surface">${escapeHtml(currentBestStore || "N/A")}</p>
                </div>
                <div>
                  <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Last Checked</p>
                  <p class="font-body text-sm text-zinc-300">${escapeHtml(lastChecked ? new Date(lastChecked).toLocaleString() : "Not checked")}</p>
                </div>
              </div>
            `}
          <div class="rounded-md overflow-hidden bg-black/20">
            <table class="w-full text-sm">
              <thead class="bg-black/30">
                <tr class="text-left text-zinc-400">
                  <th class="px-4 py-3 font-label tracking-[0.08em] text-[11px]">Store</th>
                  <th class="px-4 py-3 font-label tracking-[0.08em] text-[11px]">Price</th>
                  <th class="px-4 py-3 font-label tracking-[0.08em] text-[11px]">% Off</th>
                </tr>
              </thead>
              <tbody>
                ${snapshot.discoverEntryPricingLoading
                  ? `
                    ${[1, 2, 3, 4].map(() => `
                      <tr class="border-t border-outline-variant/20">
                        <td class="px-4 py-3">${renderSkeletonBlock("h-4", "w-32")}</td>
                        <td class="px-4 py-3">${renderSkeletonBlock("h-4", "w-20")}</td>
                        <td class="px-4 py-3">${renderSkeletonBlock("h-4", "w-12")}</td>
                      </tr>
                    `).join("")}
                  `
                  : normalizedRows.length
                  ? normalizedRows.map((row) => `
                      <tr class="border-t border-outline-variant/20">
                        <td class="px-4 py-3 text-zinc-200">
                          ${row.url ? `<a class="underline decoration-primary/40 underline-offset-2 hover:text-primary" href="${escapeHtml(row.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(row.storeName)}</a>` : escapeHtml(row.storeName)}
                        </td>
                        <td class="px-4 py-3 font-headline font-bold text-on-surface">${escapeHtml(row.amountLabel)}</td>
                        <td class="px-4 py-3 text-zinc-300">${escapeHtml(row.discountLabel)}</td>
                      </tr>
                    `).join("")
                  : `<tr class="border-t border-outline-variant/20"><td class="px-4 py-3 text-zinc-500" colspan="3">${escapeHtml(pricingStatus === "ok" ? "No selected-store prices available." : "Pricing unavailable for this title right now.")}</td></tr>`}
              </tbody>
            </table>
          </div>
        </section>
        <section id="discover-details" class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-4">
          <h3 class="font-label text-sm tracking-[0.08em] text-primary">Full Game Details</h3>
          ${snapshot.discoverEntryLoading
            ? `
              <div class="space-y-3">
                ${renderInlineSpinner("Loading full game details...")}
                ${renderSkeletonBlock("h-4", "w-full")}
                ${renderSkeletonBlock("h-4", "w-11/12")}
                ${renderSkeletonBlock("h-4", "w-10/12")}
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div class="space-y-2"><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Developer</p>${renderSkeletonBlock("h-5", "w-28")}</div>
                <div class="space-y-2"><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Publisher</p>${renderSkeletonBlock("h-5", "w-32")}</div>
                <div class="space-y-2"><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Release</p>${renderSkeletonBlock("h-5", "w-24")}</div>
                <div class="md:col-span-2 lg:col-span-3 space-y-2"><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Genres</p>${renderSkeletonBlock("h-5", "w-full")}</div>
                <div class="md:col-span-2 lg:col-span-3 space-y-2"><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Platforms</p>${renderSkeletonBlock("h-5", "w-full")}</div>
              </div>
            `
            : `
              <p class="text-sm text-zinc-300 leading-relaxed">${escapeHtml(details.description || selectedResult.description || "No description available yet.")}</p>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Developer</p><p class="text-zinc-200">${escapeHtml(details.developer || "Unknown")}</p></div>
                <div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Publisher</p><p class="text-zinc-200">${escapeHtml(details.publisher || "Unknown")}</p></div>
                <div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Release</p><p class="text-zinc-200">${escapeHtml(details.releaseDate || "Unknown")}</p></div>
                <div class="md:col-span-2 lg:col-span-3"><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Genres</p><p class="text-zinc-200">${Array.isArray(details.genres) && details.genres.length ? escapeHtml(details.genres.join(", ")) : "Unknown"}</p></div>
                <div class="md:col-span-2 lg:col-span-3"><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Platforms</p><p class="text-zinc-200">${Array.isArray(details.platforms) && details.platforms.length ? escapeHtml(details.platforms.join(", ")) : "Unknown"}</p></div>
              </div>
            `}
        </section>
        <section id="discover-media" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-4">
            <h3 class="font-label text-sm tracking-[0.08em] text-primary">Screenshots</h3>
            ${snapshot.discoverEntryLoading
              ? `
                <div class="space-y-3">
                  ${renderInlineSpinner("Loading screenshots...")}
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${[1, 2, 3, 4].map(() => `<div class="aspect-video rounded-md overflow-hidden">${renderSkeletonBlock("h-full", "w-full")}</div>`).join("")}
                  </div>
                </div>
              `
              : (screenshots.length
                ? `
                  <div class="space-y-3">
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-xs text-zinc-500">${screenshots.length} screenshot${screenshots.length === 1 ? "" : "s"}</p>
                      ${screenshots.length > 1
                        ? `
                          <div class="flex items-center gap-2">
                            <button class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-xs font-label font-bold tracking-[0.08em] rounded-md inline-flex items-center gap-1.5" data-action="discover-screenshot-prev">
                              <span class="material-symbols-outlined text-sm">arrow_back</span>
                              Prev
                            </button>
                            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-400 px-2 py-1 rounded-md bg-black/25 min-w-[4.25rem] text-center" data-discover-screenshot-counter>1 / ${screenshots.slice(0, 10).length}</span>
                            <button class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-xs font-label font-bold tracking-[0.08em] rounded-md inline-flex items-center gap-1.5" data-action="discover-screenshot-next">
                              Next
                              <span class="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                          </div>
                        `
                        : ""}
                    </div>
                    <div id="discover-screenshot-carousel" class="discover-screenshot-carousel space-y-3" data-screenshot-index="0">
                      <button class="block w-full text-left" data-action="open-media-lightbox" data-media-context="discover" aria-label="Open screenshot preview">
                        <figure class="discover-screenshot-frame aspect-video bg-zinc-900 overflow-hidden rounded-md border border-outline-variant/30 checkpoint-panel">
                          <img id="discover-screenshot-image" class="w-full h-full object-cover" src="${escapeHtml(screenshots[0])}" alt="${escapeHtml(details.title || "Game")} screenshot 1">
                        </figure>
                      </button>
                    </div>
                    ${screenshots.length > 1
                      ? `
                        <div class="flex flex-wrap gap-2">
                          ${screenshots.slice(0, 10).map((shot, index) => `
                            <button
                              class="discover-screenshot-thumb overflow-hidden rounded-md border border-outline-variant/40 bg-zinc-900"
                              data-action="discover-screenshot-jump"
                              data-screenshot-index="${index}"
                              data-screenshot-url="${escapeHtml(shot)}"
                              data-screenshot-alt="${escapeHtml(details.title || "Game")} screenshot ${index + 1}"
                              aria-pressed="${index === 0 ? "true" : "false"}"
                              aria-label="Open screenshot ${index + 1}"
                            >
                              <img class="w-full h-full object-cover" src="${escapeHtml(shot)}" alt="">
                            </button>
                          `).join("")}
                        </div>
                      `
                      : ""}
                  </div>
                `
                : `<p class="text-sm text-zinc-500">No screenshots available.</p>`)}
          </div>
          <div class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-4">
            <h3 class="font-label text-sm tracking-[0.08em] text-primary">Videos</h3>
            ${snapshot.discoverEntryLoading
              ? `
                <div class="space-y-3">
                  ${renderInlineSpinner("Loading videos...")}
                  <div class="space-y-4">
                    ${[1, 2].map(() => `
                      <div class="space-y-2">
                        <div class="aspect-video rounded-md overflow-hidden">${renderSkeletonBlock("h-full", "w-full")}</div>
                        ${renderSkeletonBlock("h-4", "w-40")}
                      </div>
                    `).join("")}
                  </div>
                </div>
              `
              : (videos.length
                ? `
                  <div class="space-y-3">
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-xs text-zinc-500">${videos.length} video${videos.length === 1 ? "" : "s"}</p>
                      ${videos.length > 1
                        ? `
                          <div class="flex items-center gap-2">
                            <button class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-xs font-label font-bold tracking-[0.08em] rounded-md inline-flex items-center gap-1.5" data-action="discover-video-prev">
                              <span class="material-symbols-outlined text-sm">arrow_back</span>
                              Prev
                            </button>
                            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-400 px-2 py-1 rounded-md bg-black/25 min-w-[4.25rem] text-center" data-discover-video-counter>1 / ${videos.length}</span>
                            <button class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-xs font-label font-bold tracking-[0.08em] rounded-md inline-flex items-center gap-1.5" data-action="discover-video-next">
                              Next
                              <span class="material-symbols-outlined text-sm">arrow_forward</span>
                            </button>
                          </div>
                        `
                        : ""}
                    </div>
                    <div id="discover-video-carousel" class="space-y-3" data-video-index="0">
                      <div class="aspect-video rounded-md overflow-hidden bg-zinc-900" id="discover-video-frame">
                        ${videos[0].embedUrl
                          ? `<iframe class="w-full h-full" src="${escapeHtml(videos[0].embedUrl)}" title="${escapeHtml(videos[0].title || "Video")}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
                          : `<a class="w-full h-full flex items-center justify-center text-sm text-zinc-300 underline" href="${escapeHtml(videos[0].url || "")}" target="_blank" rel="noopener noreferrer">Open video</a>`}
                      </div>
                    </div>
                    ${videos.length > 1
                      ? `
                        <div class="flex flex-wrap gap-2">
                          ${videos.slice(0, 10).map((video, index) => `
                            <button
                              class="discover-screenshot-thumb overflow-hidden rounded-md border border-outline-variant/40 bg-zinc-900 ${index === 0 ? "is-active" : ""}"
                              data-action="discover-video-jump"
                              data-video-index="${index}"
                              data-video-title="${escapeHtml(video.title || "Video")}"
                              data-video-embed-url="${escapeHtml(video.embedUrl || "")}"
                              data-video-url="${escapeHtml(video.url || "")}"
                              aria-pressed="${index === 0 ? "true" : "false"}"
                              aria-label="Open video ${index + 1}"
                            >
                              ${hasUsableAsset(getVideoThumbnailUrl(video))
                                ? `<img class="w-full h-full object-cover" src="${escapeHtml(getVideoThumbnailUrl(video))}" alt="">`
                                : `<span class="w-full h-full flex items-center justify-center text-[11px] font-label tracking-[0.08em] text-zinc-400">Video ${index + 1}</span>`}
                            </button>
                          `).join("")}
                        </div>
                      `
                      : ""}
                  </div>
                `
                : `<p class="text-sm text-zinc-500">No videos available.</p>`)}
          </div>
        </section>
        <section id="discover-related" class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h3 class="font-label text-sm tracking-[0.08em] text-primary">Related Titles</h3>
            ${snapshot.discoverEntryRelatedLoading ? `<p class="text-sm text-zinc-400">Loading...</p>` : ""}
          </div>
          ${snapshot.discoverEntryRelatedError ? `<p class="text-sm text-amber-200 bg-amber-500/10 rounded-md px-3 py-2">${escapeHtml(snapshot.discoverEntryRelatedError)}</p>` : ""}
          ${related.length
            ? `<div class="grid items-start grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
                ${related.map((result) => `
                  <button class="group text-left min-h-[16rem] w-full self-start flex flex-col" data-action="select-discover-related" data-search-result-id="${escapeHtml(result.id)}">
                    <div class="aspect-[3/4] w-full bg-zinc-900 overflow-hidden rounded-md cover-shadow">
                      ${hasUsableAsset(result.coverArt)
                        ? `<img class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" src="${escapeHtml(result.coverArt)}" alt="${escapeHtml(result.title)} cover">`
                        : renderFallbackArt(result.title, "Artwork pending", "text-xs p-3 rounded-md")}
                    </div>
                    <div class="pt-3 px-1 h-20 flex flex-col justify-start">
                      <p class="font-headline font-bold text-sm text-on-surface leading-6 h-12 overflow-hidden break-words checkpoint-title-clamp">${escapeHtml(result.title)}</p>
                      <p class="text-xs text-zinc-400 leading-4 mt-auto">${escapeHtml(result.releaseDate ? result.releaseDate.slice(0, 4) : "Year unknown")}</p>
                    </div>
                  </button>
                `).join("")}
              </div>`
            : `<p class="text-sm text-zinc-500">No related titles available yet.</p>`}
        </section>
      </div>
      <aside class="checkpoint-panel discover-side-rail rounded-xl p-6 md:p-8 h-fit sticky top-36 flex flex-col gap-4">
        <h3 class="font-label text-sm tracking-[0.08em] text-primary">Game Details</h3>
        <div class="metadata-rule pt-4 space-y-4 text-sm">
          <div class="flex items-center justify-between gap-4">
            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Source</span>
            <span class="font-headline font-bold text-on-surface">IGDB</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Developer</span>
            <span class="font-headline font-bold text-on-surface text-right">${escapeHtml(details.developer || "Unknown")}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Publisher</span>
            <span class="font-headline font-bold text-on-surface text-right">${escapeHtml(details.publisher || "Unknown")}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Release</span>
            <span class="font-headline font-bold text-on-surface text-right">${escapeHtml(details.releaseDate || "Unknown")}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">IGDB ID</span>
            <span class="font-headline font-bold text-on-surface text-right">${escapeHtml(String(details.igdbId || selectedResult.igdbId || "Unknown"))}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Best Price</span>
            <span class="font-headline font-bold text-on-surface text-right">${escapeHtml(currentBestLabel)}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Best Store</span>
            <span class="font-headline font-bold text-on-surface text-right">${escapeHtml(currentBestStore || "N/A")}</span>
          </div>
        </div>
        <div class="metadata-rule pt-4 space-y-3">
          <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Relevant Links</p>
          ${hasLinks
            ? `
              <div class="flex flex-col gap-2">
                ${links.igdb ? `<a class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-[11px] tracking-[0.08em] justify-start" href="${escapeHtml(links.igdb)}" target="_blank" rel="noopener noreferrer">IGDB Page</a>` : ""}
                ${links.official ? `<a class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-[11px] tracking-[0.08em] justify-start" href="${escapeHtml(links.official)}" target="_blank" rel="noopener noreferrer">Official Site</a>` : ""}
                ${(Array.isArray(links.storefronts) ? links.storefronts : []).slice(0, 4).map((row) => (
                  `<a class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-[11px] tracking-[0.08em] justify-start" href="${escapeHtml(row.url || "")}" target="_blank" rel="noopener noreferrer">${escapeHtml((row.kind || "store").toUpperCase())}</a>`
                )).join("")}
              </div>
            `
            : `<p class="text-sm text-zinc-500">No links available yet.</p>`}
        </div>
      </aside>
    </section>
  `;
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
              <section class="checkpoint-panel rounded-xl p-8">
                <div class="flex flex-col gap-3">
                  <p class="font-label text-[11px] tracking-[0.08em] text-primary">Wishlist</p>
                  <h1 class="text-4xl lg:text-5xl font-headline font-extrabold tracking-tight text-on-surface">Track deals, release timing, and what to buy next.</h1>
                  <p class="max-w-3xl text-on-surface-variant leading-relaxed">Wishlist entries are decision-first: price watch, store comparison, and release readiness.</p>
                </div>
              </section>
              ${renderDashboardShelf({ title: "Wishlist", eyebrow: "Decision Queue", filterStatus: "wishlist", entries: wishlist, emptyMessage: "No wishlist entries in the current filter.", snapshot, storefrontDefinitions, statusDefinitions })}
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
