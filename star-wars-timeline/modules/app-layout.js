import { getContentPage, isContentPage, renderContentPage } from "./content-pages.js";

export function renderAppDesktopSidebarContent({
  currentPage,
  normalizedSections,
  escapeHtml,
  getEraAssetPath
}) {
  if (isContentPage(currentPage)) {
    const page = getContentPage(currentPage);
    if (!page) return "";

    return `
      <div class="px-8 mt-24 mb-10">
        <h2 class="text-[#FFE81F] font-bold font-headline tracking-tighter text-xl">${escapeHtml(page.title)}</h2>
        <p class="text-white/40 text-[10px] uppercase tracking-[0.2em] font-label mt-1">${escapeHtml(page.subtitle)}</p>
      </div>
      <nav class="flex flex-col gap-1">
        ${page.sidebarLinks.map((item) => `
          <button class="era-nav-button flex items-center gap-4 px-8 py-4 text-white/40 hover:bg-white/5 hover:text-white transition-all group text-left" type="button" data-scroll-target="${escapeHtml(item.id)}">
            <span class="material-symbols-outlined text-secondary text-lg">${escapeHtml(item.icon)}</span>
            <span class="font-medium text-sm font-body">${escapeHtml(item.label)}</span>
          </button>
        `).join("")}
      </nav>
    `;
  }

  return `
    <div class="px-8 mt-24 mb-10">
      <h2 class="text-[#FFE81F] font-bold font-headline tracking-tighter text-xl">GALACTIC ERAS</h2>
      <p class="text-white/40 text-[10px] uppercase tracking-[0.2em] font-label mt-1">Eras</p>
    </div>
    <nav class="flex flex-col gap-1">
      ${normalizedSections.map((section) => `
        <button class="era-nav-button flex items-center gap-4 px-8 py-4 text-white/40 hover:bg-white/5 hover:text-white transition-all group text-left" type="button" data-scroll-target="${escapeHtml(section.anchorId)}">
          ${getEraAssetPath(section.era)
            ? `<img class="era-logo era-logo--sidebar" src="${escapeHtml(getEraAssetPath(section.era))}" alt="" aria-hidden="true">`
            : ""}
          <span class="font-medium text-sm font-body">${escapeHtml(section.era)}</span>
        </button>
      `).join("")}
    </nav>
  `;
}

