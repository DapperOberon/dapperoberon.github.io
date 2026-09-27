import { footerLink, icon, mobileNavButton, navButton } from "./ui.js";

// Primary destinations, shared by the desktop top bar and the mobile bottom
// nav so the two cannot drift apart. `icon` is the Material Symbols ligature.
const PRIMARY_NAV = [
  { page: "timeline", label: "Timeline", icon: "view_timeline" },
  { page: "guide", label: "Guide", icon: "menu_book" },
  { page: "stats", label: "Stats", icon: "leaderboard" },
  { page: "preferences", label: "Settings", icon: "tune" }
];

export function renderStandardTopBar({
  currentPage,
  searchValue,
  isTimelineSearchEnabled = true
}) {
  return `
    <nav id="top-bar" class="fixed top-0 w-full z-[120] bg-surface/80 dark:bg-background/80 backdrop-blur-xl flex justify-between items-center px-4 md:px-8 h-16 md:h-20 shadow-2xl">
      <div class="flex items-center gap-4">
        <button class="shrink-0 bg-transparent border-0 p-0 text-[0.82rem] sm:text-base md:text-[1.45rem] font-bold tracking-widest md:tracking-wide text-primary-fixed drop-shadow-[0_0_10px_rgba(251,228,25,0.45)] font-headline uppercase whitespace-nowrap text-left" type="button" data-nav-page="timeline">
          Star Wars: Chronicles
        </button>
      </div>
      <div class="hidden md:flex items-center gap-8 font-headline uppercase tracking-widest text-sm">
        ${PRIMARY_NAV.map((item) => navButton({
          page: item.page,
          label: item.label,
          currentPage,
          // Only Settings carries an icon in the desktop bar.
          iconName: item.page === "preferences" ? item.icon : ""
        })).join("\n        ")}
      </div>
      <div class="flex items-center gap-3 md:gap-5">
        <div class="relative group hidden lg:block ${isTimelineSearchEnabled ? "" : "opacity-50 pointer-events-none"}">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-white/40 text-sm">search</span>
          <input id="timeline-search-input-desktop" data-search-input="desktop" class="bg-surface-container-high/70 border-none border-b border-outline-variant/30 focus:border-secondary focus:ring-0 text-xs py-2.5 pl-10 pr-4 w-64 rounded-none transition-all" placeholder="Search the galaxy..." type="text" value="${searchValue}"/>
        </div>
        <div id="music-pill" class="hidden md:flex items-center gap-3 bg-white/5 px-2 lg:px-3 py-2.5 min-w-[11rem] lg:min-w-[15rem]">
          <div class="min-w-0">
            <span class="block text-label-lg font-headline uppercase tracking-hud text-secondary truncate" id="music-pill-title">Music Off</span>
          </div>
          <div class="ml-auto flex items-center gap-1">
            <button id="music-pill-toggle" class="w-8 h-8 flex items-center justify-center rounded-full text-primary-fixed hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors" type="button" aria-label="Play or pause background music">▶</button>
            <button id="music-pill-next" class="w-8 h-8 flex items-center justify-center rounded-full text-white/70 hover:text-primary-fixed transition-colors" type="button" aria-label="Skip to next track">⏭</button>
          </div>
        </div>
      </div>
    </nav>
  `;
}

export function renderDesktopSidebar(content) {
  return `
    <aside id="desktop-eras" class="hidden lg:flex h-full w-72 fixed left-0 top-0 z-[60] bg-background flex-col py-8 bg-gradient-to-r from-white/5 to-transparent">
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
          <span class="block text-label-sm font-label uppercase tracking-hud-wider text-white/35">Audio Channel</span>
          <span id="mobile-music-pill-title" class="block text-xs font-headline uppercase tracking-hud text-secondary truncate">Music Off</span>
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
    <nav class="md:hidden fixed bottom-0 left-0 right-0 z-[118] bg-background/95 backdrop-blur-xl">
      <div class="grid grid-cols-4 max-w-md mx-auto">
        ${PRIMARY_NAV.map((item) => mobileNavButton({
          page: item.page,
          label: item.label,
          currentPage,
          iconName: item.icon
        })).join("\n        ")}
      </div>
    </nav>
  `;
}

export function renderStandardFooter({ activeLink = "" } = {}) {
  return `
    <footer id="site-footer" class="w-full py-16 px-8 bg-background mt-20">
      <div class="max-w-[1320px] mx-auto flex flex-col items-center gap-8">
        <div class="glass-surface-soft px-6 py-4 text-primary-fixed font-bold font-headline tracking-tighter text-2xl drop-shadow-[0_0_10px_rgba(251,228,25,0.3)]">STAR WARS: CHRONICLES</div>
        <div class="footer-links flex flex-wrap justify-center gap-4">
          ${footerLink({ page: "privacy", label: "Privacy", activeLink })}
          ${footerLink({ page: "terms", label: "Terms", activeLink })}
          ${footerLink({ label: "Support", href: "https://github.com/DapperOberon/dapperoberon.github.io/issues" })}
          ${footerLink({ page: "guide", label: "Guide", activeLink })}
        </div>
        <div class="glass-surface-soft px-6 py-5 font-label uppercase tracking-hud-widest text-label-sm text-white/20 text-center max-w-lg leading-relaxed">
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
