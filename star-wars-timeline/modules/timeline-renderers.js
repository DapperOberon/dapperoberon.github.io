import { getEraAssetPath } from "./constants.js";
import {
  entryEpisodes,
  getEntryMetaDisplay,
  getEntryPlayUrl,
  getEntryStoryMeta,
  getWatchedCount,
  isComingSoonWatchUrl,
  isPlayableWatchUrl,
  isComplete,
  isSeriesEntry
} from "./timeline-data.js";

function getTimelineEntryLabel(entry) {
  const watchedCount = getWatchedCount(entry);
  if (isComplete(entry)) return "Watched";
  if (watchedCount > 0) return "Continue Watching";
  return isSeriesEntry(entry) ? "See Details" : "Start Watching";
}

function getModalPrimaryLabel(entry) {
  const watchedCount = getWatchedCount(entry);
  if (isComplete(entry)) return "Watched";
  if (watchedCount > 0) return "Continue Watching";
  return "Start Watching";
}

function renderDesktopEpisodeItem(episode, index, nextIndex, watchedCount, escapeHtml) {
  const watched = Array.isArray(watchedCount)
    ? Boolean(watchedCount[index])
    : index < watchedCount;
  const isNext = nextIndex >= 0 && index === nextIndex;
  const playAction = isPlayableWatchUrl(episode.watchUrl)
    ? `
        <a class="icon-button w-10 h-10 material-symbols-outlined ${isNext ? "text-primary-fixed" : "text-slate-400 hover:text-primary-fixed"} transition-colors" href="${escapeHtml(episode.watchUrl)}" target="_blank" rel="noopener noreferrer" data-episode-play="${index}" aria-label="Watch ${escapeHtml(episode.title)}">play_circle</a>
      `
    : isComingSoonWatchUrl(episode.watchUrl)
      ? `
        <span class="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container-high text-primary-fixed font-label text-[10px] uppercase tracking-[0.18em]" aria-label="Coming Soon">
          <span class="material-symbols-outlined text-sm" aria-hidden="true">schedule</span>
          <span>Coming Soon</span>
        </span>
      `
    : `
        <span class="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container-high text-slate-500 font-label text-[10px] uppercase tracking-[0.18em]" aria-label="Unavailable">
          <span class="material-symbols-outlined text-sm" aria-hidden="true">block</span>
          <span>Unavailable</span>
        </span>
      `;
  const cardClass = isNext
    ? "bg-white/[0.06] ring-1 ring-primary-fixed/45 shadow-[0_0_24px_rgba(251,228,25,0.12)]"
    : watched
      ? "bg-surface-container-low/80 hover:bg-surface-container-high ring-1 ring-white/5"
      : "bg-surface-container-low/70 hover:bg-surface-container-high ring-1 ring-white/5 opacity-70 hover:opacity-100";
  const codeTone = isNext ? "text-primary-fixed animate-pulse" : "text-secondary";

  return `
    <div class="group flex items-center justify-between px-5 py-4 rounded-lg ${cardClass} transition-all">
      <div class="flex items-center space-x-5 min-w-0">
        <button class="w-7 h-7 border ${watched ? "border-primary-fixed bg-primary-fixed" : isNext ? "border-primary-fixed/50 bg-primary-fixed/10" : "border-slate-700"} rounded-md flex items-center justify-center transition-colors" type="button" data-episode-toggle="${index}">
          <span class="material-symbols-outlined text-on-primary-fixed text-sm font-bold ${watched ? "opacity-100" : "opacity-0"}">check</span>
        </button>
        <div class="flex flex-col min-w-0">
          <span class="text-[10px] font-label ${codeTone} uppercase tracking-[0.18em]">${isNext ? "Next Episode" : escapeHtml(episode.episodeCode || `Entry ${index + 1}`)}</span>
          <span class="font-headline text-[1.05rem] text-white group-hover:text-primary-fixed transition-colors truncate">${escapeHtml(episode.title)}</span>
        </div>
      </div>
      <div class="flex items-center space-x-6 flex-shrink-0">
        <div class="text-right">
          <span class="block text-[10px] font-label text-slate-500 uppercase tracking-[0.2em]">Timestamp</span>
          <span class="text-sm font-headline text-slate-300">${escapeHtml(episode.time || "")}</span>
        </div>
        ${playAction}
      </div>
    </div>
  `;
}

