import { strict as assert } from "node:assert";
import { createPricingService } from "../services/pricing.js";
import { renderGlobalNotice, renderMediaLightbox } from "../modules/render/overlays.js";
import { renderDetailsView } from "../modules/render/details.js";
import { renderDashboardView } from "../modules/render/library.js";
import { sampleCatalog, sampleLibrary, statusDefinitions, storefrontDefinitions } from "../data/sample-data.js";

const originalFetch = globalThis.fetch;
const originalConfig = globalThis.CHECKPOINT_CONFIG;

globalThis.CHECKPOINT_CONFIG = {
  steamGridWorkerUrl: "https://checkpoint-worker.example"
};

function jsonResponse(payload) {
  return {
    ok: true,
    async json() {
      return payload;
    }
  };
}

globalThis.fetch = async function mockedFetch(url) {
  const parsed = new URL(String(url));
  if (parsed.origin !== "https://checkpoint-worker.example") {
    throw new Error(`Unexpected fetch URL: ${parsed.toString()}`);
  }

  if (parsed.pathname === "/api/itad/pricing") {
    const title = parsed.searchParams.get("title");
    if (title === "Steam App 3559270") {
      return jsonResponse({
        provider: "itad",
        providerGameId: "",
        gameUrl: "",
        currentBest: {
          amount: null,
          currency: "USD",
          storeName: "",
          url: ""
        },
        storeRows: [],
        status: "no_match",
        reason: "no_match",
        meta: {
          resolved: false,
          usedFallback: true,
          reason: "no_match"
        }
      });
    }

    if (title === "Call of Duty: Modern Warfare III") {
      return jsonResponse({
        provider: "itad",
        providerGameId: "itad-cod-mw3",
        gameUrl: "https://isthereanydeal.com/game/call-of-duty-modern-warfare-iii/info/",
        currentBest: {
          amount: 27.99,
          currency: "USD",
          storeId: "61",
          storeName: "Microsoft Store",
          url: "https://isthereanydeal.com/game/call-of-duty-modern-warfare-iii/info/",
          regularAmount: 69.99,
          discountPercent: 60
        },
        storeRows: [{
          storeId: "61",
          storeName: "Microsoft Store",
          amount: 27.99,
          currency: "USD",
          discountPercent: 60,
          url: "https://isthereanydeal.com/game/call-of-duty-modern-warfare-iii/info/"
        }],
        historicalLow: {
          amount: 24.99,
          currency: "USD",
          storeId: "61",
          storeName: "Microsoft Store",
          url: "https://isthereanydeal.com/game/call-of-duty-modern-warfare-iii/info/",
          regularAmount: 69.99,
          discountPercent: 64,
          at: "2026-04-01T00:00:00.000Z"
        },
        lastCheckedAt: "2026-04-13T18:00:00.000Z",
        status: "ok",
        reason: "resolved",
        meta: {
          resolved: true,
          usedFallback: false,
          reason: "itad"
        }
      });
    }

    if (title === "Grand Theft Auto V") {
      return jsonResponse({
        provider: "itad",
        providerGameId: "itad-gta-v",
        gameUrl: "https://isthereanydeal.com/game/grand-theft-auto-v/info/",
        currentBest: {
          amount: 39.99,
          currency: "USD",
          storeId: "20",
          storeName: "Fanatical",
          url: "https://isthereanydeal.com/game/grand-theft-auto-v/info/",
          regularAmount: 59.99,
          discountPercent: 33
        },
        storeRows: [{
          storeId: "20",
          storeName: "Fanatical",
          amount: 39.99,
          currency: "USD",
          discountPercent: 33,
          url: "https://isthereanydeal.com/game/grand-theft-auto-v/info/"
        }],
        historicalLow: {
          amount: 19.99,
          currency: "USD",
          storeId: "20",
          storeName: "Fanatical",
          url: "https://isthereanydeal.com/game/grand-theft-auto-v/info/",
          regularAmount: 59.99,
          discountPercent: 67,
          at: "2026-03-01T00:00:00.000Z"
        },
        lastCheckedAt: "2026-04-13T18:00:00.000Z",
        status: "ok",
        reason: "resolved",
        meta: {
          resolved: true,
          usedFallback: false,
          reason: "itad"
        }
      });
    }

    throw new Error(`Unexpected pricing title candidate: ${title}`);
  }

  throw new Error(`Unexpected worker path: ${parsed.pathname}`);
};

