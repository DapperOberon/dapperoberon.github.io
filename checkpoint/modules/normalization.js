function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function trimOrFallback(value, fallback = "") {
  return isNonEmptyString(value) ? value.trim() : fallback;
}

function inferIgdbId(value, fallback = null) {
  const directValue = Number(value);
  if (Number.isFinite(directValue) && directValue > 0) return directValue;

  const raw = trimOrFallback(value, "");
  const match = raw.match(/^igdb-(\d+)$/i);
  if (match) {
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  const fallbackValue = Number(fallback);
  return Number.isFinite(fallbackValue) && fallbackValue > 0 ? fallbackValue : null;
}

function clampNumber(value, { min = 0, max = Number.POSITIVE_INFINITY, fallback = 0 } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}

function normalizeStringArray(value, fallback = []) {
  if (Array.isArray(value)) {
    return value.filter(isNonEmptyString).map((item) => item.trim());
  }

  return Array.isArray(fallback) ? fallback : [];
}

function normalizeVideoArray(value, fallback = []) {
  const input = Array.isArray(value) ? value : (Array.isArray(fallback) ? fallback : []);
  return input
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      title: trimOrFallback(item.title, ""),
      url: trimOrFallback(item.url, ""),
      embedUrl: trimOrFallback(item.embedUrl, ""),
      thumbnail: trimOrFallback(item.thumbnail, trimOrFallback(item.previewImage, trimOrFallback(item.coverArt, "")))
    }))
    .filter((item) => item.url || item.embedUrl);
}

function normalizeLinks(value, fallback = {}) {
  const source = value && typeof value === "object" ? value : {};
  const fallbackSource = fallback && typeof fallback === "object" ? fallback : {};
  const storefronts = Array.isArray(source.storefronts)
    ? source.storefronts
    : (Array.isArray(fallbackSource.storefronts) ? fallbackSource.storefronts : []);
  return {
    igdb: trimOrFallback(source.igdb, trimOrFallback(fallbackSource.igdb, "")),
    official: trimOrFallback(source.official, trimOrFallback(fallbackSource.official, "")),
    storefronts: storefronts
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        kind: trimOrFallback(item.kind, ""),
        url: trimOrFallback(item.url, "")
      }))
      .filter((item) => item.url)
  };
}

function normalizeRelatedTitles(value, fallback = []) {
  const input = Array.isArray(value) ? value : (Array.isArray(fallback) ? fallback : []);
  return input
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      id: trimOrFallback(item.id, trimOrFallback(item.igdbId, "")),
      igdbId: Number.isFinite(Number(item.igdbId)) ? Number(item.igdbId) : null,
      title: trimOrFallback(item.title, ""),
      releaseDate: trimOrFallback(item.releaseDate, ""),
      coverArt: trimOrFallback(item.coverArt, ""),
      description: trimOrFallback(item.description, ""),
      platforms: normalizeStringArray(item.platforms, [])
    }))
    .filter((item) => item.id && item.title);
}

function normalizePriceWatch(priceWatch, fallback = {}, status = "playing") {
  const source = priceWatch && typeof priceWatch === "object" ? priceWatch : {};
  const fallbackSource = fallback && typeof fallback === "object" ? fallback : {};
  const parseTarget = Number(source.targetPrice ?? fallbackSource.targetPrice);
  const normalizedStatus = normalizeStatus(status, "playing");

  const hasExplicitEnabled = typeof source.enabled === "boolean";
  const fallbackEnabled = typeof fallbackSource.enabled === "boolean" ? fallbackSource.enabled : null;
  const enabled = hasExplicitEnabled
    ? source.enabled
    : (fallbackEnabled ?? (normalizedStatus === "wishlist"));

  return {
    enabled,
    targetPrice: Number.isFinite(parseTarget) && parseTarget >= 0 ? parseTarget : null,
    currency: trimOrFallback(source.currency, trimOrFallback(fallbackSource.currency, "USD")),
    lastNotifiedAt: trimOrFallback(source.lastNotifiedAt, trimOrFallback(fallbackSource.lastNotifiedAt, ""))
  };
}

function normalizePricingSnapshot(input, fallback = {}) {
  const source = input && typeof input === "object" ? input : {};
  const fallbackSource = fallback && typeof fallback === "object" ? fallback : {};
  const amount = Number(source.amount ?? fallbackSource.amount);
  const regularAmount = Number(source.regularAmount ?? fallbackSource.regularAmount);
  const discountPercent = Number(source.discountPercent ?? fallbackSource.discountPercent);

  return {
    amount: Number.isFinite(amount) ? amount : null,
    currency: trimOrFallback(source.currency, trimOrFallback(fallbackSource.currency, "USD")),
    storeId: trimOrFallback(source.storeId, trimOrFallback(fallbackSource.storeId, "")),
    storeName: trimOrFallback(source.storeName, trimOrFallback(fallbackSource.storeName, "")),
    url: trimOrFallback(source.url, trimOrFallback(fallbackSource.url, "")),
    regularAmount: Number.isFinite(regularAmount) ? regularAmount : null,
    discountPercent: Number.isFinite(discountPercent) ? discountPercent : null
  };
}