export function renderAppMainContent({
  currentPage,
  heroEntry,
  flatEntries,
  stats,
  activeFilterCount,
  filteredEntries,
  filteredSections,
  normalizedSections,
  timelineData,
  preferences,
  searchInputValue,
  escapeHtml,
  renderDesktopSection,
  renderMobileSection
}) {
  if (isContentPage(currentPage)) {
    return renderContentPage(currentPage, {
      timelineData,
      entries: flatEntries,
      preferences,
      escapeHtml
    });
  }

  const nextUpLabel = heroEntry?.watched > 0 ? "Continue your chronology" : "Start your next chapter";
  const heroMeta = heroEntry?.metaDisplay || heroEntry?.storyMeta || "";
  const heroCtaLabel = heroEntry?.watched > 0 ? "Continue Next Entry" : "Open Next Entry";

  return `
    <section id="timeline-hero" class="relative min-h-[640px] md:h-[716px] w-full overflow-hidden bg-surface-container-lowest">
      <div class="absolute inset-0 z-0">
        <img class="w-full h-full object-cover opacity-50 scale-105" src="${escapeHtml(heroEntry.posterUrl || heroEntry.poster)}" alt="${escapeHtml(heroEntry.title)}"/>
        <div class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent"></div>
      </div>
      <div class="relative z-10 h-full max-w-[1320px] mx-auto flex flex-col justify-center px-6 md:px-16">
        <div class="max-w-5xl">
          <div class="hidden md:block max-w-3xl">
            <p class="hud-label text-primary-fixed">Chronological Archive</p>
            <h1 class="mt-4 text-5xl md:text-7xl font-headline font-bold text-white tracking-tighter mb-5 leading-none">Follow the saga in the order it actually happened.</h1>
            <p class="text-on-surface-variant max-w-2xl text-lg mb-6 font-light leading-relaxed">Track progress across films, series, and anthology slices, then jump straight to the next unwatched chapter in the galaxy-wide chronology.</p>
            <div class="hero-next-up glass-surface-soft inline-flex items-center gap-4 px-5 py-4">
              <div class="space-y-1">
                <p class="hud-label text-secondary">${nextUpLabel}</p>
                <p class="font-headline text-xl text-white uppercase leading-tight">${escapeHtml(heroEntry.title)}</p>
                <p class="text-[11px] uppercase tracking-[0.18em] text-white/45">${escapeHtml(heroMeta)}</p>
              </div>
            </div>
          </div>
          <div class="md:hidden mb-12">
            <p class="hud-label text-primary-fixed">Chronological Archive</p>
            <h2 class="mt-3 font-headline text-4xl font-bold leading-tight">Follow the saga in the order it actually happened.</h2>
            <div class="mt-4 hero-next-up glass-surface-soft rounded-[1.25rem] p-4">
              <p class="font-label text-[10px] uppercase tracking-[0.2em] text-secondary">${nextUpLabel}</p>
              <p class="mt-2 font-headline text-lg text-white uppercase leading-tight">${escapeHtml(heroEntry.title)}</p>
              <p class="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">${escapeHtml(heroMeta)}</p>
            </div>
            <div class="mt-4 flex gap-4">
              <div class="bg-surface-container-high px-4 py-2 rounded-xl flex items-center gap-2">
                <span class="text-primary-container text-lg font-bold">${flatEntries.length}</span>
                <span class="font-label text-[10px] opacity-60 uppercase">Entries</span>
              </div>
              <div class="bg-surface-container-high px-4 py-2 rounded-xl flex items-center gap-2">
                <span class="text-secondary text-lg font-bold">${stats.overallProgress}%</span>
                <span class="font-label text-[10px] opacity-60 uppercase">Complete</span>
              </div>
            </div>
            <div class="mt-5 relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/40 text-sm">search</span>
              <input id="timeline-search-input-mobile" data-search-input="mobile" class="w-full rounded-full bg-black/35 px-10 py-3.5 text-sm text-white placeholder:text-white/35 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/40" placeholder="Search titles, years, and episodes..." type="text" value="${escapeHtml(searchInputValue || "")}">
            </div>
            <div class="mt-5 flex gap-3">
              <button class="px-4 py-3 bg-primary-fixed text-on-primary-fixed font-bold uppercase text-[10px] tracking-[0.18em] rounded-full" type="button" data-open-modal="${escapeHtml(heroEntry.id)}">
                ${heroCtaLabel}
              </button>
              <button class="ghost-button px-4 py-3 font-bold uppercase text-[10px] tracking-[0.18em]" type="button" data-nav-page="guide">
                Guide
              </button>
            </div>
          </div>
          <div class="hidden md:flex gap-4">
            <button class="cta-primary" type="button" data-open-modal="${escapeHtml(heroEntry.id)}">
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
              ${heroCtaLabel}
            </button>
            <button class="cta-secondary" type="button" data-nav-page="guide">
              Guide
            </button>
          </div>
        </div>
      </div>
    </section>

    <section id="timeline-desktop" class="hidden md:block px-8 md:px-16 py-20 relative">
      <div class="max-w-[1320px] mx-auto">
        <div class="flex justify-between items-end mb-12 pb-6">
          <div>
            <h2 class="text-3xl font-headline font-bold text-white uppercase tracking-tighter">The Galactic Timeline</h2>
          </div>
          <div class="flex gap-3">
            <button class="control-pill bg-surface-container-highest px-4 py-2 text-xs font-label ${activeFilterCount > 0 ? "text-primary-fixed" : "text-white/60"} hover:text-white transition-all flex items-center gap-2" type="button" data-open-filters="true">
              <span class="material-symbols-outlined text-sm">filter_alt</span>
              ${activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filter"}
            </button>
          </div>
        </div>
        ${filteredEntries.length === 0 ? `
          <div class="py-16 text-center bg-surface-container-low space-y-4">
            <p class="font-headline text-2xl uppercase tracking-widest text-white">No Matching Entries</p>
            <p class="mt-3 text-sm text-on-surface-variant">Clear or broaden the active filters.</p>
            <button class="ghost-button px-4 py-3 text-[10px] font-headline uppercase tracking-[0.18em]" type="button" data-clear-filters="true">Clear Filters</button>
          </div>
        ` : `
          <div class="desktop-timeline space-y-32 relative py-10">
            ${filteredSections.map((section, sectionIndex) => {
              const entryOffset = filteredSections
                .slice(0, sectionIndex)
                .reduce((sum, current) => sum + current.entries.length, 0);
              return renderDesktopSection(section, entryOffset);
            }).join("")}
          </div>
        `}
      </div>
    </section>

    <section id="mobile-eras" class="md:hidden pt-8 pb-52 px-4 max-w-lg mx-auto relative min-h-screen">
      <div class="mb-4 flex items-center gap-2 overflow-x-auto hide-scrollbar">
        <button class="control-pill shrink-0 px-4 py-2 ${activeFilterCount > 0 ? "is-active text-on-primary-fixed" : "bg-surface-container-high text-white/80"} text-[10px] font-label uppercase tracking-[0.18em]" type="button" data-open-filters="true">
          ${activeFilterCount > 0 ? `Filters (${activeFilterCount})` : "Filters"}
        </button>
        ${normalizedSections.map((section, index) => `
          <button class="mobile-era-chip control-pill shrink-0 px-3 py-2 bg-surface-container-high text-white/65 text-[10px] font-label uppercase tracking-[0.18em]" type="button" data-scroll-target="mobile-era-${index}">${escapeHtml(section.era)}</button>
        `).join("")}
      </div>
      <div class="relative ml-4">
        <div class="absolute left-0 top-0 bottom-0 w-[2px] timeline-line opacity-30 shadow-[0_0_15px_#fbe419]"></div>
        ${filteredEntries.length === 0
          ? `<div class="ml-4 mr-2 p-6 rounded-xl bg-surface-container-low space-y-4">
              <p class="font-headline text-xl uppercase tracking-widest text-white">No Matching Entries</p>
              <p class="text-sm text-on-surface-variant">Clear or broaden the active filters.</p>
              <button class="ghost-button px-4 py-3 text-[10px] font-headline uppercase tracking-[0.18em]" type="button" data-clear-filters="true">Clear Filters</button>
            </div>`
          : filteredSections.map((section) => renderMobileSection(section)).join("")}
      </div>
    </section>
  `;
}

