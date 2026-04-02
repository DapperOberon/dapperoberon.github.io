import {
  escapeHtml,
  formatDate,
  formatRelative,
  getGameForEntry,
  getStatusMeta,
  getStorefrontLabel,
  hasUsableAsset,
  isPendingMetadata,
  renderFallbackArt,
  renderMetaChip,
  renderOptionalText,
  renderPrimaryAction,
  renderSecondaryAction
} from "./shared.js";

function renderDetailHeroSection(snapshot, activeEntry, game, coverArt, heroBackdropArt, description, storefrontDefinitions, statusDefinitions, isNonRunEntry) {
  return `
    <section class="checkpoint-panel rounded-xl p-8 lg:p-10 overflow-hidden relative">
          ${hasUsableAsset(heroBackdropArt) ? `
        <div class="absolute inset-0 pointer-events-none">
          <img class="w-full h-full object-cover scale-105 opacity-45 blur-[1px] saturate-110 contrast-110" src="${escapeHtml(heroBackdropArt)}" alt="${escapeHtml(activeEntry.title)} hero backdrop">
          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,9,11,0.16)_0%,rgba(10,12,14,0.42)_24%,rgba(14,16,18,0.72)_56%,rgba(18,20,22,0.9)_100%)]"></div>
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(125,211,252,0.14),transparent_36%)]"></div>
          <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(0,0,0,0.36),transparent_58%)]"></div>
        </div>
      ` : ""}
      <div class="relative z-10 grid grid-cols-1 lg:grid-cols-[240px_1fr] xl:grid-cols-[280px_1fr_220px] gap-6 lg:gap-8 items-start">
        <div class="overflow-hidden rounded-md bg-zinc-900 cover-shadow aspect-[3/4] max-w-[280px] mx-auto lg:mx-0">
          ${hasUsableAsset(coverArt)
            ? `<img class="w-full h-full object-cover" src="${escapeHtml(coverArt)}" alt="${escapeHtml(activeEntry.title)} cover art">`
            : renderFallbackArt(activeEntry.title, "Artwork pending", "rounded-md")}
        </div>
        <div class="space-y-5">
          <div class="flex flex-wrap items-center gap-2">
            ${renderMetaChip(getStorefrontLabel(storefrontDefinitions, activeEntry.storefront), "primary")}
            ${renderMetaChip(getStatusMeta(statusDefinitions, activeEntry.status).label)}
          </div>
          <div>
            <h1 class="text-4xl lg:text-5xl font-extrabold font-headline tracking-tight text-on-surface">${escapeHtml(activeEntry.title)}</h1>
            <p class="mt-2 text-sm text-zinc-500">${isNonRunEntry ? `${activeEntry.status === "wishlist" ? "Wishlist" : "Backlog"} entry` : `${escapeHtml(activeEntry.runLabel || "Main Save")} • ${activeEntry.playtimeHours}h logged`}</p>
          </div>
          <p class="max-w-3xl text-on-surface-variant text-base leading-relaxed">${escapeHtml(description || "This entry was added manually and is waiting on fuller metadata.")}</p>
          <div class="metadata-rule pt-5 grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Release date</p><p class="font-headline font-bold text-on-surface">${hasUsableAsset(game?.releaseDate) ? escapeHtml(formatDate(game?.releaseDate)) : "Metadata pending"}</p></div>
            <div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Platform</p><p class="font-headline font-bold text-on-surface">${game?.platforms?.length ? escapeHtml(game.platforms.join(", ")) : "Platform pending"}</p></div>
          </div>
        </div>
        <div class="flex flex-col sm:flex-row xl:flex-col gap-3 lg:col-span-2 xl:col-auto">
          ${renderSecondaryAction("Back to Library", "set-view", "w-full px-5 py-3 tracking-[0.08em] text-[11px]", 'data-view="dashboard"')}
          ${snapshot.isDetailEditMode
            ? `
              ${renderPrimaryAction("Save Details (This Entry)", "save-detail-workspace", "w-full px-5 py-3 tracking-[0.08em] text-[11px]", `data-entry-id="${activeEntry.entryId}"`)}
              ${renderSecondaryAction("Cancel Edit", "toggle-detail-edit-mode", "w-full px-5 py-3 tracking-[0.08em] text-[11px]", 'data-detail-edit-mode="false"')}
            `
            : `${renderSecondaryAction("Edit Details", "toggle-detail-edit-mode", "w-full px-5 py-3 tracking-[0.08em] text-[11px] flex items-center justify-center gap-2", 'data-detail-edit-mode="true"')}`}
          ${activeEntry.status !== "playing" ? `<button class="checkpoint-button checkpoint-button-secondary w-full px-5 py-3 border-emerald-300/20 text-emerald-100 hover:bg-emerald-400/10 flex items-center justify-center gap-2 font-label font-bold tracking-[0.08em] text-[11px]" data-action="update-entry-status" data-entry-id="${activeEntry.entryId}" data-status="playing"><span class="material-symbols-outlined text-base">restore</span>Move to Playing (This Entry)</button>` : ""}
          <button class="checkpoint-button checkpoint-button-danger w-full px-5 py-3 flex items-center justify-center gap-2 font-label font-bold tracking-[0.08em] text-[11px]" data-action="open-delete-confirm" data-entry-id="${activeEntry.entryId}"><span class="material-symbols-outlined text-base">delete</span>Delete Entry (This Entry)</button>
        </div>
      </div>
    </section>
  `;
}