function normalizeCatalogPricing(pricing, fallback = {}) {
  const source = pricing && typeof pricing === "object" ? pricing : {};
  const fallbackSource = fallback && typeof fallback === "object" ? fallback : {};
  const normalizeStoreRows = (rows, fallbackRows = []) => {
    const inputRows = Array.isArray(rows) ? rows : (Array.isArray(fallbackRows) ? fallbackRows : []);
    return inputRows
      .filter((row) => row && typeof row === "object")
      .map((row) => ({
        storeId: trimOrFallback(row.storeId, ""),
        storeName: trimOrFallback(row.storeName, ""),
        amount: Number.isFinite(Number(row.amount)) ? Number(row.amount) : null,
        currency: trimOrFallback(row.currency, "USD"),
        discountPercent: Number.isFinite(Number(row.discountPercent)) ? Number(row.discountPercent) : null,
        url: trimOrFallback(row.url, "")
      }));
  };
  return {
    provider: trimOrFallback(source.provider, trimOrFallback(fallbackSource.provider, "")),
    providerGameId: trimOrFallback(source.providerGameId, trimOrFallback(fallbackSource.providerGameId, "")),
    currentBest: normalizePricingSnapshot(source.currentBest, fallbackSource.currentBest),
    preferredStoreCurrent: normalizePricingSnapshot(source.preferredStoreCurrent, fallbackSource.preferredStoreCurrent),
    storeRows: normalizeStoreRows(source.storeRows, fallbackSource.storeRows),
    historicalLow: {
      ...normalizePricingSnapshot(source.historicalLow, fallbackSource.historicalLow),
      at: trimOrFallback(source?.historicalLow?.at, trimOrFallback(fallbackSource?.historicalLow?.at, ""))
    },
    lastCheckedAt: trimOrFallback(source.lastCheckedAt, trimOrFallback(fallbackSource.lastCheckedAt, "")),
    status: trimOrFallback(source.status, trimOrFallback(fallbackSource.status, "unsupported")),
    reason: trimOrFallback(source.reason, trimOrFallback(fallbackSource.reason, "pricing_not_configured"))
  };
}

const CATALOG_PROVIDER_FIELDS = [
  "developer",
  "publisher",
  "releaseDate",
  "genres",
  "platforms",
  "criticSummary",
  "description",
  "heroArt",
  "capsuleArt",
  "screenshots",
  "steamGridSlug"
];

function normalizeProviderValues(providerValues, fallback = {}) {
  const source = providerValues && typeof providerValues === "object" ? providerValues : {};
  return {
    igdbId: inferIgdbId(source.igdbId, fallback.igdbId),
    developer: trimOrFallback(source.developer, trimOrFallback(fallback.developer, "")),
    publisher: trimOrFallback(source.publisher, trimOrFallback(fallback.publisher, "")),
    releaseDate: trimOrFallback(source.releaseDate, trimOrFallback(fallback.releaseDate, "")),
    genres: normalizeStringArray(source.genres, fallback.genres),
    platforms: normalizeStringArray(source.platforms, fallback.platforms),
    criticSummary: trimOrFallback(source.criticSummary, trimOrFallback(fallback.criticSummary, "")),
    description: trimOrFallback(source.description, trimOrFallback(fallback.description, "")),
    heroArt: trimOrFallback(source.heroArt, trimOrFallback(fallback.heroArt, "")),
    capsuleArt: trimOrFallback(source.capsuleArt, trimOrFallback(fallback.capsuleArt, "")),
    screenshots: normalizeStringArray(source.screenshots, fallback.screenshots),
    steamGridSlug: trimOrFallback(source.steamGridSlug, trimOrFallback(fallback.steamGridSlug, "")),
    videos: normalizeVideoArray(source.videos, fallback.videos),
    links: normalizeLinks(source.links, fallback.links),
    relatedTitles: normalizeRelatedTitles(source.relatedTitles, fallback.relatedTitles)
  };
}

function normalizeLockedFields(lockedFields) {
  if (!Array.isArray(lockedFields)) return [];
  return lockedFields
    .filter((field) => typeof field === "string" && CATALOG_PROVIDER_FIELDS.includes(field))
    .map((field) => field.trim())
    .filter(Boolean);
}

function normalizeStatus(status, fallback = "playing") {
  const normalized = trimOrFallback(status, fallback);
  if (normalized === "archived") {
    return "backlog";
  }
  return normalized;
}

