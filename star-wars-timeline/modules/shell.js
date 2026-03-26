export function renderStandardTopBar({
  currentPage,
  searchValue,
  isTimelineSearchEnabled = true
}) {
  return `
    <nav id="top-bar" class="fixed top-0 w-full z-[120] bg-surface/80 dark:bg-[#131313]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 h-16 md:h-20 shadow-2xl">
      <div class="flex items-center gap-4">
        <div class="shrink-0 text-[0.82rem] sm:text-base md:text-[1.45rem] font-bold tracking-[0.1em] md:tracking-[0.03em] text-[#FFE81F] drop-shadow-[0_0_10px_rgba(251,228,25,0.45)] font-headline uppercase whitespace-nowrap">
          Star Wars: Chronicles
        </div>
      </div>
      <div class="hidden md:flex items-center gap-8 font-headline uppercase tracking-widest text-sm">
        <button class="nav-underline-button ${currentPage === "timeline" ? "is-active text-[#FFE81F]" : "text-white/60"} pb-1" type="button" data-nav-page="timeline" aria-current="${currentPage === "timeline" ? "page" : "false"}">Timeline</button>
        <button class="nav-underline-button ${currentPage === "stats" ? "is-active text-[#FFE81F]" : "text-white/60"} pb-1" type="button" data-nav-page="stats" aria-current="${currentPage === "stats" ? "page" : "false"}">Stats</button>
      </div>
      <div class="flex items-center gap-3 md:gap-5">
        <div class="relative group hidden lg:block ${isTimelineSearchEnabled ? "" : "opacity-50 pointer-events-none"}">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/40 text-sm">search</span>
          <input id="timeline-search-input" class="bg-surface-container-high/70 border-none border-b border-outline-variant/30 focus:border-secondary focus:ring-0 text-xs py-2.5 pl-10 pr-4 w-64 rounded-none transition-all" placeholder="Search the galaxy..." type="text" value="${searchValue}"/>
        </div>
        <div id="music-pill" class="hidden xl:flex items-center gap-3 bg-white/5 px-3 py-2.5 min-w-[15rem]">
          <div class="min-w-0">
            <span class="block text-[11px] font-headline uppercase tracking-[0.12em] text-secondary truncate" id="music-pill-title">Music Off</span>
          </div>
          <div class="ml-auto flex items-center gap-1">
            <button id="music-pill-toggle" class="w-8 h-8 flex items-center justify-center rounded-full text-primary-fixed hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors" type="button" aria-label="Play or pause background music">▶</button>
            <button id="music-pill-next" class="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-primary-fixed transition-colors" type="button" aria-label="Skip to next track">⏭</button>
          </div>
        </div>
        <button class="active:scale-95 duration-150" type="button" aria-label="Profile" data-open-preferences="true">
          <span class="material-symbols-outlined text-primary-fixed text-2xl">account_circle</span>
        </button>
      </div>
    </nav>
  `;
}

export function renderContentTopBar({ basePath = ".", activePage = "" } = {}) {
  const pathPrefix = basePath.replace(/\/$/, "");

  return `
    <nav id="top-bar" class="fixed top-0 w-full z-[120] bg-surface/80 dark:bg-[#131313]/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 h-16 md:h-20 shadow-2xl">
      <div class="flex items-center gap-4">
        <a href="${pathPrefix}/" class="shrink-0 text-[0.82rem] sm:text-base md:text-[1.45rem] font-bold tracking-[0.1em] md:tracking-[0.03em] text-[#FFE81F] drop-shadow-[0_0_10px_rgba(251,228,25,0.45)] font-headline uppercase whitespace-nowrap">
          Star Wars: Chronicles
        </a>
      </div>
      <div class="hidden md:flex items-center gap-8 font-headline uppercase tracking-widest text-sm">
        <a class="nav-underline-button ${activePage === "timeline" ? "is-active text-[#FFE81F]" : "text-white/60"} pb-1" href="${pathPrefix}/">Timeline</a>
        <a class="nav-underline-button ${activePage === "guide" ? "is-active text-[#FFE81F]" : "text-white/60"} pb-1" href="${pathPrefix}/guide/">Guide</a>
      </div>
      <div class="flex items-center gap-3 md:gap-5">
        <a class="ghost-button px-4 py-2 font-label text-[10px] uppercase tracking-[0.18em]" href="${pathPrefix}/">
          Return
        </a>
      </div>
    </nav>
  `;
}

export function renderDesktopSidebar(content) {
  return `
    <aside id="desktop-eras" class="hidden lg:flex h-full w-72 fixed left-0 top-0 z-[60] bg-[#131313] flex-col py-8 bg-gradient-to-r from-white/5 to-transparent">
      ${content}
    </aside>
  `;
}

