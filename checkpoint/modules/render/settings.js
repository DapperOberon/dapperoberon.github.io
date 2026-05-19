import {
  escapeHtml,
  formatRelative,
  renderActionMessage,
  renderMetaChip,
  renderPreference,
  renderSecondaryAction
} from "./shared.js";

function renderSettingsNotice(messageState) {
  if (!messageState) return "";
  if (messageState.tone === "success" || messageState.tone === "info") {
    return "";
  }
  return renderActionMessage(messageState);
}

function renderScopedPrimaryAction(action, scope, dataAction) {
  return `
    <button class="checkpoint-button checkpoint-button-primary checkpoint-scoped-cta" data-action="${dataAction}">
      <span class="checkpoint-scoped-cta-action">${action}</span>
      <span class="checkpoint-scoped-cta-scope">(${scope})</span>
    </button>
  `;
}

function renderScopedSecondaryAction(action, scope, dataAction, extraClasses = "", extraAttributes = "") {
  return `
    <button class="checkpoint-button checkpoint-button-secondary checkpoint-scoped-cta ${extraClasses}" data-action="${dataAction}" ${extraAttributes}>
      <span class="checkpoint-scoped-cta-action">${action}</span>
      <span class="checkpoint-scoped-cta-scope">(${scope})</span>
    </button>
  `;
}

function renderCompactScopedPrimaryAction(action, scope, dataAction) {
  return `
    <button class="checkpoint-button checkpoint-button-primary px-5 py-3 rounded-md min-w-[11rem] flex flex-col gap-0.5" data-action="${dataAction}">
      <span class="font-label text-[11px] tracking-[0.08em]">${action}</span>
      <span class="font-label text-[10px] tracking-[0.08em] opacity-75">(${scope})</span>
    </button>
  `;
}

function getSettingsRailItems() {
  return [
    { id: "settings-sync-account", label: "Sync & Device" },
    { id: "settings-backup-restore", label: "Backup & Restore" },
    { id: "settings-imports", label: "Imports" },
    { id: "settings-maintenance", label: "Maintenance" },
    { id: "settings-activity", label: "Activity" }
  ];
}

function getSteamImportSteps() {
  return [
    { id: "source", label: "Source" },
    { id: "preview", label: "Preview" },
    { id: "rules", label: "Rules" },
    { id: "review", label: "Review" },
    { id: "import", label: "Import" },
    { id: "complete", label: "Complete" }
  ];
}

function renderSteamImportStepper(activeStep) {
  const steps = getSteamImportSteps();
  const activeIndex = Math.max(0, steps.findIndex((step) => step.id === activeStep));
  return `
    <div class="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1" aria-label="Steam import steps">
      ${steps.map((step, index) => {
        const isActive = step.id === activeStep;
        const isPast = index < activeIndex;
        return `
          <button class="shrink-0 rounded-full px-3 py-2 font-label text-[11px] tracking-[0.08em] transition-colors ${isActive ? "bg-primary text-black" : isPast ? "bg-primary/12 text-primary" : "bg-black/20 text-zinc-500 hover:text-zinc-200"}" data-action="set-steam-import-step" data-step="${step.id}">
            ${index + 1}. ${step.label}
          </button>
        `;
      }).join("")}
    </div>
  `;
}

function renderSteamImportModeToggle(activeMode) {
  const modes = [
    {
      id: "owned-library",
      label: "Owned Library",
      copy: "Official Steam API preview for games in your account."
    },
    {
      id: "wishlist",
      label: "Wishlist",
      copy: "Best-effort paste import for Steam wishlist URLs or copied lists."
    }
  ];

  return `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      ${modes.map((mode) => `
        <button class="rounded-xl p-4 text-left transition-colors ${activeMode === mode.id ? "bg-primary/10 shadow-[inset_0_0_0_2px_rgba(168,232,255,0.26)]" : "bg-black/20 hover:bg-white/[0.04]"}" data-action="set-steam-import-mode" data-mode="${mode.id}">
          <span class="block font-label text-xs tracking-[0.08em] ${activeMode === mode.id ? "text-primary" : "text-zinc-300"}">${mode.label}</span>
          <span class="block mt-2 text-xs leading-relaxed text-zinc-500">${mode.copy}</span>
        </button>
      `).join("")}
    </div>
  `;
}

function formatSteamPlaytime(minutes) {
  const numeric = Number(minutes);
  if (!Number.isFinite(numeric) || numeric <= 0) return "0h";
  const hours = numeric / 60;
  if (hours < 1) return `${Math.round(numeric)}m`;
  if (hours < 10) return `${hours.toFixed(1)}h`;
  return `${Math.round(hours)}h`;
}

function getSteamCandidateBadge(candidate) {
  if (candidate.matchStatus === "existing") {
    return '<span class="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[11px] font-label font-bold tracking-[0.08em] text-emerald-100">Exact match</span>';
  }
  if (candidate.matchStatus === "possible") {
    return '<span class="rounded-full bg-amber-400/10 px-2.5 py-1 text-[11px] font-label font-bold tracking-[0.08em] text-amber-100">Review</span>';
  }
  return '<span class="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-label font-bold tracking-[0.08em] text-primary">New</span>';
}

function getSteamConfidenceLabel(confidence) {
  return {
    exact: "Exact",
    high: "High",
    medium: "Medium",
    none: "None"
  }[confidence] ?? "None";
}

function getSteamActionLabel(action) {
  return {
    add: "Add",
    skip: "Skip",
    merge: "Merge",
    review: "Review"
  }[action] ?? "Review";
}

function getSteamActionTone(action) {
  return {
    add: "checkpoint-button-primary text-[#041017]",
    merge: "checkpoint-button-secondary border-emerald-300/28 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/16 hover:border-emerald-300/38",
    review: "checkpoint-button-secondary border-amber-300/28 bg-amber-400/10 text-amber-100 hover:bg-amber-400/16 hover:border-amber-300/38",
    skip: "checkpoint-button-secondary border-white/[0.12] bg-white/[0.06] text-zinc-200 hover:bg-white/[0.1]"
  }[action] ?? "checkpoint-button-secondary";
}

function renderSteamCandidateActionButton(candidate, action) {
  const isActive = candidate.action === action;
  const activeClasses = getSteamActionTone(action);
  const inactiveClasses = "checkpoint-button-secondary border-primary/14 text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]";
  return `
    <button
      class="checkpoint-button ${isActive ? activeClasses : inactiveClasses} min-w-[5.75rem] rounded-md px-4 py-2.5 font-label text-[11px] font-bold tracking-[0.08em] transition-colors"
      data-action="set-steam-import-candidate-action"
      data-candidate-id="${escapeHtml(candidate.id)}"
      data-value="${action}"
    >
      ${escapeHtml(getSteamActionLabel(action))}
    </button>
  `;
}

function getSteamCandidateStateCopy(candidate) {
  if (candidate?.matchStatus === "existing") {
    return "Checkpoint already has a strong match for this Steam row. Merge keeps one entry while attaching Steam metadata safely.";
  }
  if (candidate?.matchStatus === "possible") {
    if (candidate?.existingSurface === "wishlist") {
      return "This looks close to an item already in Wishlist. Review before importing so we do not create a duplicate watch.";
    }
    return "This looks close to an existing Checkpoint title, but still needs a human decision before import.";
  }
  if (candidate?.igdbSuggestion?.title) {
    return "Checkpoint found an IGDB suggestion for this Steam row. Review if you want to trust the suggested match before adding it.";
  }
  if (!candidate?.appid) {
    return "Steam did not provide a stable AppID for this row, so Checkpoint is treating it conservatively until you review it.";
  }
  if (String(candidate?.parseReason || "").toLowerCase().includes("title unavailable")) {
    return "Steam returned an AppID but no public store title. Checkpoint can still track the row, but metadata may need follow-up enrichment.";
  }
  return "Checkpoint did not find an existing match. This row can be added as a new title.";
}

