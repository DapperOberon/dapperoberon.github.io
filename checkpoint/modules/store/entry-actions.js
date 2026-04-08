export function createEntryActions(ctx) {
  const {
    state,
    emit,
    integrations,
    setActionState,
    statusDefinitions,
    getEntry,
    getCatalogGame,
    createDefaultAddForm,
    createDetailForm,
    getAddFormValidation,
    createEntryId,
    sortByUpdatedAtDesc,
    normalizeLibraryEntry,
    pruneCatalogToLibrary,
    mergeArtworkIntoCatalogGame,
    mergeMetadataIntoCatalogGame,
    buildEntrySaveFeedback,
    applyMetadataOverridesToGame,
    applyArtworkOverridesToGame,
    recordActivity,
    writeItadStoresCache,
    writeDiscoverMetadataCache
  } = ctx;

  function mergeCatalogPricing(gameId, pricing) {
    let nextGame = null;
    state.catalog = state.catalog.map((item) => {
      if (item.id !== gameId) return item;
      nextGame = {
        ...item,
        pricing: {
          ...(item.pricing && typeof item.pricing === "object" ? item.pricing : {}),
          ...(pricing && typeof pricing === "object" ? pricing : {})
        }
      };
      return nextGame;
    });
    return nextGame;
  }

  function getSelectedItadStoreIds() {
    return Array.isArray(state.syncPreferences.itadSelectedStoreIds)
      ? state.syncPreferences.itadSelectedStoreIds
        .map((value) => String(value ?? "").trim())
        .filter((value) => /^\d+$/.test(value))
      : [];
  }

  function normalizeDiscoverResultGameId(result) {
    const igdbId = Number(result?.igdbId);
    if (Number.isFinite(igdbId) && igdbId > 0) {
      return `igdb-${igdbId}`;
    }
    return "";
  }

  function findWishlistEntryForDiscoverResult(result) {
    if (!result) return null;
    const normalizedGameId = normalizeDiscoverResultGameId(result);
    const normalizedTitle = String(result?.title || "").trim().toLowerCase();
    const normalizedStorefront = String(result?.storefront || state.addForm.storefront || "").trim().toLowerCase();

    return state.library.find((entry) => {
      if (entry?.status !== "wishlist") return false;
      if (normalizedGameId && entry.gameId === normalizedGameId) return true;
      const entryTitle = String(entry?.title || "").trim().toLowerCase();
      const entryStorefront = String(entry?.storefront || "").trim().toLowerCase();
      return Boolean(normalizedTitle)
        && entryTitle === normalizedTitle
        && (!normalizedStorefront || entryStorefront === normalizedStorefront);
    }) ?? null;
  }

  function resetDiscoverEntryState() {
    state.discoverEntryDetails = null;
    state.discoverEntryLoading = false;
    state.discoverEntryError = "";
    state.discoverEntryPricing = null;
    state.discoverEntryPricingLoading = false;
    state.discoverEntryPricingError = "";
    state.discoverEntryRelated = [];
    state.discoverEntryRelatedLoading = false;
    state.discoverEntryRelatedError = "";
    state.discoverEntryLinks = {
      igdb: "",
      official: "",
      storefronts: []
    };
  }

  function nextDiscoverNavigationToken() {
    state.discoverNavigationToken = Number(state.discoverNavigationToken || 0) + 1;
    return state.discoverNavigationToken;
  }

  function normalizeDiscoverCacheKey(value) {
    const raw = String(value ?? "").trim();
    if (!raw) return "";
    if (/^\d+$/.test(raw)) return raw;
    const match = raw.match(/^igdb-(\d+)$/i);
    return match ? match[1] : "";
  }

  function isDiscoverDetailsComplete(details) {
    if (!details || typeof details !== "object") return false;
    const hasCoreText = Boolean(String(details.description || details.criticSummary || "").trim());
    const hasPeople = Boolean(String(details.developer || "").trim()) && Boolean(String(details.publisher || "").trim());
    const hasMedia = Array.isArray(details.screenshots) && details.screenshots.length > 0;
    const hasLinks = Boolean(
      String(details?.links?.igdb || "").trim()
      || String(details?.links?.official || "").trim()
      || (Array.isArray(details?.links?.storefronts) && details.links.storefronts.length)
    );
    return hasCoreText && hasPeople && hasMedia && hasLinks;
  }

  function mergeDiscoverDetails(base = {}, incoming = {}) {
    const next = {
      ...base,
      ...incoming
    };
    const arrayFields = ["genres", "platforms", "screenshots", "videos"];
    arrayFields.forEach((field) => {
      const incomingValue = Array.isArray(incoming?.[field]) ? incoming[field] : [];
      const baseValue = Array.isArray(base?.[field]) ? base[field] : [];
      next[field] = incomingValue.length ? incomingValue : baseValue;
    });
    next.links = (incoming?.links && typeof incoming.links === "object")
      ? incoming.links
      : ((base?.links && typeof base.links === "object")
        ? base.links
        : { igdb: "", official: "", storefronts: [] });
    return next;
  }

  function getWatchTargetHit(entry, game) {
    const currentPrice = Number(game?.pricing?.currentBest?.amount);
    const targetPrice = Number(entry?.priceWatch?.targetPrice);
    if (!Number.isFinite(currentPrice) || !Number.isFinite(targetPrice)) return false;
    return currentPrice <= targetPrice;
  }

  function getTrackedGameIgdbId(game) {
    const directId = Number(game?.igdbId);
    if (Number.isFinite(directId) && directId > 0) return directId;
    const rawGameId = String(game?.id || "").trim();
    const match = rawGameId.match(/^igdb-(\d+)$/i);
    if (!match) return null;
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  function hasTrackedGameDecisionData(game) {
    if (!game || typeof game !== "object") return false;
    const hasVideos = Array.isArray(game.videos) && game.videos.length > 0;
    const hasRelated = Array.isArray(game.relatedTitles) && game.relatedTitles.length > 0;
    const hasLinks = Boolean(
      String(game?.links?.igdb || "").trim()
      || String(game?.links?.official || "").trim()
      || (Array.isArray(game?.links?.storefronts) && game.links.storefronts.length)
    );
    return hasVideos && hasRelated && hasLinks;
  }

  async function hydrateTrackedGameDecisionData(entry) {
    const game = getCatalogGame(entry?.gameId);
    const igdbId = getTrackedGameIgdbId(game);
    if (!game || !Number.isFinite(igdbId) || igdbId <= 0) return null;
    if (hasTrackedGameDecisionData(game)) return game;
    if (typeof integrations.metadataResolver.getGameByIgdbId !== "function") return game;

    const [details, related] = await Promise.all([
      integrations.metadataResolver.getGameByIgdbId(igdbId),
      typeof integrations.metadataResolver.getRelatedGamesByIgdbId === "function"
        ? integrations.metadataResolver.getRelatedGamesByIgdbId(igdbId, 12)
        : Promise.resolve([])
    ]);

    const nextGame = mergeMetadataIntoCatalogGame(game, {
      ...(details && typeof details === "object" ? details : {}),
      relatedTitles: Array.isArray(related) && related.length
        ? related
        : (details?.relatedTitles ?? game.relatedTitles ?? [])
    }, {
      title: entry.title,
      storefront: entry.storefront
    });

    state.catalog = state.catalog.map((item) => (item.id === nextGame.id ? nextGame : item));
    return nextGame;
  }

  function shouldNotifyPriceWatch(entry) {
    const lastNotifiedAt = entry?.priceWatch?.lastNotifiedAt;
    if (!lastNotifiedAt) return true;
    const lastNotifiedTime = Date.parse(lastNotifiedAt);
    if (!Number.isFinite(lastNotifiedTime)) return true;
    const twelveHours = 12 * 60 * 60 * 1000;
    return (Date.now() - lastNotifiedTime) >= twelveHours;
  }

  function maybeEmitPriceWatchHit(entryId, { suppressNotice = false } = {}) {
    const entry = getEntry(entryId);
    if (!entry) return false;
    const game = getCatalogGame(entry.gameId);
    if (!game) return false;
    if (!entry.priceWatch?.enabled) return false;
    if (!getWatchTargetHit(entry, game)) return false;
    if (!shouldNotifyPriceWatch(entry)) return false;

    const now = new Date().toISOString();
    state.library = state.library.map((item) => (
      item.entryId === entry.entryId
        ? normalizeLibraryEntry({
            ...item,
            priceWatch: {
              ...item.priceWatch,
              lastNotifiedAt: now
            },
            updatedAt: item.updatedAt
          })
        : item
    ));

    const amount = Number(game?.pricing?.currentBest?.amount);
    const currency = String(game?.pricing?.currentBest?.currency || entry.priceWatch?.currency || "USD");
    const formattedAmount = Number.isFinite(amount) ? `${currency} ${amount.toFixed(2)}` : "target met";

    if (!suppressNotice) {
      state.notice = {
        tone: "success",
        message: `${entry.title} hit your watch target (${formattedAmount}).`
      };
    }
    recordActivity({
      category: "pricing",
      action: "price-watch-hit",
      scope: "entry",
      title: entry.title,
      message: `Price watch target met at ${formattedAmount}.`,
      tone: "success"
    });
    return true;
  }

  async function refreshPricingForEntry(entryId = state.activeEntryId, options = {}) {
    const entry = getEntry(entryId);
    if (!entry) return false;
    const game = getCatalogGame(entry.gameId);
    if (!game) return false;
    const suppressNotice = options.suppressNotice === true;
    const selectedStoreIds = getSelectedItadStoreIds();

    if (!suppressNotice) {
      setActionState("pricing", {
        tone: "info",
        message: `Refreshing price for ${entry.title}...`
      });
      emit();
    }

    try {
      const pricing = await integrations.pricing.resolvePrice({
        title: entry.title,
        storefront: entry.storefront,
        catalogGame: game,
        selectedStoreIds
      });

      const updatedGame = mergeCatalogPricing(game.id, pricing);
      if (!updatedGame) return false;
      state.catalog = pruneCatalogToLibrary(state.library, state.catalog);

      const status = String(updatedGame?.pricing?.status || "unsupported");
      const bestAmount = Number(updatedGame?.pricing?.currentBest?.amount);
      const bestCurrency = String(updatedGame?.pricing?.currentBest?.currency || "USD");
      const bestStore = String(updatedGame?.pricing?.currentBest?.storeName || "");
      const resolvedCopy = Number.isFinite(bestAmount)
        ? `${bestCurrency} ${bestAmount.toFixed(2)}${bestStore ? ` on ${bestStore}` : ""}`
        : "no current price available";

      setActionState("pricing", {
        tone: status === "ok" ? "success" : (status === "error" ? "error" : "warning"),
        message: status === "ok"
          ? `Price refreshed for ${entry.title}: ${resolvedCopy}.`
          : `Pricing refresh for ${entry.title} returned ${status}.`
      });

      if (!suppressNotice) {
        state.notice = {
          tone: status === "ok" ? "success" : (status === "error" ? "error" : "warning"),
          message: status === "ok"
            ? `${entry.title} price refreshed (${resolvedCopy}).`
            : `${entry.title} pricing status: ${status}.`
        };
      }

      recordActivity({
        category: "pricing",
        action: "refreshed",
        scope: "entry",
        title: entry.title,
        message: status === "ok"
          ? `Pricing refreshed (${resolvedCopy}).`
          : `Pricing refresh returned ${status}.`,
        tone: status === "ok" ? "success" : (status === "error" ? "error" : "warning")
      });
      maybeEmitPriceWatchHit(entry.entryId, { suppressNotice });
      emit();
      return true;
    } catch (error) {
      setActionState("pricing", {
        tone: "error",
        message: `Pricing refresh failed for ${entry.title}.`
      });
      if (!suppressNotice) {
        state.notice = {
          tone: "error",
          message: `Pricing refresh failed for ${entry.title}.`
        };
      }
      recordActivity({
        category: "pricing",
        action: "refresh-failed",
        scope: "entry",
        title: entry.title,
        message: "Pricing refresh failed.",
        tone: "error"
      });
      emit();
      return false;
    }
  }

  async function refreshLibraryPricing() {
    const entries = state.library.slice();
    if (!entries.length) {
      setActionState("pricing", {
        tone: "warning",
        message: "No entries are available for price refresh."
      });
      state.notice = {
        tone: "warning",
        message: "No entries are available for price refresh."
      };
      emit();
      return;
    }

    setActionState("pricing", {
      tone: "info",
      message: "Refreshing pricing for tracked entries..."
    });
    emit();

    let successCount = 0;
    let warningCount = 0;
    let errorCount = 0;
    let watchHits = 0;
    for (const entry of entries) {
      const previousNotifiedAt = getEntry(entry.entryId)?.priceWatch?.lastNotifiedAt || "";
      const ok = await refreshPricingForEntry(entry.entryId, { suppressNotice: true });
      if (!ok) {
        errorCount += 1;
        continue;
      }
      const game = getCatalogGame(entry.gameId);
      const status = String(game?.pricing?.status || "unsupported");
      if (status === "ok") {
        successCount += 1;
      } else if (status === "error") {
        errorCount += 1;
      } else {
        warningCount += 1;
      }
      const nextNotifiedAt = getEntry(entry.entryId)?.priceWatch?.lastNotifiedAt || "";
      if (nextNotifiedAt && nextNotifiedAt !== previousNotifiedAt) {
        watchHits += 1;
      }
    }

    const summary = `Pricing refresh complete: ${successCount} ok, ${warningCount} partial, ${errorCount} failed.`;
    setActionState("pricing", {
      tone: errorCount ? (successCount ? "warning" : "error") : "success",
      message: summary
    });
    state.notice = {
      tone: errorCount ? (successCount ? "warning" : "error") : "success",
      message: watchHits
        ? `${summary} ${watchHits} watch target${watchHits === 1 ? "" : "s"} met.`
        : summary
    };
    recordActivity({
      category: "pricing",
      action: "refresh-library",
      scope: "library",
      message: summary,
      tone: errorCount ? (successCount ? "warning" : "error") : "success"
    });
    emit();
  }

  function selectEntry(entryId) {
    state.activeEntryId = entryId;
    emit();
  }

  async function openEntryDetails(entryId) {
    const entry = getEntry(entryId);
    if (!entry) return;
    state.activeEntryId = entry.entryId;
    state.currentView = "details";
    state.isDetailEditMode = false;
    state.detailForm = createDetailForm(entry);
    emit();

    if (entry.status === "wishlist") {
      try {
        await hydrateTrackedGameDecisionData(entry);
        emit();
      } catch {
        // Best-effort hydrate only; keep the detail page usable if this fails.
      }
    }
  }

  function openAddModal() {
    state.editingEntryId = null;
    state.addForm = createDefaultAddForm();
    state.addSearchResults = [];
    state.addSearchLoading = false;
    state.addSearchError = "";
    state.addFormFeedback = null;
    state.isAddFormSubmitting = false;
    state.isAddModalOpen = true;
    emit();
  }

  function closeAddModal() {
    state.isAddModalOpen = false;
    state.editingEntryId = null;
    state.addForm = createDefaultAddForm();
    state.addSearchResults = [];
    state.addSearchLoading = false;
    state.addSearchError = "";
    state.addFormFeedback = null;
    state.isAddFormSubmitting = false;
    emit();
  }

  function openDeleteConfirm(entryId = state.activeEntryId) {
    const entry = getEntry(entryId);
    if (!entry) return;
    state.pendingDeleteEntryId = entry.entryId;
    emit();
  }

  function closeDeleteConfirm() {
    if (!state.pendingDeleteEntryId) return;
    state.pendingDeleteEntryId = null;
    emit();
  }

  function updateAddForm(patch) {
    state.addForm = {
      ...state.addForm,
      ...patch
    };
    if (Object.prototype.hasOwnProperty.call(patch, "searchQuery")) {
      state.addSearchError = "";
    }
    state.addFormFeedback = null;
    emit();
  }

  async function enrichSearchResultsWithArtwork(baseResults, queryStorefront = state.addForm.storefront) {
    return Promise.all(baseResults.map(async (result) => {
      const existingCover = String(result?.coverArt || "").trim();
      const existingHero = String(result?.heroArt || "").trim();
      if (existingCover && existingHero) {
        return {
          ...result,
          steamGridCover: "",
          steamGridHero: "",
          steamGridMeta: null
        };
      }
      try {
        const artwork = await integrations.steamGrid.resolveArtwork({
          title: result.title,
          storefront: queryStorefront,
          catalogGame: null
        });
        return {
          ...result,
          steamGridCover: existingCover ? "" : (artwork?.capsuleArt || ""),
          steamGridHero: existingHero ? "" : (artwork?.heroArt || ""),
          steamGridMeta: artwork?.meta ?? null
        };
      } catch (error) {
        return {
          ...result,
          steamGridCover: "",
          steamGridHero: "",
          steamGridMeta: {
            resolved: false,
            usedFallback: true,
            reason: "steamgrid_cover_failed"
          }
        };
      }
    }));
  }

  async function loadDiscoverTopPlayed() {
    state.currentView = "discover";
    state.uiPreferences.lastView = "discover";
    state.activeStatus = "all";
    state.uiPreferences.lastStatusFilter = "all";
    state.searchTerm = "";
    state.addForm = {
      ...state.addForm,
      searchQuery: "",
      selectedSearchResult: null,
      step: "search",
      mode: "search"
    };
    state.addSearchLoading = true;
    state.addSearchError = "";
    resetDiscoverEntryState();
    emit();

    let baseResults = [];
    try {
      baseResults = await integrations.metadataResolver.getTopPlayedGames?.() ?? [];
    } catch (error) {
      state.addSearchLoading = false;
      state.addSearchResults = [];
      state.addSearchError = "Top played feed is unavailable right now. Try search or verify worker deployment.";
      emit();
      return;
    }
    const enrichedResults = await enrichSearchResultsWithArtwork(Array.isArray(baseResults) ? baseResults : []);

    state.addSearchResults = enrichedResults;
    state.addSearchLoading = false;
    state.addSearchError = state.addSearchResults.length ? "" : "No top titles were returned. Try searching.";
    emit();
  }

  async function openDiscover({ resetQuery = false } = {}) {
    nextDiscoverNavigationToken();
    state.currentView = "discover";
    state.uiPreferences.lastView = "discover";
    state.activeStatus = "all";
    state.uiPreferences.lastStatusFilter = "all";
    state.searchTerm = "";
    state.isAddModalOpen = false;
    state.editingEntryId = null;
    resetDiscoverEntryState();

    if (resetQuery) {
      state.addForm = {
        ...state.addForm,
        searchQuery: "",
        selectedSearchResult: null,
        step: "search",
        mode: "search"
      };
      state.addSearchResults = [];
    }

    if (!state.addForm.searchQuery.trim() && !state.addForm.selectedSearchResult) {
      await loadDiscoverTopPlayed();
      return;
    }
    if (state.addForm.searchQuery.trim() && !state.addForm.selectedSearchResult && !state.addSearchResults.length) {
      await searchAddCatalog(state.addForm.searchQuery);
      return;
    }
    emit();
  }

  async function openDiscoverSearch(query = "") {
    const normalizedQuery = String(query ?? "").trim();
    const previousQuery = String(state.addForm?.searchQuery ?? "").trim();
    const hasMatchingResults = (
      normalizedQuery
      && previousQuery === normalizedQuery
      && !state.addForm?.selectedSearchResult
      && Array.isArray(state.addSearchResults)
      && state.addSearchResults.length > 0
    );

    nextDiscoverNavigationToken();
    state.currentView = "discover";
    state.uiPreferences.lastView = "discover";
    state.activeStatus = "all";
    state.uiPreferences.lastStatusFilter = "all";
    state.searchTerm = "";
    state.isAddModalOpen = false;
    state.editingEntryId = null;
    resetDiscoverEntryState();
    state.addForm = {
      ...state.addForm,
      searchQuery: normalizedQuery,
      selectedSearchResult: null,
      step: "search",
      mode: "search"
    };

    if (!normalizedQuery) {
      state.addSearchResults = [];
      state.addSearchLoading = false;
      state.addSearchError = "";
      emit();
      await loadDiscoverTopPlayed();
      return true;
    }

    if (!hasMatchingResults) {
      state.addSearchResults = [];
      state.addSearchLoading = true;
      state.addSearchError = "";
    }

    emit();

    if (hasMatchingResults) {
      return true;
    }

    await searchAddCatalog(normalizedQuery);
    return true;
  }

  async function searchAddCatalog(query = state.addForm.searchQuery) {
    const normalizedQuery = String(query ?? "").trim();

    state.addForm = {
      ...state.addForm,
      searchQuery: normalizedQuery
    };

    if (!normalizedQuery) {
      state.addSearchResults = [];
      state.addSearchLoading = false;
      state.addSearchError = "";
      emit();
      return;
    }

    state.addSearchLoading = true;
    state.addSearchError = "";
    resetDiscoverEntryState();
    emit();

    const results = await integrations.metadataResolver.searchGames({ query: normalizedQuery });
    if (state.addForm.searchQuery !== normalizedQuery) {
      return;
    }

    const baseResults = Array.isArray(results) ? results : [];
    const enrichedResults = await enrichSearchResultsWithArtwork(baseResults);

    if (state.addForm.searchQuery !== normalizedQuery) {
      return;
    }

    state.addSearchResults = enrichedResults;
    state.addSearchLoading = false;
    state.addSearchError = state.addSearchResults.length ? "" : "No matches found. You can switch to manual entry.";
    emit();
  }

  function backToAddSearch() {
    state.addForm = {
      ...state.addForm,
      step: "search",
      mode: "search"
    };
    emit();
  }

  function beginManualAdd() {
    const fallbackTitle = state.addForm.title.trim() || state.addForm.searchQuery.trim();
    state.addForm = {
      ...state.addForm,
      title: fallbackTitle,
      step: "log",
      mode: "manual",
      selectedSearchResult: null,
      selectedCatalogId: null
    };
    state.addFormFeedback = null;
    emit();
  }

  function selectAddSearchResult(resultId) {
    const selectedResult = state.addSearchResults.find((item) => item.id === resultId);
    if (!selectedResult) return;

    state.addForm = {
      ...state.addForm,
      title: selectedResult.title || state.addForm.title,
      selectedCatalogId: null,
      selectedSearchResult: selectedResult,
      step: "log",
      mode: "search"
    };
    state.addFormFeedback = null;
    emit();
  }

  async function hydrateDiscoverSelection(selectedResult, navigationToken = Number(state.discoverNavigationToken || 0)) {
    const igdbId = Number(selectedResult?.igdbId);
    const discoverCacheKey = normalizeDiscoverCacheKey(selectedResult?.igdbId || selectedResult?.id);
    const title = String(selectedResult?.title ?? "").trim();
    const storefront = String(state.addForm?.storefront || "steam");
    const selectedStoreIds = getSelectedItadStoreIds();
    const cachedDetails = discoverCacheKey
      ? state.discoverMetadataCache?.[discoverCacheKey] ?? null
      : null;

    state.discoverEntryLoading = true;
    state.discoverEntryError = "";
    state.discoverEntryPricingLoading = true;
    state.discoverEntryPricingError = "";
    state.discoverEntryRelatedLoading = true;
    state.discoverEntryRelatedError = "";
    state.discoverEntryDetails = null;
    state.discoverEntryPricing = null;
    state.discoverEntryRelated = [];
    state.discoverEntryLinks = {
      igdb: "",
      official: "",
      storefronts: []
    };
    if (cachedDetails && typeof cachedDetails === "object") {
      state.discoverEntryDetails = cachedDetails;
      state.discoverEntryLinks = cachedDetails.links && typeof cachedDetails.links === "object"
        ? cachedDetails.links
        : {
            igdb: "",
            official: "",
            storefronts: []
          };
      state.addForm = {
        ...state.addForm,
        selectedSearchResult: {
          ...selectedResult,
          releaseDate: cachedDetails.releaseDate || selectedResult.releaseDate || "",
          platforms: Array.isArray(cachedDetails.platforms) && cachedDetails.platforms.length
            ? cachedDetails.platforms
            : (selectedResult.platforms || []),
          description: cachedDetails.description || selectedResult.description || "",
          coverArt: cachedDetails.coverArt || selectedResult.coverArt || "",
          heroArt: cachedDetails.heroArt || selectedResult.heroArt || selectedResult.steamGridHero || "",
          screenshots: Array.isArray(cachedDetails.screenshots) ? cachedDetails.screenshots : [],
          videos: Array.isArray(cachedDetails.videos) ? cachedDetails.videos : [],
          links: cachedDetails.links ?? { igdb: "", official: "", storefronts: [] }
        }
      };
      state.discoverEntryLoading = !isDiscoverDetailsComplete(cachedDetails);
    }
    emit();

    const shouldFetchDetails = Number.isFinite(igdbId) && igdbId > 0 && (!cachedDetails || !isDiscoverDetailsComplete(cachedDetails));
    const detailsPromise = shouldFetchDetails
      ? integrations.metadataResolver.getGameByIgdbId?.(igdbId)
      : Promise.resolve(cachedDetails);
    const pricingPromise = title
      ? integrations.pricing.resolvePrice({
          title,
          storefront,
          catalogGame: null,
          selectedStoreIds
        })
      : Promise.resolve(null);
    const relatedPromise = Number.isFinite(igdbId) && igdbId > 0
      ? integrations.metadataResolver.getRelatedGamesByIgdbId?.(igdbId, 12)
      : Promise.resolve([]);

    const [detailsResult, pricingResult, relatedResult] = await Promise.allSettled([detailsPromise, pricingPromise, relatedPromise]);
    if (navigationToken !== Number(state.discoverNavigationToken || 0)) {
      return;
    }

    if (detailsResult.status === "fulfilled" && detailsResult.value) {
      const details = mergeDiscoverDetails(cachedDetails ?? {}, detailsResult.value);
      state.discoverEntryDetails = details;
      state.discoverEntryLinks = details.links && typeof details.links === "object"
        ? details.links
        : {
            igdb: "",
            official: "",
            storefronts: []
          };
      state.addForm = {
        ...state.addForm,
        selectedSearchResult: {
          ...selectedResult,
          releaseDate: details.releaseDate || selectedResult.releaseDate || "",
          platforms: Array.isArray(details.platforms) && details.platforms.length
            ? details.platforms
            : (selectedResult.platforms || []),
          description: details.description || selectedResult.description || "",
          coverArt: details.coverArt || selectedResult.coverArt || "",
          heroArt: details.heroArt || selectedResult.heroArt || selectedResult.steamGridHero || "",
          screenshots: Array.isArray(details.screenshots) ? details.screenshots : [],
          videos: Array.isArray(details.videos) ? details.videos : [],
          links: details.links ?? { igdb: "", official: "", storefronts: [] }
        }
      };
      if (discoverCacheKey) {
        state.discoverMetadataCache = {
          ...(state.discoverMetadataCache || {}),
          [discoverCacheKey]: details
        };
        writeDiscoverMetadataCache(state.discoverMetadataCache);
      }
    } else {
      state.discoverEntryError = "Could not load full game details right now. Core result data is still available.";
    }
    state.discoverEntryLoading = false;

    if (pricingResult.status === "fulfilled" && pricingResult.value) {
      state.discoverEntryPricing = pricingResult.value;
    } else {
      state.discoverEntryPricingError = "Could not load pricing snapshot right now.";
    }
    state.discoverEntryPricingLoading = false;

    if (relatedResult.status === "fulfilled" && Array.isArray(relatedResult.value)) {
      state.discoverEntryRelated = relatedResult.value.filter((item) => item?.id && item?.title);
    } else {
      state.discoverEntryRelatedError = "Could not load related titles right now.";
    }
    state.discoverEntryRelatedLoading = false;
    emit();
  }

  async function selectDiscoverResult(resultId) {
    const selectedResult = state.addSearchResults.find((item) => item.id === resultId);
    if (!selectedResult) return;
    resetDiscoverEntryState();
    state.addForm = {
      ...state.addForm,
      selectedSearchResult: selectedResult,
      title: selectedResult.title || state.addForm.title,
      selectedCatalogId: null,
      step: "search",
      mode: "search"
    };
    state.currentView = "discover";
    state.uiPreferences.lastView = "discover";
    const navigationToken = nextDiscoverNavigationToken();
    emit();
    await hydrateDiscoverSelection(selectedResult, navigationToken);
  }

  async function openDiscoverGameById(routeId) {
    const rawId = String(routeId ?? "").trim();
    if (!rawId) return false;
    const normalizedResultId = rawId.startsWith("igdb-") ? rawId : `igdb-${rawId}`;

    const navigationToken = nextDiscoverNavigationToken();
    state.currentView = "discover";
    state.uiPreferences.lastView = "discover";
    state.activeStatus = "all";
    state.uiPreferences.lastStatusFilter = "all";
    state.searchTerm = "";
    state.isAddModalOpen = false;
    state.editingEntryId = null;

    let selectedResult = state.addSearchResults.find((item) => (
      item.id === normalizedResultId
      || String(item.igdbId ?? "") === rawId
      || item.id === rawId
    ));

    if (!selectedResult) {
      const numericIgdbId = Number(rawId.replace(/^igdb-/, ""));
      if (Number.isFinite(numericIgdbId) && numericIgdbId > 0) {
        const details = await integrations.metadataResolver.getGameByIgdbId?.(numericIgdbId);
        if (details && details.id) {
          selectedResult = {
            id: String(details.id),
            igdbId: Number.isFinite(Number(details.igdbId)) ? Number(details.igdbId) : numericIgdbId,
            title: String(details.title || ""),
            releaseDate: String(details.releaseDate || ""),
            platforms: Array.isArray(details.platforms) ? details.platforms : [],
            coverArt: String(details.coverArt || ""),
            description: String(details.description || ""),
            storefront: "manual",
            steamGridCover: String(details.coverArt || ""),
            steamGridHero: String(details.heroArt || ""),
            steamGridMeta: details.meta ?? null
          };
          state.addSearchResults = [
            selectedResult,
            ...state.addSearchResults.filter((item) => item.id !== selectedResult.id)
          ];
        }
      }
    }

    if (!selectedResult) {
      resetDiscoverEntryState();
      state.addForm = {
        ...state.addForm,
        selectedSearchResult: null,
        step: "search",
        mode: "search"
      };
      state.notice = {
        tone: "warning",
        message: "Could not open that Discover game URL. Showing Discover results."
      };
      emit();
      if (!state.addForm.searchQuery.trim() && !state.addSearchResults.length) {
        await loadDiscoverTopPlayed();
      }
      return false;
    }

    resetDiscoverEntryState();
    state.addForm = {
      ...state.addForm,
      selectedSearchResult: selectedResult,
      title: selectedResult.title || state.addForm.title,
      selectedCatalogId: null,
      step: "search",
      mode: "search"
    };
    emit();
    await hydrateDiscoverSelection(selectedResult, navigationToken);
    return true;
  }

  async function selectDiscoverRelated(resultId) {
    const selectedRelated = (Array.isArray(state.discoverEntryRelated) ? state.discoverEntryRelated : [])
      .find((item) => item.id === resultId);
    if (!selectedRelated) return;

    const existingResult = state.addSearchResults.find((item) => item.id === resultId);
    const selectedResult = existingResult ?? {
      ...selectedRelated,
      steamGridCover: selectedRelated.coverArt || "",
      steamGridHero: selectedRelated.heroArt || "",
      steamGridMeta: null
    };

    if (!existingResult) {
      state.addSearchResults = [selectedResult, ...state.addSearchResults.filter((item) => item.id !== selectedResult.id)];
    }

    resetDiscoverEntryState();
    state.addForm = {
      ...state.addForm,
      selectedSearchResult: selectedResult,
      title: selectedResult.title || state.addForm.title,
      selectedCatalogId: null,
      step: "search",
      mode: "search"
    };
    state.currentView = "discover";
    state.uiPreferences.lastView = "discover";
    const navigationToken = nextDiscoverNavigationToken();
    emit();
    await hydrateDiscoverSelection(selectedResult, navigationToken);
  }

  function clearDiscoverSelection() {
    nextDiscoverNavigationToken();
    state.addForm = {
      ...state.addForm,
      selectedSearchResult: null,
      step: "search",
      mode: "search"
    };
    resetDiscoverEntryState();
    emit();
  }

  async function addDiscoverSelection(target = "wishlist") {
    const selectedResult = state.addForm.selectedSearchResult;
    if (!selectedResult) return;

    if (target === "wishlist") {
      const existingWishlistEntry = findWishlistEntryForDiscoverResult(selectedResult);
      if (existingWishlistEntry) {
        state.activeEntryId = existingWishlistEntry.entryId;
        state.currentView = "details";
        state.uiPreferences.lastView = "wishlist";
        state.detailForm = createDetailForm(existingWishlistEntry);
        state.notice = {
          tone: "warning",
          message: `${existingWishlistEntry.title} is already on your wishlist.`
        };
        emit();
        return;
      }
    }

    const nextStatus = target === "wishlist" ? "wishlist" : "playing";
    const nextRunLabel = target === "wishlist" ? "Wishlist" : "Main Save";
    const nextNotes = target === "wishlist"
      ? "Wishlist entry from Discover."
      : "Added from Discover.";

    state.addForm = {
      ...state.addForm,
      title: selectedResult.title || state.addForm.title,
      selectedCatalogId: null,
      selectedSearchResult: selectedResult,
      status: nextStatus,
      runLabel: nextRunLabel,
      playtimeHours: "0",
      completionPercent: "0",
      notes: nextNotes,
      step: "log",
      mode: "search"
    };

    await commitEntry({
      runLabel: nextRunLabel,
      playtimeHours: "0",
      completionPercent: "0",
      notes: nextNotes
    });
  }

  async function selectCatalogSuggestion(catalogId) {
    const item = state.catalog.find((catalogItem) => catalogItem.id === catalogId);
    if (!item) return;

    state.addForm = {
      ...state.addForm,
      title: item.title,
      storefront: item.storefront,
      runLabel: state.addForm.runLabel || "Main Save",
      selectedCatalogId: catalogId
    };
    emit();
  }

  async function commitEntry(draft = {}) {
    if (state.isAddFormSubmitting) return;

    const draftRunLabel = typeof draft.runLabel === "string" ? draft.runLabel : state.addForm.runLabel;
    const draftNotes = typeof draft.notes === "string" ? draft.notes : state.addForm.notes;
    const draftPlaytimeHours = typeof draft.playtimeHours === "string" ? draft.playtimeHours : String(state.addForm.playtimeHours ?? "0");
    const draftCompletionPercent = typeof draft.completionPercent === "string" ? draft.completionPercent : String(state.addForm.completionPercent ?? "0");
    const previousRunLabel = state.addForm.runLabel;
    const previousNotes = state.addForm.notes;
    const previousPlaytimeHours = state.addForm.playtimeHours;
    const previousCompletionPercent = state.addForm.completionPercent;
    state.addForm = {
      ...state.addForm,
      runLabel: draftRunLabel,
      notes: draftNotes,
      playtimeHours: draftPlaytimeHours,
      completionPercent: draftCompletionPercent
    };

    const validation = getAddFormValidation();
    if (validation.errors.length) {
      state.addForm = {
        ...state.addForm,
        runLabel: previousRunLabel,
        notes: previousNotes,
        playtimeHours: previousPlaytimeHours,
        completionPercent: previousCompletionPercent
      };
      state.addFormFeedback = {
        tone: "error",
        message: "Fix the required fields before saving this entry."
      };
      emit();
      return;
    }

    const {
      title,
      storefront,
      status,
      runLabel,
      playtimeHours,
      completionPercent
    } = validation.normalized;
    state.isAddFormSubmitting = true;
    state.addFormFeedback = {
      tone: "info",
      message: "Fetching metadata and resolving artwork..."
    };
    emit();

    try {
      const existingEntry = state.editingEntryId ? getEntry(state.editingEntryId) : null;
      const selectedCatalog = state.catalog.find((item) => item.id === state.addForm.selectedCatalogId);
      const selectedSearchResult = state.addForm.selectedSearchResult;
      const selectedSearchIgdbId = Number(selectedSearchResult?.igdbId);
      const matchingDiscoverDetails = Number.isFinite(selectedSearchIgdbId)
        && Number(state.discoverEntryDetails?.igdbId) === selectedSearchIgdbId
        ? state.discoverEntryDetails
        : null;
      const matchingDiscoverPricing = Number.isFinite(selectedSearchIgdbId)
        && Number(state.discoverEntryDetails?.igdbId) === selectedSearchIgdbId
        && state.discoverEntryPricing
        && typeof state.discoverEntryPricing === "object"
        ? state.discoverEntryPricing
        : null;
      const selectedRelated = matchingDiscoverDetails
        ? (Array.isArray(state.discoverEntryRelated) ? state.discoverEntryRelated : [])
        : [];
      const catalogSeed = selectedCatalog ?? (selectedSearchResult
        ? {
            id: selectedSearchResult.igdbId
              ? `igdb-${selectedSearchResult.igdbId}`
              : `game-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "manual"}`,
            igdbId: Number.isFinite(selectedSearchIgdbId) ? selectedSearchIgdbId : null,
            title: selectedSearchResult.title || title,
            storefront,
            developer: "",
            publisher: "",
            releaseDate: selectedSearchResult.releaseDate || "",
            genres: [],
            platforms: Array.isArray(selectedSearchResult.platforms) ? selectedSearchResult.platforms : [],
            criticSummary: "",
            description: selectedSearchResult.description || "",
            steamGridSlug: "",
            heroArt: selectedSearchResult.heroArt || selectedSearchResult.steamGridHero || "",
            capsuleArt: selectedSearchResult.coverArt || selectedSearchResult.steamGridCover || "",
            screenshots: [],
            videos: Array.isArray(matchingDiscoverDetails?.videos) ? matchingDiscoverDetails.videos : [],
            links: matchingDiscoverDetails?.links ?? { igdb: "", official: "", storefronts: [] },
            relatedTitles: selectedRelated,
            lockedFields: []
          }
        : null);
      const metadata = await integrations.metadataResolver.resolveGameMetadata({
        title,
        storefront,
        catalogGame: catalogSeed
      });
      let metadataGame = mergeMetadataIntoCatalogGame(catalogSeed, metadata, { title, storefront });
      if (matchingDiscoverDetails) {
        metadataGame = mergeMetadataIntoCatalogGame(metadataGame, {
          ...matchingDiscoverDetails,
          links: matchingDiscoverDetails.links ?? state.discoverEntryLinks ?? { igdb: "", official: "", storefronts: [] },
          relatedTitles: selectedRelated
        }, { title, storefront });
      }
      const needsArtworkFallback = !metadataGame?.heroArt || !metadataGame?.capsuleArt || !(Array.isArray(metadataGame?.screenshots) && metadataGame.screenshots.length);
      const artwork = needsArtworkFallback
        ? await integrations.steamGrid.resolveArtwork({
            title,
            storefront,
            catalogGame: metadataGame
          })
        : {
            heroArt: metadataGame.heroArt || "",
            capsuleArt: metadataGame.capsuleArt || "",
            screenshots: metadataGame.screenshots || [],
            meta: {
              resolved: true,
              usedFallback: false,
              reason: "igdb_primary"
            }
          };
      const catalogGame = {
        ...mergeArtworkIntoCatalogGame(metadataGame, artwork),
        pricing: matchingDiscoverPricing
          ? {
              ...(metadataGame?.pricing && typeof metadataGame.pricing === "object" ? metadataGame.pricing : {}),
              ...matchingDiscoverPricing
            }
          : metadataGame?.pricing
      };

      const catalogGameExists = state.catalog.some((item) => item.id === catalogGame.id);
      state.catalog = catalogGameExists
        ? state.catalog.map((item) => (item.id === catalogGame.id ? catalogGame : item))
        : [catalogGame, ...state.catalog];

      const now = new Date().toISOString();
      const entry = normalizeLibraryEntry({
        entryId: existingEntry?.entryId ?? createEntryId(),
        gameId: catalogGame.id,
        title: catalogGame.title,
        storefront,
        status,
        runLabel,
        addedAt: existingEntry?.addedAt ?? now,
        updatedAt: now,
        playtimeHours: existingEntry?.playtimeHours ?? playtimeHours,
        completionPercent: existingEntry
          ? (status === "finished" ? Math.max(existingEntry.completionPercent, 100) : existingEntry.completionPercent)
          : (status === "finished" ? 100 : completionPercent),
        personalRating: existingEntry?.personalRating ?? null,
        notes: state.addForm.notes.trim() || "Freshly added to Checkpoint. Ready for notes, milestones, and sync metadata.",
        spotlight: existingEntry?.spotlight ?? "New intake",
        syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline"
      });

      state.library = existingEntry
        ? state.library.map((item) => (item.entryId === existingEntry.entryId ? entry : item)).sort(sortByUpdatedAtDesc)
        : [entry, ...state.library].sort(sortByUpdatedAtDesc);
      state.catalog = pruneCatalogToLibrary(state.library, state.catalog);
      state.activeEntryId = entry.entryId;
      const previousView = state.currentView;
      state.currentView = "details";
      state.uiPreferences.lastView = entry.status === "wishlist"
        ? "wishlist"
        : (["dashboard", "discover", "wishlist", "settings"].includes(previousView)
          ? previousView
          : "dashboard");
      state.detailForm = createDetailForm(entry);
      const saveFeedback = buildEntrySaveFeedback({
        title: entry.title,
        metadata,
        artwork,
        isEditing: Boolean(existingEntry)
      });
      recordActivity({
        category: "entry",
        action: existingEntry ? "updated" : "added",
        scope: "entry",
        title: entry.title,
        message: existingEntry ? "Entry details were updated." : "Entry was added to the library.",
        tone: saveFeedback.tone
      });
      state.notice = {
        tone: saveFeedback.tone,
        message: saveFeedback.notice
      };
      state.addFormFeedback = {
        tone: saveFeedback.tone,
        message: saveFeedback.form
      };
      closeAddModal();
      return;
    } catch (error) {
      state.addForm = {
        ...state.addForm,
        runLabel: draftRunLabel,
        notes: draftNotes,
        playtimeHours: draftPlaytimeHours,
        completionPercent: draftCompletionPercent
      };
      state.isAddFormSubmitting = false;
      state.addFormFeedback = {
        tone: "error",
        message: "Checkpoint couldn't save this entry. Try again."
      };
      state.notice = {
        tone: "error",
        message: "Save failed. Your existing library data is unchanged."
      };
      emit();
      return;
    }
  }

  function confirmDeleteEntry() {
    const targetEntryId = state.pendingDeleteEntryId;
    if (!targetEntryId) return;
    const removedEntry = getEntry(targetEntryId);

    state.library = state.library.filter((entry) => entry.entryId !== targetEntryId);
    state.catalog = pruneCatalogToLibrary(state.library, state.catalog);

    if (state.editingEntryId === targetEntryId) {
      state.isAddModalOpen = false;
      state.editingEntryId = null;
      state.addForm = createDefaultAddForm();
    }

    if (state.activeEntryId === targetEntryId) {
      const nextActiveEntry = state.library[0] ?? null;
      state.activeEntryId = nextActiveEntry?.entryId ?? null;
      state.detailForm = createDetailForm(nextActiveEntry);
    }

    state.currentView = "dashboard";
    state.uiPreferences.lastView = "dashboard";
    state.pendingDeleteEntryId = null;
    recordActivity({
      category: "entry",
      action: "deleted",
      scope: "entry",
      title: removedEntry?.title ?? "",
      message: removedEntry?.title ? `${removedEntry.title} was removed from the library.` : "Entry was removed from the library.",
      tone: "warning"
    });
    state.notice = {
      tone: "success",
      message: "Entry removed from your library."
    };
    emit();
  }

  function dismissNotice() {
    if (!state.notice) return;
    state.notice = null;
    emit();
  }

  function updateEntryStatus(entryId, status) {
    if (!ctx.validStatusIds.has(status)) return;
    const existingEntry = getEntry(entryId);
    if (!existingEntry) return;

    state.library = state.library.map((entry) => (
      entry.entryId === entryId
        ? {
            ...normalizeLibraryEntry({
              ...entry,
              status,
              completionPercent: status === "finished" ? 100 : entry.completionPercent,
              updatedAt: new Date().toISOString(),
              syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline"
            })
          }
        : entry
    ));
    state.catalog = pruneCatalogToLibrary(state.library, state.catalog);

    if (state.activeEntryId === entryId) {
      const updatedEntry = getEntry(entryId);
      state.detailForm = createDetailForm(updatedEntry);
    }

    const statusLabel = statusDefinitions.find((item) => item.id === status)?.label ?? status;
    recordActivity({
      category: "entry",
      action: "status",
      scope: "entry",
      title: existingEntry.title,
      message: `Status changed to ${statusLabel}.`,
      tone: "success"
    });
    state.notice = {
      tone: "success",
      message: `${existingEntry.title} moved to ${statusLabel.toLowerCase()}.`
    };
    emit();
  }

  function updateDetailForm(patch) {
    state.detailForm = {
      ...state.detailForm,
      ...patch
    };
    emit();
  }

  function toggleDetailEditMode(forceValue) {
    const nextValue = typeof forceValue === "boolean" ? forceValue : !state.isDetailEditMode;
    state.isDetailEditMode = nextValue;
    emit();
  }

  function saveDetailWorkspace(draft = {}) {
    const entry = getEntry();
    if (!entry) return false;
    const game = getCatalogGame(entry.gameId);

    const nextRunLabel = typeof draft.runLabel === "string" && draft.runLabel.trim()
      ? draft.runLabel.trim()
      : (entry.runLabel || "Main Save");
    const nextStorefront = typeof draft.storefront === "string" && ctx.validStorefrontIds.has(draft.storefront)
      ? draft.storefront
      : entry.storefront;

    const updatedEntry = normalizeLibraryEntry({
      ...entry,
      storefront: nextStorefront,
      runLabel: nextRunLabel,
      updatedAt: new Date().toISOString(),
      syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline"
    });

    const nextMetadataGame = draft.metadataOverrides
      ? applyMetadataOverridesToGame(game, draft.metadataOverrides)
      : game;
    const nextArtworkGame = draft.artworkOverrides
      ? applyArtworkOverridesToGame(nextMetadataGame, draft.artworkOverrides)
      : nextMetadataGame;

    state.library = state.library
      .map((item) => (item.entryId === entry.entryId ? updatedEntry : item))
      .sort(sortByUpdatedAtDesc);
    if (nextArtworkGame) {
      state.catalog = state.catalog.map((item) => (
        item.id === nextArtworkGame.id ? nextArtworkGame : item
      ));
    }
    state.catalog = pruneCatalogToLibrary(state.library, state.catalog);
    state.detailForm = createDetailForm(updatedEntry);
    state.isDetailEditMode = false;
    recordActivity({
      category: "entry",
      action: "details",
      scope: "entry",
      title: updatedEntry.title,
      message: "Run details and overrides were saved.",
      tone: "success"
    });
    state.notice = {
      tone: "success",
      message: `${updatedEntry.title} details saved.`
    };
    emit();
    return true;
  }

  function saveDetailNotes(draft = {}) {
    const entry = getEntry();
    if (!entry) return;
    const nextNotes = typeof draft.notes === "string" ? draft.notes : state.detailForm.notes;

    const updatedEntry = normalizeLibraryEntry({
      ...entry,
      notes: nextNotes.trim() || "No notes recorded yet.",
      updatedAt: new Date().toISOString(),
      syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline"
    });

    state.library = state.library
      .map((item) => (item.entryId === entry.entryId ? updatedEntry : item))
      .sort(sortByUpdatedAtDesc);
    state.catalog = pruneCatalogToLibrary(state.library, state.catalog);
    state.detailForm = createDetailForm(updatedEntry);
    recordActivity({
      category: "entry",
      action: "notes",
      scope: "entry",
      title: updatedEntry.title,
      message: "Run notes were updated.",
      tone: "success"
    });
    state.notice = {
      tone: "success",
      message: `${updatedEntry.title} notes saved.`
    };
    emit();
  }

  function saveDetailProgress(draft = {}) {
    const entry = getEntry();
    if (!entry) return;
    const nextStatus = typeof draft.status === "string" ? draft.status : state.detailForm.status;
    const nextPlaytimeValue = draft.playtimeHours ?? state.detailForm.playtimeHours;
    const nextCompletionValue = draft.completionPercent ?? state.detailForm.completionPercent;

    const status = ctx.validStatusIds.has(nextStatus) ? nextStatus : entry.status;
    const parsedPlaytime = Number.parseFloat(nextPlaytimeValue);
    const parsedCompletion = Number.parseFloat(nextCompletionValue);
    const playtimeHours = Number.isFinite(parsedPlaytime) ? Math.max(0, parsedPlaytime) : entry.playtimeHours;
    const nextCompletion = Number.isFinite(parsedCompletion)
      ? Math.min(100, Math.max(0, Math.round(parsedCompletion)))
      : entry.completionPercent;

    const updatedEntry = normalizeLibraryEntry({
      ...entry,
      status,
      playtimeHours,
      completionPercent: status === "finished" ? 100 : nextCompletion,
      updatedAt: new Date().toISOString(),
      syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline"
    });

    state.library = state.library
      .map((item) => (item.entryId === entry.entryId ? updatedEntry : item))
      .sort(sortByUpdatedAtDesc);
    state.catalog = pruneCatalogToLibrary(state.library, state.catalog);
    state.detailForm = createDetailForm(updatedEntry);
    recordActivity({
      category: "entry",
      action: "progress",
      scope: "entry",
      title: updatedEntry.title,
      message: `Progress saved (${updatedEntry.playtimeHours}h, ${updatedEntry.completionPercent}%).`,
      tone: "success"
    });
    state.notice = {
      tone: "success",
      message: `${updatedEntry.title} progress updated.`
    };
    emit();
  }

  function savePriceWatch(draft = {}) {
    const entry = getEntry();
    if (!entry) return;
    const targetValue = typeof draft.targetPrice === "string" ? draft.targetPrice : String(draft.targetPrice ?? "");
    const parsedTarget = Number.parseFloat(targetValue);
    const nextTargetPrice = Number.isFinite(parsedTarget) && parsedTarget >= 0 ? parsedTarget : null;
    const nextCurrency = typeof draft.currency === "string" && draft.currency.trim()
      ? draft.currency.trim().toUpperCase()
      : (entry.priceWatch?.currency || "USD");
    const enabled = typeof draft.enabled === "boolean"
      ? draft.enabled
      : (entry.priceWatch?.enabled !== false);
    const nextWishlistPriority = typeof draft.wishlistPriority === "string" && ["low", "medium", "high", "must-buy"].includes(draft.wishlistPriority)
      ? draft.wishlistPriority
      : (entry.wishlistPriority || "medium");
    const nextWishlistIntent = typeof draft.wishlistIntent === "string" && ["buy-now", "wait-sale", "monitor-release", "research"].includes(draft.wishlistIntent)
      ? draft.wishlistIntent
      : (entry.wishlistIntent || "wait-sale");

    const updatedEntry = normalizeLibraryEntry({
      ...entry,
      wishlistPriority: nextWishlistPriority,
      wishlistIntent: nextWishlistIntent,
      priceWatch: {
        ...entry.priceWatch,
        enabled,
        targetPrice: nextTargetPrice,
        currency: nextCurrency
      },
      syncState: integrations.googleDrive.isConfigured() ? "pending" : "offline",
      updatedAt: new Date().toISOString()
    });

    state.library = state.library
      .map((item) => (item.entryId === entry.entryId ? updatedEntry : item))
      .sort(sortByUpdatedAtDesc);
    state.detailForm = createDetailForm(updatedEntry);
    state.notice = {
      tone: "success",
      message: `${updatedEntry.title} wishlist settings saved.`
    };
    recordActivity({
      category: "pricing",
      action: "watch-updated",
      scope: "entry",
      title: updatedEntry.title,
      message: "Price watch, priority, and intent updated.",
      tone: "success"
    });
    emit();
  }

  function togglePriceWatch(entryId = state.activeEntryId) {
    const entry = getEntry(entryId);
    if (!entry) return;
    savePriceWatch({
      enabled: !(entry.priceWatch?.enabled !== false),
      targetPrice: entry.priceWatch?.targetPrice,
      currency: entry.priceWatch?.currency || "USD"
    });
  }

  async function loadItadStores() {
    if (!integrations.pricing?.isConfigured?.()) {
      state.itadStores = [];
      state.itadStoresLoading = false;
      state.itadStoresError = "Pricing integration is not configured.";
      setActionState("pricing", {
        tone: "warning",
        message: "Pricing integration is not configured."
      });
      emit();
      return;
    }

    state.itadStoresLoading = true;
    state.itadStoresError = "";
    setActionState("pricing", {
      tone: "info",
      message: "Loading ITAD stores..."
    });
    emit();

    const stores = await integrations.pricing.listStores();
    state.itadStoresLoading = false;
    state.itadStores = Array.isArray(stores) ? stores : [];
    writeItadStoresCache(state.itadStores);
    if (!state.itadStores.length) {
      state.itadStoresError = "No stores were returned by ITAD.";
      setActionState("pricing", {
        tone: "warning",
        message: "No ITAD stores were returned."
      });
    } else {
      setActionState("pricing", {
        tone: "success",
        message: `Loaded ${state.itadStores.length} ITAD stores.`
      });
    }
    emit();
  }

  function toggleItadStoreSelection(storeId, checked) {
    const normalizedStoreId = String(storeId ?? "").trim();
    if (!normalizedStoreId) return;
    const current = Array.isArray(state.syncPreferences.itadSelectedStoreIds)
      ? state.syncPreferences.itadSelectedStoreIds
        .map((value) => String(value ?? "").trim())
        .filter((value) => /^\d+$/.test(value))
      : [];
    const nextSet = new Set(current);
    if (checked) {
      nextSet.add(normalizedStoreId);
    } else {
      nextSet.delete(normalizedStoreId);
    }
    state.syncPreferences = {
      ...state.syncPreferences,
      itadSelectedStoreIds: Array.from(nextSet)
    };
    emit();
  }

  function togglePreference(key) {
    const allowedPreferenceKeys = new Set(["autoBackup", "includeArtwork", "includeNotes", "includeActivityHistory"]);
    if (!allowedPreferenceKeys.has(key)) return;
    state.syncPreferences[key] = !state.syncPreferences[key];
    emit();
  }

  return {
    selectEntry,
    openEntryDetails,
    openAddModal,
    closeAddModal,
    openDeleteConfirm,
    closeDeleteConfirm,
    updateAddForm,
    openDiscover,
    openDiscoverSearch,
    loadDiscoverTopPlayed,
    searchAddCatalog,
    backToAddSearch,
    beginManualAdd,
    selectAddSearchResult,
    selectDiscoverResult,
    openDiscoverGameById,
    selectDiscoverRelated,
    clearDiscoverSelection,
    addDiscoverSelection,
    selectCatalogSuggestion,
    commitEntry,
    confirmDeleteEntry,
    dismissNotice,
    updateEntryStatus,
    updateDetailForm,
    toggleDetailEditMode,
    saveDetailWorkspace,
    saveDetailNotes,
    saveDetailProgress,
    savePriceWatch,
    togglePriceWatch,
    refreshPricingForEntry,
    refreshLibraryPricing,
    hydrateTrackedGameDecisionData,
    loadItadStores,
    toggleItadStoreSelection,
    togglePreference
  };
}
