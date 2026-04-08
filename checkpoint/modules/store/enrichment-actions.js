import { normalizeCatalogGame } from "../normalization.js";

const METADATA_OVERRIDE_FIELDS = ["developer", "publisher", "releaseDate", "criticSummary", "description", "steamGridSlug"];
const ARTWORK_OVERRIDE_FIELDS = ["heroArt", "capsuleArt", "screenshots"];

function normalizeOverrideValue(field, value) {
  if (field === "screenshots") {
    return Array.isArray(value)
      ? value.filter((item) => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
      : [];
  }

  return typeof value === "string" ? value.trim() : "";
}

export function createEnrichmentActions(ctx) {
  const {
    state,
    emit,
    integrations,
    setActionState,
    getEntry,
    getCatalogGame,
    recordActivity
  } = ctx;

  function mergeProviderField(game, field, nextValue) {
    const lockedFields = Array.isArray(game?.lockedFields) ? game.lockedFields : [];
    const providerValues = {
      ...(game?.providerValues ?? {}),
      [field]: nextValue
    };

    return {
      value: lockedFields.includes(field) ? game?.[field] : nextValue,
      providerValues
    };
  }

  function mergeArtworkIntoCatalogGame(game, artwork) {
    const heroArt = mergeProviderField(game, "heroArt", artwork.heroArt || game.providerValues?.heroArt || game.heroArt || "");
    const capsuleArt = mergeProviderField(game, "capsuleArt", artwork.capsuleArt || game.providerValues?.capsuleArt || game.capsuleArt || "");
    const screenshots = mergeProviderField(
      game,
      "screenshots",
      artwork.screenshots?.length ? artwork.screenshots : (game.providerValues?.screenshots ?? game.screenshots ?? [])
    );

    return normalizeCatalogGame({
      ...game,
      heroArt: heroArt.value,
      capsuleArt: capsuleArt.value,
      screenshots: screenshots.value,
      providerValues: {
        ...(game?.providerValues ?? {}),
        ...heroArt.providerValues,
        ...capsuleArt.providerValues,
        ...screenshots.providerValues
      }
    });
  }

  function mergeMetadataIntoCatalogGame(game, metadata, entryLike = {}) {
    const baseGame = game ?? {
      id: `custom-${ctx.normalizeTerm(entryLike.title ?? "").replace(/\s+/g, "-")}`,
      title: entryLike.title ?? "",
      storefront: entryLike.storefront ?? "steam"
    };

    const igdbId = mergeProviderField(game, "igdbId", metadata.igdbId || game?.providerValues?.igdbId || baseGame.igdbId || null);
    const developer = mergeProviderField(game, "developer", metadata.developer || game?.providerValues?.developer || baseGame.developer);
    const publisher = mergeProviderField(game, "publisher", metadata.publisher || game?.providerValues?.publisher || baseGame.publisher);
    const releaseDate = mergeProviderField(game, "releaseDate", metadata.releaseDate || game?.providerValues?.releaseDate || baseGame.releaseDate);
    const genres = mergeProviderField(game, "genres", metadata.genres?.length ? metadata.genres : (game?.providerValues?.genres ?? baseGame.genres ?? []));
    const platforms = mergeProviderField(game, "platforms", metadata.platforms?.length ? metadata.platforms : (game?.providerValues?.platforms ?? baseGame.platforms ?? []));
    const criticSummary = mergeProviderField(game, "criticSummary", metadata.criticSummary || game?.providerValues?.criticSummary || baseGame.criticSummary);
    const description = mergeProviderField(game, "description", metadata.description || game?.providerValues?.description || baseGame.description);
    const videos = mergeProviderField(game, "videos", metadata.videos?.length ? metadata.videos : (game?.providerValues?.videos ?? baseGame.videos ?? []));
    const links = mergeProviderField(
      game,
      "links",
      metadata.links && typeof metadata.links === "object"
        ? metadata.links
        : (game?.providerValues?.links ?? baseGame.links ?? { igdb: "", official: "", storefronts: [] })
    );
    const relatedTitles = mergeProviderField(
      game,
      "relatedTitles",
      metadata.relatedTitles?.length
        ? metadata.relatedTitles
        : (game?.providerValues?.relatedTitles ?? baseGame.relatedTitles ?? [])
    );
    const steamGridSlug = mergeProviderField(game, "steamGridSlug", metadata.steamGridSlug || game?.providerValues?.steamGridSlug || baseGame.steamGridSlug);
    const heroArt = mergeProviderField(game, "heroArt", metadata.heroArt || game?.providerValues?.heroArt || baseGame.heroArt);
    const capsuleArt = mergeProviderField(game, "capsuleArt", metadata.capsuleArt || game?.providerValues?.capsuleArt || baseGame.capsuleArt);
    const screenshots = mergeProviderField(
      game,
      "screenshots",
      metadata.screenshots?.length ? metadata.screenshots : (game?.providerValues?.screenshots ?? baseGame.screenshots ?? [])
    );

    return normalizeCatalogGame({
      ...baseGame,
      title: entryLike.title ?? baseGame.title,
      storefront: entryLike.storefront ?? baseGame.storefront,
      igdbId: igdbId.value,
      developer: developer.value,
      publisher: publisher.value,
      releaseDate: releaseDate.value,
      genres: genres.value,
      platforms: platforms.value,
      criticSummary: criticSummary.value,
      description: description.value,
      videos: videos.value,
      links: links.value,
      relatedTitles: relatedTitles.value,
      steamGridSlug: steamGridSlug.value,
      heroArt: heroArt.value,
      capsuleArt: capsuleArt.value,
      screenshots: screenshots.value,
      providerValues: {
        ...(game?.providerValues ?? {}),
        ...developer.providerValues,
        ...publisher.providerValues,
        ...releaseDate.providerValues,
        ...genres.providerValues,
        ...platforms.providerValues,
        ...criticSummary.providerValues,
        ...description.providerValues,
        ...videos.providerValues,
        ...links.providerValues,
        ...relatedTitles.providerValues,
        ...steamGridSlug.providerValues,
        ...heroArt.providerValues,
        ...capsuleArt.providerValues,
        ...screenshots.providerValues
      }
    });
  }

  function didArtworkChange(previousGame, nextGame) {
    return (
      (nextGame?.heroArt ?? "") !== (previousGame?.heroArt ?? "")
      || (nextGame?.capsuleArt ?? "") !== (previousGame?.capsuleArt ?? "")
      || JSON.stringify(nextGame?.screenshots ?? []) !== JSON.stringify(previousGame?.screenshots ?? [])
    );
  }

  function didMetadataChange(previousGame, nextGame) {
    return (
      (nextGame?.developer ?? "") !== (previousGame?.developer ?? "")
      || (nextGame?.publisher ?? "") !== (previousGame?.publisher ?? "")
      || (nextGame?.releaseDate ?? "") !== (previousGame?.releaseDate ?? "")
      || JSON.stringify(nextGame?.genres ?? []) !== JSON.stringify(previousGame?.genres ?? [])
      || JSON.stringify(nextGame?.platforms ?? []) !== JSON.stringify(previousGame?.platforms ?? [])
      || (nextGame?.criticSummary ?? "") !== (previousGame?.criticSummary ?? "")
      || (nextGame?.description ?? "") !== (previousGame?.description ?? "")
      || JSON.stringify(nextGame?.videos ?? []) !== JSON.stringify(previousGame?.videos ?? [])
      || JSON.stringify(nextGame?.links ?? {}) !== JSON.stringify(previousGame?.links ?? {})
      || JSON.stringify(nextGame?.relatedTitles ?? []) !== JSON.stringify(previousGame?.relatedTitles ?? [])
      || Number(nextGame?.igdbId ?? 0) !== Number(previousGame?.igdbId ?? 0)
      || (nextGame?.steamGridSlug ?? "") !== (previousGame?.steamGridSlug ?? "")
    );
  }

  async function resolveArtworkWithIgdbPrimary(entry, game) {
    let metadataArtwork = {
      heroArt: "",
      capsuleArt: "",
      screenshots: []
    };
    try {
      const metadata = await integrations.metadataResolver.resolveGameMetadata({
        title: entry.title,
        storefront: entry.storefront,
        catalogGame: game
      });
      metadataArtwork = {
        heroArt: String(metadata?.heroArt || "").trim(),
        capsuleArt: String(metadata?.capsuleArt || "").trim(),
        screenshots: Array.isArray(metadata?.screenshots)
          ? metadata.screenshots.filter((item) => typeof item === "string" && item.trim()).map((item) => item.trim())
          : []
      };
    } catch (error) {
      // Best effort: continue into SteamGrid fallback.
    }

    const needsHero = !metadataArtwork.heroArt;
    const needsCapsule = !metadataArtwork.capsuleArt;
    const needsScreenshots = !metadataArtwork.screenshots.length;

    if (!needsHero && !needsCapsule && !needsScreenshots) {
      return {
        heroArt: metadataArtwork.heroArt,
        capsuleArt: metadataArtwork.capsuleArt,
        screenshots: metadataArtwork.screenshots,
        meta: {
          resolved: true,
          usedFallback: false,
          reason: "igdb_primary"
        }
      };
    }

    try {
      const fallbackArtwork = await integrations.steamGrid.resolveArtwork({
        title: entry.title,
        storefront: entry.storefront,
        catalogGame: game
      });
      return {
        heroArt: metadataArtwork.heroArt || fallbackArtwork?.heroArt || "",
        capsuleArt: metadataArtwork.capsuleArt || fallbackArtwork?.capsuleArt || "",
        screenshots: metadataArtwork.screenshots.length
          ? metadataArtwork.screenshots
          : (fallbackArtwork?.screenshots ?? []),
        meta: {
          resolved: Boolean(metadataArtwork.heroArt || metadataArtwork.capsuleArt || metadataArtwork.screenshots.length || fallbackArtwork?.meta?.resolved),
          usedFallback: true,
          reason: metadataArtwork.heroArt || metadataArtwork.capsuleArt || metadataArtwork.screenshots.length
            ? "igdb_primary_steamgrid_fallback"
            : (fallbackArtwork?.meta?.reason ?? "steamgrid_fallback")
        }
      };
    } catch (error) {
      return {
        heroArt: metadataArtwork.heroArt || "",
        capsuleArt: metadataArtwork.capsuleArt || "",
        screenshots: metadataArtwork.screenshots,
        meta: {
          resolved: Boolean(metadataArtwork.heroArt || metadataArtwork.capsuleArt || metadataArtwork.screenshots.length),
          usedFallback: true,
          reason: metadataArtwork.heroArt || metadataArtwork.capsuleArt || metadataArtwork.screenshots.length
            ? "igdb_primary"
            : "worker_request_failed"
        }
      };
    }
  }

  function getArtworkRefreshMessage(entryTitle, artwork, changed) {
    if (changed) {
      return {
        tone: "success",
        actionMessage: `${entryTitle} artwork refreshed.`,
        noticeMessage: `${entryTitle} artwork updated.`
      };
    }

    const reason = artwork?.meta?.reason;
    if (reason === "missing_worker_url") {
      return {
        tone: "error",
        actionMessage: "Add the deployed Cloudflare Worker URL in checkpoint/config.js before refreshing artwork.",
        noticeMessage: "A worker URL is required to refresh artwork."
      };
    }
    if (reason === "no_match") {
      return {
        tone: "info",
        actionMessage: `No artwork match was found for ${entryTitle}. Existing artwork was kept.`,
        noticeMessage: `${entryTitle} had no artwork match, so the current artwork stayed in place.`
      };
    }
    if (reason === "worker_request_failed") {
      return {
        tone: "error",
        actionMessage: `Checkpoint couldn't reach the artwork services for ${entryTitle}. Existing artwork was kept.`,
        noticeMessage: `${entryTitle} artwork could not be refreshed because the artwork request failed.`
      };
    }

    return {
      tone: "info",
      actionMessage: `No new artwork was applied for ${entryTitle}.`,
      noticeMessage: `${entryTitle} artwork was unchanged.`
    };
  }

  function getMetadataRefreshMessage(entryTitle, metadata, changed) {
    if (changed) {
      return {
        tone: "success",
        actionMessage: `${entryTitle} metadata refreshed.`,
        noticeMessage: `${entryTitle} metadata updated.`
      };
    }

    const reason = metadata?.meta?.reason;
    if (reason === "missing_worker_url") {
      return {
        tone: "error",
        actionMessage: "Add the deployed Cloudflare Worker URL in checkpoint/config.js before refreshing metadata.",
        noticeMessage: "A metadata proxy URL is required to refresh metadata."
      };
    }
    if (reason === "no_match") {
      return {
        tone: "info",
        actionMessage: `No IGDB match was found for ${entryTitle}. Existing metadata was kept.`,
        noticeMessage: `${entryTitle} had no IGDB match, so the current metadata stayed in place.`
      };
    }
    if (reason === "worker_request_failed") {
      return {
        tone: "error",
        actionMessage: `Checkpoint couldn't reach the metadata proxy for ${entryTitle}. Existing metadata was kept.`,
        noticeMessage: `${entryTitle} metadata could not be refreshed because the metadata proxy request failed.`
      };
    }

    return {
      tone: "info",
      actionMessage: `No new metadata was applied for ${entryTitle}.`,
      noticeMessage: `${entryTitle} metadata was unchanged.`
    };
  }

  function buildEntrySaveFeedback({ title, metadata, artwork, isEditing }) {
    const metadataResolved = Boolean(metadata?.meta?.resolved);
    const artworkResolved = Boolean(artwork?.meta?.resolved);

    if (metadataResolved && artworkResolved) {
      return {
        tone: "success",
        notice: isEditing
          ? `${title} was updated with live metadata and artwork.`
          : `${title} was added with live metadata and artwork.`,
        form: "Metadata and artwork resolved successfully."
      };
    }

    if (metadataResolved || artworkResolved) {
      return {
        tone: "info",
        notice: isEditing
          ? `${title} was updated with partial enrichment.`
          : `${title} was added with partial enrichment.`,
        form: metadataResolved
          ? "Metadata resolved, but artwork stayed on the current asset set."
          : "Artwork resolved, but metadata stayed on the current values."
      };
    }

    return {
      tone: "info",
      notice: isEditing
        ? `${title} was updated as a manual or fallback entry.`
        : `${title} was added as a manual or fallback entry.`,
      form: "Saved without live metadata or artwork. You can refresh enrichment later."
    };
  }

  async function refreshArtworkForEntry(entryId = state.activeEntryId) {
    const entry = getEntry(entryId);
    if (!entry) return false;

    const game = getCatalogGame(entry.gameId);
    setActionState("artwork", {
      tone: "info",
      message: `Refreshing artwork for ${entry.title}...`
    });
    emit();

    try {
      const artwork = await resolveArtworkWithIgdbPrimary(entry, game);
      const nextGame = mergeArtworkIntoCatalogGame(game, artwork);
      const changed = didArtworkChange(game, nextGame);

      state.catalog = state.catalog.map((item) => (
        item.id === entry.gameId ? nextGame : item
      ));
      const refreshMessage = getArtworkRefreshMessage(entry.title, artwork, changed);
      setActionState("artwork", {
        tone: refreshMessage.tone,
        message: refreshMessage.actionMessage
      });
      state.notice = {
        tone: refreshMessage.tone,
        message: refreshMessage.noticeMessage
      };
      recordActivity({
        category: "refresh",
        action: "artwork",
        scope: "entry",
        title: entry.title,
        message: refreshMessage.noticeMessage,
        tone: refreshMessage.tone
      });
      emit();
      return changed;
    } catch (error) {
      setActionState("artwork", {
        tone: "error",
        message: `Checkpoint couldn't refresh artwork for ${entry.title}.`
      });
      state.notice = {
        tone: "error",
        message: `${entry.title} artwork refresh failed.`
      };
      recordActivity({
        category: "refresh",
        action: "artwork",
        scope: "entry",
        title: entry.title,
        message: `${entry.title} artwork refresh failed.`,
        tone: "error"
      });
      emit();
      return false;
    }
  }

  async function refreshMetadataForEntry(entryId = state.activeEntryId) {
    const entry = getEntry(entryId);
    if (!entry) return false;

    const game = getCatalogGame(entry.gameId);
    setActionState("metadata", {
      tone: "info",
      message: `Refreshing metadata for ${entry.title}...`
    });
    emit();

    try {
      const baseMetadata = await integrations.metadataResolver.resolveGameMetadata({
        title: entry.title,
        storefront: entry.storefront,
        catalogGame: game
      });
      let metadata = baseMetadata;
      const igdbId = Number(game?.igdbId ?? baseMetadata?.igdbId);
      if (Number.isFinite(igdbId) && igdbId > 0 && typeof integrations.metadataResolver.getGameByIgdbId === "function") {
        const [details, related] = await Promise.all([
          integrations.metadataResolver.getGameByIgdbId(igdbId),
          typeof integrations.metadataResolver.getRelatedGamesByIgdbId === "function"
            ? integrations.metadataResolver.getRelatedGamesByIgdbId(igdbId, 12)
            : Promise.resolve([])
        ]);
        metadata = {
          ...baseMetadata,
          ...(details && typeof details === "object" ? details : {}),
          relatedTitles: Array.isArray(related) && related.length
            ? related
            : (details?.relatedTitles ?? baseMetadata?.relatedTitles ?? [])
        };
      }
      const nextGame = mergeMetadataIntoCatalogGame(game, metadata, {
        title: entry.title,
        storefront: entry.storefront
      });
      const changed = didMetadataChange(game, nextGame);

      state.catalog = state.catalog.map((item) => (
        item.id === entry.gameId ? nextGame : item
      ));
      const refreshMessage = getMetadataRefreshMessage(entry.title, metadata, changed);
      setActionState("metadata", {
        tone: refreshMessage.tone,
        message: refreshMessage.actionMessage
      });
      state.notice = {
        tone: refreshMessage.tone,
        message: refreshMessage.noticeMessage
      };
      recordActivity({
        category: "refresh",
        action: "metadata",
        scope: "entry",
        title: entry.title,
        message: refreshMessage.noticeMessage,
        tone: refreshMessage.tone
      });
      emit();
      return changed;
    } catch (error) {
      setActionState("metadata", {
        tone: "error",
        message: `Checkpoint couldn't refresh metadata for ${entry.title}.`
      });
      state.notice = {
        tone: "error",
        message: `${entry.title} metadata refresh failed.`
      };
      recordActivity({
        category: "refresh",
        action: "metadata",
        scope: "entry",
        title: entry.title,
        message: `${entry.title} metadata refresh failed.`,
        tone: "error"
      });
      emit();
      return false;
    }
  }

  async function refreshLibraryArtwork() {
    const referencedGames = state.catalog.filter((game) => state.library.some((entry) => entry.gameId === game.id));

    if (!referencedGames.length) {
      setActionState("artwork", {
        tone: "info",
        message: "No tracked games are available for artwork refresh."
      });
      emit();
      return false;
    }

    setActionState("artwork", {
      tone: "info",
      message: `Refreshing artwork for ${referencedGames.length} ${referencedGames.length === 1 ? "game" : "games"}...`
    });
    emit();

    let refreshedCount = 0;

    for (const game of referencedGames) {
      const linkedEntry = state.library.find((entry) => entry.gameId === game.id);
      if (!linkedEntry) continue;

      try {
        const artwork = await resolveArtworkWithIgdbPrimary(linkedEntry, game);

        const nextGame = mergeArtworkIntoCatalogGame(game, artwork);
        const artworkChanged = didArtworkChange(game, nextGame);

        state.catalog = state.catalog.map((item) => (item.id === game.id ? nextGame : item));
        if (artworkChanged) {
          refreshedCount += 1;
        }
      } catch (error) {
        // Keep best-effort refresh behavior for the rest of the library.
      }
    }

    setActionState("artwork", {
      tone: refreshedCount > 0 ? "success" : "info",
      message: refreshedCount > 0
        ? `Artwork refreshed for ${refreshedCount} ${refreshedCount === 1 ? "game" : "games"}.`
        : "Artwork refresh finished with no new assets found."
    });
    state.notice = {
      tone: refreshedCount > 0 ? "success" : "info",
      message: refreshedCount > 0
        ? `Checkpoint refreshed artwork for ${refreshedCount} ${refreshedCount === 1 ? "title" : "titles"}.`
        : "Artwork refresh finished. Existing artwork was retained."
    };
    recordActivity({
      category: "refresh",
      action: "artwork",
      scope: "library",
      title: "",
      message: refreshedCount > 0
        ? `Library artwork refreshed for ${refreshedCount} ${refreshedCount === 1 ? "title" : "titles"}.`
        : "Library artwork refresh finished with no changes.",
      tone: refreshedCount > 0 ? "success" : "info"
    });
    emit();
    return true;
  }

  async function refreshLibraryMetadata() {
    const referencedGames = state.catalog.filter((game) => state.library.some((entry) => entry.gameId === game.id));

    if (!referencedGames.length) {
      setActionState("metadata", {
        tone: "info",
        message: "No tracked games are available for metadata refresh."
      });
      emit();
      return false;
    }

    setActionState("metadata", {
      tone: "info",
      message: `Refreshing metadata for ${referencedGames.length} ${referencedGames.length === 1 ? "game" : "games"}...`
    });
    emit();

    let refreshedCount = 0;

    for (const game of referencedGames) {
      const linkedEntry = state.library.find((entry) => entry.gameId === game.id);
      if (!linkedEntry) continue;

      try {
        const metadata = await integrations.metadataResolver.resolveGameMetadata({
          title: linkedEntry.title,
          storefront: linkedEntry.storefront,
          catalogGame: game
        });

        const nextGame = mergeMetadataIntoCatalogGame(game, metadata, {
          title: linkedEntry.title,
          storefront: linkedEntry.storefront
        });
        const metadataChanged = didMetadataChange(game, nextGame);

        state.catalog = state.catalog.map((item) => (item.id === game.id ? nextGame : item));
        if (metadataChanged) {
          refreshedCount += 1;
        }
      } catch (error) {
        // Keep best-effort refresh behavior for the rest of the library.
      }
    }

    setActionState("metadata", {
      tone: refreshedCount > 0 ? "success" : "info",
      message: refreshedCount > 0
        ? `Metadata refreshed for ${refreshedCount} ${refreshedCount === 1 ? "game" : "games"}.`
        : "Metadata refresh finished with no new values found."
    });
    state.notice = {
      tone: refreshedCount > 0 ? "success" : "info",
      message: refreshedCount > 0
        ? `Checkpoint refreshed metadata for ${refreshedCount} ${refreshedCount === 1 ? "title" : "titles"}.`
        : "Metadata refresh finished. Existing metadata was retained."
    };
    recordActivity({
      category: "refresh",
      action: "metadata",
      scope: "library",
      title: "",
      message: refreshedCount > 0
        ? `Library metadata refreshed for ${refreshedCount} ${refreshedCount === 1 ? "title" : "titles"}.`
        : "Library metadata refresh finished with no changes.",
      tone: refreshedCount > 0 ? "success" : "info"
    });
    emit();
    return true;
  }

  function saveMetadataOverrides(entryId, overrides = {}) {
    const entry = getEntry(entryId);
    if (!entry) return false;

    const game = getCatalogGame(entry.gameId);
    if (!game) return false;

    const nextLockedFields = new Set(game.lockedFields ?? []);
    const providerValues = { ...(game.providerValues ?? {}) };
    const nextGame = { ...game };

    for (const field of METADATA_OVERRIDE_FIELDS) {
      const hasOverride = Object.prototype.hasOwnProperty.call(overrides, field);
      if (!hasOverride) continue;
      const normalizedValue = normalizeOverrideValue(field, overrides[field]);
      const providerSnapshot = field in providerValues ? providerValues[field] : game[field];
      if (!(field in providerValues)) {
        providerValues[field] = providerSnapshot;
      }

      if (!normalizedValue) {
        nextGame[field] = providerSnapshot ?? game[field];
        nextLockedFields.delete(field);
        continue;
      }

      if (nextLockedFields.has(field) || normalizedValue !== String(providerSnapshot ?? "")) {
        nextGame[field] = normalizedValue;
        nextLockedFields.add(field);
      } else {
        nextGame[field] = providerSnapshot ?? game[field];
        nextLockedFields.delete(field);
      }
    }

    state.catalog = state.catalog.map((item) => (
      item.id === game.id
        ? normalizeCatalogGame({
            ...nextGame,
            providerValues,
            lockedFields: Array.from(nextLockedFields)
          })
        : item
    ));
    setActionState("metadata", {
      tone: "success",
      message: `${entry.title} metadata overrides saved and locked.`
    });
    state.notice = {
      tone: "success",
      message: `${entry.title} metadata overrides saved.`
    };
    emit();
    return true;
  }

  function applyMetadataOverridesToGame(game, overrides = {}) {
    if (!game) return null;

    const nextLockedFields = new Set(game.lockedFields ?? []);
    const providerValues = { ...(game.providerValues ?? {}) };
    const nextGame = { ...game };

    for (const field of METADATA_OVERRIDE_FIELDS) {
      const hasOverride = Object.prototype.hasOwnProperty.call(overrides, field);
      if (!hasOverride) continue;
      const normalizedValue = normalizeOverrideValue(field, overrides[field]);
      const providerSnapshot = field in providerValues ? providerValues[field] : game[field];
      if (!(field in providerValues)) {
        providerValues[field] = providerSnapshot;
      }

      if (!normalizedValue) {
        nextGame[field] = providerSnapshot ?? game[field];
        nextLockedFields.delete(field);
        continue;
      }

      if (nextLockedFields.has(field) || normalizedValue !== String(providerSnapshot ?? "")) {
        nextGame[field] = normalizedValue;
        nextLockedFields.add(field);
      } else {
        nextGame[field] = providerSnapshot ?? game[field];
        nextLockedFields.delete(field);
      }
    }

    return normalizeCatalogGame({
      ...nextGame,
      providerValues,
      lockedFields: Array.from(nextLockedFields)
    });
  }

  async function clearMetadataOverrides(entryId) {
    const entry = getEntry(entryId);
    if (!entry) return false;

    const game = getCatalogGame(entry.gameId);
    if (!game) return false;

    const nextLockedFields = (game.lockedFields ?? []).filter((field) => !METADATA_OVERRIDE_FIELDS.includes(field));
    const nextGame = { ...game };

    for (const field of METADATA_OVERRIDE_FIELDS) {
      if (field in (game.providerValues ?? {})) {
        nextGame[field] = game.providerValues[field];
      }
    }

    const unlockedGame = normalizeCatalogGame({
      ...nextGame,
      lockedFields: nextLockedFields
    });

    let finalGame = unlockedGame;
    try {
      const metadata = await integrations.metadataResolver.resolveGameMetadata({
        title: entry.title,
        storefront: entry.storefront,
        catalogGame: unlockedGame
      });
      finalGame = mergeMetadataIntoCatalogGame(unlockedGame, metadata, {
        title: entry.title,
        storefront: entry.storefront
      });
    } catch (error) {
      // Keep unlocked provider snapshot if a refresh call fails.
    }

    state.catalog = state.catalog.map((item) => (
      item.id === game.id
        ? finalGame
        : item
    ));
    setActionState("metadata", {
      tone: "success",
      message: `${entry.title} metadata overrides cleared and refreshed.`
    });
    state.notice = {
      tone: "success",
      message: `${entry.title} metadata overrides cleared and metadata re-fetched.`
    };
    recordActivity({
      category: "refresh",
      action: "metadata",
      scope: "entry",
      title: entry.title,
      message: `${entry.title} metadata overrides were cleared and metadata was refreshed.`,
      tone: "success"
    });
    emit();
    return true;
  }

  function saveArtworkOverrides(entryId, overrides = {}) {
    const entry = getEntry(entryId);
    if (!entry) return false;

    const game = getCatalogGame(entry.gameId);
    if (!game) return false;

    const nextLockedFields = new Set(game.lockedFields ?? []);
    const providerValues = { ...(game.providerValues ?? {}) };
    const nextGame = { ...game };

    for (const field of ARTWORK_OVERRIDE_FIELDS) {
      const hasOverride = Object.prototype.hasOwnProperty.call(overrides, field);
      if (!hasOverride) continue;
      const normalizedValue = normalizeOverrideValue(field, overrides[field]);
      const providerSnapshot = field in providerValues ? providerValues[field] : game[field];
      if (!(field in providerValues)) {
        providerValues[field] = providerSnapshot;
      }

      if (field === "screenshots") {
        const normalizedScreens = Array.isArray(normalizedValue) ? normalizedValue : [];
        const providerScreens = Array.isArray(providerSnapshot) ? providerSnapshot : [];
        if (!normalizedScreens.length) {
          nextGame[field] = providerScreens;
          nextLockedFields.delete(field);
          continue;
        }

        if (nextLockedFields.has(field) || JSON.stringify(normalizedScreens) !== JSON.stringify(providerScreens)) {
          nextGame[field] = normalizedScreens;
          nextLockedFields.add(field);
        } else {
          nextGame[field] = providerScreens;
          nextLockedFields.delete(field);
        }
        continue;
      }

      if (!normalizedValue) {
        nextGame[field] = providerSnapshot ?? game[field];
        nextLockedFields.delete(field);
        continue;
      }

      if (nextLockedFields.has(field) || normalizedValue !== String(providerSnapshot ?? "")) {
        nextGame[field] = normalizedValue;
        nextLockedFields.add(field);
      } else {
        nextGame[field] = providerSnapshot ?? game[field];
        nextLockedFields.delete(field);
      }
    }

    state.catalog = state.catalog.map((item) => (
      item.id === game.id
        ? normalizeCatalogGame({
            ...nextGame,
            providerValues,
            lockedFields: Array.from(nextLockedFields)
          })
        : item
    ));
    setActionState("artwork", {
      tone: "success",
      message: `${entry.title} artwork overrides saved and locked.`
    });
    state.notice = {
      tone: "success",
      message: `${entry.title} artwork overrides saved.`
    };
    emit();
    return true;
  }

  function applyArtworkOverridesToGame(game, overrides = {}) {
    if (!game) return null;

    const nextLockedFields = new Set(game.lockedFields ?? []);
    const providerValues = { ...(game.providerValues ?? {}) };
    const nextGame = { ...game };

    for (const field of ARTWORK_OVERRIDE_FIELDS) {
      const hasOverride = Object.prototype.hasOwnProperty.call(overrides, field);
      if (!hasOverride) continue;
      const normalizedValue = normalizeOverrideValue(field, overrides[field]);
      const providerSnapshot = field in providerValues ? providerValues[field] : game[field];
      if (!(field in providerValues)) {
        providerValues[field] = providerSnapshot;
      }

      if (field === "screenshots") {
        const normalizedScreens = Array.isArray(normalizedValue) ? normalizedValue : [];
        const providerScreens = Array.isArray(providerSnapshot) ? providerSnapshot : [];
        if (!normalizedScreens.length) {
          nextGame[field] = providerScreens;
          nextLockedFields.delete(field);
          continue;
        }

        if (nextLockedFields.has(field) || JSON.stringify(normalizedScreens) !== JSON.stringify(providerScreens)) {
          nextGame[field] = normalizedScreens;
          nextLockedFields.add(field);
        } else {
          nextGame[field] = providerScreens;
          nextLockedFields.delete(field);
        }
        continue;
      }

      if (!normalizedValue) {
        nextGame[field] = providerSnapshot ?? game[field];
        nextLockedFields.delete(field);
        continue;
      }

      if (nextLockedFields.has(field) || normalizedValue !== String(providerSnapshot ?? "")) {
        nextGame[field] = normalizedValue;
        nextLockedFields.add(field);
      } else {
        nextGame[field] = providerSnapshot ?? game[field];
        nextLockedFields.delete(field);
      }
    }

    return normalizeCatalogGame({
      ...nextGame,
      providerValues,
      lockedFields: Array.from(nextLockedFields)
    });
  }

  async function clearArtworkOverrides(entryId) {
    const entry = getEntry(entryId);
    if (!entry) return false;

    const game = getCatalogGame(entry.gameId);
    if (!game) return false;

    const nextLockedFields = (game.lockedFields ?? []).filter((field) => !ARTWORK_OVERRIDE_FIELDS.includes(field));
    const nextGame = { ...game };

    for (const field of ARTWORK_OVERRIDE_FIELDS) {
      if (field in (game.providerValues ?? {})) {
        nextGame[field] = game.providerValues[field];
      }
    }

    const unlockedGame = normalizeCatalogGame({
      ...nextGame,
      lockedFields: nextLockedFields
    });

    let finalGame = unlockedGame;
    try {
      const artwork = await resolveArtworkWithIgdbPrimary(entry, unlockedGame);
      finalGame = mergeArtworkIntoCatalogGame(unlockedGame, artwork);
    } catch (error) {
      // Keep unlocked provider snapshot if a refresh call fails.
    }

    state.catalog = state.catalog.map((item) => (
      item.id === game.id
        ? finalGame
        : item
    ));
    setActionState("artwork", {
      tone: "success",
      message: `${entry.title} artwork overrides cleared and refreshed.`
    });
    state.notice = {
      tone: "success",
      message: `${entry.title} artwork overrides cleared and artwork re-fetched.`
    };
    recordActivity({
      category: "refresh",
      action: "artwork",
      scope: "entry",
      title: entry.title,
      message: `${entry.title} artwork overrides were cleared and artwork was refreshed.`,
      tone: "success"
    });
    emit();
    return true;
  }

  return {
    mergeArtworkIntoCatalogGame,
    mergeMetadataIntoCatalogGame,
    buildEntrySaveFeedback,
    refreshArtworkForEntry,
    refreshMetadataForEntry,
    refreshLibraryArtwork,
    refreshLibraryMetadata,
    applyMetadataOverridesToGame,
    applyArtworkOverridesToGame,
    saveMetadataOverrides,
    clearMetadataOverrides,
    saveArtworkOverrides,
    clearArtworkOverrides
  };
}