try {
  const pricing = createPricingService();

  const preexistingResult = await pricing.resolvePrice({
    title: "Grand Theft Auto V",
    storefront: "manual",
    catalogGame: {
      id: "igdb-1020",
      igdbId: 1020,
      title: "Grand Theft Auto V"
    }
  });

  assert.equal(preexistingResult.status, "ok");
  assert.equal(preexistingResult.currentBest.storeName, "Fanatical");
  assert.equal(preexistingResult.providerGameId, "itad-gta-v");

  const steamPlaceholderResult = await pricing.resolvePrice({
    title: "Steam App 3559270",
    storefront: "steam",
    catalogGame: {
      id: "steam-3559270",
      title: "Call of Duty: Modern Warfare III",
      steam: {
        appid: 3559270
      }
    }
  });

  assert.equal(steamPlaceholderResult.status, "ok");
  assert.equal(steamPlaceholderResult.currentBest.storeName, "Microsoft Store");
  assert.equal(steamPlaceholderResult.providerGameId, "itad-cod-mw3");

  const noticeHtml = renderGlobalNotice({
    notice: {
      tone: "info",
      message: "Refreshing metadata for tracked entries...",
      progress: {
        current: 58,
        total: 418,
        label: "Metadata Refresh"
      }
    }
  });

  assert(noticeHtml.includes("58 / 418"), "Expected progress counts to render.");
  assert(
    noticeHtml.includes('style="width:14%;background:rgba(34,211,238,0.92);transition:width 300ms ease-out;"'),
    "Expected visible inline progress bar fill to render."
  );

  const lightboxGameA = renderMediaLightbox({
    mediaLightbox: {
      open: true,
      title: "Game A",
      index: 0,
      images: [
        "https://images.example/game-a-shot-1.jpg",
        "https://images.example/game-a-shot-2.jpg"
      ]
    }
  });
  const lightboxGameB = renderMediaLightbox({
    mediaLightbox: {
      open: true,
      title: "Game B",
      index: 1,
      images: [
        "https://images.example/game-b-shot-1.jpg",
        "https://images.example/game-b-shot-2.jpg"
      ]
    }
  });

  assert(lightboxGameA.includes("Game A"), "Expected first lightbox title to render.");
  assert(lightboxGameB.includes("Game B"), "Expected second lightbox title to render.");
  assert(lightboxGameB.includes("https://images.example/game-b-shot-2.jpg"), "Expected second lightbox to render the new gallery image.");
  assert(!lightboxGameB.includes("https://images.example/game-a-shot-1.jpg"), "Lightbox must not keep stale images from the previous game.");

  const libraryEntry = sampleLibrary.find((entry) => entry.entryId === "entry-outer-wilds-main");
  const wishlistEntry = sampleLibrary.find((entry) => entry.entryId === "entry-outer-wilds-archive");
  assert(libraryEntry, "Expected sample library entry for detail regression coverage.");
  assert(wishlistEntry, "Expected sample wishlist entry for detail regression coverage.");

  const librarySnapshot = {
    currentView: "details",
    activeEntry: libraryEntry,
    activeEntryId: libraryEntry.entryId,
    library: sampleLibrary,
    catalog: sampleCatalog,
    uiPreferences: {
      lastView: "dashboard"
    },
    detailForm: {
      playtimeHours: String(libraryEntry.playtimeHours),
      completionPercent: String(libraryEntry.completionPercent),
      status: libraryEntry.status
    },
    isDetailEditMode: false,
    syncPreferences: {
      itadSelectedStoreIds: []
    },
    itadStores: []
  };
  const libraryDetailsHtml = renderDetailsView(librarySnapshot, storefrontDefinitions, statusDefinitions);
  assert(libraryDetailsHtml.includes("Refresh Game Data (This Entry)"), "Library details should expose game-data refresh.");
  assert(!libraryDetailsHtml.includes("Refresh Pricing Data (This Entry)"), "Library details should not expose entry pricing refresh.");

  const wishlistSnapshot = {
    currentView: "details",
    activeEntry: wishlistEntry,
    activeEntryId: wishlistEntry.entryId,
    library: sampleLibrary,
    catalog: sampleCatalog,
    uiPreferences: {
      lastView: "wishlist"
    },
    detailForm: {
      playtimeHours: String(wishlistEntry.playtimeHours),
      completionPercent: String(wishlistEntry.completionPercent),
      status: wishlistEntry.status
    },
    isDetailEditMode: false,
    syncPreferences: {
      itadSelectedStoreIds: []
    },
    itadStores: []
  };
  const wishlistDetailsHtml = renderDetailsView(wishlistSnapshot, storefrontDefinitions, statusDefinitions);
  assert(wishlistDetailsHtml.includes("Refresh Game Data (This Entry)"), "Wishlist details should expose game-data refresh in maintenance.");
  assert(wishlistDetailsHtml.includes("Refresh Pricing Data (This Entry)"), "Wishlist details should expose pricing refresh in maintenance.");
  assert(wishlistDetailsHtml.includes("Move to Library"), "Wishlist details should keep the move-to-library CTA.");
  assert(
    wishlistDetailsHtml.indexOf('id="detail-maintenance"') < wishlistDetailsHtml.indexOf('class="checkpoint-panel discover-side-rail'),
    "Wishlist maintenance panel should render in the main content column before the side rail markup."
  );

  const discoverSnapshot = {
    currentView: "discover",
    searchTerm: "",
    library: sampleLibrary,
    catalog: sampleCatalog,
    visibleLibrary: sampleLibrary,
    activeStatus: "all",
    addForm: {
      selectedSearchResult: {
        id: "igdb-1020",
        igdbId: 1020,
        title: "Grand Theft Auto V",
        releaseDate: "2013-09-17",
        description: "Discover selection",
        platforms: ["PC (Microsoft Windows)"],
        coverArt: "https://images.example/gta-cover.jpg",
        heroArt: "https://images.example/gta-hero.jpg"
      }
    },
    discoverEntryDetails: {
      id: "igdb-1020",
      igdbId: 1020,
      title: "Grand Theft Auto V",
      releaseDate: "2013-09-17",
      description: "Discover detail",
      genres: ["Action"],
      platforms: ["PC (Microsoft Windows)"],
      developer: "Rockstar North",
      publisher: "Rockstar Games",
      coverArt: "https://images.example/gta-cover.jpg",
      heroArt: "https://images.example/gta-hero.jpg",
      screenshots: ["https://images.example/gta-shot.jpg"],
      videos: [{ url: "https://www.youtube.com/watch?v=gta" }],
      links: {
        igdb: "https://www.igdb.com/games/grand-theft-auto-v",
        official: "https://www.rockstargames.com/V/",
        storefronts: []
      }
    },
    discoverEntryPricing: {
      status: "ok",
      currentBest: {
        amount: 39.99,
        currency: "USD",
        storeName: "Fanatical",
        url: "https://isthereanydeal.com/game/grand-theft-auto-v/info/"
      },
      storeRows: [],
      gameUrl: "https://isthereanydeal.com/game/grand-theft-auto-v/info/",
      lastCheckedAt: "2026-04-13T18:00:00.000Z"
    },
    discoverEntryRelated: [],
    discoverEntryLinks: {
      igdb: "https://www.igdb.com/games/grand-theft-auto-v",
      official: "https://www.rockstargames.com/V/",
      storefronts: []
    },
    discoverEntryLoading: false,
    discoverEntryError: "",
    discoverEntryPricingLoading: false,
    discoverEntryPricingError: "",
    uiPreferences: {
      lastView: "discover"
    }
  };
  const discoverHtml = renderDashboardView(discoverSnapshot, storefrontDefinitions, statusDefinitions);
  assert(discoverHtml.includes("Refresh Pricing Data"), "Discover details should expose pricing refresh.");
  assert(!discoverHtml.includes("Refresh Game Data (This Entry)"), "Discover details should not expose entry maintenance actions.");

  console.log("[checkpoint] Phase 5 hardening verification passed.");
} finally {
  globalThis.fetch = originalFetch;
  globalThis.CHECKPOINT_CONFIG = originalConfig;
}