export function buildRenderShellOptions({
  currentPage,
  activeEntry,
  isFilterPanelOpen,
  normalizedSections,
  searchInputValue,
  escapeHtml,
  getEraAssetPath,
  renderStandardTopBar,
  renderDesktopSidebar,
  renderMobileAudioPlayer,
  renderMobileBottomNav,
  renderStandardFooter
}) {
  const topBar = renderStandardTopBar({
    currentPage,
    searchValue: escapeHtml(searchInputValue),
    isTimelineSearchEnabled: currentPage === "timeline"
  });

  const sidebarContent = renderAppDesktopSidebarContent({
    currentPage,
    normalizedSections,
    escapeHtml,
    getEraAssetPath
  });

  const desktopSidebar = sidebarContent ? renderDesktopSidebar(sidebarContent) : "";

  const mobileAudio = renderMobileAudioPlayer({
    show: !activeEntry && !isFilterPanelOpen && currentPage !== "preferences"
  });

  const mobileBottomNav = renderMobileBottomNav({
    show: !activeEntry && !isFilterPanelOpen,
    currentPage
  });

  const footer = renderStandardFooter({ activeLink: currentPage });

  return {
    topBar,
    desktopSidebar,
    mobileAudio,
    mobileBottomNav,
    footer
  };
}