function getSteamCompleteSummaryCopy(session, result, enrichment) {
  const isWishlist = session.mode === "wishlist";
  const added = Number(result?.added ?? 0);
  const merged = Number(result?.merged ?? 0);
  const skipped = Number(result?.skipped ?? 0);
  const failed = Number(enrichment?.failed ?? 0);
  const enrichmentTouched = Number(enrichment?.metadataUpdated ?? 0) + Number(enrichment?.artworkUpdated ?? 0) + Number(enrichment?.pricingUpdated ?? 0);

  let base = isWishlist
    ? `Steam wishlist import finished: ${added} added, ${merged} merged, ${skipped} skipped.`
    : `Steam owned-library import finished: ${added} added, ${merged} merged, ${skipped} skipped.`;

  if (enrichmentTouched > 0) {
    base += ` Post-import enrichment updated ${Number(enrichment?.metadataUpdated ?? 0)} metadata, ${Number(enrichment?.artworkUpdated ?? 0)} artwork, and ${Number(enrichment?.pricingUpdated ?? 0)} pricing record${Number(enrichment?.pricingUpdated ?? 0) === 1 ? "" : "s"}.`;
  } else {
    base += " No extra enrichment changes were needed after import.";
  }

  if (failed > 0) {
    base += ` ${failed} title${failed === 1 ? "" : "s"} still need follow-up review.`;
  }

  return base;
}

function renderSteamImportSummary(session) {
  const summary = session.summary ?? {};
  const isWishlist = session.mode === "wishlist";
  const tiles = isWishlist
    ? [
        ["Total parsed", summary.total ?? 0],
        ["With AppIDs", summary.withAppIds ?? 0],
        ["Title only", summary.titleOnly ?? 0],
        ["Existing", summary.existing ?? 0],
        ["Needs review", summary.possibleMatches ?? 0],
        ["New", summary.unmatched ?? 0]
      ]
    : [
        ["Total found", summary.total ?? 0],
        ["Played", summary.played ?? 0],
        ["Unplayed", summary.unplayed ?? 0],
        ["Recent", summary.recent ?? 0],
        ["Existing", summary.existing ?? 0],
        ["Needs review", summary.possibleMatches ?? 0],
        ["New", summary.unmatched ?? 0]
      ];

  return `
    <div class="grid ${isWishlist ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-6" : "grid-cols-2 md:grid-cols-4 xl:grid-cols-7"} gap-3">
      ${tiles.map(([label, value]) => `
        <div class="rounded-lg bg-black/20 px-4 py-3">
          <p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">${escapeHtml(label)}</p>
          <p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(value)}</p>
        </div>
      `).join("")}
    </div>
  `;
}

function renderSteamImportErrors(errors) {
  const rows = Array.isArray(errors) ? errors.filter(Boolean) : [];
  if (!rows.length) return "";

  return `
    <div class="rounded-lg border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
      ${rows.map((error) => `<p>${escapeHtml(error)}</p>`).join("")}
    </div>
  `;
}

