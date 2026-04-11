import {
  escapeHtml,
  formatRelative,
  renderActionMessage,
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
    add: "bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(168,232,255,0.24)]",
    merge: "bg-emerald-400/10 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(167,243,208,0.22)]",
    review: "bg-amber-400/10 text-amber-100 shadow-[inset_0_0_0_1px_rgba(253,230,138,0.22)]",
    skip: "bg-white/[0.06] text-zinc-300 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
  }[action] ?? "bg-white/[0.06] text-zinc-300";
}

function renderSteamImportSummary(session) {
  const summary = session.summary ?? {};
  const tiles = [
    ["Total found", summary.total ?? 0],
    ["Played", summary.played ?? 0],
    ["Unplayed", summary.unplayed ?? 0],
    ["Recent", summary.recent ?? 0],
    ["Existing", summary.existing ?? 0],
    ["Needs review", summary.possibleMatches ?? 0],
    ["New", summary.unmatched ?? 0]
  ];

  return `
    <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
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
  if (!candidates.length) {
    return `
      <div class="rounded-lg bg-black/20 px-4 py-8 text-sm text-zinc-500">
        Fetch a Steam preview to see owned-library candidates here. Nothing will be imported during this step.
      </div>
    `;
  }

  return `
    <div class="overflow-hidden rounded-xl bg-black/20">
      <div class="hidden md:grid grid-cols-[minmax(0,1.5fr)_0.7fr_0.7fr_0.9fr_0.9fr] gap-4 px-4 py-3 font-label text-[10px] tracking-[0.08em] text-zinc-500">
        <span>Steam game</span>
        <span>Total</span>
        <span>Recent</span>
        <span>Proposed</span>
        <span>Match</span>
      </div>
      <div class="divide-y divide-white/[0.06]">
        ${candidates.slice(0, 40).map((candidate) => `
          <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1.5fr)_0.7fr_0.7fr_0.9fr_0.9fr] gap-3 md:gap-4 px-4 py-4">
            <div class="min-w-0">
              <p class="font-headline font-bold text-on-surface truncate">${escapeHtml(candidate.title)}</p>
              <p class="mt-1 font-label text-[10px] tracking-[0.08em] text-zinc-500">AppID ${escapeHtml(candidate.appid ?? "Unknown")}</p>
            </div>
            <p class="text-sm text-zinc-300">${escapeHtml(formatSteamPlaytime(candidate.playtimeForeverMinutes))}</p>
            <p class="text-sm ${candidate.playtime2WeeksMinutes > 0 ? "text-primary" : "text-zinc-500"}">${escapeHtml(formatSteamPlaytime(candidate.playtime2WeeksMinutes))}</p>
            <p class="font-label text-[11px] font-bold tracking-[0.08em] text-zinc-300">${escapeHtml(candidate.proposedStatus === "playing" ? "Playing" : "Backlog")}</p>
            <div class="flex flex-col items-start gap-1">
              ${getSteamCandidateBadge(candidate)}
              ${candidate.existingTitle ? `<span class="text-xs text-zinc-500 truncate max-w-full">${escapeHtml(candidate.existingTitle)}</span>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
      ${candidates.length > 40 ? `<p class="px-4 py-3 text-xs text-zinc-500">Showing first 40 of ${escapeHtml(candidates.length)} preview rows. Full review comes in the conflict step.</p>` : ""}
    </div>
  `;
}

function renderSteamImportReviewRows(session) {
  const candidates = Array.isArray(session.candidates) ? session.candidates : [];
  if (!candidates.length) {
    return `
      <div class="rounded-lg bg-black/20 px-4 py-8 text-sm text-zinc-500">
        Fetch a Steam preview first so Checkpoint can build a conflict review list.
      </div>
    `;
  }

  return `
    <div class="space-y-3">
      ${candidates.map((candidate) => {
        const showSuggestion = candidate.matchStatus === "unmatched" && candidate.igdbSuggestion;
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
                  <span>Proposed ${escapeHtml(candidate.proposedStatus === "playing" ? "Playing" : "Backlog")}</span>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 xl:max-w-[26rem] xl:justify-end">
                ${actions.map((action) => `
                  <button
                    class="rounded-full px-3 py-2 font-label text-[11px] font-bold tracking-[0.08em] transition-colors ${candidate.action === action ? getSteamActionTone(action) : "bg-white/[0.03] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"}"
                    data-action="set-steam-import-candidate-action"
                    data-candidate-id="${escapeHtml(candidate.id)}"
                    data-value="${action}"
                  >
                    ${escapeHtml(getSteamActionLabel(action))}
                  </button>
                `).join("")}
              </div>
            </div>
            <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-3">
              <div class="rounded-lg bg-black/20 px-4 py-3">
                <p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">Match Reason</p>
                <p class="mt-2 text-sm text-zinc-300">${escapeHtml(candidate.matchReasonLabel)}</p>
                ${candidate.existingTitle ? `<p class="mt-1 text-xs text-zinc-500">Existing ${escapeHtml(candidate.existingSurfaceLabel || "entry")}: ${escapeHtml(candidate.existingTitle)}</p>` : ""}
              </div>
              <div class="rounded-lg bg-black/20 px-4 py-3">
                <p class="font-label text-[10px] tracking-[0.08em] text-zinc-500">${showSuggestion ? "IGDB Suggestion" : "Current Decision"}</p>
                ${showSuggestion ? `
                  <p class="mt-2 text-sm text-zinc-300">${escapeHtml(candidate.igdbSuggestion.title || "Suggested metadata match")}</p>
                  ${candidate.igdbSuggestion.releaseDate ? `<p class="mt-1 text-xs text-zinc-500">${escapeHtml(candidate.igdbSuggestion.releaseDate)}</p>` : ""}
                ` : `
                  <p class="mt-2 text-sm text-zinc-300">${escapeHtml(getSteamActionLabel(candidate.action))}</p>
                  <p class="mt-1 text-xs text-zinc-500">Default ${escapeHtml(getSteamActionLabel(candidate.defaultAction))}</p>
                `}
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
            <textarea id="steam-wishlist-source" class="mt-2 min-h-36 w-full rounded-lg bg-black/30 border border-primary/10 px-4 py-3 text-sm text-on-surface focus:ring-1 focus:ring-primary" placeholder="Paste a Steam wishlist URL, copied wishlist page content, or one Steam app URL/title per line."></textarea>
          </div>
          <p class="text-xs text-zinc-500 leading-relaxed">Wishlist import is best-effort because Steam does not provide a stable official public wishlist API. Nothing is added until you review matches.</p>
        </div>
        <div class="rounded-lg bg-black/20 px-4 py-4 space-y-3">
          <p class="font-label text-[11px] tracking-[0.08em] text-primary">What happens next</p>
          <p class="text-xs text-zinc-500 leading-relaxed">Checkpoint will extract Steam app IDs and titles where possible, then resolve conflicts against your Library and Wishlist.</p>
          ${renderSecondaryAction("Parse Preview", "steam-import-placeholder", "w-full px-4 py-2 text-[11px] tracking-[0.12em] justify-center opacity-60 cursor-not-allowed")}
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
        <p class="text-xs text-zinc-500 leading-relaxed">Owned-library import uses Steam's official API. Your Steam game details must be public or accessible to the API key.</p>
        ${renderSteamImportErrors(session.errors)}
      </div>
      <div class="rounded-lg bg-black/20 px-4 py-4 space-y-3">
        <p class="font-label text-[11px] tracking-[0.08em] text-primary">Setup Status</p>
        <p class="text-xs leading-relaxed ${workerReady ? "text-zinc-400" : "text-amber-200"}">${workerReady ? "Worker endpoint is configured. If STEAM_WEB_API_KEY is present on the worker, preview can run now." : "Worker endpoint is not configured, so Steam API preview cannot run yet."}</p>
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
  return `
    <div class="space-y-4">
      ${renderSteamImportErrors(session.errors)}
      ${renderSteamImportSummary(session)}
      <div class="rounded-lg bg-black/20 px-4 py-4">
        <p class="font-label text-[11px] tracking-[0.08em] text-primary mb-2">Read-only Preview</p>
        <p class="text-sm text-zinc-500 leading-relaxed">These rows are candidates only. The next phases add import rules, conflict review, and explicit commit actions.</p>
      </div>
      ${renderSteamOwnedPreviewRows(session)}
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

  if (session.step === "preview") {
    return `
      <div class="flex flex-wrap gap-3 pt-2">
        ${renderSecondaryAction("Review Rules", "set-steam-import-step", `px-4 py-2 text-[11px] tracking-[0.12em] justify-center ${!hasCandidates ? "opacity-60 cursor-not-allowed" : ""}`, !hasCandidates ? "disabled" : "", 'data-step="rules"')}
        ${renderSecondaryAction("Go To Review", "set-steam-import-step", `px-4 py-2 text-[11px] tracking-[0.12em] justify-center ${!hasCandidates ? "opacity-60 cursor-not-allowed" : ""}`, !hasCandidates ? "disabled" : "", 'data-step="review"')}
      </div>
    `;
  }

  if (session.step === "rules") {
    return `
      <div class="flex flex-wrap gap-3 pt-2">
        ${renderSecondaryAction("Back To Preview", "set-steam-import-step", "px-4 py-2 text-[11px] tracking-[0.12em] justify-center", "", 'data-step="preview"')}
        ${renderSecondaryAction("Continue To Review", "set-steam-import-step", `px-4 py-2 text-[11px] tracking-[0.12em] justify-center ${!hasCandidates ? "opacity-60 cursor-not-allowed" : ""}`, !hasCandidates ? "disabled" : "", 'data-step="review"')}
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
          ${renderSecondaryAction("Back To Rules", "set-steam-import-step", "px-4 py-2 text-[11px] tracking-[0.12em] justify-center", "", 'data-step="rules"')}
          ${renderSecondaryAction("Prepare Import", "set-steam-import-step", `px-4 py-2 text-[11px] tracking-[0.12em] justify-center ${reviewCount ? "opacity-60 cursor-not-allowed" : ""}`, reviewCount ? "disabled" : "", 'data-step="import"')}
        </div>
      </div>
    `;
  }

  if (session.step === "import") {
    return `
      <div class="flex flex-wrap gap-3 pt-2">
        ${renderSecondaryAction("Back To Review", "set-steam-import-step", "px-4 py-2 text-[11px] tracking-[0.12em] justify-center", "", 'data-step="review"')}
        ${renderScopedPrimaryAction(session.loading ? "Importing..." : "Import Selected", "This Device", "commit-steam-owned-import").replace('checkpoint-scoped-cta"', `checkpoint-scoped-cta ${loadingDisabled}"`).replace("data-action=\"commit-steam-owned-import\"", `data-action="commit-steam-owned-import"${session.loading ? " disabled" : ""}`)}
      </div>
    `;
  }

  if (session.step === "complete") {
    return `
      <div class="flex flex-wrap gap-3 pt-2">
        ${renderSecondaryAction("Start Another Preview", "set-steam-import-step", "px-4 py-2 text-[11px] tracking-[0.12em] justify-center", "", 'data-step="source"')}
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
      return session.mode === "owned-library"
        ? renderSteamImportPreviewStep(session)
        : renderSteamImportPlanningStep(session);
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
            <p class="text-sm text-zinc-500 leading-relaxed">Review exact duplicates, title-only matches, and unresolved titles before import commit is enabled. Actions here stay transient for now.</p>
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
              <p class="text-sm text-zinc-500 leading-relaxed">Checkpoint will add new owned games, merge exact/title-confirmed matches into existing entries, and keep Steam playtime separate from local progress.</p>
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
            <p class="text-sm text-zinc-500 leading-relaxed">Steam owned-library selections have been committed into local Checkpoint state without overwriting your editable progress fields.</p>
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
    <section data-surface-region="settings-local-nav" class="checkpoint-toolbar rounded-xl px-4 py-3 mb-8 xl:hidden">
      <nav class="flex items-center gap-1 overflow-x-auto custom-scrollbar">
        ${items.map((item) => `
          <button class="px-3 py-2 whitespace-nowrap rounded-md font-label tracking-[0.08em] text-[11px] transition-colors ${item.id === activeSection ? "bg-primary/10 text-primary" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03]"}" data-action="set-settings-section" data-section="${item.id}">
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
    <main data-surface="settings" class="pt-[8.75rem] md:pt-24 pb-12">
      <div class="max-w-[1400px] mx-auto px-6 lg:px-8">
        <div class="mb-12 max-w-3xl">
          <p class="font-label text-[11px] tracking-[0.08em] text-primary mb-3">Settings</p>
          <h1 class="text-4xl font-headline font-extrabold tracking-tight text-on-surface">Sync, backup, and library maintenance.</h1>
          <p class="mt-3 text-on-surface-variant leading-relaxed">Manage Drive sync, backups, and refresh actions while keeping run tracking local-first.</p>
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
        <section id="settings-backup-restore" data-surface-region="settings-backup-restore" class="space-y-8 mt-10">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div class="xl:col-span-12 grid grid-cols-1 gap-8">
              <div class="checkpoint-subpanel p-7 rounded-xl flex flex-col gap-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary mb-2">Local Backup</h3>
                    <p class="text-on-surface-variant leading-relaxed text-sm">Download your full local Checkpoint state as JSON.</p>
                  </div>
                  ${renderScopedPrimaryAction("Export JSON", "This Device", "export-json")}
                </div>
                <p class="text-xs text-zinc-500">Includes library, catalog, sync preferences, and UI preferences.</p>
                ${renderSettingsNotice(snapshot.actionState.backup)}
              </div>
              <div class="checkpoint-subpanel p-7 rounded-xl flex flex-col gap-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary mb-2">Restore Backup</h3>
                    <p class="text-on-surface-variant leading-relaxed text-sm">Import a Checkpoint JSON backup into local storage.</p>
                  </div>
                  ${renderScopedPrimaryAction("Import JSON", "This Device", "trigger-import-json")}
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
                ${renderSettingsNotice(snapshot.actionState.metadata)}
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
                ${renderSettingsNotice(snapshot.actionState.artwork)}
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
                ${renderSettingsNotice(snapshot.actionState.pricing)}
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