function renderMobileEpisodeItem(episode, index, nextIndex, watchedCount, poster, escapeHtml) {
  const watched = Array.isArray(watchedCount)
    ? Boolean(watchedCount[index])
    : index < watchedCount;
  const isNext = nextIndex >= 0 && index === nextIndex;
  const actionIcon = watched ? "check_circle" : "bookmark_add";
  const playSurface = isPlayableWatchUrl(episode.watchUrl)
    ? `
        <a class="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-highest group/play" href="${escapeHtml(episode.watchUrl)}" target="_blank" rel="noopener noreferrer" data-episode-play="${index}" aria-label="Watch ${escapeHtml(episode.title)}">
          <img class="w-full h-full object-cover opacity-60" src="${escapeHtml(poster)}" alt="${escapeHtml(episode.title)}">
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-2xl group-active:scale-125 group-hover/play:scale-110 transition-transform" style="font-variation-settings: 'FILL' 1;">play_circle</span>
          </div>
        </a>
      `
    : isComingSoonWatchUrl(episode.watchUrl)
      ? `
        <div class="flex-shrink-0">
          <span class="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container-high text-primary-fixed font-label text-[10px] uppercase tracking-[0.18em]" aria-label="Coming Soon">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">schedule</span>
            <span>Coming Soon</span>
          </span>
        </div>
      `
    : `
        <div class="flex-shrink-0">
          <span class="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-container-high text-slate-500 font-label text-[10px] uppercase tracking-[0.18em]" aria-label="Unavailable">
            <span class="material-symbols-outlined text-sm" aria-hidden="true">block</span>
            <span>Unavailable</span>
          </span>
        </div>
      `;
  return `
    <div class="glass-card rounded-xl p-4 flex items-center gap-4 active:bg-white/5 transition-colors group">
      ${playSurface}
      <div class="flex-grow min-w-0">
        <div class="flex items-center gap-2 mb-0.5">
          <span class="text-[10px] font-label font-bold ${isNext ? "text-primary-fixed" : "text-secondary"} tracking-tight uppercase">${escapeHtml(episode.episodeCode || `Entry ${index + 1}`)}</span>
          <span class="w-1 h-1 bg-outline-variant rounded-full"></span>
          <span class="text-[10px] font-label text-on-surface-variant font-medium tracking-widest">${escapeHtml(episode.time || "")}</span>
        </div>
        <h4 class="text-sm font-headline font-bold text-white truncate">${escapeHtml(episode.title)}</h4>
      </div>
      <button class="p-2 ${watched ? "text-primary-fixed" : "text-on-surface-variant hover:text-primary-fixed"} transition-colors" type="button" aria-label="${watched ? "Watched" : "Save"} ${escapeHtml(episode.title)}" data-episode-toggle="${index}">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${watched ? 1 : 0};">${actionIcon}</span>
      </button>
    </div>
  `;
}

