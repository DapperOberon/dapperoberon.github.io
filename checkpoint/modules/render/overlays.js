import {
  escapeHtml,
  getStatusMeta,
  getStorefrontLabel,
  hasUsableAsset,
  isPendingMetadata,
  renderFallbackArt
} from "./shared.js";

export function renderDeleteConfirmModal(snapshot, storefrontDefinitions, statusDefinitions) {
  if (!snapshot.pendingDeleteEntryId) return "";

  const pendingEntry = snapshot.library.find((entry) => entry.entryId === snapshot.pendingDeleteEntryId);
  if (!pendingEntry) return "";

  return `
    <div class="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:p-6 bg-black/85 backdrop-blur-sm" data-modal-root="delete-confirm" tabindex="-1">
      <div class="glass-panel w-full max-w-xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto rounded-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.85)] border border-red-400/20 overflow-hidden flex flex-col">
        <div class="p-8 pb-5 flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="w-2 h-2 rounded-[0.15rem] bg-red-300 shadow-[0_0_10px_rgba(252,165,165,0.8)]"></span>
              <span class="font-label tracking-[0.08em] text-[11px] text-red-300">Delete confirmation</span>
            </div>
            <h2 class="font-headline text-3xl font-bold tracking-tight text-on-surface">Remove Entry</h2>
          </div>
          <button class="text-outline hover:text-on-surface transition-colors" data-action="close-delete-confirm">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div data-scroll-root="delete-confirm-modal" class="px-8 pb-6 space-y-5 overflow-y-auto custom-scrollbar">
          <p class="text-on-surface-variant leading-relaxed">
            Delete <span class="text-on-surface font-headline font-bold">${escapeHtml(pendingEntry.title)}</span>
            from your library? This removes the tracked run
            <span class="text-primary font-label tracking-[0.08em] text-xs">${escapeHtml(pendingEntry.runLabel || "Main Save")}</span>
            and cannot be undone yet.
          </p>
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-black/20 p-4 border-l-2 border-red-300/40">
            <div><p class="font-label text-[11px] tracking-[0.08em] text-outline">Storefront</p><p class="font-headline text-sm font-bold text-on-surface">${escapeHtml(getStorefrontLabel(storefrontDefinitions, pendingEntry.storefront))}</p></div>
            <div><p class="font-label text-[11px] tracking-[0.08em] text-outline">Status</p><p class="font-headline text-sm font-bold text-on-surface">${escapeHtml(getStatusMeta(statusDefinitions, pendingEntry.status).label)}</p></div>
            <div><p class="font-label text-[11px] tracking-[0.08em] text-outline">Entry ID</p><p class="font-headline text-sm font-bold text-primary">${escapeHtml(pendingEntry.entryId)}</p></div>
          </div>
        </div>
        <div class="p-8 bg-black/40 flex items-center justify-between border-t border-outline-variant/10 gap-6 shrink-0">
          <p class="font-label text-[11px] tracking-[0.08em] text-outline">If this is the final run for this title, its catalog metadata is cleaned up too.</p>
          <div class="flex items-center gap-4">
            <button class="font-label text-xs tracking-[0.08em] text-outline hover:text-on-surface transition-colors" data-action="close-delete-confirm">Cancel</button>
            <button class="checkpoint-button checkpoint-button-danger px-8 py-3 font-label font-bold text-xs tracking-[0.08em] rounded-sm" data-action="confirm-delete-entry">Delete Entry</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderGlobalNotice(snapshot) {
  if (!snapshot.notice) return "";

  const toneClasses = {
    success: "border-emerald-300/30 bg-emerald-400/10 text-emerald-100",
    error: "border-red-300/30 bg-red-400/10 text-red-100",
    info: "border-primary/30 bg-primary/10 text-on-surface"
  };

  return `
    <div class="fixed bottom-6 right-6 z-[70] max-w-md">
      <div class="glass-panel rounded-xl border px-5 py-4 shadow-[0_20px_48px_rgba(0,0,0,0.45)] ${toneClasses[snapshot.notice.tone] ?? toneClasses.info}">
        <div class="flex items-start gap-4">
          <div class="flex-1">
            <p class="font-label text-[11px] tracking-[0.08em] opacity-80 mb-1">Status</p>
            <p class="text-sm leading-relaxed">${escapeHtml(snapshot.notice.message)}</p>
          </div>
          <button class="text-current/70 hover:text-current transition-colors" data-action="dismiss-notice" aria-label="Dismiss status message">
            <span class="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      </div>
    </div>
  `;
}

export function renderMediaLightbox(snapshot) {
  const lightbox = snapshot.mediaLightbox;
  if (!lightbox?.open) return "";

  const images = Array.isArray(lightbox.images) ? lightbox.images.filter(hasUsableAsset) : [];
  if (!images.length) return "";

  const index = Math.max(0, Math.min(Number(lightbox.index) || 0, images.length - 1));
  const currentImage = images[index];
  const title = String(lightbox.title || "Screenshot");

  return `
    <div class="checkpoint-lightbox-root z-[90] p-2 md:p-3 2xl:p-2" data-modal-root="media-lightbox" tabindex="-1">
      <div class="checkpoint-lightbox-shell w-full h-full rounded-xl flex flex-col overflow-hidden">
        <div class="checkpoint-lightbox-header checkpoint-lightbox-header-grid px-4 md:px-6 py-3">
          <div class="min-w-0">
            <p class="font-label text-[11px] tracking-[0.08em] text-primary">Screenshot Preview</p>
            <p class="text-sm text-zinc-300 truncate">${escapeHtml(title)}</p>
          </div>
          <div class="flex items-center justify-center gap-2">
            <button class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-xs tracking-[0.08em] inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed" data-action="media-lightbox-prev" ${index <= 0 ? "disabled" : ""}>
              <span class="material-symbols-outlined text-sm">arrow_back</span>
              Prev
            </button>
            <p class="font-label text-xs tracking-[0.08em] text-zinc-300 min-w-[4.25rem] text-center">${index + 1} / ${images.length}</p>
            <button class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-xs tracking-[0.08em] inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed" data-action="media-lightbox-next" ${index >= images.length - 1 ? "disabled" : ""}>
              Next
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
          <button class="checkpoint-button checkpoint-button-secondary px-4 py-2 text-xs tracking-[0.08em] inline-flex items-center gap-1.5" data-action="close-media-lightbox" aria-label="Close screenshot preview">
            <span class="material-symbols-outlined text-sm">close</span>
            Close
          </button>
        </div>
        <div class="flex-1 min-h-0 px-2 md:px-3 py-2">
          <div class="checkpoint-lightbox-stage h-full flex items-center justify-center overflow-hidden rounded-md">
            <img class="checkpoint-lightbox-image object-contain object-center" src="${escapeHtml(currentImage)}" alt="${escapeHtml(title)} screenshot ${index + 1}">
          </div>
        </div>
        <div class="checkpoint-lightbox-footer px-4 md:px-6 py-3 overflow-x-auto custom-scrollbar">
          <div class="flex items-center gap-2 min-w-max">
          ${images.map((image, imageIndex) => `
            <button
              class="discover-screenshot-thumb ${imageIndex === index ? "is-active" : ""} overflow-hidden rounded-md"
              data-action="media-lightbox-jump"
              data-media-index="${imageIndex}"
              aria-label="Open screenshot ${imageIndex + 1}"
            >
              <img class="w-full h-full object-cover" src="${escapeHtml(image)}" alt="">
            </button>
          `).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

export function renderAddModal(snapshot, statusDefinitions, storefrontDefinitions) {
  if (!snapshot.isAddModalOpen) return "";
  const duplicateEntry = snapshot.addFormValidation.duplicateEntry;
  const hasErrors = snapshot.addFormValidation.errors.length > 0;
  const inSearchStep = snapshot.addForm.step !== "log";
  const selectedResult = snapshot.addForm.selectedSearchResult;
  const selectedCover = selectedResult?.steamGridCover || selectedResult?.coverArt || "";

  const feedbackToneClasses = {
    info: "border-primary/20 bg-primary/10 text-on-surface",
    error: "border-red-300/20 bg-red-400/10 text-red-100",
    success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
  };

  return `
    <div class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6 bg-black/80 backdrop-blur-sm" data-modal-root="add-entry" tabindex="-1">
      <div class="glass-panel w-full max-w-4xl max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] my-auto rounded-xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-outline-variant/10 overflow-hidden flex flex-col">
        <div class="p-8 pb-4 flex justify-between items-start shrink-0 border-b border-outline-variant/10">
          <div>
            <p class="font-label text-[11px] tracking-[0.08em] text-primary mb-2">${inSearchStep ? "Step 1 · Find Game" : "Step 2 · Log Run"}</p>
            <h2 class="font-headline text-3xl font-bold tracking-tight text-on-surface">${inSearchStep ? "Add Game" : "Add Entry"}</h2>
          </div>
          <button class="text-outline hover:text-on-surface transition-colors" data-action="close-add-modal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div data-scroll-root="add-entry-modal" class="px-8 py-6 overflow-y-auto custom-scrollbar">
          ${inSearchStep ? `
            <div class="space-y-6">
              <div class="space-y-3">
                <label class="font-label text-[11px] tracking-[0.08em] text-zinc-400">Search IGDB</label>
                <div class="flex gap-3">
                  <div class="checkpoint-search-shell flex-1 flex items-center rounded-md px-3">
                    <span class="material-symbols-outlined text-zinc-500 mr-2 text-base">search</span>
                    <input id="add-search-query" class="checkpoint-search-input add-search-input border-none focus:ring-0 w-full font-body text-sm text-on-surface py-2.5 placeholder:text-zinc-500 rounded-md" placeholder="Search game title..." type="text" value="${escapeHtml(snapshot.addForm.searchQuery)}">
                  </div>
                  <button class="checkpoint-button checkpoint-button-primary px-5 py-3 font-label font-bold text-xs tracking-[0.08em] rounded-md disabled:opacity-60 disabled:cursor-not-allowed" data-action="search-add-catalog" ${snapshot.addSearchLoading || !snapshot.addForm.searchQuery.trim() ? "disabled" : ""}>${snapshot.addSearchLoading ? "Searching..." : "Search"}</button>
                </div>
                <p class="text-xs text-zinc-500">Pick a match, then confirm run details. Covers in this flow come from SteamGrid and search auto-runs after a short pause.</p>
              </div>
              <div class="space-y-3">
                ${snapshot.addSearchLoading ? `<div class="p-4 rounded-lg border border-primary/10 bg-surface-container-low/40 text-sm text-zinc-300">Searching IGDB and resolving SteamGrid covers...</div>` : ""}
                ${!snapshot.addSearchLoading && snapshot.addSearchError ? `<div class="p-4 rounded-lg border border-amber-300/20 bg-amber-400/10 text-sm text-amber-100">${escapeHtml(snapshot.addSearchError)}</div>` : ""}
                ${!snapshot.addSearchLoading && snapshot.addSearchResults.length ? `
                  <div class="space-y-2">
                    ${snapshot.addSearchResults.map((result) => `
                      <button class="w-full text-left flex items-center gap-4 p-3 rounded-lg border border-primary/10 bg-surface-container-low/30 hover:bg-primary/5 transition-colors" data-action="select-add-search-result" data-search-result-id="${escapeHtml(result.id)}">
                        <div class="w-12 h-16 bg-zinc-800 rounded overflow-hidden shrink-0">
                          ${hasUsableAsset(result.steamGridCover || result.coverArt)
                            ? `<img class="w-full h-full object-cover" src="${escapeHtml(result.steamGridCover || result.coverArt)}" alt="${escapeHtml(result.title)} cover">`
                            : renderFallbackArt(result.title, "SteamGrid pending", "text-xs p-2")}
                        </div>
                        <div class="min-w-0">
                          <p class="font-headline font-bold text-sm text-on-surface truncate">${escapeHtml(result.title)}</p>
                          <p class="text-xs text-zinc-400 mt-1">${escapeHtml(result.releaseDate ? result.releaseDate.slice(0, 4) : "Year unknown")} ${result.platforms?.length ? `· ${escapeHtml(result.platforms.join(", "))}` : ""}</p>
                        </div>
                        <span class="material-symbols-outlined text-primary ml-auto">arrow_forward</span>
                      </button>
                    `).join("")}
                  </div>
                ` : ""}
              </div>
            </div>
          ` : `
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div class="lg:col-span-4 space-y-4">
                <div class="rounded-lg border border-primary/10 bg-surface-container-low/30 p-4">
                  <p class="font-label text-[11px] tracking-[0.08em] text-primary mb-3">${snapshot.addForm.mode === "manual" ? "Manual Entry" : "Selected Game"}</p>
                  <div class="flex gap-3">
                    <div class="w-16 h-24 rounded overflow-hidden bg-zinc-800 shrink-0">
                      ${hasUsableAsset(selectedCover)
                        ? `<img class="w-full h-full object-cover" src="${escapeHtml(selectedCover)}" alt="${escapeHtml(snapshot.addForm.title || "Selected game")} cover">`
                        : renderFallbackArt(snapshot.addForm.title || "Manual", "SteamGrid cover", "text-xs p-2")}
                    </div>
                    <div class="min-w-0">
                      <p class="font-headline text-base font-bold text-on-surface line-clamp-2">${escapeHtml(snapshot.addForm.title || "Manual game")}</p>
                      <p class="text-xs text-zinc-400 mt-1">${escapeHtml(selectedResult?.releaseDate ? selectedResult.releaseDate.slice(0, 4) : "Year unknown")}</p>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-2 mt-4">
                    <button class="checkpoint-button checkpoint-button-secondary px-3 py-2 text-[11px] tracking-[0.08em] rounded-md" data-action="back-add-search">Back to Search</button>
                    ${snapshot.addForm.mode !== "manual" ? `<button class="checkpoint-button checkpoint-button-secondary px-3 py-2 text-[11px] tracking-[0.08em] rounded-md" data-action="switch-add-manual">Switch to Manual</button>` : ""}
                  </div>
                </div>
              </div>
              <div class="lg:col-span-8 space-y-5">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label class="space-y-2"><span class="font-label text-[11px] tracking-[0.08em] text-zinc-400">Title</span><input id="add-title" class="w-full bg-black/30 border ${hasErrors && !snapshot.addForm.title.trim() ? "border-red-300/40" : "border-primary/10"} rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary" type="text" value="${escapeHtml(snapshot.addForm.title)}"></label>
                  <label class="space-y-2"><span class="font-label text-[11px] tracking-[0.08em] text-zinc-400">Storefront</span><select id="add-storefront" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary appearance-none">${storefrontDefinitions.map((item) => `<option class="bg-surface" value="${item.id}" ${snapshot.addForm.storefront === item.id ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></label>
                  <label class="space-y-2"><span class="font-label text-[11px] tracking-[0.08em] text-zinc-400">Run Label</span><input id="add-run-label" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary" type="text" value="${escapeHtml(snapshot.addForm.runLabel || "Main Save")}"></label>
                  <label class="space-y-2"><span class="font-label text-[11px] tracking-[0.08em] text-zinc-400">Playtime (Hours)</span><input id="add-playtime-hours" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary" type="number" min="0" step="0.5" value="${escapeHtml(snapshot.addForm.playtimeHours ?? "0")}"></label>
                  <label class="space-y-2 sm:col-span-2"><span class="font-label text-[11px] tracking-[0.08em] text-zinc-400">Completion (%)</span><input id="add-completion-percent" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary" type="number" min="0" max="100" step="1" value="${escapeHtml(snapshot.addForm.completionPercent ?? "0")}"></label>
                </div>
                <div class="space-y-2">
                  <span class="font-label text-[11px] tracking-[0.08em] text-zinc-400">Status</span>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    ${statusDefinitions.map((status) => `<button class="flex items-center justify-between p-3 rounded-lg ${snapshot.addForm.status === status.id ? "bg-surface-container-high border border-primary/20" : "bg-surface-container-low/40 hover:bg-surface-container-high"} transition-colors group" data-action="pick-form-status" data-status="${status.id}"><span class="font-label text-xs tracking-[0.08em] ${snapshot.addForm.status === status.id ? "text-on-surface" : "text-outline"}">${escapeHtml(status.label)}</span><div class="w-4 h-4 rounded-[0.2rem] border ${snapshot.addForm.status === status.id ? "border-primary flex items-center justify-center" : "border-outline-variant"}">${snapshot.addForm.status === status.id ? '<div class="w-2 h-2 rounded-[0.15rem] bg-primary shadow-[0_0_8px_#a8e8ff]"></div>' : ""}</div></button>`).join("")}
                  </div>
                </div>
                <label class="space-y-2 block"><span class="font-label text-[11px] tracking-[0.08em] text-zinc-400">Notes</span><textarea id="add-notes" class="w-full bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-body text-sm text-on-surface focus:ring-1 focus:ring-primary min-h-24 resize-y" placeholder="Optional run notes...">${escapeHtml(snapshot.addForm.notes)}</textarea></label>
                ${duplicateEntry ? `<div class="border border-amber-300/20 bg-amber-400/10 px-4 py-3 rounded-lg"><p class="font-label text-[11px] tracking-[0.08em] text-amber-100 mb-1">Duplicate warning</p><p class="text-xs leading-relaxed text-amber-50">A run already exists for ${escapeHtml(duplicateEntry.title)} on ${escapeHtml(getStorefrontLabel(storefrontDefinitions, duplicateEntry.storefront))} with label ${escapeHtml(duplicateEntry.runLabel || "Main Save")}.</p></div>` : ""}
                ${snapshot.addFormValidation.errors.length ? `<div class="border border-red-300/20 bg-red-400/10 p-4 rounded-lg"><p class="font-label text-[11px] tracking-[0.08em] text-red-100 mb-1">Required fixes</p><div class="space-y-1 text-xs text-red-50">${snapshot.addFormValidation.errors.map((error) => `<p>${escapeHtml(error)}</p>`).join("")}</div></div>` : ""}
                ${snapshot.addFormFeedback ? `<div class="border p-4 rounded-lg ${feedbackToneClasses[snapshot.addFormFeedback.tone] ?? feedbackToneClasses.info}"><p class="text-xs">${escapeHtml(snapshot.addFormFeedback.message)}</p></div>` : ""}
              </div>
            </div>
          `}
        </div>
        <div class="p-8 bg-black/40 flex items-center justify-between border-t border-outline-variant/10 shrink-0">
          <button class="font-label text-sm tracking-[0.08em] text-outline hover:text-on-surface transition-colors" data-action="close-add-modal">Cancel</button>
          <div class="flex items-center gap-3">
            ${inSearchStep ? `<button class="checkpoint-button checkpoint-button-secondary px-4 py-3 text-xs tracking-[0.08em] rounded-md" data-action="begin-add-manual">Manual Entry</button>` : ""}
            ${inSearchStep
              ? `<button class="checkpoint-button checkpoint-button-primary px-6 py-3 text-xs tracking-[0.08em] rounded-md disabled:opacity-60 disabled:cursor-not-allowed" data-action="search-add-catalog" ${snapshot.addSearchLoading || !snapshot.addForm.searchQuery.trim() ? "disabled" : ""}>${snapshot.addSearchLoading ? "Searching..." : "Search Games"}</button>`
              : `<button class="checkpoint-button checkpoint-button-primary px-6 py-3 text-xs tracking-[0.08em] rounded-md disabled:opacity-60 disabled:cursor-not-allowed" data-action="commit-entry" ${snapshot.isAddFormSubmitting ? "disabled" : ""}>${snapshot.isAddFormSubmitting ? "Saving..." : "Save Entry"}</button>`
            }
          </div>
        </div>
      </div>
    </div>
  `;
}
