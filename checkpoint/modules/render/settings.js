import {
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

function renderSettingsSectionRail() {
  const items = [
    { id: "settings-sync-account", label: "Sync & Device" },
    { id: "settings-backup-restore", label: "Backup & Restore" },
    { id: "settings-maintenance", label: "Maintenance" }
  ];

  return `
    <section data-surface-region="settings-local-nav" class="checkpoint-panel rounded-xl px-4 py-3 mb-8">
      <nav class="flex items-center gap-1 overflow-x-auto custom-scrollbar">
        ${items.map((item) => `<a href="#${item.id}" class="px-3 py-2 whitespace-nowrap rounded-md font-label tracking-[0.08em] text-[11px] text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.03] transition-colors">${item.label}</a>`).join("")}
      </nav>
    </section>
  `;
}

export function renderSettingsView(snapshot) {
  const conflict = snapshot.syncStatus.syncConflict;
  const conflictPrefersRemote = conflict?.preferredResolution === "restore-remote";
  const conflictPrimaryAction = conflictPrefersRemote ? "restore-google-drive" : "keep-local-during-conflict";
  const conflictSecondaryLabel = conflictPrefersRemote ? "Keep Local (This Device)" : "Restore Drive (This Device)";
  const conflictSecondaryAction = conflictPrefersRemote ? "keep-local-during-conflict" : "restore-google-drive";

  return `
    <main data-scroll-root="settings" data-surface="settings" class="pt-[8.75rem] md:pt-24 pb-12 flex-1 overflow-y-auto custom-scrollbar">
      <div class="max-w-[1400px] mx-auto px-6 lg:px-8">
        <div class="mb-12 max-w-3xl">
          <p class="font-label text-[11px] tracking-[0.08em] text-primary mb-3">Settings</p>
          <h1 class="text-4xl font-headline font-extrabold tracking-tight text-on-surface">Sync, backup, and library maintenance.</h1>
          <p class="mt-3 text-on-surface-variant leading-relaxed">Manage Drive sync, backups, and refresh actions while keeping run tracking local-first.</p>
        </div>
        ${renderSettingsSectionRail()}
        <section id="settings-sync-account" data-surface-region="settings-sync-account" class="space-y-8">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div class="xl:col-span-12 grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-6">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 class="font-label tracking-[0.08em] text-sm font-bold text-primary">Drive Sync</h3>
                  <p class="text-sm text-zinc-500 mt-1">Connect your Google account and sync your full Checkpoint state.</p>
                </div>
                ${snapshot.syncStatus.driveConnected
                  ? renderScopedPrimaryAction("Sync Now", "This Device", "mark-all-synced")
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
              ${renderSettingsNotice(snapshot.actionState.sync)}
            </div>
            <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-5">
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
            </div>
          </div>
        </section>
        <section id="settings-backup-restore" data-surface-region="settings-backup-restore" class="space-y-8 mt-10">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div class="xl:col-span-12 grid grid-cols-1 xl:grid-cols-2 gap-8">
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
        <section id="settings-maintenance" data-surface-region="settings-maintenance" class="space-y-8 mt-10">
          <div class="grid grid-cols-1 xl:grid-cols-12 gap-8">
            <div class="xl:col-span-12 grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div class="checkpoint-panel p-8 rounded-xl flex flex-col gap-5">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p class="font-label tracking-[0.08em] text-[11px] text-primary mb-2">Maintenance</p>
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
                  ${renderSecondaryAction("Refresh Artwork (Library-wide)", "refresh-library-artwork", "px-5 py-3 text-[11px] tracking-[0.08em] whitespace-nowrap")}
                </div>
                <p class="text-xs text-zinc-500">Refreshes artwork for tracked titles without exposing secrets in the browser.</p>
                ${renderSettingsNotice(snapshot.actionState.artwork)}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  `;
}