export function renderModal(entry, { escapeHtml, getModalEntryNavigation }) {
  if (!entry) return "";

  const episodes = entryEpisodes(entry);
  const modalNav = getModalEntryNavigation(entry.id);
  const watchedStates = Array.isArray(entry._watchedArray) && entry._watchedArray.length === entry.episodes
    ? entry._watchedArray.slice()
    : new Array(episodes.length).fill(false).map((_, index) => index < Math.max(0, Math.min(getWatchedCount(entry), episodes.length)));
  const watchedCount = watchedStates.filter(Boolean).length;
  const rawNextIndex = watchedStates.findIndex((watched) => !watched);
  const nextIndex = rawNextIndex >= 0 ? rawNextIndex : -1;
  const watchedSummary = `${watchedCount}/${episodes.length} Watched`;
  const metaLine = entry.episodes > 1
    ? `${entry.episodes} Episodes • ${entry.mediaLabel || "Media"}`
    : (entry.mediaLabel || "Media");
  const mobileStoryMeta = entry.metaDisplay || getEntryMetaDisplay(entry, metaLine);
  const infoAction = entry.infoUrl
    ? `
      <a class="ghost-button px-5 py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em] inline-flex items-center gap-2" href="${escapeHtml(entry.infoUrl)}" target="_blank" rel="noopener noreferrer" data-entry-info="${escapeHtml(entry.id)}">
        <span class="material-symbols-outlined text-sm">info</span>
        Info
      </a>
    `
    : "";
  const mobileInfoAction = entry.infoUrl
    ? `
      <a class="ghost-button px-4 py-4 text-[10px] font-label font-bold uppercase tracking-[0.2em] inline-flex items-center justify-center" href="${escapeHtml(entry.infoUrl)}" target="_blank" rel="noopener noreferrer" data-entry-info="${escapeHtml(entry.id)}" aria-label="Open ${escapeHtml(entry.title)} on Wookieepedia">
        <span class="material-symbols-outlined text-sm">info</span>
      </a>
    `
    : "";

  return `
    <div id="entry-modal" class="fixed inset-0 z-[90]" aria-hidden="false" role="dialog" aria-modal="true" aria-labelledby="entry-modal-title">
      <div class="hidden md:block fixed inset-0 pt-24 px-4 pb-4 lg:pl-[19rem]">
        <div class="absolute inset-0 bg-surface-container-lowest/90 backdrop-blur-md modal-close-surface" data-close-modal="true"></div>
        <div class="relative w-full h-full glass-panel rounded-2xl overflow-hidden flex flex-col shadow-2xl">
          <button class="absolute top-5 right-5 z-20 w-12 h-12 rounded-full bg-surface-container-highest/80 flex items-center justify-center hover:bg-primary-fixed hover:text-on-primary-fixed transition-all" type="button" data-close-modal="true" aria-label="Close details">
            <span class="material-symbols-outlined">close</span>
          </button>
          <header class="relative flex-shrink-0">
            <div class="absolute inset-0 z-0">
              <img class="w-full h-full object-cover opacity-40" src="${escapeHtml(entry.posterUrl || entry.poster)}" alt="${escapeHtml(entry.title)}">
              <div class="absolute inset-0 scrim-bottom"></div>
              <div class="absolute inset-0 bg-gradient-to-r from-black/60 via-black/15 to-black/45"></div>
            </div>
            <div class="relative z-10 p-8 md:p-12 lg:px-14 flex flex-col md:flex-row gap-8 lg:gap-10 items-end min-h-[21rem]">
              <div class="w-40 md:w-56 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-2 ring-primary-fixed/20 flex-shrink-0">
                <img class="w-full h-full object-cover" src="${escapeHtml(entry.posterUrl || entry.poster)}" alt="${escapeHtml(entry.title)} poster">
              </div>
              <div class="flex-grow space-y-5 max-w-4xl">
                <div class="flex items-center gap-3 mb-1 flex-wrap">
                  <span class="kicker-label">${escapeHtml(entry.era)}</span>
                  <span class="story-meta text-secondary">${escapeHtml(metaLine)}</span>
                </div>
                <h2 id="entry-modal-title" class="max-w-4xl text-4xl md:text-6xl xl:text-7xl font-headline font-bold text-white tracking-tighter leading-[0.95]">${escapeHtml(entry.title)}</h2>
                <p class="max-w-2xl text-slate-300 font-body text-sm md:text-lg leading-relaxed opacity-90">${escapeHtml(entry.synopsis || "Entry synopsis coming soon.")}</p>
                <div class="flex items-center gap-6 pt-3 flex-wrap">
                  <button class="cta-primary px-7" type="button" data-modal-primary>
                    ${getModalPrimaryLabel(entry)}
                  </button>
                  <button class="ghost-button px-5 py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em]" type="button" data-share-entry="${escapeHtml(entry.id)}">
                    <span class="material-symbols-outlined text-sm">share</span>
                    Share
                  </button>
                  ${infoAction}
                  <div class="flex items-center space-x-2 text-slate-300">
                    <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">visibility</span>
                    <span class="text-sm font-headline tracking-wide">${escapeHtml(watchedSummary)}</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
          <main class="flex-grow overflow-y-auto px-8 md:px-12 lg:px-14 pb-12">
            <div class="flex items-center justify-between sticky top-0 z-20 py-6 bg-[linear-gradient(to_bottom,rgba(22,22,22,0.96),rgba(22,22,22,0.84),transparent)] backdrop-blur-sm">
              <h3 class="font-headline text-lg uppercase tracking-[0.18em] text-[#75d1ff]">Episodes</h3>
              <div class="flex items-center space-x-4">
                <div class="h-1 w-24 bg-surface-container-highest rounded-full overflow-hidden">
                  <div class="h-full" style="width:${episodes.length ? Math.round((watchedCount / episodes.length) * 100) : 0}%; background:#fbe419; box-shadow:0 0 8px rgba(251,228,25,0.5);"></div>
                </div>
                <span class="text-[10px] font-label text-white uppercase tracking-[0.2em]">${escapeHtml(watchedSummary)}</span>
              </div>
            </div>
            <div class="space-y-2.5">
              ${episodes.map((episode, index) => renderDesktopEpisodeItem(episode, index, nextIndex, watchedStates, escapeHtml)).join("")}
            </div>
            <div class="pt-8 flex items-center justify-between gap-4">
              <button class="ghost-button inline-flex items-center justify-center gap-2 px-5 py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em] ${modalNav.previous ? "" : "opacity-35 pointer-events-none"}" type="button" ${modalNav.previous ? `data-modal-nav="previous"` : "disabled"}>
                <span class="material-symbols-outlined text-sm">west</span>
                ${modalNav.previous ? `Previous: ${escapeHtml(modalNav.previous.title)}` : "Start of Timeline"}
              </button>
              <button class="ghost-button inline-flex items-center justify-center gap-2 px-5 py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em] ${modalNav.next ? "" : "opacity-35 pointer-events-none"}" type="button" ${modalNav.next ? `data-modal-nav="next"` : "disabled"}>
                ${modalNav.next ? `Next: ${escapeHtml(modalNav.next.title)}` : "End of Timeline"}
                <span class="material-symbols-outlined text-sm">east</span>
              </button>
            </div>
          </main>
        </div>
      </div>

      <div class="md:hidden fixed inset-0 bg-background overflow-y-auto">
        <main class="relative pt-0 pb-10 min-h-screen bg-surface overflow-x-hidden">
          <section class="relative h-[486px] w-full overflow-hidden">
            <div class="absolute inset-0 z-0">
              <img class="w-full h-full object-cover scale-105" src="${escapeHtml(entry.posterUrl || entry.poster)}" alt="${escapeHtml(entry.title)}">
              <div class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent"></div>
              <div class="absolute inset-0 bg-gradient-to-b from-background/60 via-transparent to-transparent"></div>
            </div>
            <button class="absolute top-20 right-6 z-20 w-10 h-10 rounded-full glass-card flex items-center justify-center text-on-surface active:scale-90 transition-transform" type="button" data-close-modal="true" aria-label="Close details">
              <span class="material-symbols-outlined">close</span>
            </button>
            <div class="absolute bottom-0 left-0 w-full p-6 z-10 space-y-4">
              <div class="space-y-1">
                <span class="font-label text-xs uppercase tracking-[0.22em] text-[#FFE81F] font-bold">${escapeHtml(entry.era)}</span>
                <h2 class="font-headline text-4xl font-black text-white leading-none tracking-tight max-w-[18rem]">${escapeHtml(entry.title)}</h2>
              </div>
              <div class="flex items-center gap-3 text-xs font-label text-on-surface-variant tracking-wider flex-wrap">
                <span class="flex items-center gap-1">
                  <span class="material-symbols-outlined text-sm text-secondary" style="font-variation-settings: 'FILL' 1;">visibility</span>
                  ${escapeHtml(watchedSummary)}
                </span>
                <span class="w-1 h-1 bg-outline-variant rounded-full"></span>
                <span>${escapeHtml(mobileStoryMeta)}</span>
              </div>
              <p class="text-on-surface-variant text-sm leading-relaxed max-w-md line-clamp-3 font-light">${escapeHtml(entry.synopsis || "Entry synopsis coming soon.")}</p>
              <div class="pt-2">
                <div class="flex gap-3">
                  <button class="flex-1 w-full py-4 bg-primary-fixed text-on-primary-fixed font-headline font-bold rounded-full flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(251,228,25,0.3)] active:scale-[0.98] transition-all" type="button" data-modal-primary>
                    <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
                    ${getModalPrimaryLabel(entry).toUpperCase()}
                  </button>
                  <button class="ghost-button px-4 py-4 text-[10px] font-label font-bold uppercase tracking-[0.2em]" type="button" data-share-entry="${escapeHtml(entry.id)}" aria-label="Share ${escapeHtml(entry.title)}">
                    <span class="material-symbols-outlined text-sm">share</span>
                  </button>
                  ${mobileInfoAction}
                </div>
              </div>
            </div>
          </section>
          <section class="px-6 space-y-6 mt-4">
            <div class="flex items-center justify-between">
              <h3 class="font-headline text-lg font-bold tracking-widest uppercase text-white">Episodes</h3>
              <span class="story-meta">${escapeHtml(watchedSummary)}</span>
            </div>
            <div class="space-y-3 pb-4">
              ${episodes.map((episode, index) => renderMobileEpisodeItem(episode, index, nextIndex, watchedStates, entry.posterUrl || entry.poster, escapeHtml)).join("")}
            </div>
            <div class="grid grid-cols-2 gap-3 pb-6">
              <button class="ghost-button inline-flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em] ${modalNav.previous ? "" : "opacity-35 pointer-events-none"}" type="button" ${modalNav.previous ? `data-modal-nav="previous"` : "disabled"}>
                <span class="material-symbols-outlined text-sm">west</span>
                Prev
              </button>
              <button class="ghost-button inline-flex items-center justify-center gap-2 px-4 py-3 text-[10px] font-label font-bold uppercase tracking-[0.2em] ${modalNav.next ? "" : "opacity-35 pointer-events-none"}" type="button" ${modalNav.next ? `data-modal-nav="next"` : "disabled"}>
                Next
                <span class="material-symbols-outlined text-sm">east</span>
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  `;
}

