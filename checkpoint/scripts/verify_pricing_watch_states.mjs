import { createStore } from "../modules/store.js";
import { renderDetailsView } from "../modules/render/details.js";
import { statusDefinitions, storefrontDefinitions } from "../data/sample-data.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createMemoryPersistence() {
  return {
    load({ initialLibrary, initialCatalog }) {
      return {
        library: initialLibrary,
        catalog: initialCatalog,
        syncPreferences: {
          autoBackup: false,
          includeArtwork: true,
          includeNotes: true,
          includeActivityHistory: true,
          itadSelectedStoreIds: ["61"]
        },
        uiPreferences: {
          lastView: "dashboard",
          lastStatusFilter: "all",
          librarySort: "updated_desc",
          settingsSection: "sync"
        }
      };
    },
    save() {}
  };
}

function buildPricingResult({
  status = "ok",
  reason = "resolved",
  amount = 19.99,
  currency = "USD",
  storeName = "Steam",
  storeId = "61",
  discountPercent = 0
} = {}) {
  return {
    provider: "itad",
    providerGameId: "itad-test-1",
    currentBest: {
      amount: Number.isFinite(Number(amount)) ? Number(amount) : null,
      currency,
      storeId,
      storeName,
      url: "",
      regularAmount: null,
      discountPercent: Number.isFinite(Number(discountPercent)) ? Number(discountPercent) : null
    },
    preferredStoreCurrent: {
      amount: null,
      currency,
      storeId: "",
      storeName: "",
      url: "",
      regularAmount: null,
      discountPercent: null
    },
    storeRows: Number.isFinite(Number(amount))
      ? [{
          storeId,
          storeName,
          amount: Number(amount),
          currency,
          discountPercent: Number.isFinite(Number(discountPercent)) ? Number(discountPercent) : null,
          url: ""
        }]
      : [],
    historicalLow: {
      amount: null,
      currency,
      storeId: "",
      storeName: "",
      url: "",
      regularAmount: null,
      discountPercent: null,
      at: ""
    },
    lastCheckedAt: new Date().toISOString(),
    status,
    reason,
    meta: {
      resolved: status === "ok",
      usedFallback: status !== "ok",
      reason
    }
  };
}

function createTestStore() {
  const pricingState = {
    response: buildPricingResult({
      status: "ok",
      reason: "resolved",
      amount: 14.99,
      storeName: "Steam",
      storeId: "61",
      discountPercent: 40
    })
  };

  const integrations = {
    metadataResolver: {
      isConfigured: () => true,
      async searchGames() {
        return [];
      },
      async resolveGameMetadata({ catalogGame }) {
        return {
          developer: catalogGame?.developer ?? "",
          publisher: catalogGame?.publisher ?? "",
          releaseDate: catalogGame?.releaseDate ?? "",
          genres: catalogGame?.genres ?? [],
          platforms: catalogGame?.platforms ?? [],
          criticSummary: catalogGame?.criticSummary ?? "",
          description: catalogGame?.description ?? "",
          steamGridSlug: catalogGame?.steamGridSlug ?? "",
          meta: { resolved: true, usedFallback: false, reason: "test" }
        };
      }
    },
    steamGrid: {
      isConfigured: () => true,
      async resolveArtwork({ catalogGame }) {
        return {
          heroArt: catalogGame?.heroArt ?? "",
          capsuleArt: catalogGame?.capsuleArt ?? "",
          screenshots: catalogGame?.screenshots ?? [],
          meta: { resolved: true, usedFallback: false, reason: "test" }
        };
      }
    },
    googleDrive: {
      isConfigured: () => false,
      getStatus: () => ({ available: false, connected: false, clientConfigured: false }),
      async connect() {
        return { ok: false, mode: "oauth", message: "not configured" };
      },
      disconnect() {
        return { ok: true, mode: "oauth", message: "disconnected" };
      },
      async syncAppState() {
        return { ok: false, mode: "manual", message: "not configured" };
      },
      async restoreAppState() {
        throw new Error("not configured");
      }
    },
    pricing: {
      isConfigured: () => true,
      async resolvePrice() {
        return JSON.parse(JSON.stringify(pricingState.response));
      },
      async listStores() {
        return [{ id: "61", name: "Steam" }];
      }
    }
  };

  const catalog = [
    {
      id: "game-wish",
      title: "Wish Test",
      storefront: "steam",
      developer: "Test Dev",
      publisher: "Test Pub",
      releaseDate: "2025-01-01",
      genres: ["RPG"],
      platforms: ["PC"],
      criticSummary: "Test summary",
      description: "Test description",
      heroArt: "",
      capsuleArt: "",
      screenshots: []
    },
    {
      id: "game-play",
      title: "Play Test",
      storefront: "steam",
      developer: "Test Dev",
      publisher: "Test Pub",
      releaseDate: "2024-01-01",
      genres: ["Action"],
      platforms: ["PC"],
      criticSummary: "Play summary",
      description: "Play description",
      heroArt: "",
      capsuleArt: "",
      screenshots: []
    }
  ];

  const library = [
    {
      entryId: "entry-wishlist",
      gameId: "game-wish",
      title: "Wish Test",
      storefront: "steam",
      status: "wishlist",
      runLabel: "Wishlist",
      addedAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
      playtimeHours: 0,
      completionPercent: 0,
      personalRating: null,
      notes: "wishlist",
      spotlight: "",
      syncState: "offline"
    },
    {
      entryId: "entry-playing",
      gameId: "game-play",
      title: "Play Test",
      storefront: "steam",
      status: "playing",
      runLabel: "Main Save",
      addedAt: "2026-04-01T00:00:00.000Z",
      updatedAt: "2026-04-01T00:00:00.000Z",
      playtimeHours: 0,
      completionPercent: 0,
      personalRating: null,
      notes: "playing",
      spotlight: "",
      syncState: "offline"
    }
  ];

  const store = createStore({
    initialLibrary: library,
    catalog,
    persistence: createMemoryPersistence(),
    integrations,
    statusDefinitions,
    storefrontDefinitions
  });

  return {
    store,
    setPricingResponse(nextResponse) {
      pricingState.response = nextResponse;
    }
  };
}