function renderSteamOwnedPreviewRows(session) {
  const candidates = Array.isArray(session.candidates) ? session.candidates : [];
  const isWishlist = session.mode === "wishlist";
  if (!candidates.length) {
    return `
      <div class="rounded-lg bg-black/20 px-4 py-8 text-sm text-zinc-500">
        Fetch a Steam preview to see owned-library candidates here. Nothing will be imported during this step.
      </div>
    `;
  }

  return `
    <div class="overflow-hidden rounded-xl bg-black/20 checkpoint-steam-preview-table">
      <div class="checkpoint-steam-preview-head hidden md:grid px-4 py-3 font-label text-[10px] tracking-[0.08em] text-zinc-500">
        <span class="checkpoint-steam-preview-cell">Steam game</span>
        <span class="checkpoint-steam-preview-cell">${isWishlist ? "Source" : "Total"}</span>
        <span class="checkpoint-steam-preview-cell">${isWishlist ? "Confidence" : "Recent"}</span>
        <span class="checkpoint-steam-preview-cell">Proposed</span>
        <span class="checkpoint-steam-preview-cell">Match</span>
      </div>
      <div class="divide-y divide-white/[0.06]">
        ${candidates.slice(0, 40).map((candidate) => `
          <div class="checkpoint-steam-preview-row grid grid-cols-1 gap-3 md:gap-4 px-4 py-4 items-start">
            <div class="checkpoint-steam-preview-cell min-w-0">
              <p class="font-headline font-bold text-on-surface truncate" title="${escapeHtml(candidate.title)}">${escapeHtml(candidate.title)}</p>
              <p class="mt-1 font-label text-[10px] tracking-[0.08em] text-zinc-500">${candidate.appid ? `AppID ${escapeHtml(candidate.appid)}` : "Title-only parse"}</p>
            </div>
            <p class="checkpoint-steam-preview-cell checkpoint-steam-preview-nowrap min-w-0 text-sm text-zinc-300 truncate" title="${escapeHtml(isWishlist ? (candidate.parseReason || (candidate.appid ? "Steam app URL" : "Pasted title")) : formatSteamPlaytime(candidate.playtimeForeverMinutes))}">${escapeHtml(isWishlist ? (candidate.parseReason || (candidate.appid ? "Steam app URL" : "Pasted title")) : formatSteamPlaytime(candidate.playtimeForeverMinutes))}</p>
            <p class="checkpoint-steam-preview-cell checkpoint-steam-preview-nowrap text-sm ${!isWishlist && candidate.playtime2WeeksMinutes > 0 ? "text-primary" : "text-zinc-500"}">${escapeHtml(isWishlist ? getSteamConfidenceLabel(candidate.parseConfidence || "low") : formatSteamPlaytime(candidate.playtime2WeeksMinutes))}</p>
            <p class="checkpoint-steam-preview-cell checkpoint-steam-preview-nowrap font-label text-[11px] font-bold tracking-[0.08em] text-zinc-300">${escapeHtml(candidate.proposedStatus === "wishlist" ? "Wishlist" : candidate.proposedStatus === "playing" ? "Playing" : "Backlog")}</p>
            <div class="checkpoint-steam-preview-cell min-w-0 flex flex-col items-start gap-1">
              ${getSteamCandidateBadge(candidate)}
              ${candidate.existingTitle ? `<span class="checkpoint-steam-preview-nowrap max-w-full text-xs text-zinc-500 truncate" title="${escapeHtml(candidate.existingTitle)}">${escapeHtml(candidate.existingTitle)}</span>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
      ${candidates.length > 40 ? `<p class="px-4 py-3 text-xs text-zinc-500">Showing first 40 of ${escapeHtml(candidates.length)} preview rows. Full review comes in the conflict step.</p>` : ""}
    </div>
  `;
}

function renderSteamImportReviewRows(session) {
  const actionOrder = { add: 0, merge: 1, skip: 2, review: 3 };
  const candidates = Array.isArray(session.candidates)
    ? session.candidates.slice().sort((a, b) => {
        const actionDelta = (actionOrder[a?.action] ?? 99) - (actionOrder[b?.action] ?? 99);
        if (actionDelta !== 0) return actionDelta;
        return String(a?.title || "").localeCompare(String(b?.title || ""));
      })
    : [];
  if (!candidates.length) {
    return `
      <div class="rounded-lg bg-black/20 px-4 py-8 text-sm text-zinc-500">
        Fetch a Steam preview first so Checkpoint can build a conflict review list.
      </div>
    `;
  }

  return `
    <div class="space-y-3 checkpoint-import-review-scroll pr-1 custom-scrollbar">
      ${candidates.map((candidate) => {
        const showSuggestion = candidate.matchStatus === "unmatched" && candidate.igdbSuggestion;
        const canSearchForMatch = candidate.matchStatus !== "existing";
        const matchSearchOptions = Array.isArray(session.matchOptions?.[candidate.id]) ? session.matchOptions[candidate.id] : [];
        const matchSearchQuery = String(session.matchQueries?.[candidate.id] || candidate.title || "").trim();
        const matchSearchError = String(session.matchSearchErrors?.[candidate.id] || "").trim();
        const isSearchingMatch = session.matchSearchLoadingId === candidate.id;
        const selectedManualSuggestion = candidate.igdbSuggestion?.manual ? candidate.igdbSuggestion : null;
        const matchInputId = `steam-import-match-query-${escapeHtml(candidate.id)}`;
        const actions = candidate.matchStatus === "existing"
          ? ["merge", "skip"]
          : candidate.matchStatus === "possible"
            ? ["review", "merge", "skip"]
            : showSuggestion
              ? ["review", "add", "skip"]
              : ["add", "skip"];

        return `
          <div class="rounded-xl bg-black/20 px-4 py-4 space-y-4">
            <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div class="min-w-0 space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-headline text-lg font-bold text-on-surface">${escapeHtml(candidate.title)}</p>
                  ${getSteamCandidateBadge(candidate)}
                  <span class="rounded-full bg-white/[0.05] px-2.5 py-1 text-[11px] font-label tracking-[0.08em] text-zinc-400">Confidence ${escapeHtml(getSteamConfidenceLabel(candidate.matchConfidence))}</span>
                </div>
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                  <span>AppID ${escapeHtml(candidate.appid ?? "Unknown")}</span>
                  <span>Total ${escapeHtml(formatSteamPlaytime(candidate.playtimeForeverMinutes))}</span>
                  <span>Recent ${escapeHtml(formatSteamPlaytime(candidate.playtime2WeeksMinutes))}</span>
                  <span>Proposed ${escapeHtml(candidate.proposedStatus === "wishlist" ? "Wishlist" : candidate.proposedStatus === "playing" ? "Playing" : "Backlog")}</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 xl:max-w-[26rem] xl:justify-end">
                ${actions.map((action) => renderSteamCandidateActionButton(candidate, action)).join("")}
              </div>
            </div>
            <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-3">
              <div class="rounded-lg bg-black/20 px-4 py-3">
                <p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Match Reason</p>
                <p class="mt-2 text-sm text-zinc-300">${escapeHtml(candidate.matchReasonLabel)}</p>
                ${candidate.existingTitle ? `<p class="mt-1 text-xs text-zinc-500">Existing ${escapeHtml(candidate.existingSurfaceLabel || "entry")}: ${escapeHtml(candidate.existingTitle)}</p>` : ""}
                <p class="mt-3 text-xs leading-relaxed text-zinc-500">${escapeHtml(getSteamCandidateStateCopy(candidate))}</p>
              </div>
              <div class="rounded-lg bg-black/20 px-4 py-3">
                <div class="flex items-center justify-between gap-3">
                  <p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">${showSuggestion || selectedManualSuggestion ? "IGDB Suggestion" : "Current Decision"}</p>
                </div>
                ${canSearchForMatch ? `
                  <div class="mt-3 checkpoint-match-search-grid">
                    <label class="min-w-0 space-y-2">
                      <span class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Search title</span>
                      <input
                        id="${matchInputId}"
                        class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-label text-sm text-on-surface focus:ring-1 focus:ring-primary"
                        type="text"
                        value="${escapeHtml(matchSearchQuery)}"
                        placeholder="Search for the correct game title or Title, 2023"
                      >
                    </label>
                    <button
                      class="checkpoint-button checkpoint-button-secondary w-full px-4 py-3 text-[11px] tracking-[0.08em] lg:min-w-[14rem] ${isSearchingMatch ? "opacity-60 cursor-not-allowed" : ""}"
                      data-action="search-steam-import-match"
                      data-candidate-id="${escapeHtml(candidate.id)}"
                      data-input-id="${matchInputId}"
                      ${isSearchingMatch ? "disabled" : ""}
                    >
                      ${isSearchingMatch ? "Searching..." : (matchSearchOptions.length ? "Refresh Match Search" : "Find Better Match")}
                    </button>
                  </div>
                ` : ""}
                ${showSuggestion ? `
                  <p class="mt-3 text-sm text-zinc-300">${escapeHtml(candidate.igdbSuggestion.title || "Suggested metadata match")}</p>
                  ${candidate.igdbSuggestion.releaseDate ? `<p class="mt-1 text-xs text-zinc-500">${escapeHtml(candidate.igdbSuggestion.releaseDate)}</p>` : ""}
                  <p class="mt-3 text-xs leading-relaxed text-zinc-500">Review keeps this row conservative until you decide whether the IGDB suggestion is trustworthy enough to merge or add.</p>
                ` : `
                  <p class="mt-3 text-sm text-zinc-300">${escapeHtml(getSteamActionLabel(candidate.action))}</p>
                  <p class="mt-1 text-xs text-zinc-500">Default ${escapeHtml(getSteamActionLabel(candidate.defaultAction))}</p>
                  <p class="mt-3 text-xs leading-relaxed text-zinc-500">${escapeHtml(candidate.action === "skip" ? "Skipping leaves the Steam row out of this import pass, but you can always re-run the preview later." : candidate.action === "merge" ? "Merging keeps one Checkpoint entry while attaching Steam metadata and identity safely." : candidate.action === "review" ? "Review keeps this row out of commit until you are comfortable with the match." : "Adding creates a new Checkpoint title from this Steam row without touching existing entries.")}</p>
                `}
                ${selectedManualSuggestion ? `
                  <div class="mt-3 rounded-lg border border-primary/14 bg-primary/8 px-3 py-3">
                    <p class="font-label text-[10px] tracking-[0.08em] text-primary">Selected Manual Match</p>
                    <p class="mt-2 text-sm text-zinc-200">${escapeHtml(selectedManualSuggestion.title || "Selected IGDB title")}</p>
                    ${selectedManualSuggestion.releaseDate ? `<p class="mt-1 text-xs text-zinc-500">${escapeHtml(selectedManualSuggestion.releaseDate)}</p>` : ""}
                  </div>
                ` : ""}
                ${matchSearchError ? `<p class="mt-3 text-xs text-amber-200">${escapeHtml(matchSearchError)}</p>` : ""}
                ${matchSearchOptions.length ? `
                  <div class="mt-3 space-y-2 checkpoint-match-results overflow-y-auto pr-1 custom-scrollbar">
                    ${matchSearchOptions.map((option) => `
                      <div class="flex items-center justify-between gap-3 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-3">
                        <div class="min-w-0 flex items-center gap-3">
                          <div class="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-zinc-900">
                            ${option.coverArt
                              ? `<img class="h-full w-full object-cover" src="${escapeHtml(option.coverArt)}" alt="${escapeHtml(option.title || `IGDB ${option.igdbId}`)} cover">`
                              : `<div class="h-full w-full bg-zinc-900"></div>`}
                          </div>
                          <div class="min-w-0">
                            <p class="truncate text-sm text-zinc-200">${escapeHtml(option.title || `IGDB ${option.igdbId}`)}</p>
                            <div class="mt-1 flex flex-wrap items-center gap-2">
                              <span class="text-xs text-zinc-500">${escapeHtml(option.releaseDate || "Release unknown")}</span>
                              ${option.gameTypeLabel ? renderMetaChip(option.gameTypeLabel, "primary") : ""}
                            </div>
                          </div>
                        </div>
                        <button
                          class="checkpoint-button checkpoint-button-secondary rounded-md px-3 py-2 font-label text-[10px] font-bold tracking-[0.08em]"
                          data-action="apply-steam-import-match"
                          data-candidate-id="${escapeHtml(candidate.id)}"
                          data-match-igdb-id="${escapeHtml(option.igdbId)}"
                        >
                          Use Match
                        </button>
                      </div>
                    `).join("")}
                  </div>
                ` : ""}
              </div>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function renderSteamImportSourceStep(session, serviceConfig) {
  const isWishlist = session.mode === "wishlist";
  const workerReady = Boolean(serviceConfig?.workerBaseUrl || serviceConfig?.steamGridWorkerUrl);
  const source = session.source ?? {};
  const loading = Boolean(session.loading);

  if (isWishlist) {
    return `
      <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-5">
        <div class="rounded-lg bg-black/20 px-4 py-4 space-y-4">
          <div>
            <label class="font-label text-[11px] tracking-[0.08em] text-zinc-500" for="steam-wishlist-source">Wishlist URL or copied list</label>
            <textarea id="steam-wishlist-source" class="mt-2 min-h-36 w-full rounded-lg bg-black/30 border border-primary/10 px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary" placeholder="Paste a Steam wishlist URL, copied wishlist page content, or one Steam app URL/title per line.">${escapeHtml(source.wishlistSource ?? "")}</textarea>
          </div>
          <p class="text-xs text-zinc-500 leading-relaxed">Wishlist import is best-effort. Checkpoint will parse what Steam exposes, surface anything uncertain, and wait for review before adding or merging titles.</p>
          ${renderSteamImportErrors(session.errors)}
        </div>
        <div class="rounded-lg bg-black/20 px-4 py-4 space-y-3">
          <p class="font-label text-[11px] tracking-[0.08em] text-primary">What happens next</p>
          <p class="text-xs text-zinc-500 leading-relaxed">Checkpoint will extract Steam AppIDs and titles where possible, then compare them against your Library and Wishlist before anything is committed.</p>
          ${renderSecondaryAction(loading ? "Parsing..." : "Parse Preview", "fetch-steam-wishlist-preview", `w-full px-4 py-2 text-[11px] tracking-[0.12em] justify-center ${loading ? "opacity-60 cursor-not-allowed" : ""}`, loading ? "disabled" : "")}
        </div>
      </div>
    `;
  }

  return `
    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_280px] gap-5">
      <div class="rounded-lg bg-black/20 px-4 py-4 space-y-4">
        <div>
          <label class="font-label text-[11px] tracking-[0.08em] text-zinc-500" for="steam-profile-source">SteamID64 or profile URL</label>
          <input id="steam-profile-source" class="mt-2 w-full rounded-lg bg-black/30 border border-primary/10 px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary" type="text" value="${escapeHtml(source.steamProfile ?? "")}" placeholder="https://steamcommunity.com/id/your-profile or SteamID64">
        </div>
        <label class="flex items-center justify-between gap-4 rounded-lg bg-black/20 px-4 py-3 text-sm text-on-surface">
          <span>Include played free games</span>
          <input id="steam-include-free-played" type="checkbox" ${source.includeFreePlayed === false ? "" : "checked"} class="accent-primary">
        </label>
        <p class="text-xs text-zinc-500 leading-relaxed">Owned-library import uses Steam's official API. Steam playtime stays separate from Checkpoint progress, and nothing is written until you confirm the review step.</p>
        ${renderSteamImportErrors(session.errors)}
      </div>
      <div class="rounded-lg bg-black/20 px-4 py-4 space-y-3">
        <p class="font-label text-[11px] tracking-[0.08em] text-primary">Setup Status</p>
        <p class="text-xs leading-relaxed ${workerReady ? "text-zinc-400" : "text-amber-200"}">${workerReady ? "Worker endpoint is configured. If STEAM_WEB_API_KEY is present on the worker, preview can run now." : "Worker endpoint is not configured yet, so Steam preview cannot run."}</p>
        ${session.lastResolvedSteamId ? `<p class="text-xs text-zinc-500">Last SteamID: <span class="text-zinc-300">${escapeHtml(session.lastResolvedSteamId)}</span></p>` : ""}
        ${renderSecondaryAction(loading ? "Fetching..." : "Fetch Preview", "fetch-steam-owned-preview", `w-full px-4 py-2 text-[11px] tracking-[0.12em] justify-center ${loading || !workerReady ? "opacity-60 cursor-not-allowed" : ""}`, loading || !workerReady ? "disabled" : "")}
      </div>
    </div>
  `;
}

function renderSteamImportPlanningStep(session) {
  const isWishlist = session.mode === "wishlist";
  return `
    <div class="rounded-lg bg-black/20 px-4 py-4 space-y-4">
      <p class="font-label text-[11px] tracking-[0.08em] text-primary">${isWishlist ? "Wishlist Review Flow" : "Owned Library Review Flow"}</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div class="rounded-lg bg-black/20 px-4 py-4">
          <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-2">${isWishlist ? "Destination" : "Default Destination"}</p>
          <p class="text-sm text-on-surface">${isWishlist ? "Wishlist" : "Backlog"}</p>
          <p class="text-xs text-zinc-500 mt-2">${isWishlist ? "Existing wishlist/library items are not duplicated." : "Recently played games can be suggested as Playing later."}</p>
        </div>
        <div class="rounded-lg bg-black/20 px-4 py-4">
          <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-2">Conflict Handling</p>
          <p class="text-sm text-on-surface">Review before import</p>
          <p class="text-xs text-zinc-500 mt-2">Exact Steam AppID matches merge metadata; title-only matches require review.</p>
        </div>
        <div class="rounded-lg bg-black/20 px-4 py-4">
          <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-2">Playtime</p>
          <p class="text-sm text-on-surface">Steam stays separate</p>
          <p class="text-xs text-zinc-500 mt-2">Imported Steam playtime will not overwrite Checkpoint progress.</p>
        </div>
      </div>
    </div>
  `;
}

function renderSteamImportPreviewStep(session) {
  const isWishlist = session.mode === "wishlist";
  return `
    <div class="space-y-4">
      ${renderSteamImportErrors(session.errors)}
      ${renderSteamImportSummary(session)}
      <div class="rounded-lg bg-black/20 px-4 py-4">
        <p class="font-label text-[11px] tracking-[0.08em] text-primary mb-2">Read-only Preview</p>
        <p class="text-sm text-zinc-500 leading-relaxed">${isWishlist ? "These parsed wishlist rows are still only candidates. The next step separates clear adds from rows that need human review, especially when Steam provides only partial titles or when something already exists in Library or Wishlist." : "These owned-library rows are still only candidates. The next steps apply import rules, surface conflicts, and wait for an explicit commit before anything is written."}</p>
      </div>
      <div class="checkpoint-import-preview-scroll custom-scrollbar pr-1">
        ${renderSteamOwnedPreviewRows(session)}
      </div>
    </div>
  `;
}

function renderSteamImportRulesStep(session) {
  const rules = session.rules ?? {};
  const destination = rules.defaultDestination === "playing" ? "playing" : "backlog";
  const duplicateBehavior = rules.duplicateBehavior === "skip"
    ? "skip"
    : rules.duplicateBehavior === "ask-title"
      ? "ask-title"
      : "merge-appid";

  const destinationOptions = [
    {
      value: "backlog",
      label: "Backlog",
      copy: "Default owned games to backlog unless recently played nudges them into Playing."
    },
    {
      value: "playing",
      label: "Playing",
      copy: "Aggressive default. Useful only if you want Steam import to feel like an active-now list."
    }
  ];

  const duplicateOptions = [
    {
      value: "merge-appid",
      label: "Merge exact AppID",
      copy: "Recommended. Exact Steam matches merge metadata safely, title-only matches still need review."
    },
    {
      value: "skip",
      label: "Skip duplicates",
      copy: "Conservative. Existing exact matches are ignored entirely during import."
    },
    {
      value: "ask-title",
      label: "Ask on title-only",
      copy: "Exact AppID matches merge, but normalized title matches are surfaced for manual review."
    }
  ];

  return `
    <div class="space-y-5">
      ${renderSteamImportSummary(session)}
      <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
        <div class="rounded-lg bg-black/20 px-4 py-4 space-y-4">
          <div>
            <p class="font-label text-[11px] tracking-[0.08em] text-primary">Default Destination</p>
            <p class="mt-2 text-sm text-zinc-500 leading-relaxed">Imported owned-library games should land in one safe place before you curate them further.</p>
          </div>
          <div class="space-y-3">
            ${destinationOptions.map((option) => `
              <button class="w-full rounded-lg px-4 py-4 text-left transition-colors ${destination === option.value ? "bg-primary/10 shadow-[inset_0_0_0_2px_rgba(168,232,255,0.26)]" : "bg-black/20 hover:bg-white/[0.04]"}" data-action="set-steam-import-rule" data-rule="defaultDestination" data-value="${option.value}">
                <span class="block font-label text-[11px] font-bold tracking-[0.08em] ${destination === option.value ? "text-primary" : "text-zinc-300"}">${option.label}</span>
                <span class="mt-2 block text-xs leading-relaxed text-zinc-500">${option.copy}</span>
              </button>
            `).join("")}
          </div>
        </div>
        <div class="rounded-lg bg-black/20 px-4 py-4 space-y-4">
          <div>
            <p class="font-label text-[11px] tracking-[0.08em] text-primary">Recently Played Suggestion</p>
            <p class="mt-2 text-sm text-zinc-500 leading-relaxed">Keep Steam’s recent activity as a lightweight signal instead of treating all playtime as currently playing.</p>
          </div>
          <label class="flex items-center justify-between gap-4 rounded-lg bg-black/20 px-4 py-3 text-sm text-on-surface">
            <span>Suggest "Playing" when Steam shows recent playtime</span>
            <input id="steam-rules-suggest-playing" type="checkbox" ${rules.suggestRecentlyPlayedAsPlaying === false ? "" : "checked"} class="accent-primary">
          </label>
          <div class="rounded-lg bg-black/20 px-4 py-4">
            <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-2">Finished Import</p>
            <p class="text-sm text-zinc-400 leading-relaxed">Checkpoint will never auto-import games as "Finished" from Steam data.</p>
          </div>
        </div>
      </div>
      <div class="rounded-lg bg-black/20 px-4 py-4 space-y-4">
        <div>
          <p class="font-label text-[11px] tracking-[0.08em] text-primary">Duplicate Behavior</p>
          <p class="mt-2 text-sm text-zinc-500 leading-relaxed">Choose how Steam import should treat rows that already appear in your catalog or library.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          ${duplicateOptions.map((option) => `
            <button class="rounded-lg px-4 py-4 text-left transition-colors ${duplicateBehavior === option.value ? "bg-primary/10 shadow-[inset_0_0_0_2px_rgba(168,232,255,0.26)]" : "bg-black/20 hover:bg-white/[0.04]"}" data-action="set-steam-import-rule" data-rule="duplicateBehavior" data-value="${option.value}">
              <span class="block font-label text-[11px] font-bold tracking-[0.08em] ${duplicateBehavior === option.value ? "text-primary" : "text-zinc-300"}">${option.label}</span>
              <span class="mt-2 block text-xs leading-relaxed text-zinc-500">${option.copy}</span>
            </button>
          `).join("")}
        </div>
      </div>
    </div>
  `;
}

function renderSteamImportFlowFooter(session) {
  const candidates = Array.isArray(session.candidates) ? session.candidates : [];
  const hasCandidates = candidates.length > 0;
  const reviewCount = candidates.filter((candidate) => candidate.action === "review").length;
  const actionableCount = candidates.filter((candidate) => candidate.action === "add" || candidate.action === "merge").length;
  const loadingDisabled = session.loading ? "opacity-60 cursor-not-allowed" : "";
  const isWishlist = session.mode === "wishlist";

  if (session.step === "preview") {
    if (isWishlist) {
      return `
        <div class="flex flex-wrap gap-3 pt-2">
          ${renderScopedSecondaryAction("Go To Review", "Next Step", "set-steam-import-step", `${!hasCandidates ? "opacity-60 cursor-not-allowed" : ""}`, `${!hasCandidates ? "disabled" : ""} data-step="review"`)}
        </div>
      `;
    }
    return `
      <div class="flex flex-wrap gap-3 pt-2">
        ${renderScopedSecondaryAction("Review Rules", "Step 3", "set-steam-import-step", `${!hasCandidates ? "opacity-60 cursor-not-allowed" : ""}`, `${!hasCandidates ? "disabled" : ""} data-step="rules"`)}
        ${renderScopedSecondaryAction("Go To Review", "Step 4", "set-steam-import-step", `${!hasCandidates ? "opacity-60 cursor-not-allowed" : ""}`, `${!hasCandidates ? "disabled" : ""} data-step="review"`)}
      </div>
    `;
  }

  if (session.step === "rules") {
    if (isWishlist) {
      return `
        <div class="flex flex-wrap gap-3 pt-2">
          ${renderScopedSecondaryAction("Back To Preview", "Step 2", "set-steam-import-step", "", 'data-step="preview"')}
          ${renderScopedSecondaryAction("Continue To Review", "Step 4", "set-steam-import-step", `${!hasCandidates ? "opacity-60 cursor-not-allowed" : ""}`, `${!hasCandidates ? "disabled" : ""} data-step="review"`)}
        </div>
      `;
    }
    return `
      <div class="flex flex-wrap gap-3 pt-2">
        ${renderScopedSecondaryAction("Back To Preview", "Step 2", "set-steam-import-step", "", 'data-step="preview"')}
        ${renderScopedSecondaryAction("Continue To Review", "Step 4", "set-steam-import-step", `${!hasCandidates ? "opacity-60 cursor-not-allowed" : ""}`, `${!hasCandidates ? "disabled" : ""} data-step="review"`)}
      </div>
    `;
  }

  if (session.step === "review") {
    return `
      <div class="rounded-lg bg-black/20 px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p class="font-label text-[11px] tracking-[0.08em] text-primary">Ready Check</p>
          <p class="mt-1 text-sm text-zinc-500">${reviewCount ? `${reviewCount} review item${reviewCount === 1 ? "" : "s"} still need a decision.` : `${actionableCount} import action${actionableCount === 1 ? "" : "s"} ready to commit.`}</p>
        </div>
        <div class="flex flex-wrap gap-3">
          ${renderScopedSecondaryAction("Back To Rules", "Step 3", "set-steam-import-step", "", 'data-step="rules"')}
          ${renderScopedSecondaryAction("Prepare Import", "Step 5", "set-steam-import-step", `${reviewCount ? "opacity-60 cursor-not-allowed" : ""}`, `${reviewCount ? "disabled" : ""} data-step="import"`)}
        </div>
      </div>
    `;
  }

  if (session.step === "import") {
    return `
      <div class="flex flex-wrap gap-3 pt-2">
        ${renderScopedSecondaryAction("Back To Review", "Step 4", "set-steam-import-step", "", 'data-step="review"')}
        ${session.loading
          ? renderScopedSecondaryAction("Cancel Import", "Safe Stop", "cancel-job", "", 'data-job-key="steam-import"')
          : ""}
        ${renderScopedPrimaryAction(session.loading ? "Importing..." : (session.mode === "wishlist" ? "Import Wishlist" : "Import Selected"), "This Device", "commit-steam-owned-import").replace('checkpoint-scoped-cta"', `checkpoint-scoped-cta ${loadingDisabled}"`).replace("data-action=\"commit-steam-owned-import\"", `data-action="commit-steam-owned-import"${session.loading ? " disabled" : ""}`)}
      </div>
    `;
  }

  if (session.step === "complete") {
    return `
      <div class="flex flex-wrap gap-3 pt-2">
        ${renderScopedSecondaryAction("Start Another Preview", "Step 1", "set-steam-import-step", "", 'data-step="source"')}
      </div>
    `;
  }

  return "";
}

function renderSteamImportStepBody(session, serviceConfig) {
  switch (session.step) {
    case "source":
      return renderSteamImportSourceStep(session, serviceConfig);
    case "preview":
      return renderSteamImportPreviewStep(session);
    case "rules":
      return session.mode === "owned-library"
        ? renderSteamImportRulesStep(session)
        : renderSteamImportPlanningStep(session);
    case "review":
      return `
        <div class="space-y-4">
          ${renderSteamImportErrors(session.errors)}
          <div class="rounded-lg bg-black/20 px-4 py-4">
            <p class="font-label text-[11px] tracking-[0.08em] text-primary mb-2">Conflict Review</p>
            <p class="text-sm text-zinc-500 leading-relaxed">${session.mode === "wishlist" ? "Review duplicate watches, title-only parses, and unresolved Steam rows before import commit is enabled. Actions here stay transient until you confirm the final import." : "Review exact duplicates, title-only matches, and unresolved Steam rows before import commit is enabled. Actions here stay transient until you confirm the final import."}</p>
          </div>
          ${renderSteamImportReviewRows(session)}
        </div>
      `;
    case "import":
      {
        const summary = Array.isArray(session.candidates) ? session.candidates : [];
        const addCount = summary.filter((candidate) => candidate.action === "add").length;
        const mergeCount = summary.filter((candidate) => candidate.action === "merge").length;
        const skipCount = summary.filter((candidate) => candidate.action === "skip").length;
        const reviewCount = summary.filter((candidate) => candidate.action === "review").length;
        return `
          <div class="space-y-4">
            ${renderSteamImportErrors(session.errors)}
            <div class="rounded-lg bg-black/20 px-4 py-4 space-y-3">
              <p class="font-label text-[11px] tracking-[0.08em] text-primary">Import Commit</p>
              <p class="text-sm text-zinc-500 leading-relaxed">${session.mode === "wishlist" ? "Checkpoint will add new wishlist titles, merge safe matches into existing entries, and leave anything unresolved out of the commit until you review it." : "Checkpoint will add new owned games, merge safe matches into existing entries, and keep Steam playtime separate from local progress."}</p>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Add</p><p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(addCount)}</p></div>
                <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Merge</p><p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(mergeCount)}</p></div>
                <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Skip</p><p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(skipCount)}</p></div>
                <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Review Remaining</p><p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(reviewCount)}</p></div>
              </div>
            </div>
          </div>
        `;
      }
    case "complete":
      {
        const result = session.commitResult ?? { added: 0, merged: 0, skipped: 0, total: 0 };
        const isWishlist = session.mode === "wishlist";
        const enrichment = result.enrichment ?? {
          attempted: 0,
          metadataUpdated: 0,
          artworkUpdated: 0,
          pricingUpdated: 0,
          pricingSkipped: 0,
          failed: 0,
          errors: []
        };
        return `
          <div class="rounded-lg bg-black/20 px-4 py-4 space-y-3">
            <p class="font-label text-[11px] tracking-[0.08em] text-primary">Import Complete</p>
            <p class="text-sm text-zinc-500 leading-relaxed">${escapeHtml(getSteamCompleteSummaryCopy(session, result, enrichment))}</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Total</p><p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(result.total)}</p></div>
              <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Added</p><p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(result.added)}</p></div>
              <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Merged</p><p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(result.merged)}</p></div>
              <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Skipped</p><p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(result.skipped)}</p></div>
            </div>
            <div class="rounded-lg bg-black/20 px-4 py-4 space-y-3">
              <div class="flex flex-col gap-1">
                <p class="font-label text-[11px] tracking-[0.08em] text-primary">Post-Import Enrichment</p>
                <p class="text-sm text-zinc-500 leading-relaxed">Imported titles were pushed through the same IGDB-first metadata/media pipeline and ITAD pricing lookup used elsewhere in Checkpoint.</p>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Titles</p><p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(enrichment.attempted)}</p></div>
                <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Metadata</p><p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(enrichment.metadataUpdated)}</p></div>
                <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Artwork</p><p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(enrichment.artworkUpdated)}</p></div>
                <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Pricing</p><p class="mt-1 font-headline text-2xl font-bold text-on-surface">${escapeHtml(enrichment.pricingUpdated)}</p></div>
                <div class="rounded-lg bg-black/20 px-4 py-3"><p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Partial Failures</p><p class="mt-1 font-headline text-2xl font-bold ${enrichment.failed ? "text-amber-200" : "text-on-surface"}">${escapeHtml(enrichment.failed)}</p></div>
              </div>
              ${enrichment.pricingSkipped ? `<p class="text-xs text-zinc-500">Pricing enrichment was skipped for ${escapeHtml(enrichment.pricingSkipped)} title${enrichment.pricingSkipped === 1 ? "" : "s"} because ITAD is not configured in this environment.</p>` : ""}
              ${Array.isArray(enrichment.errors) && enrichment.errors.length
                ? `<div class="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                    <p class="font-label text-[10px] tracking-[0.08em] text-amber-200 mb-2">Needs Review</p>
                    <ul class="space-y-1 text-sm text-zinc-300">
                      ${enrichment.errors.slice(0, 5).map((message) => `<li>${escapeHtml(message)}</li>`).join("")}
                    </ul>
                  </div>`
                : ""}
            </div>
          </div>
        `;
      }
    default:
      return renderSteamImportSourceStep(session, serviceConfig);
  }
}

function renderSteamImportPanel(snapshot) {
  const session = snapshot.steamImport ?? {};
  const mode = session.mode === "wishlist" ? "wishlist" : "owned-library";
  const normalizedSession = {
    ...session,
    mode,
    step: typeof session.step === "string" ? session.step : "source"
  };

  return `
    <section id="settings-imports" data-surface-region="settings-imports" class="space-y-8 mt-10">
      <div class="checkpoint-subpanel p-7 rounded-xl flex flex-col gap-6">
        <div class="flex flex-col gap-2">
          <p class="font-label text-[11px] tracking-[0.08em] text-primary">Steam Import</p>
          <h3 class="text-2xl font-headline font-bold text-on-surface">Bring Steam into Checkpoint safely.</h3>
          <p class="text-sm text-zinc-500 leading-relaxed max-w-3xl">Preview Steam data, resolve matches, and only commit selected entries after review. Owned games default to Backlog, and Steam playtime stays separate from Checkpoint progress.</p>
        </div>
        ${renderSteamImportModeToggle(mode)}
        ${renderSteamImportStepper(normalizedSession.step)}
        ${renderSteamImportStepBody(normalizedSession, snapshot.serviceConfig)}
        ${renderSteamImportFlowFooter(normalizedSession)}
      </div>
    </section>
  `;
}

function renderSettingsSectionRail(items, activeSection, mode = "mobile") {
  if (mode === "desktop") {
    return `
      <aside data-surface-region="settings-local-nav" class="hidden xl:block">
        <div class="checkpoint-toolbar rounded-xl p-4 sticky top-32">
          <p class="font-label text-[11px] tracking-[0.08em] text-primary mb-4">Settings Pages</p>
          <nav class="flex flex-col gap-1">
            ${items.map((item) => `
              <button class="px-3 py-2 rounded-md font-label tracking-[0.08em] text-[11px] text-left transition-colors ${item.id === activeSection ? "bg-primary/10 text-primary" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"}" data-action="set-settings-section" data-section="${item.id}">
                ${item.label}
              </button>
            `).join("")}
          </nav>
        </div>
      </aside>
    `;
  }

  return `
    <section data-surface-region="settings-local-nav" class="checkpoint-toolbar rounded-xl px-3 py-3 mb-8 xl:hidden">
      <nav class="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:overflow-x-auto sm:custom-scrollbar">
        ${items.map((item) => `
          <button class="px-3 py-2 min-h-10 rounded-md font-label tracking-[0.08em] text-[11px] transition-colors ${item.id === activeSection ? "bg-primary/10 text-primary" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"}" data-action="set-settings-section" data-section="${item.id}">
            ${item.label}
          </button>
        `).join("")}
      </nav>
    </section>
  `;
}

function renderSyncHistoryPanel(syncHistory) {
  const entries = Array.isArray(syncHistory) ? syncHistory.slice(0, 6) : [];
  if (!entries.length) {
    return `
      <div class="checkpoint-subpanel p-7 rounded-xl flex flex-col gap-3 xl:col-span-2 w-full min-w-0 max-w-none">
        <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary">Recent Sync Activity</h3>
        <p class="text-sm text-zinc-500">No sync activity yet. Run Sync Now after connecting Drive to populate this history.</p>
      </div>
    `;
  }

  return `
    <div class="checkpoint-subpanel p-7 rounded-xl flex flex-col gap-4 xl:col-span-2 w-full min-w-0 max-w-none">
      <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary">Recent Sync Activity</h3>
      <div class="space-y-2">
        ${entries.map((entry) => `
          <div class="rounded-lg bg-black/20 px-4 py-3 flex items-start justify-between gap-4">
            <div class="min-w-0">
              <p class="text-sm ${entry.ok ? "text-zinc-200" : "text-red-200"}">${escapeHtml(entry.message || "Sync event")}</p>
              <p class="text-xs text-zinc-500 mt-1">${escapeHtml(entry.mode || "manual")}</p>
            </div>
            <p class="text-xs text-zinc-500 whitespace-nowrap">${escapeHtml(formatRelative(entry.timestamp))}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderActivityPanel(activityHistory) {
  const entries = Array.isArray(activityHistory) ? activityHistory.slice(0, 10) : [];
  if (!entries.length) {
    return `
      <section id="settings-activity" data-surface-region="settings-activity" class="space-y-8 mt-10">
        <div class="checkpoint-subpanel p-7 rounded-xl flex flex-col gap-3">
          <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary">Recent Activity</h3>
          <p class="text-sm text-zinc-500">No activity yet. Entry updates, refreshes, and sync actions will appear here.</p>
        </div>
      </section>
    `;
  }

  const toneClasses = {
    success: "text-emerald-100",
    warning: "text-amber-100",
    error: "text-red-200",
    info: "text-zinc-200"
  };

  const actionLabels = {
    added: "Added",
    updated: "Updated",
    deleted: "Deleted",
    status: "Status Updated",
    details: "Details Saved",
    notes: "Notes Saved",
    progress: "Progress Saved",
    metadata: "Metadata Refresh",
    artwork: "Artwork Refresh",
    connect: "Drive Connected",
    disconnect: "Drive Disconnected",
    "sync-now": "Sync Now",
    conflict: "Sync Conflict",
    "restore-remote": "Restored from Drive",
    "restore-local-snapshot": "Local Snapshot Restored"
  };

  return `
    <section id="settings-activity" data-surface-region="settings-activity" class="space-y-8 mt-10">
      <div class="checkpoint-subpanel p-7 rounded-xl flex flex-col gap-4">
        <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary">Recent Activity</h3>
        <div class="space-y-2">
          ${entries.map((entry) => `
            <div class="rounded-lg bg-black/20 px-4 py-3 flex items-start justify-between gap-4">
              <div class="min-w-0">
                <p class="text-sm ${toneClasses[entry.tone] ?? toneClasses.info}">
                  ${escapeHtml(entry.title ? `${entry.title}: ${entry.message || "Activity event"}` : (entry.message || "Activity event"))}
                </p>
                <p class="text-xs text-zinc-500 mt-1">
                  ${escapeHtml(actionLabels[entry.action] || entry.action || "Updated")} • ${escapeHtml(entry.scope || "library")}
                </p>
              </div>
              <p class="text-xs text-zinc-500 whitespace-nowrap">${escapeHtml(formatRelative(entry.timestamp))}</p>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

export function renderSettingsView(snapshot, storefrontDefinitions = []) {
  const settingsRailItems = getSettingsRailItems();
  const sectionIds = new Set(settingsRailItems.map((item) => item.id));
  const activeSection = sectionIds.has(snapshot.uiPreferences?.settingsSection)
    ? snapshot.uiPreferences.settingsSection
    : settingsRailItems[0].id;
  const conflict = snapshot.syncStatus.syncConflict;
  const conflictPrefersRemote = conflict?.preferredResolution === "restore-remote";
  const conflictPrimaryAction = conflictPrefersRemote ? "restore-google-drive" : "keep-local-during-conflict";
  const conflictSecondaryLabel = conflictPrefersRemote ? "Keep Local (This Device)" : "Restore Drive (This Device)";
  const conflictSecondaryAction = conflictPrefersRemote ? "keep-local-during-conflict" : "restore-google-drive";

  return `
    <main data-surface="settings" class="pt-[16rem] md:pt-24 pb-12">
      <div class="max-w-[1400px] mx-auto px-5 sm:px-6 lg:px-8">
        <div class="mb-9 md:mb-12 max-w-3xl">
          <p class="font-label text-[11px] tracking-[0.08em] text-primary mb-3">Settings</p>
          <h1 class="text-[2.45rem] leading-[1.08] sm:text-4xl font-headline font-extrabold tracking-tight text-on-surface">Sync, backup, and library maintenance.</h1>
          <p class="mt-4 text-base sm:text-lg text-on-surface-variant leading-relaxed">Manage Drive sync, backups, and refresh actions while keeping run tracking local-first.</p>
        </div>
        <div class="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-8">
          <div class="space-y-10">
            ${renderSettingsSectionRail(settingsRailItems, activeSection, "mobile")}
        ${activeSection === "settings-sync-account" ? `
        <section id="settings-sync-account" data-surface-region="settings-sync-account" class="space-y-8 xl:col-span-2">
          <div class="grid grid-cols-1 gap-8">
            <div class="checkpoint-subpanel p-7 rounded-xl flex flex-col gap-6 w-full min-w-0 max-w-none">
              <div class="space-y-5">
                <div class="space-y-4">
                  <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary">Drive Sync</h3>
                  <p class="text-sm text-zinc-500 mt-1">Connect your Google account and sync your full Checkpoint state.</p>
                  <div class="flex flex-wrap items-center gap-3 text-xs text-zinc-500 leading-relaxed">
                    <span>${snapshot.syncStatus.driveConnected ? "Connected with browser-based Google OAuth." : snapshot.syncStatus.driveClientConfigured ? "OAuth is configured. Connect when you are ready." : "Add googleDriveClientId to checkpoint/config.js to enable Drive sync."}</span>
                  </div>
                  <p class="text-xs text-zinc-500">If Drive is unavailable, tracking still works locally on this device.</p>
                </div>
                <div class="pt-4 border-t border-white/[0.06] flex flex-col gap-4">
                  <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <p class="text-xs text-zinc-500 leading-relaxed max-w-2xl">Run a device-safe sync now, restore from Drive when needed, or disconnect this browser without affecting your local tracking data.</p>
                    <div class="self-start">
                      ${snapshot.syncStatus.driveConnected
                        ? renderCompactScopedPrimaryAction("Sync Now", "This Device", "sync-now")
                        : renderCompactScopedPrimaryAction("Connect Drive", "This Device", "connect-google-drive")}
                    </div>
                  </div>
                  ${snapshot.syncStatus.driveConnected ? `
                    <div class="flex flex-wrap items-center gap-3">
                      ${renderSecondaryAction("Restore From Drive", "restore-google-drive", "px-4 py-2 text-[11px] tracking-[0.12em] justify-center")}
                      ${renderSecondaryAction("Disconnect Drive", "disconnect-google-drive", "px-4 py-2 text-[11px] tracking-[0.12em] justify-center")}
                    </div>
                  ` : ""}
                </div>
              </div>
              <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] gap-5 items-start">
                <div class="rounded-lg bg-black/20 px-4 py-4 flex flex-col gap-5">
                  <div class="flex flex-col gap-2">
                    <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary">Current Device</h3>
                    <p class="text-on-surface-variant leading-relaxed text-sm">Name this browser so sync and recovery choices are easier to read.</p>
                  </div>
                  <div class="space-y-2">
                    <label class="font-label text-[11px] tracking-[0.08em] text-zinc-500" for="device-label">Device Label</label>
                    <div class="flex flex-col gap-3">
                      <input id="device-label" class="flex-1 bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-label text-sm text-on-surface focus:ring-1 focus:ring-primary" type="text" value="${snapshot.syncStatus.currentDeviceLabel}">
                      <div class="self-start">
                        ${renderSecondaryAction("Save Label", "save-device-label", "px-4 py-3 text-[11px] tracking-[0.12em] min-w-[10.5rem] justify-center")}
                      </div>
                    </div>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-zinc-500">
                    <div class="rounded-lg bg-black/20 px-4 py-4">
                      <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-2">Current Device ID</p>
                      <p class="font-headline font-bold text-on-surface break-all">${snapshot.syncStatus.currentDeviceId}</p>
                    </div>
                    <div class="rounded-lg bg-black/20 px-4 py-4">
                      <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-2">Last Synced Device</p>
                      <p class="font-headline font-bold text-on-surface">${snapshot.syncStatus.lastSyncedByDeviceLabel || "Not synced yet"}</p>
                      <p class="mt-2 text-xs text-zinc-500">${snapshot.syncStatus.comparisonMode.replace("-", " ")}</p>
                    </div>
                  </div>
                </div>
                <div class="grid grid-cols-1 gap-5">
                  <div class="rounded-lg bg-black/20 px-4 py-4">
                    <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-3">Sync Preferences</p>
                    <div class="space-y-3">
                      ${renderPreference("Auto-backup on state change", "autoBackup", snapshot.syncPreferences.autoBackup)}
                      ${renderPreference("Include artwork payloads", "includeArtwork", snapshot.syncPreferences.includeArtwork)}
                      ${renderPreference("Include archive notes", "includeNotes", snapshot.syncPreferences.includeNotes)}
                      ${renderPreference("Include activity history", "includeActivityHistory", snapshot.syncPreferences.includeActivityHistory)}
                    </div>
                  </div>
                  <div class="rounded-lg bg-black/20 px-4 py-4 flex flex-col gap-4">
                    <div class="space-y-2">
                      <p class="font-label text-[11px] tracking-[0.08em] text-primary">Local Restore Safety Snapshot</p>
                      ${snapshot.restorePointMeta
                        ? `<p class="text-xs text-zinc-400">Saved ${formatRelative(snapshot.restorePointMeta.timestamp)} from ${snapshot.restorePointMeta.source}</p>`
                        : `<p class="text-xs text-zinc-500 leading-relaxed">Checkpoint keeps a local restore snapshot before Drive restore actions so this browser can roll back safely.</p>`}
                    </div>
                    ${snapshot.restorePointMeta ? `
                      <div class="mt-auto">
                        ${renderSecondaryAction("Restore Local Snapshot", "restore-local-snapshot", "w-full px-4 py-2 text-[11px] tracking-[0.12em] justify-center")}
                      </div>
                    ` : ""}
                  </div>
                </div>
              </div>
              ${conflict ? `
                <div class="rounded-xl bg-amber-500/8 p-5 flex flex-col gap-4">
                  <div class="flex flex-col gap-2">
                    <p class="font-label text-[11px] tracking-[0.08em] text-amber-200">Sync Conflict</p>
                    <p class="text-sm text-on-surface leading-relaxed">${conflict.mode === "remote-newer" ? "Drive has a newer backup than this device." : "This device and Drive both changed, so Checkpoint needs an explicit choice before it can sync again."}</p>
                    <p class="text-xs text-zinc-400 leading-relaxed">Auto-backup is paused until you resolve this.</p>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div class="rounded-lg ${conflict.preferredResolution === "keep-local" ? "bg-primary/10" : "bg-black/20"} px-4 py-4">
                      <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-2">Local</p>
                      <p class="font-headline font-bold text-on-surface">${conflict.local.deviceLabel}</p>
                      <p class="mt-2 text-zinc-400">${conflict.local.modifiedAt ? `Modified ${formatRelative(conflict.local.modifiedAt)}` : "No local mutation timestamp yet"}</p>
                    </div>
                    <div class="rounded-lg ${conflict.preferredResolution === "restore-remote" ? "bg-primary/10" : "bg-black/20"} px-4 py-4">
                      <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-2">Drive</p>
                      <p class="font-headline font-bold text-on-surface">${conflict.remote.deviceLabel}</p>
                      <p class="mt-2 text-zinc-400">${conflict.remote.modifiedAt ? `Modified ${formatRelative(conflict.remote.modifiedAt)}` : "Remote timestamp unavailable"}</p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-3">
                    ${conflictPrefersRemote
                      ? renderScopedPrimaryAction("Restore Drive", "This Device", conflictPrimaryAction)
                      : renderScopedPrimaryAction("Keep Local", "This Device", conflictPrimaryAction)}
                    ${renderSecondaryAction(conflictSecondaryLabel, conflictSecondaryAction, "px-5 py-3 text-xs tracking-[0.12em]")}
                    ${renderSecondaryAction("Export Local Backup (This Device)", "export-json", "px-5 py-3 text-[11px] tracking-[0.1em]")}
                  </div>
                </div>
              ` : ""}
              ${renderSettingsNotice(snapshot.actionState.sync)}
            </div>
            ${renderSyncHistoryPanel(snapshot.syncHistory)}
          </div>
        </section>
        ` : ""}
        ${activeSection === "settings-backup-restore" ? `
        <section id="settings-backup-restore" data-surface-region="settings-backup-restore" class="space-y-6 sm:space-y-8 mt-8 sm:mt-10">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div class="xl:col-span-12 grid grid-cols-1 gap-8">
              <div class="checkpoint-subpanel p-5 sm:p-7 rounded-xl flex flex-col gap-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-4">
                  <div>
                    <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary mb-2">Local Backup</h3>
                    <p class="text-on-surface-variant leading-relaxed text-sm">Download your full local Checkpoint state as JSON.</p>
                  </div>
                  <div class="w-full sm:w-auto">
                    ${renderCompactScopedPrimaryAction("Export JSON", "This Device", "export-json")}
                  </div>
                </div>
                <p class="text-xs text-zinc-500">Includes library, catalog, sync preferences, and UI preferences.</p>
                ${renderSettingsNotice(snapshot.actionState.backup)}
              </div>
              <div class="checkpoint-subpanel p-5 sm:p-7 rounded-xl flex flex-col gap-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-4">
                  <div>
                    <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary mb-2">Restore Backup</h3>
                    <p class="text-on-surface-variant leading-relaxed text-sm">Import a Checkpoint JSON backup into local storage.</p>
                  </div>
                  <div class="w-full sm:w-auto">
                    ${renderCompactScopedPrimaryAction("Import JSON", "This Device", "trigger-import-json")}
                  </div>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button class="flex items-center justify-between p-3 rounded-lg ${snapshot.importMode === "replace" ? "bg-surface-container-high shadow-[inset_0_0_0_2px_rgba(0,212,255,0.22)]" : "bg-surface-container-low/40 hover:bg-surface-container-high"} transition-colors group" data-action="set-import-mode" data-import-mode="replace"><span class="font-label text-xs tracking-[0.08em] ${snapshot.importMode === "replace" ? "text-on-surface" : "text-outline"}">Replace</span><div class="w-4 h-4 rounded-[0.2rem] border ${snapshot.importMode === "replace" ? "border-primary flex items-center justify-center" : "border-outline-variant"}">${snapshot.importMode === "replace" ? '<div class="w-2 h-2 rounded-[0.15rem] bg-primary shadow-[0_0_8px_#a8e8ff]"></div>' : ""}</div></button>
                  <button class="flex items-center justify-between p-3 rounded-lg ${snapshot.importMode === "merge" ? "bg-surface-container-high shadow-[inset_0_0_0_2px_rgba(0,212,255,0.22)]" : "bg-surface-container-low/40 hover:bg-surface-container-high"} transition-colors group" data-action="set-import-mode" data-import-mode="merge"><span class="font-label text-xs tracking-[0.08em] ${snapshot.importMode === "merge" ? "text-on-surface" : "text-outline"}">Merge</span><div class="w-4 h-4 rounded-[0.2rem] border ${snapshot.importMode === "merge" ? "border-primary flex items-center justify-center" : "border-outline-variant"}">${snapshot.importMode === "merge" ? '<div class="w-2 h-2 rounded-[0.15rem] bg-primary shadow-[0_0_8px_#a8e8ff]"></div>' : ""}</div></button>
                </div>
                <p class="text-xs text-zinc-500">${snapshot.importMode === "merge" ? "Merge keeps current sync and UI preferences, and imported entries overwrite matching entry IDs." : "Replace swaps the entire local backup state after validation."}</p>
                <p class="text-xs text-zinc-500 leading-relaxed">${snapshot.importMode === "merge" ? "Use merge to bring in entries without replacing your current device state." : "Use replace when this backup should become the full local source of truth."}</p>
                <input id="import-json-input" class="hidden" type="file" accept="application/json,.json">
              </div>
            </div>
          </div>
        </section>
        ` : ""}
        ${activeSection === "settings-imports" ? renderSteamImportPanel(snapshot) : ""}
        ${activeSection === "settings-maintenance" ? `
        <section id="settings-maintenance" data-surface-region="settings-maintenance" class="space-y-8 mt-10">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div class="xl:col-span-12 grid grid-cols-1 gap-8">
              <div class="checkpoint-subpanel p-7 rounded-xl flex flex-col gap-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary mb-2">Metadata Refresh</h3>
                    <p class="text-on-surface-variant leading-relaxed text-sm">Library-wide metadata and artwork refresh actions live here.</p>
                  </div>
                  ${renderScopedPrimaryAction("Refresh Metadata", "Library-wide", "refresh-library-metadata")}
                </div>
                <p class="text-xs text-zinc-500">Updates catalog metadata while keeping your run-specific notes, progress, and status intact.</p>
              </div>
              <div class="checkpoint-subpanel p-7 rounded-xl flex flex-col gap-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary mb-2">Artwork Refresh</h3>
                    <p class="text-on-surface-variant leading-relaxed text-sm">Refresh artwork for every tracked title in your library.</p>
                  </div>
                  ${renderScopedPrimaryAction("Refresh Artwork", "Library-wide", "refresh-library-artwork")}
                </div>
                <p class="text-xs text-zinc-500">Refreshes artwork for tracked titles without exposing secrets in the browser.</p>
              </div>
              <div class="checkpoint-subpanel p-7 rounded-xl flex flex-col gap-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary mb-2">Wishlist Pricing (ITAD)</h3>
                    <p class="text-on-surface-variant leading-relaxed text-sm">Load stores from ITAD, choose which stores to track, and refresh pricing.</p>
                  </div>
                  ${renderScopedPrimaryAction("Refresh Prices", "Library-wide", "refresh-library-pricing")}
                </div>
                <div class="flex flex-wrap items-center gap-3">
                  ${renderSecondaryAction("Load ITAD Stores", "load-itad-stores", "px-4 py-2 text-[11px] tracking-[0.12em]")}
                  ${snapshot.itadStoresLoading ? `<span class="text-xs text-zinc-500">Loading stores...</span>` : ""}
                  ${snapshot.itadStoresError ? `<span class="text-xs text-amber-200">${escapeHtml(snapshot.itadStoresError)}</span>` : ""}
                </div>
                ${Array.isArray(snapshot.itadStores) && snapshot.itadStores.length ? `
                  <div class="rounded-lg bg-black/20 px-4 py-4">
                    <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-3">Stores to include in wishlist price table</p>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                      ${snapshot.itadStores.map((store) => {
                        const checked = Array.isArray(snapshot.syncPreferences?.itadSelectedStoreIds) && snapshot.syncPreferences.itadSelectedStoreIds.includes(store.id);
                        return `
                          <label class="flex items-center gap-2 text-sm text-zinc-300">
                            <input
                              type="checkbox"
                              data-action="toggle-itad-store"
                              data-store-id="${escapeHtml(store.id)}"
                              ${checked ? "checked" : ""}
                              class="h-4 w-4 rounded border-primary/20 bg-black/30 text-primary focus:ring-primary"
                            >
                            <span>${escapeHtml(store.name)}</span>
                          </label>
                        `;
                      }).join("")}
                    </div>
                  </div>
                ` : ""}
                <p class="text-xs text-zinc-500">Used for ITAD lookup prioritization when resolving current deals.</p>
              </div>
            </div>
          </div>
        </section>
        ` : ""}
        ${activeSection === "settings-activity" ? renderActivityPanel(snapshot.activityHistory) : ""}
          </div>
          ${renderSettingsSectionRail(settingsRailItems, activeSection, "desktop")}
        </div>
      </div>
    </main>
  `;
}
