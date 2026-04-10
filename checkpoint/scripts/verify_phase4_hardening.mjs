import { createStore } from "../modules/store.js";
import { APP_STATE_SCHEMA_VERSION } from "../modules/schema.js";
import { renderDetailsView } from "../modules/render/details.js";
import { renderDashboardView } from "../modules/render/library.js";
import {
  getReleaseState,
  getReleaseStateLabel,
  getReleaseStatusDetail
} from "../modules/render/shared.js";
import { statusDefinitions, storefrontDefinitions } from "../data/sample-data.js";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createMemoryPersistence({
  initialLibrary,
  initialCatalog,
  selectedStoreIds = ["61"]
} = {}) {
  return {
    load() {
      return {
        schemaVersion: APP_STATE_SCHEMA_VERSION,
        library: initialLibrary,
        catalog: initialCatalog,
        syncPreferences: {
          autoBackup: false,
          includeArtwork: true,
          includeNotes: true,
          includeActivityHistory: true,
          itadSelectedStoreIds: selectedStoreIds
        },
        uiPreferences: {
          lastView: "wishlist",
          lastStatusFilter: "all",
          librarySort: "updated_desc",
          settingsSection: "settings-sync-account"
        }
      };
    },
    save() {}
  };
}

function createBaseIntegrations({
  metadataResolver = null,
  steamGrid = null,
  pricing = null
} = {}) {
  return {
    metadataResolver: metadataResolver ?? {
      isConfigured: () => true,
      async searchGames() {
        return [];
      },
      async resolveGameMetadata({ catalogGame }) {
        return {
          igdbId: catalogGame?.igdbId ?? null,
          developer: catalogGame?.developer ?? "",
          publisher: catalogGame?.publisher ?? "",
          releaseDate: catalogGame?.releaseDate ?? "",
          genres: catalogGame?.genres ?? [],
          platforms: catalogGame?.platforms ?? [],
          criticSummary: catalogGame?.criticSummary ?? "",
          description: catalogGame?.description ?? "",
          heroArt: catalogGame?.heroArt ?? "",
          capsuleArt: catalogGame?.capsuleArt ?? "",
          screenshots: catalogGame?.screenshots ?? [],
          videos: catalogGame?.videos ?? [],
          links: catalogGame?.links ?? { igdb: "", official: "", storefronts: [] },
          relatedTitles: catalogGame?.relatedTitles ?? [],
          steamGridSlug: catalogGame?.steamGridSlug ?? "",
          meta: { resolved: true, usedFallback: false, reason: "test" }
        };
      },
      async getGameByIgdbId() {
        return null;
      },
      async getRelatedGamesByIgdbId() {
        return [];
      }
    },
    steamGrid: steamGrid ?? {
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
    pricing: pricing ?? {
      isConfigured: () => true,
      async resolvePrice() {
        return {
          provider: "itad",
          providerGameId: "itad-test",
          gameUrl: "",
          currentBest: {
            amount: null,
            currency: "USD",
            storeId: "",
            storeName: "",
            url: "",
            regularAmount: null,
            discountPercent: null
          },
          storeRows: [],
          historicalLow: {
            amount: null,
            currency: "USD",
            storeId: "",
            storeName: "",
            url: "",
            regularAmount: null,
            discountPercent: null,
            at: ""
          },
          lastCheckedAt: new Date().toISOString(),
          status: "unsupported",
          reason: "unsupported",
          meta: {
            resolved: false,
            usedFallback: true,
            reason: "unsupported"
          }
        };
      },
      async listStores() {
        return [];
      }
    }
  };
}

function createSingleEntryStore({
  entryStatus = "wishlist",
  releaseDate = "2035-01-01",
  selectedStoreIds = ["61"],
  storefront = "steam",
  integrations = {}
} = {}) {
  const catalog = [{
    id: "game-test",
    igdbId: 17269,
    title: "Phase 4 Test",
    storefront,
    developer: "Test Dev",
    publisher: "Test Pub",
    releaseDate,
    genres: ["Action"],
    platforms: ["PC"],
    criticSummary: "Summary",
    description: "Description",
    heroArt: "",
    capsuleArt: "",
    screenshots: [],
    videos: [],
    links: { igdb: "", official: "", storefronts: [] },
    relatedTitles: [],
    steamGridSlug: ""
  }];

  const library = [{
    entryId: "entry-test",
    gameId: "game-test",
    title: "Phase 4 Test",
    storefront,
    status: entryStatus,
    runLabel: entryStatus === "wishlist" ? "Wishlist" : "Main Save",
    addedAt: "2026-04-01T00:00:00.000Z",
    updatedAt: "2026-04-01T00:00:00.000Z",
    playtimeHours: 0,
    completionPercent: 0,
    personalRating: null,
    notes: "",
    spotlight: "",
    syncState: "offline"
  }];

  return createStore({
    initialLibrary: library,
    catalog,
    persistence: createMemoryPersistence({
      initialLibrary: library,
      initialCatalog: catalog,
      selectedStoreIds
    }),
    integrations: createBaseIntegrations(integrations),
    statusDefinitions,
    storefrontDefinitions
  });
}

function getCatalogGame(snapshot, gameId = "game-test") {
  return snapshot.catalog.find((item) => item.id === gameId) ?? null;
}

async function verifyReleaseStateHelpers() {
  assert(getReleaseState("2035-01-01") === "releasing-soon", "Expected future date to normalize as releasing-soon.");
  assert(getReleaseState("Coming Soon") === "coming-soon", "Expected 'Coming Soon' to normalize as coming-soon.");
  assert(getReleaseState("TBD") === "tbd", "Expected 'TBD' to normalize as tbd.");
  assert(getReleaseState("") === "tbd", "Expected empty release date to normalize as tbd.");
  assert(getReleaseStateLabel("releasing-soon") === "Releasing Soon", "Expected release-state label mapping to remain stable.");
  assert(getReleaseStatusDetail("2035-01-01").startsWith("Releasing in "), "Expected future release detail copy to include countdown.");
  assert(getReleaseStatusDetail("Coming Soon") === "Coming soon", "Expected coming-soon detail copy to remain stable.");
  assert(getReleaseStatusDetail("") === "Release date TBD", "Expected empty release detail copy to remain stable.");
}

async function verifyReleaseAwareWishlistUiStates() {
  const futureStore = createSingleEntryStore({
    releaseDate: "2035-01-01",
    integrations: {
      pricing: {
        isConfigured: () => true,
        async resolvePrice() {
          return {
            provider: "itad",
            providerGameId: "itad-test",
            gameUrl: "",
            currentBest: {
              amount: null,
              currency: "USD",
              storeId: "",
              storeName: "",
              url: "",
              regularAmount: null,
              discountPercent: null
            },
            storeRows: [],
            historicalLow: {
              amount: null,
              currency: "USD",
              storeId: "",
              storeName: "",
              url: "",
              regularAmount: null,
              discountPercent: null,
              at: ""
            },
            lastCheckedAt: new Date().toISOString(),
            status: "unsupported",
            reason: "unsupported",
            meta: { resolved: false, usedFallback: true, reason: "unsupported" }
          };
        },
        async listStores() {
          return [{ id: "61", name: "Steam" }];
        }
      }
    }
  });

  futureStore.setView("wishlist");
  await futureStore.openEntryDetails("entry-test");
  await futureStore.loadItadStores();
  await futureStore.refreshPricingForEntry("entry-test", { suppressNotice: true });
  let html = renderDetailsView(futureStore.getSnapshot(), storefrontDefinitions, statusDefinitions);
  assert(html.includes("Releasing Soon"), "Expected future-dated wishlist detail to render Releasing Soon state.");
  assert(html.includes("Releasing in "), "Expected future-dated wishlist detail to render countdown copy.");
  assert(!html.includes("Unsupported by provider"), "Expected unreleased wishlist entries not to render provider failure copy.");

  const tbdStore = createSingleEntryStore({
    releaseDate: "",
    integrations: {
      pricing: {
        isConfigured: () => true,
        async resolvePrice() {
          return {
            provider: "itad",
            providerGameId: "itad-test",
            gameUrl: "",
            currentBest: {
              amount: null,
              currency: "USD",
              storeId: "",
              storeName: "",
              url: "",
              regularAmount: null,
              discountPercent: null
            },
            storeRows: [],
            historicalLow: {
              amount: null,
              currency: "USD",
              storeId: "",
              storeName: "",
              url: "",
              regularAmount: null,
              discountPercent: null,
              at: ""
            },
            lastCheckedAt: new Date().toISOString(),
            status: "no_match",
            reason: "no_match",
            meta: { resolved: false, usedFallback: true, reason: "no_match" }
          };
        },
        async listStores() {
          return [{ id: "61", name: "Steam" }];
        }
      }
    }
  });

  tbdStore.setView("wishlist");
  await tbdStore.openEntryDetails("entry-test");
  await tbdStore.loadItadStores();
  await tbdStore.refreshPricingForEntry("entry-test", { suppressNotice: true });
  html = renderDetailsView(tbdStore.getSnapshot(), storefrontDefinitions, statusDefinitions);
  assert(html.includes("Release date TBD"), "Expected true-TBD wishlist detail to show release-date TBD status copy.");
  assert(!html.includes("Unsupported by provider"), "Expected true-TBD wishlist detail not to render provider failure copy.");

  const comingSoonCardStore = createSingleEntryStore({
    releaseDate: "Coming Soon",
    storefront: "epic-games",
    integrations: {
      pricing: {
        isConfigured: () => true,
        async resolvePrice() {
          return {
            provider: "itad",
            providerGameId: "itad-test",
            gameUrl: "",
            currentBest: {
              amount: null,
              currency: "USD",
              storeId: "",
              storeName: "",
              url: "",
              regularAmount: null,
              discountPercent: null
            },
            storeRows: [],
            historicalLow: {
              amount: null,
              currency: "USD",
              storeId: "",
              storeName: "",
              url: "",
              regularAmount: null,
              discountPercent: null,
              at: ""
            },
            lastCheckedAt: new Date().toISOString(),
            status: "unsupported",
            reason: "unsupported",
            meta: { resolved: false, usedFallback: true, reason: "unsupported" }
          };
        },
        async listStores() {
          return [{ id: "61", name: "Steam" }];
        }
      }
    }
  });

  comingSoonCardStore.setView("wishlist");
  await comingSoonCardStore.refreshPricingForEntry("entry-test", { suppressNotice: true });
  html = renderDashboardView(comingSoonCardStore.getSnapshot(), storefrontDefinitions, statusDefinitions);
  assert(html.includes("Coming Soon"), "Expected unreleased wishlist cards to show a release-aware label.");
  assert(!html.includes("Epic Games"), "Expected unreleased wishlist cards not to fall back to a synthetic storefront label when no concrete store price exists.");
}

async function verifySelectedStoreValidationAndTableRows() {
  let lastSelectedStoreIds = [];
  const store = createSingleEntryStore({
    releaseDate: "2025-01-01",
    selectedStoreIds: ["61", "999"],
    integrations: {
      pricing: {
        isConfigured: () => true,
        async resolvePrice({ selectedStoreIds }) {
          lastSelectedStoreIds = Array.isArray(selectedStoreIds) ? selectedStoreIds.slice() : [];
          return {
            provider: "itad",
            providerGameId: "itad-test",
            gameUrl: "",
            currentBest: {
              amount: 15.99,
              currency: "USD",
              storeId: "61",
              storeName: "Steam",
              url: "",
              regularAmount: null,
              discountPercent: 20
            },
            storeRows: [{
              storeId: "61",
              storeName: "Steam",
              amount: 15.99,
              currency: "USD",
              discountPercent: 20,
              url: ""
            }],
            historicalLow: {
              amount: 12.99,
              currency: "USD",
              storeId: "61",
              storeName: "Steam",
              url: "",
              regularAmount: null,
              discountPercent: 35,
              at: "2026-01-01T00:00:00.000Z"
            },
            lastCheckedAt: new Date().toISOString(),
            status: "ok",
            reason: "resolved",
            meta: { resolved: true, usedFallback: false, reason: "resolved" }
          };
        },
        async listStores() {
          return [
            { id: "61", name: "Steam" },
            { id: "16", name: "Epic Game Store" }
          ];
        }
      }
    }
  });

  await store.loadItadStores();
  let snapshot = store.getSnapshot();
  assert(JSON.stringify(snapshot.syncPreferences.itadSelectedStoreIds) === JSON.stringify(["61"]), "Expected stale selected store ids to be pruned against the current ITAD store list.");

  store.setView("wishlist");
  await store.openEntryDetails("entry-test");
  await store.refreshPricingForEntry("entry-test", { suppressNotice: true });
  snapshot = store.getSnapshot();
  const html = renderDetailsView(snapshot, storefrontDefinitions, statusDefinitions);
  assert(JSON.stringify(lastSelectedStoreIds) === JSON.stringify(["61"]), "Expected pricing refresh to pass only validated selected store ids.");
  assert(html.includes("Steam"), "Expected selected-store pricing table to render validated selected store rows.");
  assert(!html.includes("Epic Game Store"), "Expected unselected store rows not to render in the wishlist detail table.");
}

async function verifyIgdbPrimaryMediaOrdering() {
  let fallbackCalls = 0;
  const igdbPrimaryStore = createSingleEntryStore({
    entryStatus: "playing",
    releaseDate: "2025-01-01",
    integrations: {
      metadataResolver: {
        isConfigured: () => true,
        async searchGames() {
          return [];
        },
        async resolveGameMetadata() {
          return {
            heroArt: "https://igdb.example/hero.jpg",
            capsuleArt: "https://igdb.example/capsule.jpg",
            screenshots: ["https://igdb.example/shot-1.jpg"],
            meta: { resolved: true, usedFallback: false, reason: "igdb_primary" }
          };
        }
      },
      steamGrid: {
        isConfigured: () => true,
        async resolveArtwork() {
          fallbackCalls += 1;
          return {
            heroArt: "https://steamgrid.example/hero.jpg",
            capsuleArt: "https://steamgrid.example/capsule.jpg",
            screenshots: ["https://steamgrid.example/shot-1.jpg"],
            meta: { resolved: true, usedFallback: false, reason: "steamgrid" }
          };
        }
      }
    }
  });

  await igdbPrimaryStore.refreshArtworkForEntry("entry-test");
  let game = getCatalogGame(igdbPrimaryStore.getSnapshot());
  assert(game?.heroArt === "https://igdb.example/hero.jpg", "Expected IGDB hero art to win when present.");
  assert(game?.capsuleArt === "https://igdb.example/capsule.jpg", "Expected IGDB capsule art to win when present.");
  assert(JSON.stringify(game?.screenshots ?? []) === JSON.stringify(["https://igdb.example/shot-1.jpg"]), "Expected IGDB screenshots to win when present.");
  assert(fallbackCalls === 0, "Expected SteamGrid fallback not to run when IGDB already provides all artwork fields.");

  let partialFallbackCalls = 0;
  const partialFallbackStore = createSingleEntryStore({
    entryStatus: "playing",
    releaseDate: "2025-01-01",
    integrations: {
      metadataResolver: {
        isConfigured: () => true,
        async searchGames() {
          return [];
        },
        async resolveGameMetadata() {
          return {
            heroArt: "https://igdb.example/hero-only.jpg",
            capsuleArt: "",
            screenshots: [],
            meta: { resolved: true, usedFallback: false, reason: "igdb_primary" }
          };
        }
      },
      steamGrid: {
        isConfigured: () => true,
        async resolveArtwork() {
          partialFallbackCalls += 1;
          return {
            heroArt: "https://steamgrid.example/hero.jpg",
            capsuleArt: "https://steamgrid.example/capsule.jpg",
            screenshots: ["https://steamgrid.example/shot-1.jpg"],
            meta: { resolved: true, usedFallback: false, reason: "steamgrid" }
          };
        }
      }
    }
  });

  await partialFallbackStore.refreshArtworkForEntry("entry-test");
  game = getCatalogGame(partialFallbackStore.getSnapshot());
  assert(game?.heroArt === "https://igdb.example/hero-only.jpg", "Expected IGDB hero art to remain even when SteamGrid fallback is used.");
  assert(game?.capsuleArt === "https://steamgrid.example/capsule.jpg", "Expected SteamGrid capsule art to fill missing IGDB capsule art.");
  assert(JSON.stringify(game?.screenshots ?? []) === JSON.stringify(["https://steamgrid.example/shot-1.jpg"]), "Expected SteamGrid screenshots to fill missing IGDB screenshots.");
  assert(partialFallbackCalls === 1, "Expected SteamGrid fallback to run exactly once when IGDB artwork is partial.");
}

async function run() {
  await verifyReleaseStateHelpers();
  await verifyReleaseAwareWishlistUiStates();
  await verifySelectedStoreValidationAndTableRows();
  await verifyIgdbPrimaryMediaOrdering();
  console.log("[checkpoint] Phase 4 hardening verification passed.");
}

run().catch((error) => {
  console.error("[checkpoint] Phase 4 hardening verification failed.");
  console.error(error?.stack || error?.message || error);
  process.exitCode = 1;
});