export function renderMobileAudioPlayer({ show, compact = false } = {}) {
  if (!show) return "";

  return `
    <div class="md:hidden fixed bottom-[4.6rem] left-4 right-4 z-[117]">
      <div class="glass-panel rounded-2xl px-4 py-3 gap-3 flex items-center shadow-2xl ${compact ? "glass-surface-soft" : ""}">
        <button id="mobile-music-pill-toggle" class="w-11 h-11 rounded-full text-primary-fixed flex items-center justify-center active:scale-95 transition-transform" type="button" aria-label="Play or pause background music">
          ▶
        </button>
        <div class="min-w-0 flex-1">
          <span class="block text-[9px] font-label uppercase tracking-[0.2em] text-white/35">Audio Channel</span>
          <span id="mobile-music-pill-title" class="block text-xs font-headline uppercase tracking-[0.12em] text-secondary truncate">Music Off</span>
        </div>
        <button id="mobile-music-pill-next" class="w-10 h-10 rounded-full text-white/70 flex items-center justify-center active:scale-95 transition-transform" type="button" aria-label="Skip to next track">
          ⏭
        </button>
      </div>
    </div>
  `;
}

export function renderMobileBottomNav({ show, currentPage } = {}) {
  if (!show) return "";

  return `
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-[118] bg-[#131313]/95 backdrop-blur-xl">
      <div class="grid grid-cols-2 max-w-md mx-auto">
        <button class="nav-underline-button flex flex-col items-center justify-center gap-1 py-3 ${currentPage === "timeline" ? "is-active text-primary-fixed" : "text-white/45"}" type="button" data-nav-page="timeline" aria-current="${currentPage === "timeline" ? "page" : "false"}">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${currentPage === "timeline" ? 1 : 0};">view_timeline</span>
          <span class="font-label text-[10px] uppercase tracking-[0.2em]">Timeline</span>
        </button>
        <button class="nav-underline-button flex flex-col items-center justify-center gap-1 py-3 ${currentPage === "stats" ? "is-active text-primary-fixed" : "text-white/45"}" type="button" data-nav-page="stats" aria-current="${currentPage === "stats" ? "page" : "false"}">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${currentPage === "stats" ? 1 : 0};">leaderboard</span>
          <span class="font-label text-[10px] uppercase tracking-[0.2em]">Stats</span>
        </button>
      </div>
    </nav>
  `;
}

export function renderStandardFooter({ basePath = ".", activeLink = "" } = {}) {
  const pathPrefix = basePath.replace(/\/$/, "");

  return `
    <footer id="site-footer" class="w-full py-16 px-8 bg-background mt-20">
      <div class="max-w-[1320px] mx-auto flex flex-col items-center gap-8">
        <div class="glass-surface-soft px-6 py-4 text-primary-fixed font-bold font-headline tracking-tighter text-2xl drop-shadow-[0_0_10px_rgba(251,228,25,0.3)]">STAR WARS: CHRONICLES</div>
        <div class="footer-links flex flex-wrap justify-center gap-4">
          <a class="font-label uppercase tracking-widest text-[10px] ${activeLink === "privacy" ? "text-primary-fixed" : "text-white/40 hover:text-primary-fixed transition-colors"}" href="${pathPrefix}/privacy/">Privacy</a>
          <a class="font-label uppercase tracking-widest text-[10px] ${activeLink === "terms" ? "text-primary-fixed" : "text-white/40 hover:text-primary-fixed transition-colors"}" href="${pathPrefix}/terms/">Terms</a>
          <a class="font-label uppercase tracking-widest text-[10px] text-white/40 hover:text-primary-fixed transition-colors" href="https://github.com/DapperOberon/dapperoberon.github.io/issues" target="_blank" rel="noopener noreferrer">Support</a>
          <a class="font-label uppercase tracking-widest text-[10px] ${activeLink === "guide" ? "text-primary-fixed" : "text-white/40 hover:text-primary-fixed transition-colors"}" href="${pathPrefix}/guide/">Guide</a>
        </div>
        <div class="glass-surface-soft px-6 py-5 font-label uppercase tracking-[0.4em] text-[9px] text-white/20 text-center max-w-lg leading-relaxed">
          © &amp; TM LUCASFILM LTD. ALL RIGHTS RESERVED.
        </div>
      </div>
    </footer>
  `;
}

export function renderShellLayout({
  topBar,
  desktopSidebar,
  mainContent,
  mobileAudio,
  mobileBottomNav,
  footer,
  overlays = "",
  mainClassName = "lg:ml-72 pt-16 md:pt-20"
}) {
  return `
    ${topBar}
    ${desktopSidebar}
    <main class="${mainClassName}">
      ${mainContent}
    </main>
    ${mobileAudio}
    ${mobileBottomNav}
    ${footer}
    ${overlays}
  `;
}
