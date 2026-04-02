export const MOCK_FALLBACK_ART =
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80";

export function createMockArtworkResult(catalogGame = null, meta = {}) {
  const fallbackMeta = {
    resolved: false,
    usedFallback: true,
    reason: "fallback",
    ...meta
  };

  if (catalogGame) {
    return {
      heroArt: catalogGame.heroArt,
      capsuleArt: catalogGame.capsuleArt,
      screenshots: catalogGame.screenshots,
      meta: fallbackMeta
    };
  }

  return {
    heroArt: MOCK_FALLBACK_ART,
    capsuleArt: MOCK_FALLBACK_ART,
    screenshots: [MOCK_FALLBACK_ART, MOCK_FALLBACK_ART, MOCK_FALLBACK_ART],
    meta: fallbackMeta
  };
}

export function createMockStorefrontMetadata({ title, storefront, catalogGame, meta = {} }) {
  const fallbackMeta = {
    resolved: false,
    usedFallback: true,
    reason: "fallback",
    ...meta
  };

  if (catalogGame) {
    return {
      developer: catalogGame.developer,
      publisher: catalogGame.publisher,
      releaseDate: catalogGame.releaseDate,
      genres: catalogGame.genres,
      platforms: catalogGame.platforms,
      criticSummary: catalogGame.criticSummary,
      description: catalogGame.description,
      steamGridSlug: catalogGame.steamGridSlug,
      meta: fallbackMeta
    };
  }

  return {
    developer: "Unknown developer",
    publisher: storefront === "steam" ? "Steam import pending" : "Manual entry",
    releaseDate: "",
    genres: ["Unclassified"],
    platforms: [],
    criticSummary: `${title} was added as a manual entry and is ready for metadata enrichment.`,
    description: `This manual ${storefront} entry is in Checkpoint. Live metadata was not available for this lookup, so fallback values were kept.`,
    steamGridSlug: "",
    meta: fallbackMeta
  };
}