function getEntry(snapshot, entryId) {
  return snapshot.library.find((entry) => entry.entryId === entryId);
}

async function verifyWishlistDefaultsAndWatchTrigger() {
  const { store, setPricingResponse } = createTestStore();
  const initialSnapshot = store.getSnapshot();
  const wishlistEntry = getEntry(initialSnapshot, "entry-wishlist");
  const playingEntry = getEntry(initialSnapshot, "entry-playing");

  assert(wishlistEntry?.priceWatch?.enabled === true, "Expected wishlist entries to default priceWatch.enabled to true.");
  assert(playingEntry?.priceWatch?.enabled === false, "Expected non-wishlist entries to default priceWatch.enabled to false.");

  store.selectEntry("entry-wishlist");
  store.savePriceWatch({
    enabled: true,
    targetPrice: "20",
    currency: "USD"
  });

  setPricingResponse(buildPricingResult({
    status: "ok",
    reason: "resolved",
    amount: 14.99,
    currency: "USD",
    storeId: "61",
    storeName: "Steam",
    discountPercent: 40
  }));

  const refreshed = await store.refreshPricingForEntry("entry-wishlist");
  assert(refreshed === true, "Expected first pricing refresh to succeed.");

  const afterFirstRefresh = store.getSnapshot();
  const firstEntryState = getEntry(afterFirstRefresh, "entry-wishlist");
  const firstNotifiedAt = firstEntryState?.priceWatch?.lastNotifiedAt;
  const firstHitCount = afterFirstRefresh.activityHistory.filter((item) => item.action === "price-watch-hit").length;

  assert(Boolean(firstNotifiedAt), "Expected first threshold hit to stamp lastNotifiedAt.");
  assert(firstHitCount === 1, "Expected exactly one price-watch-hit activity after first refresh.");

  const refreshedAgain = await store.refreshPricingForEntry("entry-wishlist");
  assert(refreshedAgain === true, "Expected second pricing refresh to succeed.");

  const afterSecondRefresh = store.getSnapshot();
  const secondEntryState = getEntry(afterSecondRefresh, "entry-wishlist");
  const secondNotifiedAt = secondEntryState?.priceWatch?.lastNotifiedAt;
  const secondHitCount = afterSecondRefresh.activityHistory.filter((item) => item.action === "price-watch-hit").length;

  assert(firstNotifiedAt === secondNotifiedAt, "Expected anti-spam guard to keep lastNotifiedAt unchanged within cooldown window.");
  assert(secondHitCount === 1, "Expected anti-spam guard to prevent duplicate price-watch-hit activity entries.");
}

async function verifyPricingStatusUiStates() {
  const { store, setPricingResponse } = createTestStore();

  store.setView("wishlist");
  store.openEntryDetails("entry-wishlist");

  setPricingResponse(buildPricingResult({
    status: "no_match",
    reason: "no_match",
    amount: null
  }));
  await store.refreshPricingForEntry("entry-wishlist", { suppressNotice: true });
  let html = renderDetailsView(store.getSnapshot(), storefrontDefinitions, statusDefinitions);
  assert(html.includes("Coming soon"), "Expected no_match status UI to render Coming soon copy.");

  setPricingResponse(buildPricingResult({
    status: "unsupported",
    reason: "unsupported",
    amount: null
  }));
  await store.refreshPricingForEntry("entry-wishlist", { suppressNotice: true });
  html = renderDetailsView(store.getSnapshot(), storefrontDefinitions, statusDefinitions);
  assert(html.includes("Coming soon"), "Expected unsupported status UI to render Coming soon copy.");

  setPricingResponse(buildPricingResult({
    status: "error",
    reason: "worker_request_failed",
    amount: null
  }));
  await store.refreshPricingForEntry("entry-wishlist", { suppressNotice: true });
  html = renderDetailsView(store.getSnapshot(), storefrontDefinitions, statusDefinitions);
  assert(html.includes("Provider unavailable"), "Expected error status UI to render Provider unavailable copy.");
}

async function run() {
  await verifyWishlistDefaultsAndWatchTrigger();
  await verifyPricingStatusUiStates();
  console.log("[checkpoint] Pricing watch/default/status verification passed.");
}

run().catch((error) => {
  console.error("[checkpoint] Pricing watch/default/status verification failed.");
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
