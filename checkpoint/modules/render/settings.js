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

function getSettingsRailItems() {
  return [
    { id: "settings-sync-account", label: "Sync & Device" },
    { id: "settings-backup-restore", label: "Backup & Restore" },
    { id: "settings-maintenance", label: "Maintenance" },
    { id: "settings-activity", label: "Activity" }
  ];
}

function renderSettingsSectionRail(items, activeSection, mode = "mobile") {
  if (mode === "desktop") {
    return `
      <aside data-surface-region="settings-local-nav" class="hidden xl:block">
        <div class="checkpoint-panel rounded-xl p-5 sticky top-36">
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
    <section data-surface-region="settings-local-nav" class="checkpoint-panel rounded-xl px-4 py-3 mb-8 xl:hidden">
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
      <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-3 xl:col-span-2">
        <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary">Recent Sync Activity</h3>
        <p class="text-sm text-zinc-500">No sync activity yet. Run Sync Now after connecting Drive to populate this history.</p>
      </div>
    `;
  }

  return `
    <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-4 xl:col-span-2">
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
        <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-3">
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
      <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-4">
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
        <section id="settings-sync-account" data-surface-region="settings-sync-account" class="space-y-8">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div class="xl:col-span-12 grid grid-cols-1 gap-8">
            <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary">Drive Sync</h3>
                  <p class="text-sm text-zinc-500 mt-1">Connect your Google account and sync your full Checkpoint state.</p>
                </div>
                ${snapshot.syncStatus.driveConnected
                  ? renderScopedPrimaryAction("Sync Now", "This Device", "sync-now")
                  : renderScopedPrimaryAction("Connect Drive", "This Device", "connect-google-drive")}
              </div>
              <div class="flex flex-wrap items-center gap-3 text-xs text-zinc-500 leading-relaxed">
                <span>${snapshot.syncStatus.driveConnected ? "Connected with browser-based Google OAuth." : snapshot.syncStatus.driveClientConfigured ? "OAuth is configured. Connect when you are ready." : "Add googleDriveClientId to checkpoint/config.js to enable Drive sync."}</span>
              </div>
              <p class="text-xs text-zinc-500">If Drive is unavailable, tracking still works locally on this device.</p>
              ${snapshot.syncStatus.driveConnected ? `
                <div class="flex flex-wrap items-center gap-3">
                  ${renderSecondaryAction("Restore From Drive (Replace This Device)", "restore-google-drive", "px-4 py-2 text-[11px] tracking-[0.12em]")}
                  ${renderSecondaryAction("Disconnect Drive (This Device)", "disconnect-google-drive", "px-4 py-2 text-[11px] tracking-[0.12em]")}
                </div>
              ` : ""}
              <div class="rounded-lg bg-black/20 px-4 py-4">
                <p class="font-label text-[11px] tracking-[0.08em] text-zinc-500 mb-3">Sync Preferences</p>
                <div class="space-y-3">
                  ${renderPreference("Auto-backup on state change", "autoBackup", snapshot.syncPreferences.autoBackup)}
                  ${renderPreference("Include artwork payloads", "includeArtwork", snapshot.syncPreferences.includeArtwork)}
                  ${renderPreference("Include archive notes", "includeNotes", snapshot.syncPreferences.includeNotes)}
                  ${renderPreference("Include activity history", "includeActivityHistory", snapshot.syncPreferences.includeActivityHistory)}
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
              ${snapshot.restorePointMeta
                ? `<div class="rounded-lg bg-primary/6 px-4 py-3"><p class="font-label text-[11px] tracking-[0.08em] text-primary mb-2">Local Restore Safety Snapshot</p><div class="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-400"><span>Saved ${formatRelative(snapshot.restorePointMeta.timestamp)} from ${snapshot.restorePointMeta.source}</span>${renderSecondaryAction("Restore Local Snapshot (This Device)", "restore-local-snapshot", "px-4 py-2 text-[11px] tracking-[0.12em]")}</div></div>`
                : `<p class="text-xs text-zinc-500 leading-relaxed">Before a Drive restore runs, Checkpoint saves a local restore safety snapshot in this browser so you can roll back quickly.</p>`}
              <div class="rounded-lg bg-black/20 px-4 py-4 flex flex-col gap-5">
                <div class="flex flex-col gap-2">
                  <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary">Current Device</h3>
                  <p class="text-on-surface-variant leading-relaxed text-sm">Name this browser so sync and recovery choices are easier to read.</p>
                </div>
                <div class="space-y-2">
                  <label class="font-label text-[11px] tracking-[0.08em] text-zinc-500" for="device-label">Device Label</label>
                  <div class="flex flex-col sm:flex-row gap-3">
                    <input id="device-label" class="flex-1 bg-black/30 border border-primary/10 rounded-lg px-4 py-3 font-label text-sm text-on-surface focus:ring-1 focus:ring-primary" type="text" value="${snapshot.syncStatus.currentDeviceLabel}">
                    ${renderSecondaryAction("Save Label (This Device)", "save-device-label", "px-4 py-3 text-[11px] tracking-[0.12em] whitespace-nowrap")}
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
              ${renderSettingsNotice(snapshot.actionState.sync)}
            </div>
            ${renderSyncHistoryPanel(snapshot.syncHistory)}
            </div>
          </div>
        </section>
        ` : ""}
        ${activeSection === "settings-backup-restore" ? `
        <section id="settings-backup-restore" data-surface-region="settings-backup-restore" class="space-y-8 mt-10">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div class="xl:col-span-12 grid grid-cols-1 gap-8">
              <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-5">
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
              <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-5">
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
        ${activeSection === "settings-maintenance" ? `
        <section id="settings-maintenance" data-surface-region="settings-maintenance" class="space-y-8 mt-10">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div class="xl:col-span-12 grid grid-cols-1 gap-8">
              <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-5">
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
              <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-5">
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
              <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-5">
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
