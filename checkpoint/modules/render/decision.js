import {
  escapeHtml,
  formatCurrency,
  getReleaseState,
  getReleaseStateLabel,
  getReleaseStatusDetail,
  hasUsableAsset,
  renderFallbackArt
} from "./shared.js";

function renderInlineSpinner(label = "Loading") {
  return `
    <span class="inline-flex items-center gap-2 text-sm text-zinc-400">
      <span class="checkpoint-spinner" aria-hidden="true"></span>
      <span>${escapeHtml(label)}</span>
    </span>
  `;
}

function renderSkeletonBlock(heightClass = "h-4", widthClass = "w-full") {
  return `<span class="checkpoint-skeleton ${heightClass} ${widthClass} rounded-md block"></span>`;
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

export function renderDecisionDetailPage({
  idPrefix = "decision",
  title = "Unknown title",
  releaseDate = "",
  genres = [],
  criticSummary = "",
  description = "",
  platforms = [],
  developer = "",
  publisher = "",
  coverArt = "",
  heroArt = "",
  screenshots = [],
  videos = [],
  related = [],
  links = { igdb: "", official: "", storefronts: [] },
  pricing = null,
  loading = false,
  error = "",
  pricingLoading = false,
  pricingError = "",
  heroActionsHtml = "",
  priceSupplementHtml = "",
  sideRailTitle = "Game Details",
  sourceLabel = "IGDB",
  mediaContext = "discover"
} = {}) {
  const heroBackdrop = heroArt || coverArt || "";
  const pricingStatus = String(pricing?.status || "unsupported");
  const currentBest = pricing?.currentBest ?? {};
  const currentBestAmount = Number(currentBest.amount);
  const currentBestLabel = Number.isFinite(currentBestAmount)
    ? formatCurrency(currentBestAmount, currentBest.currency || "USD")
    : (pricingStatus === "ok" ? "No current price" : "Price unavailable");
  const currentBestStore = String(currentBest.storeName || "");
  const lastChecked = pricing?.lastCheckedAt ? String(pricing.lastCheckedAt) : "";
  const releaseYear = releaseDate ? String(releaseDate).slice(0, 4) : "TBD";
  const releaseState = getReleaseState(releaseDate);
  const releaseStateLabel = getReleaseStateLabel(releaseState);
  const releaseStatusDetail = getReleaseStatusDetail(releaseDate);
  const itadLink = String(
    pricing?.gameUrl
    || pricing?.meta?.itadGameUrl
    || pricing?.currentBest?.url
    || (Array.isArray(pricing?.storeRows) ? pricing.storeRows.find((row) => String(row?.url || "").trim())?.url : "")
    || pricing?.historicalLow?.url
    || ""
  ).trim();
  const hasLinks = Boolean(itadLink || links.igdb || links.official || (Array.isArray(links.storefronts) && links.storefronts.length));
  const normalizedRows = (Array.isArray(pricing?.storeRows) ? pricing.storeRows : [])
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
  const normalizedScreenshots = Array.isArray(screenshots)
    ? screenshots.filter(hasUsableAsset).slice(0, 12)
    : [];
  const normalizedVideos = Array.isArray(videos)
    ? videos.filter((video) => video && typeof video === "object" && (video.embedUrl || video.url))
    : [];
  const primaryScreenshot = normalizedScreenshots[0] || "";
  const primaryVideo = normalizedVideos[0] || null;
  const primaryVideoTitle = String(primaryVideo?.title || `${title} video`).trim() || "Video";

  const navItems = [
    { href: `#${idPrefix}-overview`, label: "Overview" },
    { href: `#${idPrefix}-price`, label: "Price" },
    { href: `#${idPrefix}-details`, label: "Details" },
    { href: `#${idPrefix}-media`, label: "Media" },
    { href: `#${idPrefix}-related`, label: "Related" }
  ];

  return `
    <section id="${idPrefix}-overview" class="checkpoint-panel rounded-xl p-8 lg:p-10 overflow-hidden relative">
      ${hasUsableAsset(heroBackdrop) ? `
        <div class="absolute inset-0 pointer-events-none">
          <img class="w-full h-full object-cover scale-105 opacity-45 blur-[1px] saturate-110 contrast-110" src="${escapeHtml(heroBackdrop)}" alt="${escapeHtml(title)} hero backdrop">
          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,11,0.16)_0%,rgba(10,12,14,0.42)_24%,rgba(14,16,18,0.72)_56%,rgba(18,20,22,0.9)_100%)]"></div>
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.14),transparent_36%)]"></div>
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.36),transparent_58%)]"></div>
        </div>
      ` : ""}
      <div class="relative z-10 discover-hero-grid items-start">
        <div class="discover-hero-cover overflow-hidden rounded-md bg-zinc-900 cover-shadow aspect-[3/4] max-w-[280px] mx-auto lg:mx-0">
          ${hasUsableAsset(coverArt)
            ? `<img class="w-full h-full object-cover" src="${escapeHtml(coverArt)}" alt="${escapeHtml(title)} cover">`
            : renderFallbackArt(title, "IGDB media pending", "rounded-md")}
        </div>
        <div class="discover-hero-main space-y-5 rounded-md bg-black/42 px-5 py-6">
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-1 rounded-md font-label text-[11px] tracking-[0.08em] bg-primary/12 text-primary">${escapeHtml(releaseStateLabel)}</span>
            <span class="px-2.5 py-1 rounded-md font-label text-[11px] tracking-[0.08em] bg-black/25 text-zinc-300">${escapeHtml(releaseYear)}</span>
            ${Array.isArray(genres) && genres.length
              ? `<span class="px-2.5 py-1 rounded-md font-label text-[11px] tracking-[0.08em] bg-black/25 text-zinc-300">${escapeHtml(genres[0])} focus</span>`
              : ""}
          </div>
          <div>
            <h2 class="text-4xl lg:text-5xl font-extrabold font-headline tracking-tight text-on-surface">${escapeHtml(title)}</h2>
            <p class="mt-2 text-sm text-zinc-400">${escapeHtml(releaseStatusDetail)}</p>
          </div>
          <p class="max-w-3xl text-on-surface-variant text-base leading-relaxed">${escapeHtml(criticSummary || description || "Live metadata and pricing are loaded lazily so this page stays fast.")}</p>
          <div class="metadata-rule pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <div>
              <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Platforms</p>
              <p class="font-headline font-bold text-on-surface">${platforms?.length ? escapeHtml(platforms.join(", ")) : "Unknown"}</p>
            </div>
            <div>
              <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Quick Price</p>
              <p class="font-headline font-bold text-on-surface">${escapeHtml(currentBestLabel)}${currentBestStore ? ` · ${escapeHtml(currentBestStore)}` : ""}</p>
            </div>
          </div>
          ${(loading || pricingLoading)
            ? `<div>${renderInlineSpinner("Loading richer details and pricing snapshot...")}</div>`
            : ""}
          ${error ? `<p class="text-sm text-amber-200 bg-amber-500/10 rounded-md px-3 py-2">${escapeHtml(error)}</p>` : ""}
          ${pricingError ? `<p class="text-sm text-amber-200 bg-amber-500/10 rounded-md px-3 py-2">${escapeHtml(pricingError)}</p>` : ""}
        </div>
        <aside class="discover-hero-rail flex flex-col sm:flex-row xl:flex-col gap-3 rounded-md bg-black/46 px-4 py-4">
          ${heroActionsHtml}
        </aside>
      </div>
    </section>
    <section data-surface-region="details-local-nav" class="checkpoint-panel rounded-xl px-4 py-3">
      <nav class="flex items-center gap-1 overflow-x-auto custom-scrollbar">
        ${navItems.map((item) => `<a href="${item.href}" class="px-3 py-2 whitespace-nowrap rounded-md font-label tracking-[0.08em] text-[11px] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors">${item.label}</a>`).join("")}
      </nav>
    </section>
    <section class="discover-detail-shell grid grid-cols-1 gap-6 lg:gap-8">
      <div class="space-y-6">
        <section id="${idPrefix}-price" class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-4">
          <h3 class="font-label text-sm tracking-[0.08em] text-primary">Price Snapshot</h3>
          ${pricingLoading
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
                ${pricingLoading
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
          ${priceSupplementHtml}
        </section>
        <section id="${idPrefix}-details" class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-4">
          <h3 class="font-label text-sm tracking-[0.08em] text-primary">Full Game Details</h3>
          ${loading
            ? `
              <div class="space-y-3">
                ${renderInlineSpinner("Loading full game details...")}
                ${renderSkeletonBlock("h-4", "w-full")}
                ${renderSkeletonBlock("h-4", "w-11/12")}
                ${renderSkeletonBlock("h-4", "w-10/12")}
              </div>
            `
            : `<p class="text-sm text-zinc-300 leading-relaxed">${escapeHtml(description || "No description available yet.")}</p>`}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Developer</p><p class="text-zinc-200">${escapeHtml(developer || "Unknown")}</p></div>
            <div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Publisher</p><p class="text-zinc-200">${escapeHtml(publisher || "Unknown")}</p></div>
            <div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Release</p><p class="text-zinc-200">${escapeHtml(releaseDate || "Unknown")}</p></div>
            <div class="md:col-span-2 lg:col-span-3"><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Genres</p><p class="text-zinc-200">${Array.isArray(genres) && genres.length ? escapeHtml(genres.join(", ")) : "Unknown"}</p></div>
            <div class="md:col-span-2 lg:col-span-3"><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Platforms</p><p class="text-zinc-200">${Array.isArray(platforms) && platforms.length ? escapeHtml(platforms.join(", ")) : "Unknown"}</p></div>
          </div>
        </section>
        <section id="${idPrefix}-media" class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-4">
            <h3 class="font-label text-sm tracking-[0.08em] text-primary">Screenshots</h3>
            ${loading
              ? `<div class="space-y-3">${renderInlineSpinner("Loading screenshots...")}</div>`
              : (normalizedScreenshots.length
                ? `
                  <div class="flex items-start justify-between gap-4">
                    <p class="text-sm text-zinc-400">${normalizedScreenshots.length} screenshot${normalizedScreenshots.length === 1 ? "" : "s"}</p>
                    <div class="flex items-center gap-3">
                      <button class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-xs tracking-[0.08em]" data-action="discover-screenshot-prev">Prev</button>
                      <span class="font-label text-xs tracking-[0.08em] text-zinc-400 min-w-[3.75rem] text-center" data-discover-screenshot-counter>1 / ${normalizedScreenshots.length}</span>
                      <button class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-xs tracking-[0.08em]" data-action="discover-screenshot-next">Next</button>
                    </div>
                  </div>
                  <div id="discover-screenshot-carousel" data-screenshot-index="0" class="space-y-4">
                    <button class="block w-full aspect-video bg-zinc-900 overflow-hidden rounded-md text-left group checkpoint-panel" data-action="open-media-lightbox" data-media-context="${escapeHtml(mediaContext)}" data-media-index="0" aria-label="Open screenshot 1">
                      <img id="discover-screenshot-image" class="w-full h-full object-cover grayscale-[22%] hover:grayscale-0 transition-all duration-500" src="${escapeHtml(primaryScreenshot)}" alt="${escapeHtml(title)} screenshot 1">
                    </button>
                    <div class="flex flex-wrap gap-2">
                      ${normalizedScreenshots.map((shot, index) => `
                        <button
                          class="discover-screenshot-thumb overflow-hidden rounded-md border-2 border-outline-variant/40 bg-zinc-900 ${index === 0 ? "is-active" : ""}"
                          data-action="discover-screenshot-jump"
                          data-screenshot-index="${index}"
                          data-screenshot-url="${escapeHtml(shot)}"
                          data-screenshot-alt="${escapeHtml(`${title} screenshot ${index + 1}`)}"
                          aria-label="View screenshot ${index + 1}"
                          aria-pressed="${index === 0 ? "true" : "false"}"
                        >
                          <img class="w-full h-full object-cover grayscale-[50%] hover:grayscale-0 transition-all duration-500" src="${escapeHtml(shot)}" alt="">
                        </button>
                      `).join("")}
                    </div>
                  </div>
                `
                : `<p class="text-sm text-zinc-500">No screenshots available.</p>`)}
          </div>
          <div class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-4">
            <h3 class="font-label text-sm tracking-[0.08em] text-primary">Videos</h3>
            ${loading
              ? `<div class="space-y-3">${renderInlineSpinner("Loading videos...")}</div>`
              : (normalizedVideos.length
                ? `
                  <div class="flex items-start justify-between gap-4">
                    <p class="text-sm text-zinc-400">${normalizedVideos.length} video${normalizedVideos.length === 1 ? "" : "s"}</p>
                    <div class="flex items-center gap-3">
                      <button class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-xs tracking-[0.08em]" data-action="discover-video-prev">Prev</button>
                      <span class="font-label text-xs tracking-[0.08em] text-zinc-400 min-w-[3.75rem] text-center" data-discover-video-counter>1 / ${normalizedVideos.length}</span>
                      <button class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-xs tracking-[0.08em]" data-action="discover-video-next">Next</button>
                    </div>
                  </div>
                  <div id="discover-video-carousel" data-video-index="0" class="space-y-4">
                    <div id="discover-video-frame" class="aspect-video rounded-md overflow-hidden bg-zinc-900">
                      ${primaryVideo?.embedUrl
                        ? `<iframe class="w-full h-full" src="${escapeHtml(primaryVideo.embedUrl)}" title="${escapeHtml(primaryVideoTitle)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`
                        : `<a class="w-full h-full flex items-center justify-center text-sm text-zinc-300 underline" href="${escapeHtml(primaryVideo?.url || "")}" target="_blank" rel="noopener noreferrer">Open video</a>`}
                    </div>
                    <div class="flex flex-wrap gap-2">
                      ${normalizedVideos.map((video, index) => {
                        const thumbUrl = getVideoThumbnailUrl(video);
                        return `
                          <button
                            class="discover-screenshot-thumb overflow-hidden rounded-md border-2 border-outline-variant/40 bg-zinc-900 ${index === 0 ? "is-active" : ""}"
                            data-action="discover-video-jump"
                            data-video-index="${index}"
                            data-video-embed-url="${escapeHtml(video.embedUrl || "")}"
                            data-video-url="${escapeHtml(video.url || "")}"
                            data-video-title="${escapeHtml(String(video.title || `${title} video ${index + 1}`))}"
                            aria-label="Play video ${index + 1}"
                            aria-pressed="${index === 0 ? "true" : "false"}"
                          >
                            ${hasUsableAsset(thumbUrl)
                              ? `<img class="w-full h-full object-cover grayscale-[50%] hover:grayscale-0 transition-all duration-500" src="${escapeHtml(thumbUrl)}" alt="">`
                              : `<span class="w-full h-full flex items-center justify-center text-[11px] font-label tracking-[0.08em] text-zinc-400">Video ${index + 1}</span>`}
                          </button>
                        `;
                      }).join("")}
                    </div>
                  </div>
                `
                : `<p class="text-sm text-zinc-500">No videos available.</p>`)}
          </div>
        </section>
        <section id="${idPrefix}-related" class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-4">
          <h3 class="font-label text-sm tracking-[0.08em] text-primary">Related Titles</h3>
          ${related.length
            ? `<div class="grid items-start grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-x-4 gap-y-6">
                ${related.map((result) => `
                  <button class="group text-left min-h-[16rem] w-full self-start flex flex-col" data-action="select-discover-related" data-search-result-id="${escapeHtml(result.id || `igdb-${String(result.igdbId || "")}`)}">
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
        <h3 class="font-label text-sm tracking-[0.08em] text-primary">${escapeHtml(sideRailTitle)}</h3>
        <div class="metadata-rule pt-4 space-y-4 text-sm">
          <div class="flex items-center justify-between gap-4">
            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Source</span>
            <span class="font-headline font-bold text-on-surface">${escapeHtml(sourceLabel)}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Developer</span>
            <span class="font-headline font-bold text-on-surface text-right">${escapeHtml(developer || "Unknown")}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Publisher</span>
            <span class="font-headline font-bold text-on-surface text-right">${escapeHtml(publisher || "Unknown")}</span>
          </div>
          <div class="flex items-center justify-between gap-4">
            <span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Release</span>
            <span class="font-headline font-bold text-on-surface text-right">${escapeHtml(releaseDate || "Unknown")}</span>
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
                ${itadLink ? `<a class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-[11px] tracking-[0.08em] justify-start" href="${escapeHtml(itadLink)}" target="_blank" rel="noopener noreferrer">IsThereAnyDeal</a>` : ""}
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
