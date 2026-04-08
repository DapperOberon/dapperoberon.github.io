export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatDate(dateString) {
  if (!dateString) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(dateString));
}

export function formatRelative(dateString) {
  if (!dateString) return "Unknown";
  const diff = Date.now() - new Date(dateString).getTime();
  const day = 24 * 60 * 60 * 1000;
  if (diff < day) return "Today";
  if (diff < day * 2) return "Yesterday";
  return `${Math.round(diff / day)}d ago`;
}

export function isUnreleasedGame(releaseDate) {
  const value = String(releaseDate ?? "").trim();
  if (!value) return false;

  const normalized = value.toLowerCase();
  if (
    normalized.includes("tbd")
    || normalized.includes("to be announced")
    || normalized.includes("coming soon")
  ) {
    return true;
  }

  const releaseTime = Date.parse(value);
  if (!Number.isFinite(releaseTime)) return false;
  return releaseTime > Date.now();
}

export function getReleaseState(releaseDate) {
  const value = String(releaseDate ?? "").trim();
  if (!value) return "tbd";

  const normalized = value.toLowerCase();
  if (normalized.includes("tbd") || normalized.includes("to be announced")) {
    return "tbd";
  }
  if (normalized.includes("coming soon")) {
    return "coming-soon";
  }

  const releaseTime = Date.parse(value);
  if (!Number.isFinite(releaseTime)) {
    return "tbd";
  }
  if (releaseTime > Date.now()) {
    return "releasing-soon";
  }
  return "released";
}

export function getReleaseStateLabel(releaseState) {
  return {
    released: "Released",
    "releasing-soon": "Releasing Soon",
    "coming-soon": "Coming Soon",
    tbd: "TBD"
  }[releaseState] ?? "TBD";
}

export function getReleaseStatusDetail(releaseDate) {
  const state = getReleaseState(releaseDate);
  const value = String(releaseDate ?? "").trim();
  if (state === "released") {
    return value ? formatDate(value) : "Released";
  }
  if (state === "releasing-soon") {
    const releaseTime = Date.parse(value);
    if (!Number.isFinite(releaseTime)) return "Releasing soon";
    const diffMs = releaseTime - Date.now();
    const diffDays = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
    return diffDays <= 0 ? formatDate(value) : `Releasing in ${diffDays} day${diffDays === 1 ? "" : "s"}`;
  }
  if (state === "coming-soon") {
    return "Coming soon";
  }
  return "Release date TBD";
}

export function formatCurrency(amount, currency = "USD") {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return "N/A";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: String(currency || "USD").toUpperCase(),
      maximumFractionDigits: 2
    }).format(numeric);
  } catch (error) {
    return `${String(currency || "USD").toUpperCase()} ${numeric.toFixed(2)}`;
  }
}

export function getStorefrontLabel(storefrontDefinitions, storefrontId) {
  return storefrontDefinitions.find((item) => item.id === storefrontId)?.label ?? storefrontId;
}

export function getStatusMeta(statusDefinitions, statusId) {
  return statusDefinitions.find((item) => item.id === statusId) ?? statusDefinitions[0];
}

export function getGameForEntry(snapshot, entry) {
  return snapshot.catalog.find((item) => item.id === entry.gameId) ?? null;
}

export function hasUsableAsset(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function isPendingMetadata(value) {
  if (typeof value !== "string") return true;
  const normalized = value.trim().toLowerCase();
  return !normalized || normalized.startsWith("unknown ");
}

export function renderFallbackArt(title, subtitle = "Manual entry", className = "") {
  return `
    <div class="w-full h-full ${className} bg-[radial-gradient(circle_at_top,#183548_0%,#09111a_45%,#05070b_100%)] flex flex-col justify-end p-5">
      <div class="w-10 h-10 rounded-md border border-primary/30 bg-primary/10 flex items-center justify-center mb-4">
        <span class="material-symbols-outlined text-primary">stadia_controller</span>
      </div>
      <p class="font-body text-xs tracking-[0.04em] text-primary mb-2">${escapeHtml(subtitle)}</p>
      <h3 class="font-headline text-xl font-extrabold tracking-tight text-on-surface">${escapeHtml(title)}</h3>
    </div>
  `;
}

export function renderOptionalText(value, fallbackLabel) {
  return isPendingMetadata(value)
    ? `<span class="font-body text-xs text-zinc-500">${escapeHtml(fallbackLabel)}</span>`
    : `<span class="font-headline font-bold">${escapeHtml(value)}</span>`;
}

export function renderPrimaryAction(label, dataAction, extraClasses = "", extraAttributes = "") {
  return `
    <button class="checkpoint-button checkpoint-button-primary font-label font-bold ${extraClasses}" data-action="${dataAction}" ${extraAttributes}>
      ${escapeHtml(label)}
    </button>
  `;
}

export function renderSecondaryAction(label, dataAction, extraClasses = "", extraAttributes = "") {
  return `
    <button class="checkpoint-button checkpoint-button-secondary font-label font-bold ${extraClasses}" data-action="${dataAction}" ${extraAttributes}>
      ${escapeHtml(label)}
    </button>
  `;
}

export function renderMetaChip(label, tone = "neutral") {
  const toneClasses = {
    primary: "bg-primary/10 text-primary border border-primary/20",
    neutral: "bg-white/[0.03] text-zinc-300 border border-white/[0.08]"
  };

  return `
    <span class="px-2.5 py-1 rounded-md font-label text-[11px] tracking-[0.08em] ${toneClasses[tone] ?? toneClasses.neutral}">
      ${escapeHtml(label)}
    </span>
  `;
}

export function renderActionMessage(messageState) {
  if (!messageState) return "";

  const toneClasses = {
    info: "border-primary/20 bg-primary/10 text-on-surface",
    warning: "border-amber-300/20 bg-amber-400/10 text-amber-100",
    success: "border-emerald-300/20 bg-emerald-400/10 text-emerald-100",
    error: "border-red-300/20 bg-red-400/10 text-red-100"
  };

  return `
    <div class="border rounded-lg px-4 py-3 ${toneClasses[messageState.tone] ?? toneClasses.info}">
      <p class="font-body text-xs">${escapeHtml(messageState.message)}</p>
    </div>
  `;
}

export function renderPreference(label, key, enabled) {
  return `
    <button class="flex items-center justify-between p-3 rounded-lg bg-surface-container-low/40 hover:bg-surface-container-high transition-colors group w-full text-left" data-action="toggle-preference" data-key="${key}">
      <span class="font-label text-xs tracking-[0.08em] ${enabled ? "text-on-surface" : "text-outline"}">${escapeHtml(label)}</span>
      <div class="w-4 h-4 rounded-[0.2rem] border ${enabled ? "border-primary bg-primary flex items-center justify-center" : "border-outline-variant bg-transparent"}">
        ${enabled ? '<span class="material-symbols-outlined text-[12px] leading-none text-[#041017]" style="font-variation-settings: \'FILL\' 1;">check</span>' : ""}
      </div>
    </button>
  `;
}

export function getWishlistPriorityLabel(value) {
  return {
    low: "Low Priority",
    medium: "Medium Priority",
    high: "High Priority",
    "must-buy": "Must Buy"
  }[value] ?? "Medium Priority";
}

export function getWishlistIntentLabel(value) {
  return {
    "buy-now": "Buy Now",
    "wait-sale": "Wait for Sale",
    "monitor-release": "Monitor Release",
    research: "Research"
  }[value] ?? "Wait for Sale";
}
