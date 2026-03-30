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
    genres: Array.isArray(game?.genres) ? game.genres.filter(isNonEmptyString).map((item) => item.trim()) : (Array.isArray(fallback.genres) ? fallback.genres : []),
    platforms: Array.isArray(game?.platforms) ? game.platforms.filter(isNonEmptyString).map((item) => item.trim()) : (Array.isArray(fallback.platforms) ? fallback.platforms : []),
    criticSummary: trimOrFallback(game?.criticSummary, trimOrFallback(fallback.criticSummary, `${title} is ready for metadata enrichment.`)),
    description: trimOrFallback(game?.description, trimOrFallback(fallback.description, `${title} is stored in Checkpoint with sparse manual metadata.`)),
    heroArt: trimOrFallback(game?.heroArt, trimOrFallback(fallback.heroArt, "")),
    capsuleArt: trimOrFallback(game?.capsuleArt, trimOrFallback(fallback.capsuleArt, trimOrFallback(game?.heroArt, trimOrFallback(fallback.heroArt, "")))),
    screenshots: Array.isArray(game?.screenshots) ? game.screenshots.filter(isNonEmptyString) : (Array.isArray(fallback.screenshots) ? fallback.screenshots : []),
    steamGridSlug: trimOrFallback(game?.steamGridSlug, trimOrFallback(fallback.steamGridSlug, ""))
  };
}

export function normalizeLibraryEntry(entry, fallback = {}) {
  const now = new Date().toISOString();

  return {
    entryId: trimOrFallback(entry?.entryId, trimOrFallback(fallback.entryId)),
    gameId: trimOrFallback(entry?.gameId, trimOrFallback(fallback.gameId)),
    title: trimOrFallback(entry?.title, trimOrFallback(fallback.title, "Untitled Game")),
    storefront: trimOrFallback(entry?.storefront, trimOrFallback(fallback.storefront, "steam")),
    status: trimOrFallback(entry?.status, trimOrFallback(fallback.status, "playing")),
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
    syncState: trimOrFallback(entry?.syncState, trimOrFallback(fallback.syncState, "offline"))
  };
}
