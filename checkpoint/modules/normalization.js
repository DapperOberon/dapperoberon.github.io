function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function trimOrFallback(value, fallback = "") {
  return isNonEmptyString(value) ? value.trim() : fallback;
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
    steamGridSlug: trimOrFallback(source.steamGridSlug, trimOrFallback(fallback.steamGridSlug, ""))
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
    steamGridSlug: trimOrFallback(game?.steamGridSlug, trimOrFallback(fallback.steamGridSlug, "")),
    providerValues: normalizeProviderValues(game?.providerValues, fallback.providerValues),
    lockedFields: normalizeLockedFields(game?.lockedFields ?? fallback.lockedFields),
    pricing: normalizeCatalogPricing(game?.pricing, fallback.pricing)
  };
}

export function normalizeLibraryEntry(entry, fallback = {}) {
  const now = new Date().toISOString();
  const status = normalizeStatus(entry?.status, normalizeStatus(fallback.status, "playing"));

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
    syncState: trimOrFallback(entry?.syncState, trimOrFallback(fallback.syncState, "offline")),
    priceWatch: normalizePriceWatch(entry?.priceWatch, fallback.priceWatch, status)
  };
}