function renderDetailWorkspacePanel(snapshot, activeEntry, storefrontDefinitions, isNonRunEntry) {
  if (!snapshot.isDetailEditMode) {
    return `
      <div id="detail-run-details" class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-5">
        <div class="flex flex-col gap-1">
          <h3 class="font-label text-sm tracking-[0.08em] text-primary">Run Details</h3>
          <p class="text-xs text-zinc-500">Switch to edit mode to change run labels and game-level values.</p>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Title</p><p class="font-headline font-bold text-on-surface">${escapeHtml(activeEntry.title)}</p></div>
          <div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Storefront</p><p class="font-headline font-bold text-on-surface">${escapeHtml(getStorefrontLabel(storefrontDefinitions, activeEntry.storefront))}</p></div>
          ${isNonRunEntry
            ? `<div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Run Label</p><p class="font-body text-sm text-zinc-500">Not tracked for backlog or wishlist entries</p></div>`
            : `<div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Run Label</p><p class="font-headline font-bold text-on-surface">${escapeHtml(activeEntry.runLabel || "Main Save")}</p></div>`}
        </div>
      </div>
    `;
  }

  return `
    <div id="detail-run-details" class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 class="font-label text-sm tracking-[0.08em] text-primary">Run Details</h3>
          <p class="text-xs text-zinc-500 mt-1">Save Details commits run-level changes together with any game and artwork edits.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div><p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-1">Title</p><p class="font-headline font-bold text-on-surface">${escapeHtml(activeEntry.title)}</p></div>
        <label class="space-y-2"><span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Storefront</span><select id="detail-storefront" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-label text-sm text-on-surface focus:ring-1 focus:ring-primary appearance-none">${storefrontDefinitions.map((item) => `<option class="bg-surface" value="${item.id}" ${activeEntry.storefront === item.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></label>
        ${isNonRunEntry
          ? `<div class="space-y-2"><span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Run Label</span><p class="w-full bg-black/20 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-zinc-500">Not tracked for backlog or wishlist entries</p></div>`
          : `<label class="space-y-2"><span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Run Label</span><input id="detail-run-label" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-label text-sm text-on-surface focus:ring-1 focus:ring-primary" type="text" value="${escapeHtml(activeEntry.runLabel || "Main Save")}"></label>`}
      </div>
    </div>
  `;
}

function renderDetailProgressPanel(snapshot, activeEntry, statusDefinitions) {
  return `
    <div id="detail-progress" class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-6 relative overflow-hidden">
      <div class="flex flex-col sm:flex-row justify-between sm:items-end gap-6">
        <div class="flex flex-col gap-1">
          <h3 class="font-label text-sm tracking-[0.08em] text-primary">Progress</h3>
          <p class="text-xs text-zinc-500">Edit tracked run values directly here.</p>
          <p class="text-3xl font-headline font-extrabold tracking-tighter">${activeEntry.completionPercent}% complete</p>
        </div>
        <div class="text-right shrink-0">
          <p class="font-label text-xs text-zinc-500">Last updated</p>
          <p class="font-body font-bold text-on-surface">${escapeHtml(formatRelative(activeEntry.updatedAt))}</p>
        </div>
      </div>
      <div class="h-1 w-full bg-surface-container-highest rounded-full overflow-hidden"><div class="h-full bg-gradient-to-r from-cyan-500 to-primary-container shadow-[0_0_15px_rgba(168,232,255,0.5)]" style="width:${activeEntry.completionPercent}%"></div></div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <label class="space-y-2"><span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Playtime</span><input id="detail-playtime" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-label text-sm text-on-surface focus:ring-1 focus:ring-primary" type="number" min="0" step="0.5" value="${escapeHtml(snapshot.detailForm.playtimeHours)}"></label>
        <label class="space-y-2"><span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Completion</span><input id="detail-completion" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-label text-sm text-on-surface focus:ring-1 focus:ring-primary" type="number" min="0" max="100" step="1" value="${escapeHtml(snapshot.detailForm.completionPercent)}"></label>
        <label class="space-y-2"><span class="font-label text-[11px] tracking-[0.08em] text-zinc-500">Status</span><select id="detail-status" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-label text-sm text-on-surface focus:ring-1 focus:ring-primary appearance-none">${statusDefinitions.map((status) => `<option class="bg-surface" value="${status.id}" ${snapshot.detailForm.status === status.id ? "selected" : ""}>${escapeHtml(status.label)}</option>`).join("")}</select></label>
      </div>
      <div class="flex justify-end"><p class="mr-auto text-xs text-zinc-500 self-center">Save Progress only affects playtime, completion, and status for this run.</p>${renderPrimaryAction("Save Progress (This Entry)", "save-detail-progress", "px-6 py-3 text-xs tracking-[0.08em]")}</div>
    </div>
  `;
}

function renderDetailMediaPanel(activeEntry, screenshots) {
  return `
    <div id="detail-screenshots" class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-6">
      <h3 class="font-label text-sm tracking-[0.08em] text-primary">Screenshots</h3>
      ${screenshots.length
        ? `<div class="grid grid-cols-1 md:grid-cols-3 gap-4">${screenshots.map((shot) => `<div class="aspect-video bg-surface-container overflow-hidden rounded-md group checkpoint-panel"><img class="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500" src="${escapeHtml(shot)}" alt="${escapeHtml(activeEntry.title)} screenshot"></div>`).join("")}</div>`
        : `<div class="rounded-lg px-6 py-8 text-center bg-black/20"><p class="font-label text-[11px] tracking-[0.08em] text-primary mb-2">Media pending</p><p class="text-on-surface-variant">No screenshots are stored for this entry yet. Manual records can be enriched later without changing the run data.</p></div>`}
    </div>
  `;
}

function renderDetailMaintenancePanel(activeEntry) {
  return `
    <div id="detail-maintenance" class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-5">
      <div class="flex flex-col gap-1">
        <h3 class="font-label text-sm tracking-[0.08em] text-primary">Maintenance</h3>
        <p class="text-xs text-zinc-500">Refresh provider data without changing run progress or notes.</p>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        ${renderSecondaryAction("Refresh Metadata (This Entry)", "refresh-entry-metadata", "px-4 py-2 text-[11px] tracking-[0.08em]", `data-entry-id="${activeEntry.entryId}"`)}
        ${renderSecondaryAction("Refresh Artwork (This Entry)", "refresh-entry-artwork", "px-4 py-2 text-[11px] tracking-[0.08em]", `data-entry-id="${activeEntry.entryId}"`)}
      </div>
    </div>
  `;
}

function renderDetailNotesPanel(snapshot) {
  return `
    <div id="detail-notes-section" class="checkpoint-panel rounded-xl p-6 md:p-8 flex flex-col gap-5">
      <div class="flex flex-col gap-1">
        <h3 class="font-label text-sm tracking-[0.08em] text-primary">Notes</h3>
        <p class="text-xs text-zinc-500 mt-1">Quick notes for this run stay editable whether or not detail edit mode is active.</p>
      </div>
      <textarea id="detail-notes" class="w-full min-h-36 bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary resize-y" placeholder="Track what happened in this run, where you stopped, or what to revisit next.">${escapeHtml(snapshot.detailForm.notes)}</textarea>
      <div class="flex justify-end"><p class="mr-auto text-xs text-zinc-500 self-center">Save Notes only affects notes for this run.</p>${renderPrimaryAction("Save Notes (This Entry)", "save-detail-notes", "px-5 py-3 text-xs tracking-[0.08em]")}</div>
    </div>
  `;
}

function renderOverrideChips(game, fields) {
  const locked = Array.isArray(game?.lockedFields) ? game.lockedFields : [];
  const activeLocks = fields.filter((field) => locked.includes(field));
  if (!activeLocks.length) {
    return `<p class="text-xs text-zinc-500">No locked overrides yet.</p>`;
  }

  return `
    <div class="flex flex-wrap gap-2">
      ${activeLocks.map((field) => `<span class="px-2.5 py-1 rounded-md bg-primary/10 font-label text-[11px] tracking-[0.08em] text-primary">${escapeHtml(field)}</span>`).join("")}
    </div>
  `;
}

function renderDetailSidebar(snapshot, activeEntry, game, storefrontDefinitions) {
  if (!snapshot.isDetailEditMode) {
    return `
      <aside id="detail-game-details" class="flex flex-col gap-8">
        <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-8 sticky top-36">
          <div class="flex flex-col gap-5">
            <h4 class="font-label text-sm tracking-[0.08em] text-primary border-b border-outline-variant/20 pb-4">Game Details</h4>
            <div class="flex justify-between items-center"><span class="font-label text-xs text-zinc-500">Storefront</span><span class="font-headline font-bold">${escapeHtml(getStorefrontLabel(storefrontDefinitions, activeEntry.storefront))}</span></div>
            <div class="flex justify-between items-center gap-4"><span class="font-label text-xs text-zinc-500">Developer</span>${renderOptionalText(game?.developer, "Metadata pending")}</div>
            <div class="flex justify-between items-center gap-4"><span class="font-label text-xs text-zinc-500">Publisher</span>${renderOptionalText(game?.publisher, "Metadata pending")}</div>
            <div class="flex justify-between items-center gap-4"><span class="font-label text-xs text-zinc-500">SteamGrid slug</span>${renderOptionalText(game?.steamGridSlug, "Artwork pending")}</div>
          </div>
        </div>
      </aside>
    `;
  }

  return `
    <aside id="detail-game-details" class="flex flex-col gap-8">
        <div class="checkpoint-panel p-8 rounded-xl bg-black/20 flex flex-col gap-8 sticky top-36 max-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar">
        <div class="flex flex-col gap-2">
          <h4 class="font-label text-sm tracking-[0.08em] text-primary">Advanced Overrides</h4>
          <p class="text-xs text-zinc-500 leading-relaxed">Core run logging stays in the main column. Expand sections below only when you need to curate provider data.</p>
        </div>
        <details class="rounded-lg bg-surface-container-low/50 px-4 py-3">
          <summary class="cursor-pointer list-none flex items-center justify-between gap-3">
            <span class="font-label text-sm tracking-[0.08em] text-primary">Edit Metadata</span>
            <span class="material-symbols-outlined text-zinc-500">expand_more</span>
          </summary>
          <div class="mt-4 flex flex-col gap-5">
            <p class="text-xs text-zinc-500 leading-relaxed">Save Details commits these values and keeps them through metadata refreshes until you clear them.</p>
            ${renderOverrideChips(game, ["developer", "publisher", "releaseDate", "criticSummary", "description", "steamGridSlug"])}
            <label class="space-y-2"><span class="font-body text-sm text-zinc-400">Developer</span><input id="override-developer" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary" type="text" value="${escapeHtml(game?.developer ?? "")}"></label>
            <label class="space-y-2"><span class="font-body text-sm text-zinc-400">Publisher</span><input id="override-publisher" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary" type="text" value="${escapeHtml(game?.publisher ?? "")}"></label>
            <label class="space-y-2"><span class="font-body text-sm text-zinc-400">Release Date</span><input id="override-release-date" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary" type="date" value="${escapeHtml(game?.releaseDate ?? "")}"></label>
            <label class="space-y-2"><span class="font-body text-sm text-zinc-400">Critic Summary</span><input id="override-critic-summary" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary" type="text" value="${escapeHtml(game?.criticSummary ?? "")}"></label>
            <label class="space-y-2"><span class="font-body text-sm text-zinc-400">SteamGrid Slug</span><input id="override-steamgrid-slug" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary" type="text" value="${escapeHtml(game?.steamGridSlug ?? "")}"></label>
            <label class="space-y-2"><span class="font-body text-sm text-zinc-400">Description</span><textarea id="override-description" class="w-full min-h-28 bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary resize-y">${escapeHtml(game?.description ?? "")}</textarea></label>
            <div class="flex flex-wrap gap-3">
              ${renderSecondaryAction("Clear Game Details (This Entry)", "clear-metadata-overrides", "px-4 py-3 text-[11px] tracking-[0.08em]", `data-entry-id="${activeEntry.entryId}"`)}
            </div>
          </div>
        </details>
        <details class="rounded-lg bg-surface-container-low/50 px-4 py-3">
          <summary class="cursor-pointer list-none flex items-center justify-between gap-3">
            <span class="font-label text-sm tracking-[0.08em] text-primary">Edit Artwork</span>
            <span class="material-symbols-outlined text-zinc-500">expand_more</span>
          </summary>
          <div class="mt-4 flex flex-col gap-5">
            <p class="text-xs text-zinc-500 leading-relaxed">Save Details commits these values and keeps them through artwork refreshes until you clear them.</p>
            ${renderOverrideChips(game, ["heroArt", "capsuleArt", "screenshots"])}
            <label class="space-y-2"><span class="font-body text-sm text-zinc-400">Hero Art URL</span><input id="override-hero-art" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary" type="url" value="${escapeHtml(game?.heroArt ?? "")}"></label>
            <label class="space-y-2"><span class="font-body text-sm text-zinc-400">Capsule Art URL</span><input id="override-capsule-art" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary" type="url" value="${escapeHtml(game?.capsuleArt ?? "")}"></label>
            <label class="space-y-2"><span class="font-body text-sm text-zinc-400">Screenshot URLs</span><textarea id="override-screenshots" class="w-full min-h-28 bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary resize-y" placeholder="One URL per line">${escapeHtml((game?.screenshots ?? []).join("\n"))}</textarea></label>
            <div class="flex flex-wrap gap-3">
              ${renderSecondaryAction("Clear Artwork (This Entry)", "clear-artwork-overrides", "px-4 py-3 text-[11px] tracking-[0.08em]", `data-entry-id="${activeEntry.entryId}"`)}
            </div>
          </div>
        </details>
      </div>
    </aside>
  `;
}

function renderDetailSectionRail(isNonRunEntry) {
  const items = [
    { id: "detail-game-details", label: "Game Details" },
    { id: "detail-run-details", label: "Run Details" },
    { id: "detail-notes-section", label: "Notes" },
    { id: "detail-screenshots", label: "Screenshots" },
    { id: "detail-maintenance", label: "Maintenance" }
  ];
  if (!isNonRunEntry) {
    items.splice(3, 0, { id: "detail-progress", label: "Progress" });
  }

  return `
    <section data-surface-region="details-local-nav" class="checkpoint-panel rounded-xl px-4 py-3">
      <nav class="flex items-center gap-1 overflow-x-auto custom-scrollbar">
        ${items.map((item) => `<a href="#${item.id}" class="px-3 py-2 whitespace-nowrap rounded-md font-label tracking-[0.08em] text-[11px] text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors">${item.label}</a>`).join("")}
      </nav>
    </section>
  `;
}

export function renderDetailsView(snapshot, storefrontDefinitions, statusDefinitions) {
  const activeEntry = snapshot.activeEntry;
  if (!activeEntry) {
    return `
      <div data-scroll-root="details" data-surface="details" class="pt-[8.75rem] md:pt-24 pb-12 flex-1 overflow-y-auto custom-scrollbar">
        <div class="max-w-[1100px] mx-auto px-6 lg:px-8">
          <section data-surface-region="details-core" class="checkpoint-panel rounded-xl px-8 py-10 min-h-[20rem]">
            <div class="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 items-center">
              <div class="mx-auto md:mx-0 w-full max-w-[220px] aspect-[3/4] overflow-hidden rounded-md bg-zinc-900 cover-shadow">
                ${renderFallbackArt("No Entry Selected", "Open a game", "rounded-md")}
              </div>
              <div class="flex flex-col items-center md:items-start text-center md:text-left gap-4">
                <h2 class="font-headline text-3xl font-extrabold tracking-tight text-on-surface">Select a game to view details</h2>
                <p class="max-w-xl text-on-surface-variant leading-relaxed">Open any library entry to edit run details, update progress, and manage metadata or artwork.</p>
                ${renderPrimaryAction("Back to Library", "set-view", "px-6 py-3 text-xs tracking-[0.08em]", 'data-view="dashboard"')}
              </div>
            </div>
          </section>
        </div>
      </div>
    `;
  }

  const game = getGameForEntry(snapshot, activeEntry);
  const isNonRunEntry = activeEntry.status === "wishlist" || activeEntry.status === "backlog";
  const coverArt = game?.capsuleArt ?? game?.heroArt ?? "";
  const heroBackdropArt = game?.heroArt ?? game?.capsuleArt ?? "";
  const screenshots = Array.isArray(game?.screenshots) ? game.screenshots.filter(hasUsableAsset) : [];
  const description = !isPendingMetadata(game?.description) ? game.description : activeEntry.notes;

  return `
    <div data-scroll-root="details" data-surface="details" class="pt-[8.75rem] md:pt-24 pb-12 flex-1 overflow-y-auto custom-scrollbar">
      <div class="max-w-[1400px] mx-auto px-6 lg:px-8 space-y-10">
        <section data-surface-region="details-hero">
          ${renderDetailHeroSection(snapshot, activeEntry, game, coverArt, heroBackdropArt, description, storefrontDefinitions, statusDefinitions, isNonRunEntry)}
        </section>
        ${renderDetailSectionRail(isNonRunEntry)}
        <div class="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 lg:gap-8">
          <div data-surface-region="details-secondary" class="xl:order-2">
            ${renderDetailSidebar(snapshot, activeEntry, game, storefrontDefinitions)}
          </div>
          <div data-surface-region="details-core" class="flex flex-col gap-8 xl:order-1">
            ${renderDetailWorkspacePanel(snapshot, activeEntry, storefrontDefinitions, isNonRunEntry)}
            ${renderDetailNotesPanel(snapshot)}
            ${isNonRunEntry ? "" : renderDetailProgressPanel(snapshot, activeEntry, statusDefinitions)}
            ${renderDetailMediaPanel(activeEntry, screenshots)}
            ${renderDetailMaintenancePanel(activeEntry)}
          </div>
        </div>
      </div>
    </div>
  `;
}