export function normalizeCatalogGame(game, fallback = {}) {
  const title = trimOrFallback(game?.title, trimOrFallback(fallback.title, "Untitled Game"));
  const storefront = trimOrFallback(game?.storefront, trimOrFallback(fallback.storefront, "steam"));

  return {
    id: trimOrFallback(game?.id, trimOrFallback(fallback.id, `custom-${title.toLowerCase().replace(/\s+/g, "-")}`)),
    igdbId: inferIgdbId(game?.igdbId ?? game?.id, fallback.igdbId ?? fallback.id),
    title,
    storefront,
    developer: trimOrFallback(game?.developer, trimOrFallback(fallback.developer, "Unknown developer")),
    publisher: trimOrFallback(game?.publisher, trimOrFallback(fallback.publisher, "Unknown publisher")),
    releaseDate: trimOrFallback(game?.releaseDate, trimOrFallback(fallback.releaseDate, "")),
    genres: normalizeStringArray(game?.genres, fallback.genres),
    platforms: normalizeStringArray(game?.platforms, fallback.platforms),
    criticSummary: trimOrFallback(game?.criticSummary, trimOrFallback(fallback.criticSummary, `${title} is ready for metadata enrichment.`)),
    description: trimOrFallback(game?.description, trimOrFallback(fallback.description, `${title} is stored in Checkpoint with sparse manual metadata.`)),
    heroArt: trimOrFallback(game?.heroArt, trimOrFallback(fallback.heroArt, "")),
    capsuleArt: trimOrFallback(game?.capsuleArt, trimOrFallback(fallback.capsuleArt, trimOrFallback(game?.heroArt, trimOrFallback(fallback.heroArt, "")))),
    screenshots: normalizeStringArray(game?.screenshots, fallback.screenshots),
    videos: normalizeVideoArray(game?.videos, fallback.videos),
    links: normalizeLinks(game?.links, fallback.links),
    relatedTitles: normalizeRelatedTitles(game?.relatedTitles, fallback.relatedTitles),
    steamGridSlug: trimOrFallback(game?.steamGridSlug, trimOrFallback(fallback.steamGridSlug, "")),
    providerValues: normalizeProviderValues(game?.providerValues, fallback.providerValues),
    lockedFields: normalizeLockedFields(game?.lockedFields ?? fallback.lockedFields),
    pricing: normalizeCatalogPricing(game?.pricing, fallback.pricing)
  };
}

export function normalizeLibraryEntry(entry, fallback = {}) {
  const now = new Date().toISOString();
  const status = normalizeStatus(entry?.status, normalizeStatus(fallback.status, "playing"));
  const sourcePriority = trimOrFallback(entry?.wishlistPriority, trimOrFallback(fallback.wishlistPriority, status === "wishlist" ? "medium" : "medium"));
  const sourceIntent = trimOrFallback(entry?.wishlistIntent, trimOrFallback(fallback.wishlistIntent, status === "wishlist" ? "wait-sale" : "wait-sale"));
  const wishlistPriority = ["low", "medium", "high", "must-buy"].includes(sourcePriority) ? sourcePriority : "medium";
  const wishlistIntent = ["buy-now", "wait-sale", "monitor-release", "research"].includes(sourceIntent) ? sourceIntent : "wait-sale";

  return {
    entryId: trimOrFallback(entry?.entryId, trimOrFallback(fallback.entryId)),
    gameId: trimOrFallback(entry?.gameId, trimOrFallback(fallback.gameId)),
    title: trimOrFallback(entry?.title, trimOrFallback(fallback.title, "Untitled Game")),
    storefront: trimOrFallback(entry?.storefront, trimOrFallback(fallback.storefront, "steam")),
    status,
    runLabel: trimOrFallback(entry?.runLabel, trimOrFallback(fallback.runLabel, "Main Save")),
    addedAt: trimOrFallback(entry?.addedAt, trimOrFallback(fallback.addedAt, now)),
    updatedAt: trimOrFallback(entry?.updatedAt, trimOrFallback(fallback.updatedAt, now)),
    playtimeHours: clampNumber(entry?.playtimeHours ?? fallback.playtimeHours, { min: 0, fallback: 0 }),
    completionPercent: clampNumber(entry?.completionPercent ?? fallback.completionPercent, { min: 0, max: 100, fallback: 0 }),
    personalRating: entry?.personalRating == null && fallback.personalRating == null
      ? null
      : clampNumber(entry?.personalRating ?? fallback.personalRating, { min: 0, max: 10, fallback: 0 }),
    notes: trimOrFallback(entry?.notes, trimOrFallback(fallback.notes, "")),
    spotlight: trimOrFallback(entry?.spotlight, trimOrFallback(fallback.spotlight, "")),
    wishlistPriority,
    wishlistIntent,
    syncState: trimOrFallback(entry?.syncState, trimOrFallback(fallback.syncState, "offline")),
    priceWatch: normalizePriceWatch(entry?.priceWatch, fallback.priceWatch, status)
  };
}