function renderDesktopEntry(entry, index, escapeHtml) {
  const reverse = index % 2 === 1;
  const watchedCount = getWatchedCount(entry);
  const playUrl = getEntryPlayUrl(entry);
  const nodeBorder = watchedCount > 0 ? "border-secondary" : "border-primary-fixed";
  const nodeCore = watchedCount > 0 ? "bg-secondary" : "bg-primary-fixed";
  const yearTone = watchedCount > 0 ? "text-secondary" : "text-primary-fixed";
  const watchLabel = getTimelineEntryLabel(entry);
  const watchIcon = isComplete(entry) ? "check_circle" : "visibility";
  const watchButton = isComplete(entry)
    ? "bg-primary-fixed/90 text-on-primary-fixed"
    : "bg-background/80 text-white";
  const synopsis = entry.shortSynopsis ? escapeHtml(entry.shortSynopsis) : "";
  const storyMeta = entry.storyMeta || getEntryStoryMeta(entry);

  return `
    <article class="relative flex flex-col md:${reverse ? "flex-row-reverse" : "flex-row"} items-center justify-between group gap-8 md:gap-0 cursor-pointer" data-era="${escapeHtml(entry.era)}" data-entry-id="${escapeHtml(entry.id)}" tabindex="0"${entry.anchorId ? ` id="${escapeHtml(entry.anchorId)}"` : ""}>
      <div class="absolute left-0 md:left-1/2 -translate-x-1/2 w-10 h-10 bg-background border-2 ${nodeBorder} rounded-full z-10 flex items-center justify-center ${entry.watched > 0 ? "" : "shadow-[0_0_15px_rgba(251,228,25,0.4)]"}">
        <div class="w-2 h-2 ${nodeCore} rounded-full ${entry.watched > 0 ? "" : "animate-pulse"}"></div>
      </div>
      <div class="md:w-[45%] pl-12 md:pl-0 ${reverse ? "" : "md:text-right"}">
        <div class="inline-flex items-center gap-3 mb-3 ${reverse ? "" : "md:ml-auto md:justify-end"}">
          <span class="${yearTone} font-headline font-bold text-2xl tracking-tighter block">${escapeHtml(entry.displayYear || entry.year)}</span>
          <span class="story-meta hidden md:inline-flex items-center gap-2">
            <span class="story-meta-dot"></span>
            <span>${escapeHtml(storyMeta)}</span>
          </span>
        </div>
        <h3 class="text-xl xl:text-[1.65rem] font-headline font-bold text-white uppercase tracking-tight leading-none">${escapeHtml(entry.title)}</h3>
        ${synopsis ? `<p class="text-on-surface-variant text-sm mt-3 leading-relaxed max-w-md ${reverse ? "" : "ml-auto"}">${synopsis}</p>` : ""}
      </div>
      <div class="hidden md:block w-[45%]">
        <div class="relative overflow-hidden group/card bg-surface-container-low aspect-video shadow-2xl">
          <img class="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110 grayscale-[0.5] group-hover/card:grayscale-0" src="${escapeHtml(entry.posterUrl || entry.poster)}" alt="${escapeHtml(entry.title)}"/>
          <div class="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent"></div>
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-fixed/80 via-primary-fixed/20 to-transparent"></div>
          <div class="absolute top-4 left-4">
            <span class="story-meta bg-black/35 backdrop-blur-md px-3 py-1.5 rounded-full text-white/68">${escapeHtml(entry.metaText || `${entry.episodes} Episodes`)}</span>
          </div>
          <div class="absolute bottom-4 ${reverse ? "left-4" : "right-4"} flex items-center gap-3">
          ${playUrl && !isSeriesEntry(entry) ? `
            <a class="ghost-button inline-flex items-center gap-2 px-4 py-2 rounded-full" href="${escapeHtml(playUrl)}" target="_blank" rel="noopener noreferrer" data-entry-play="${escapeHtml(entry.id)}" aria-label="Watch ${escapeHtml(entry.title)}">
              <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
              <span class="text-[10px] font-label uppercase tracking-widest">Play</span>
            </a>
          ` : ""}
          <button class="desktop-media-button flex items-center gap-2 ${watchButton} backdrop-blur-md px-4 py-2 rounded-full transition-all" type="button" ${isSeriesEntry(entry) ? `data-open-modal="${escapeHtml(entry.id)}"` : `data-toggle-entry="${escapeHtml(entry.id)}"`}>
            <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">${watchIcon}</span>
            <span class="text-[10px] font-label uppercase tracking-widest ${watchedCount > 0 ? "font-bold" : ""}">${watchLabel}</span>
          </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

export function renderDesktopSection(section, startIndex, { escapeHtml }) {
  const eraAsset = getEraAssetPath(section.era);
  return `
    <div class="relative" id="${escapeHtml(section.anchorId)}">
      <div class="absolute left-1/2 -translate-x-1/2 -top-12 w-3 h-3 rounded-full shadow-[0_0_15px_currentColor]" style="color:${escapeHtml(section.color)}; background:${escapeHtml(section.color)};"></div>
      <h3 class="text-center font-headline font-bold text-3xl uppercase tracking-[0.2em] mb-24 relative z-20 bg-background inline-flex items-center gap-4 left-1/2 -translate-x-1/2 px-8" style="color:${escapeHtml(section.color)};">
        ${eraAsset ? `<img class="era-logo era-logo--heading" src="${escapeHtml(eraAsset)}" alt="" aria-hidden="true">` : ""}
        <span>${escapeHtml(section.era)}</span>
      </h3>
      <div class="space-y-24">
        ${section.entries.map((entry, index) => renderDesktopEntry(entry, startIndex + index, escapeHtml)).join("")}
      </div>
    </div>
  `;
}

function renderMobileEntry(entry, escapeHtml) {
  const checked = getWatchedCount(entry) > 0;
  const series = isSeriesEntry(entry);
  const playUrl = getEntryPlayUrl(entry);
  const storyMeta = entry.metaDisplay || getEntryMetaDisplay(entry, entry.displayYear || entry.year);
  return `
    <article class="relative cursor-pointer" data-era="${escapeHtml(entry.era)}" data-entry-id="${escapeHtml(entry.id)}" tabindex="0">
      <div class="absolute -left-[37px] top-6 w-3 h-3 rounded-full ${checked ? "bg-secondary/55 shadow-[0_0_10px_rgba(117,209,255,0.25)]" : "bg-primary-container shadow-[0_0_10px_#fbe419]"}"></div>
      <div class="bg-surface-container-low rounded-[1.25rem] overflow-hidden shadow-2xl group active:scale-[0.98] transition-transform duration-200">
        <div class="h-44 relative">
          <img class="w-full h-full object-cover" src="${escapeHtml(entry.posterUrl || entry.poster)}" alt="${escapeHtml(entry.title)}"/>
          <div class="absolute inset-0 bg-gradient-to-t from-surface-container-low via-transparent to-transparent"></div>
          <div class="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-fixed/80 via-primary-fixed/20 to-transparent"></div>
          <div class="absolute top-3 right-3">
            <div class="story-meta bg-black/55 backdrop-blur-md px-2.5 py-1 rounded-full text-[#75d1ff]">${escapeHtml(entry.mediaLabel || "Media")}</div>
          </div>
        </div>
        <div class="p-5">
          <div class="flex justify-between items-start mb-2 gap-3">
            <div>
              <h4 class="font-headline font-bold text-lg leading-tight mb-1">${escapeHtml(entry.title)}</h4>
              <div class="flex items-center gap-2 opacity-60">
                <span class="story-meta">${escapeHtml(storyMeta)}</span>
              </div>
            </div>
            <div class="flex items-center gap-2">
            ${playUrl && !series ? `
              <a class="icon-button w-10 h-10 text-primary-fixed/85 flex items-center justify-center" href="${escapeHtml(playUrl)}" target="_blank" rel="noopener noreferrer" data-entry-play="${escapeHtml(entry.id)}" aria-label="Watch ${escapeHtml(entry.title)}">
                <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">play_arrow</span>
              </a>
            ` : ""}
            <button class="icon-button w-10 h-10 ${checked ? "text-primary-container bg-primary-container/10" : "text-outline"} flex items-center justify-center" type="button" ${series ? `data-open-modal="${escapeHtml(entry.id)}"` : `data-toggle-entry="${escapeHtml(entry.id)}"`}>
              <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' ${checked ? 1 : 0};">${series ? "visibility" : (checked ? "check_box" : "check_box_outline_blank")}</span>
            </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  `;
}

export function renderMobileSection(section, { escapeHtml }) {
  const eraAsset = getEraAssetPath(section.era);
  return `
    <section class="mb-16 relative" id="mobile-era-${section.sectionIndex}">
      <div class="flex items-center gap-4 mb-8 -ml-4">
        <div class="w-8 h-8 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(251,228,25,0.25)]" style="background:${escapeHtml(section.color)};">
          ${eraAsset ? `<img class="era-logo era-logo--mobile" src="${escapeHtml(eraAsset)}" alt="" aria-hidden="true">` : ""}
        </div>
        <h3 class="font-headline font-bold text-lg tracking-widest uppercase" style="color:${escapeHtml(section.color)};">${escapeHtml(section.era)}</h3>
      </div>
      <div class="space-y-8 pl-8 relative">
        ${section.entries.map((entry) => renderMobileEntry(entry, escapeHtml)).join("")}
      </div>
    </section>
  `;
}
